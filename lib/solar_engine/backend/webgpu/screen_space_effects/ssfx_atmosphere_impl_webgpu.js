import { BufferObject_WebGPU } from "../../../../graphics/backend/webgpu/buffer_impl_webgpu.js";
import { WebGPUUtil } from "../../../../graphics/backend/webgpu/gpu_util.js";
import { Sampler_WebGPU, Texture2D_WebGPU } from "../../../../graphics/backend/webgpu/texture_impl_webgpu.js";
import { ScreenSpaceEffectBase_WebGPU } from "../screen_space_effect_impl_webgpu.js";

export class ScreenSpace_Atmosphere_WebGPU extends ScreenSpaceEffectBase_WebGPU {

    static #FRAGMENT_SOURCE = `
    
        struct Matrices {
            vpInv: mat4x4f
        }

        @group(0) @binding(0) var<uniform> u_Matrices: Matrices;

        @group(0) @binding(1) var tex_sampler_filtering: sampler;
        @group(0) @binding(2) var tex_sampler_non_filtering: sampler;

        @group(0) @binding(3) var tex_albedo: texture_2d<f32>;
        @group(0) @binding(4) var tex_position: texture_2d<f32>;
        @group(0) @binding(5) var tex_depth: texture_2d<f32>;

        const planet_pos = vec3f(0, 0, 2.14833904E+02);
        const planet_radius = 9.25929242E-02;
        const atmosphere_thickness = .5E-02;
        const atmosphere_radius = planet_radius + atmosphere_thickness;

        const STEP_COUNT = 10.;
        const STEP_INCREMENT = 1. / (STEP_COUNT - 1.);
        
        const DENSITY_FALLOF = 1.0;

        const WAVE_LENGTHS = vec3f(700, 530, 440);
        const SCATTER_STRENGTH = 0.;
        const SCATTER_COEFFS = pow(400. / WAVE_LENGTHS, vec3f(4.)) * SCATTER_STRENGTH;

        fn sphere_intersection(ro: vec3f, rd: vec3f, center: vec3f, radius: f32) -> f32 {

            let oc = ro - center;
            let a = dot(rd, rd);
            let b = 2.0 * dot(oc, rd);
            let c = dot(oc, oc) - radius * radius;
            let discriminant = b * b - 4.0 * a * c;

            if(discriminant < 0.){
                return -1.0;
            }
            else{
                let sq = sqrt(discriminant);
                let t1 = (-b + sq) / (2.0 * a);
                let t2 = (-b - sq) / (2.0 * a);
                if(t2 > 0.) {
                    return t2;
                }
                else {
                    if(t1 > 0.) {
                        return t1;
                    }
                    else {
                        return -1;
                    }
                }
            }
        }

        // https://stackoverflow.com/questions/51108596/linearize-depth
        fn linearize_depth(d: f32, zNear: f32, zFar: f32) -> f32 {
            var depth = (d + 1) * 0.5;
            return zNear * zFar / (zFar + depth * (zNear - zFar));
        }

        fn get_density(sample_point: vec3f) -> f32 {
            let ground_height = length(sample_point - planet_pos) - planet_radius;
            let normalized_height = ground_height / atmosphere_thickness;
            return  exp(-normalized_height * DENSITY_FALLOF) * (1. - normalized_height);
        }

        fn get_optical_depth(ro: vec3f, rd: vec3f, length: f32) -> f32 {
            let step = length * STEP_INCREMENT;

            var sample_point = ro;
            var depth = 0.;
            for(var f = 0.0; f <= 1.0; f += STEP_INCREMENT) {
                depth += get_density(sample_point) * step;
                sample_point += rd * step;
            }

            return depth;
        }

        fn calculate_light(origin: vec3f, direction: vec3f, sample_distance: f32, base_color: vec3f) -> vec3f {

            let step_size = sample_distance * STEP_INCREMENT;

            var acc_light = vec3f(0.0);
            var view_optical_depth = 0.;
            for(var f = 0.0; f <= 1.0; f += STEP_INCREMENT) {

                let current_pos         = origin + f * sample_distance * direction;
                let to_sun              = normalize(-current_pos);
                let to_sun_thickness    = sphere_intersection(current_pos, to_sun, planet_pos, atmosphere_radius);
                let to_earth            = sphere_intersection(current_pos, to_sun, planet_pos, planet_radius);

                if(to_earth < 0.) {

                    let sun_optical_depth = get_optical_depth(current_pos, to_sun, to_sun_thickness);
                    let density = get_density(current_pos);

                    view_optical_depth = get_optical_depth(current_pos, -direction, f * sample_distance);
                
                    let transmittance = exp(-(sun_optical_depth + view_optical_depth) * SCATTER_COEFFS);

                    acc_light += density * transmittance * step_size;
                }
            }
            let base_color_transmittance = exp(-view_optical_depth);
            return base_color * base_color_transmittance + acc_light;
        }

        @fragment
        fn fragment_main(fs_input: VertexOutput) -> @location(0) vec4f {


            let base_color      = textureSample(tex_albedo, tex_sampler_filtering, fs_input.uv).xyz;
            let base_position   = textureSample(tex_position, tex_sampler_non_filtering, fs_input.uv).xyz;
            let base_depth      = textureSample(tex_depth, tex_sampler_non_filtering, fs_input.uv).x;


            let uv_normalized = vec2f(fs_input.uv.x, 1. - fs_input.uv.y) * 2. - 1.;
            var eye = u_Matrices.vpInv * vec4f(uv_normalized,  0., 1.0);
            var end = u_Matrices.vpInv * vec4f(uv_normalized,  1., 1.0);

            eye /= eye.w;
            end /= end.w;

            let ro = eye.xyz;
            let rd = normalize(end.xyz - eye.xyz);

            let dist = sphere_intersection(ro, rd, planet_pos, atmosphere_radius - 0.0);
            let lin_depth = linearize_depth(base_depth, 0.01, 10000.0);

            var final_light = vec3(0.);

            var result = vec3f(0.);

            if(dist > 0. && dist < lin_depth) {

                let intersection = ro + rd * dist;
                let other_side_dist = sphere_intersection(intersection + rd * 0.0001, rd, planet_pos, atmosphere_radius);
                let sample_dist = min(length(base_position - intersection), other_side_dist);

                final_light = calculate_light(intersection, rd, sample_dist, base_color);
            }
            else {
                final_light = base_color;
            }

            return vec4f(final_light, 1.0);
        }`;
    
    /**
     * 
     * @param {{
     *      albedo_texture:     Texture2D_WebGPU,
     *      position_texture:   Texture2D_WebGPU,
     *      depth_texture:      Texture2D_WebGPU,
     *      vp_inverse_ub:      BufferObject_WebGPU
     * }} input 
     * @param {Texture2D_WebGPU} output 
     */
    constructor(input, output) {

        super(ScreenSpace_Atmosphere_WebGPU.#FRAGMENT_SOURCE);

        const device = WebGPUUtil.get_device();

        this.input = input;
        this.output = output;

        this.sampler_filtering = new Sampler_WebGPU({
            label: 'Effect: Atmosphere: Sampler (Filtering)'
        });

        this.sampler_non_filtering = new Sampler_WebGPU({
            label: 'Effect: Atmosphere: Sampler (Non-Filtering)',
            minFilter: 'nearest',
            magFilter: 'nearest',
        });

        this.bindgroup_layout = device.createBindGroupLayout({
            label: 'Effect: Atmosphere: BindGroupLayout',
            entries: [
                { 
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT, 
                    buffer: {} 
                },
                { 
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: { type: 'filtering' } 
                },
                { 
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: { type: 'non-filtering' } 
                },
                { 
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: 'float' } 
                },
                { 
                    binding: 4,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: 'unfilterable-float' } 
                },
                { 
                    binding: 5,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: 'unfilterable-float' } 
                }
            ]
        });

        this.pipeline_layout = device.createPipelineLayout({
            label: 'Effect: Atmosphere: PipelineLayout',
            bindGroupLayouts: [this.bindgroup_layout]
        });

        this.pipeline = device.createRenderPipeline({
            label: 'Effect: Atmosphere: Pipeline',
            layout: this.pipeline_layout,
            vertex: {
                module: this.shader.module,
                entryPoint: 'vertex_main'
            },
            fragment: {
                module: this.shader.module,
                entryPoint: 'fragment_main',
                targets: [
                    { format: this.output.texture.format }
                ]
            }
        });

        this.bindgroup = device.createBindGroup({
            label: 'Effect: Atmosphere: BindGroup',
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {   binding: 0, resource: { buffer: this.input.vp_inverse_ub.buffer } },
                {   binding: 1, resource: this.sampler_filtering.sampler },
                {   binding: 2, resource: this.sampler_non_filtering.sampler },
                {   binding: 3, resource: this.input.albedo_texture.texture.createView() },
                {   binding: 4, resource: this.input.position_texture.texture.createView() },
                {   binding: 5, resource: this.input.depth_texture.texture.createView() }
            ]
        });
    }


    /**
     * 
     * @param {GPUCommandEncoder} encoder 
     */
    apply(encoder) {
        
        const pass = encoder.beginRenderPass({
            label: 'Effect: Atmosphere: RenderPass',
            colorAttachments: [
                { 
                    view: this.output.texture.createView(),
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: [0.0, 0.0, 0.0, 1.0]
                }
            ]
        });

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindgroup);
        pass.draw(6);
        pass.end();
    }
}