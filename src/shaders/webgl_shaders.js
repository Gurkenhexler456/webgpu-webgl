export const planet_vertex_glsl = `#version 300 es

        layout (location = 0) in vec3 in_Position;
        layout (location = 1) in vec2 in_UV;
        layout (location = 2) in vec3 in_Normal;

        out vec3 vf_World_Position;
        out vec2 vf_UV;
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
            vf_UV               = vec2(1. - in_UV.x, in_UV.y); //in_UV * vec2(21, 15);
            vf_Normal           = (u_common.normal * vec4(in_Normal, 0)).xyz;

            gl_Position = u_common.projection * u_common.view * world_pos;
        }`;

export const planet_fragment_glsl = `#version 300 es
        precision highp float;

        in vec3 vf_World_Position;
        in vec2 vf_UV;
        in vec3 vf_Normal;

        layout (location = 0) out vec4 out_Color;
        layout (location = 1) out vec4 out_World_Position;
        layout (location = 2) out vec4 out_Normal;

        uniform sampler2D u_Texture;

        void main() {

            out_Color = texture(u_Texture, vf_UV);

            out_World_Position = vec4(vf_World_Position, 1.0);
            out_Normal = vec4(vf_Normal, 1.0);
        }`;



export const sun_vertex_glsl = `#version 300 es

        layout (location = 0) in vec3 in_Position;
        layout (location = 1) in vec2 in_UV;
        layout (location = 2) in vec3 in_Normal;

        out vec3 vf_World_Position;
        out vec2 vf_UV;
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
            vf_UV               = vec2(1. - in_UV.x, in_UV.y); //in_UV * vec2(21, 15);
            vf_Normal           = (u_common.normal * vec4(in_Normal, 0)).xyz;

            gl_Position = u_common.projection * u_common.view * world_pos;
        }`;

export const sun_fragment_glsl = `#version 300 es
        precision highp float;

        in vec3 vf_World_Position;
        in vec2 vf_UV;
        in vec3 vf_Normal;

        layout (location = 0) out vec4 out_Color;
        layout (location = 1) out vec4 out_World_Position;
        layout (location = 2) out vec4 out_Normal;
        layout (location = 3) out vec4 out_Light;

        uniform sampler2D u_Texture;

        void main() {

            out_Color = texture(u_Texture, vf_UV);

            out_World_Position = vec4(vf_World_Position, 1.0);
            out_Normal = vec4(vf_Normal, 1.0);
            out_Light = vec4(1.);
        }`;



export const quad_vertex_glsl = `#version 300 es

        out vec2 vf_UV;
        
        vec3 positions[6] = vec3[6](
            vec3(-1.0, -1.0, 0.0),
            vec3( 1.0, -1.0, 0.0),
            vec3( 1.0,  1.0, 0.0),

            vec3( 1.0,  1.0, 0.0),
            vec3(-1.0,  1.0, 0.0),
            vec3(-1.0, -1.0, 0.0)
        );

        vec2 uvs[6] = vec2[6](
            vec2(0.0, 0.0),
            vec2(1.0, 0.0),
            vec2(1.0, 1.0),

            vec2(1.0, 1.0),
            vec2(0.0, 1.0),
            vec2(0.0, 0.0)
        );

        void main() {
            
            vf_UV = uvs[gl_VertexID];
            gl_Position = vec4(positions[gl_VertexID], 1.0);
        }`;

export const quad_fragment_glsl = `#version 300 es
        precision highp float;

        in vec2 vf_UV;

        out vec4 out_Color;

        layout (std140) uniform Matrices {
            mat4 projectionInv;
            mat4 viewInv;
            mat4 vpInv;
        } u_Matrices;

        uniform sampler2D u_Albedo;
        uniform sampler2D u_Light;
        uniform sampler2D u_Position;
        uniform sampler2D u_Normal;
        uniform sampler2D u_Depth;

        const vec3 planet_pos = vec3(0, 0, 2.14833904E+02);
        const float planet_radius = 9.25929242E-02;
        const float atmosphere_thickness = .5E-02;
        const float atmosphere_radius = planet_radius + atmosphere_thickness;

        const vec3 LIGHT_POS = vec3(0, 0, 0);

        const float STEP_COUNT = 15.;
        const float DENSITY_FALLOF = 1.0;
        const float STEP_INCREMENT = 1. / (STEP_COUNT - 1.);
        const vec3 WAVE_LENGTHS = vec3(700, 530, 440);
        const float SCATTER_STRENGTH = 0.;
        const vec3 SCATTER_COEFFS = pow(400. / WAVE_LENGTHS, vec3(4.)) * SCATTER_STRENGTH;

        float sphere_intersection(vec3 ro, vec3 rd, vec3 center, float radius) {

            vec3 oc = ro - center;
            float a = dot(rd, rd);
            float b = 2.0 * dot(oc, rd);
            float c = dot(oc, oc) - radius * radius;
            float discriminant = b * b - 4.0 * a * c;

            if(discriminant < 0.){
                return -1.0;
            }
            else{
                float t1 = (-b + sqrt(discriminant)) / (2.0 * a);
                float t2 = (-b - sqrt(discriminant)) / (2.0 * a);
                return t2 > 0. ? t2 : t1 > 0. ? t1 : -1.0;
            }
        }

        // https://stackoverflow.com/questions/51108596/linearize-depth
        float linearize_depth(float d, float zNear, float zFar)
        {
            return zNear * zFar / (zFar + d * (zNear - zFar));
        }

        float get_density(vec3 sample_point) {
            float ground_height = length(sample_point - planet_pos) - planet_radius;
            float normalized_height = ground_height / atmosphere_thickness;
            return  exp(-normalized_height * DENSITY_FALLOF) * (1. - normalized_height);
        }

        float get_optical_depth(vec3 ro, vec3 rd, float length) {
            vec3 sample_point = ro;
            float step = length * STEP_INCREMENT;
            float depth = 0.;
            for(float f = 0.0; f <= 1.0; f += STEP_INCREMENT) {
                depth += get_density(sample_point) * step;
                sample_point += rd * step;
            }

            return depth;
        }

        vec3 calculate_light(vec3 origin, vec3 direction, float sample_distance, vec3 base_color) {

            vec3 acc_light = vec3(0.0);
            float step_size = sample_distance * STEP_INCREMENT;
            float view_optical_depth = 0.;
            for(float f = 0.0; f <= 1.0; f += STEP_INCREMENT) {

                vec3 current_pos = origin + f * sample_distance * direction;
                vec3 to_sun = normalize(LIGHT_POS - current_pos);
                float to_sun_thickness = sphere_intersection(current_pos, to_sun, planet_pos, atmosphere_radius);
                float to_earth = sphere_intersection(current_pos, to_sun, planet_pos, planet_radius);

                if(to_earth < 0.) {

                    float sun_optical_depth = get_optical_depth(current_pos, to_sun, to_sun_thickness);
                    view_optical_depth = get_optical_depth(current_pos, -direction, f * sample_distance);
                    float density = get_density(current_pos);
                
                    vec3 transmittance = exp(-(sun_optical_depth + view_optical_depth) * SCATTER_COEFFS);

                    acc_light += density * transmittance * step_size;
                }
                else {
                }
            }
            float base_color_transmittance = exp(-view_optical_depth);
            return base_color * base_color_transmittance + acc_light;
        }

        void main() {


            vec3 base_color = texture(u_Albedo, vf_UV).xyz;
            vec3 base_light = texture(u_Light, vf_UV).xyz;
            vec3 base_position = texture(u_Position, vf_UV).xyz;
            vec3 base_normal = texture(u_Normal, vf_UV).xyz;
            float base_depth = texture(u_Depth, vf_UV).x;


            vec3 color = base_color;

            vec2 uv_normalized = vf_UV * 2. - 1.;
            vec4 eye = u_Matrices.vpInv * vec4(uv_normalized, -1., 1.0);
            vec4 end = u_Matrices.vpInv * vec4(uv_normalized,  1., 1.0);

            eye /= eye.w;
            end /= end.w;

            vec3 ro = eye.xyz;
            vec3 rd = normalize(end.xyz - eye.xyz);

            float dist = sphere_intersection(ro, rd, planet_pos, atmosphere_radius);
            float lin_depth = linearize_depth(base_depth, 0.01, 10000.0);
            
            vec3 final_light = vec3(0.);

            vec3 to_sun = normalize(LIGHT_POS - base_position);
            float ambient = 0.0;
            float diff = max(dot(to_sun, base_normal), 0.) * (1. - ambient);
            
            color = (diff + ambient) * color;

            if(dist > 0. && dist < lin_depth) {
                vec3 intersection = ro + rd * dist;
                float other_side_dist = sphere_intersection(intersection + rd * 0.0001, rd, planet_pos, atmosphere_radius);
                float sample_dist = lin_depth < other_side_dist + dist ? length(base_position - intersection) : other_side_dist;

                vec3 light = calculate_light(intersection, rd, sample_dist, color);

                final_light = light;
            }
            else {
                final_light = color;
            }

            final_light += base_light * base_color;
            vec3 corrected = pow(final_light * .5, vec3(1. / 2.2));

            out_Color = vec4(corrected, 1.0);
        }`;