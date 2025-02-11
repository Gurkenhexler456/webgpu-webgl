const planet_vertex_glsl = `#version 300 es

        layout (location = 0) in vec3 in_Position;
        layout (location = 1) in vec2 in_UV;
        layout (location = 2) in vec3 in_Normal;

        out vec3 vf_World_Position;
        out vec2 vf_UV;
        out vec4 vf_Color;
        out vec3 vf_Normal;

        layout (std140) uniform CommonData {
            mat4 projection;
            mat4 view;
            mat4 model;
            mat4 normal;
        } u_common;
 
        void main() {
            
            vec4 world_pos = u_common.model * vec4(in_Position, 1.);

            vf_World_Position   = world_pos.xyz;
            vf_UV               = vec2(1. - in_UV.x, in_UV.y); //in_UV;// * vec2(21, 15);
            vf_Color            = vec4(in_UV, 0., 1.);
            vf_Normal           = (u_common.normal * vec4(in_Normal, 0)).xyz;

            gl_Position = u_common.projection * u_common.view * world_pos;
        }`;

const planet_fragment_glsl = `#version 300 es
        precision highp float;

        in vec3 vf_World_Position;
        in vec2 vf_UV;
        in vec4 vf_Color;
        in vec3 vf_Normal;

        out vec4 out_Color;

        uniform sampler2D u_Texture;

        void main() {

            vec3 light_pos = vec3(0, 0, 0.);
            vec3 light_color = vec3(1.);
            float light_intensity = 0.25;

            vec3 to_light = light_pos - vf_World_Position;

            float distance = length(to_light) * light_intensity;

            float diff = max(0., dot(vf_Normal, normalize(to_light)));
            float intensity = (diff * 100.) / (distance * distance);

            vec4 albedo = texture(u_Texture, vf_UV);
            vec3 normal_01 = (vf_Normal + 1.) * 0.5;

            vec3 lit_color = albedo.rgb * .2 + light_color * intensity;
            vec3 corrected = pow(lit_color * .5, vec3(1. / 2.2));

            out_Color = vec4(corrected, 1.);
        }`;