export const planet_vertex_wgsl = `
        struct CommonData {
            projection: mat4x4f,
            view: mat4x4f,
            model: mat4x4f,
            normal: mat4x4f,
        }

        @group(0) @binding(0) var<uniform> u_common: CommonData;

        struct VertexInput {
            @location(0) position: vec3f,
            @location(1) uv: vec2f,
            @location(2) normal: vec3f
        }

        struct VertexOutput {
            @builtin(position) position: vec4f,
            @location(0) uv: vec2f,
            @location(1) normal: vec3f,

            @location(2) world_position: vec3f
        }

        @vertex 
        fn vertex_main(vs_input: VertexInput) -> VertexOutput {

            let colors = array(
                vec3f(1., 0., 0.),
                vec3f(0., 1., 0.),
                vec3f(0., 0., 1.),
            );
            
            let world_pos = u_common.model * vec4f(vs_input.position, 1.);

            var vsOut: VertexOutput;
            vsOut.world_position = world_pos.xyz;
            vsOut.position = u_common.projection * u_common.view * world_pos;
            vsOut.uv = vec2f(1. - vs_input.uv.x, vs_input.uv.y);// * vec2f(21, 15);

            vsOut.normal = (u_common.normal * vec4f(vs_input.normal, 0)).xyz;

            return vsOut;
        }`;

export const planet_fragment_wgsl = `

        @group(0) @binding(1) var tex_sampler: sampler;
        @group(0) @binding(2) var tex_texture: texture_2d<f32>;

        struct FSOutput {
            @location(0) color: vec4f,
            @location(1) world_position: vec4f,
            @location(2) normal: vec4f
        }

        @fragment
        fn fragment_main(fsIn: VertexOutput) -> FSOutput {

            let light_pos = vec3f(0, 0, 0.);
            let light_color = vec3f(1.);
            let light_intensity = 0.25;

            let to_light = light_pos - fsIn.world_position;

            let distance = length(to_light) * light_intensity;

            let diff = max(0, dot(fsIn.normal, normalize(to_light)));
            let intensity = (diff * 100) / (distance * distance);

            let albedo = textureSample(tex_texture, tex_sampler, fsIn.uv);
            let normal_01 = (fsIn.normal + 1.) * 0.5;

            let lit_color = albedo.rgb * .2 + light_color * intensity;
            let corrected = pow(lit_color * .5, vec3f(1. / 2.2));

            var fs_output: FSOutput;

            fs_output.color = vec4f(lit_color, 1.0);

            return fs_output;
        }`;



export const sun_vertex_wgsl = `

        struct VSInput {
            @location(0) position: vec3f,
            @location(1) uv: vec2f,
            @location(2) normal: vec3f
        }

        struct VSOutput {
            @builtin(position) position: vec4f,
            @location(0) uv: vec2f,
            @location(1) normal: vec3f,
            @location(2) world_position: vec3f
        }

        struct CommonData {
            projection: mat4x4f,
            view: mat4x4f,
            model: mat4x4f,
            normal: mat4x4f
        }

        @group(0) @binding(0) var<uniform> u_Common: CommonData;
 
        @vertex
        fn vertex_main(vs_input: VSInput) -> VSOutput {

            let world_pos = u_Common.model * vec4f(vs_input.position, 1.);

            var vs_output: VSOutput;
            vs_output.world_position    = world_pos.xyz;
            vs_output.uv                = vs_input.uv;
            vs_output.normal            = (u_Common.normal * vec4(vs_input.normal, 0)).xyz;

            vs_output.position          = u_Common.projection * u_Common.view * world_pos;

            return vs_output;
        }`;

export const sun_fragment_wgsl = `
        struct FSOutput {
            @location(0) color: vec4f,
            @location(1) world_position: vec4f,
            @location(2) normal: vec4f,
            @location(3) light: vec4f
        }

        @group(0) @binding(1) var tex_sampler: sampler;
        @group(0) @binding(2) var tex_texture: texture_2d<f32>;

        @fragment
        fn fragment_main(fs_input: VSOutput) -> FSOutput {

            var fs_output: FSOutput;

            fs_output.color             = textureSample(tex_texture, tex_sampler, fs_input.uv);

            fs_output.world_position    = vec4f(fs_input.world_position, 1.0);
            fs_output.normal            = vec4f(fs_input.normal, 1.0);
            fs_output.light             = vec4f(1.);

            return fs_output;
        }`;



export const quad_vertex_wgsl = `

        const positions = array(
            vec3f(-1.0, -1.0,  0.0),
            vec3f( 1.0, -1.0,  0.0),
            vec3f( 1.0,  1.0,  0.0),

            vec3f( 1.0,  1.0,  0.0),
            vec3f(-1.0,  1.0,  0.0),
            vec3f(-1.0, -1.0,  0.0)
        );

        const uvs = array(
            vec2f(0.0, 0.0),
            vec2f(1.0, 0.0),
            vec2f(1.0, 1.0),

            vec2f(1.0, 1.0),
            vec2f(0.0, 1.0),
            vec2f(0.0, 0.0),
        );

        struct VSOutput {
            @builtin(position) position: vec4f,
            @location(0) uv: vec2f
        }

        @vertex
        fn vertex_main(@builtin(vertex_index) index: u32) -> VSOutput {
            
            var vs_output: VSOutput;

            vs_output.uv = uvs[index];
            vs_output.position = vec4f(positions[index], 1.0);
        
            return vs_output;
        }`;

export const quad_fragment_wgsl = `


        struct Matrices {
            projectionInv: mat4x4f,
            viewInv: mat4x4f,
            vpInv: mat4x4f
        }

        @group(0) @binding(0) var<uniform> u_Matrices: Matrices;

        @group(0) @binding(1) var tex_sampler: sampler;

        @group(0) @binding(2) var tex_albedo: texture_2d<f32>;
        @group(0) @binding(3) var tex_light: texture_2d<f32>;
        @group(0) @binding(4) var tex_position: texture_2d<f32>;
        @group(0) @binding(5) var tex_normal: texture_2d<f32>;
        @group(0) @binding(6) var tex_depth: texture_depth_2d;

        const planet_pos = vec3f(0, 0, 2.14833904E+02);
        const planet_radius = 9.25929242E-02;
        const atmosphere_thickness = 1E-02;
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
            return zNear * zFar / (zFar + d * (zNear - zFar));
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
        fn fragment_main(fs_input: VSOutput) -> @location(0) vec4f {


            let base_color      = textureSample(tex_albedo, tex_sampler, fs_input.uv).xyz;
            let base_light      = textureSample(tex_light, tex_sampler, fs_input.uv).xyz;
            let base_position   = textureSample(tex_position, tex_sampler, fs_input.uv).xyz;
            let base_normal     = textureSample(tex_normal, tex_sampler, fs_input.uv).xyz;
            let base_depth      = textureSample(tex_depth, tex_sampler, fs_input.uv);


            let uv_normalized = fs_input.uv * 2. - 1.;
            var eye = u_Matrices.vpInv * vec4f(uv_normalized, -1., 1.0);
            var end = u_Matrices.vpInv * vec4f(uv_normalized,  1., 1.0);

            eye /= eye.w;
            end /= end.w;

            let ro = eye.xyz;
            let rd = normalize(end.xyz - eye.xyz);

            let dist = sphere_intersection(ro, rd, planet_pos, atmosphere_radius);

            let to_sun = normalize(-base_position);
            let ambient = 0.0;
            let diff = max(dot(to_sun, base_normal), 0.) * (1. - ambient);
            
            let color = (diff + ambient) * base_color;


            var final_light = vec3(0.);

            if(dist > 0.) {
                let intersection = ro + rd * dist;
                let other_side_dist = sphere_intersection(intersection + rd * 0.0001, rd, planet_pos, atmosphere_radius);
                let lin_depth = linearize_depth(base_depth, 0.01, 10000.0);


                let sample_dist = min(length(base_position - intersection), other_side_dist);

                let light = calculate_light(intersection, rd, sample_dist, color);

                final_light = light;
            }
            else {
                final_light = color;
            }

            final_light += base_light;
            let corrected = pow(final_light * .5, vec3f(1. / 2.2));

            return vec4f(corrected, 1.0);
        }`;