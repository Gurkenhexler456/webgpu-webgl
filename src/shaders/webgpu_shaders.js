const planet_vertex_wgsl = `
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
            @location(1) color: vec4f,
            @location(2) normal: vec3f,
            @location(3) world_position: vec3f
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
            vsOut.color = vec4f(vs_input.uv, 0., 1.);

            vsOut.normal = (u_common.normal * vec4f(vs_input.normal, 0)).xyz;

            return vsOut;
        }`;

const planet_fragment_wgsl = `

        @group(0) @binding(1) var tex_sampler: sampler;
        @group(0) @binding(2) var tex_texture: texture_2d<f32>;

        @fragment
        fn fragment_main(fsIn: VertexOutput) -> @location(0) vec4f {

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

            return vec4f(corrected, 0.);
        }`;