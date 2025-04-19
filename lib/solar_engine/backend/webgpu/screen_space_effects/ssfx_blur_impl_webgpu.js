import { WebGPUUtil } from "../../../../graphics/backend/webgpu/gpu_util.js";
import { Sampler_WebGPU, Texture2D_WebGPU } from "../../../../graphics/backend/webgpu/texture_impl_webgpu.js";
import { ScreenSpaceEffectBase_WebGPU } from "../screen_space_effect_impl_webgpu.js";

export const BlurDirection_WebGPU = {
    HORIZONTAL: 'vec2f(1, 0)',
    VERTICAL: 'vec2f(0, 1)',
};

export class ScreenSpace_Blur_WebGPU extends ScreenSpaceEffectBase_WebGPU {

    static #get_fragment_source(direction) {
        return `
    
        const kernel = array(0.383, 0.242, 0.061, 0.006);
        //const kernel = array(0.3829, 0.2417, 0.0606, 0.0060, 0.0002);

        @group(0) @binding(0) var tex_sampler: sampler;

        @group(0) @binding(1) var tex_image: texture_2d<f32>;

        @fragment
        fn fragment_main(fs_input: VertexOutput) -> @location(0) vec4f {

            let pixel_step = vec2f(1.) / vec2f(750, 750);
            let direction = ${direction} * pixel_step;

            var color = vec3f(0.);

            //color += kernel[4] * textureSample(tex_image, tex_sampler, fs_input.uv + direction *  4.).xyz;
            color += kernel[3] * textureSample(tex_image, tex_sampler, fs_input.uv + direction *  3.).xyz;
            color += kernel[2] * textureSample(tex_image, tex_sampler, fs_input.uv + direction *  2.).xyz;
            color += kernel[1] * textureSample(tex_image, tex_sampler, fs_input.uv + direction *  1.).xyz;
            
            color += kernel[0] * textureSample(tex_image, tex_sampler, fs_input.uv + direction     ).xyz;

            color += kernel[1] * textureSample(tex_image, tex_sampler, fs_input.uv + direction * -1.).xyz;
            color += kernel[2] * textureSample(tex_image, tex_sampler, fs_input.uv + direction * -2.).xyz;
            color += kernel[3] * textureSample(tex_image, tex_sampler, fs_input.uv + direction * -3.).xyz;
            //color += kernel[4] * textureSample(tex_image, tex_sampler, fs_input.uv + direction * -4.).xyz;

            return vec4f(color, 1.0);
        }`
    };
    
    /**
     * 
     * @param {Texture2D_WebGPU} input 
     * @param {Texture2D_WebGPU} output 
     */
    constructor(input, output, direction = BlurDirection_WebGPU.HORIZONTAL) {

        super(ScreenSpace_Blur_WebGPU.#get_fragment_source(direction));

        const device = WebGPUUtil.get_device();

        this.input = input;
        this.output = output;

        this.sampler = new Sampler_WebGPU({
            label: 'Effect: Blur: Sampler',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge'
        });

        this.bindgroup_layout = device.createBindGroupLayout({
            label: 'Effect: Blur: BindGroupLayout',
            entries: [
                { 
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: { type: 'filtering' } 
                },
                { 
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: 'float' } 
                }
            ]
        });

        this.pipeline_layout = device.createPipelineLayout({
            label: 'Effect: Blur: PipelineLayout',
            bindGroupLayouts: [this.bindgroup_layout]
        });

        this.pipeline = device.createRenderPipeline({
            label: 'Effect: Blur: Pipeline',
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
            label: 'Effect: Blur: BindGroup',
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {   binding: 0, resource: this.sampler.sampler },
                {   binding: 1, resource: this.input.texture.createView() }
            ]
        });
    }


    /**
     * 
     * @param {GPUCommandEncoder} encoder 
     */
    apply(encoder) {
        
        const pass = encoder.beginRenderPass({
            label: 'Effect: Blur: RenderPass',
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