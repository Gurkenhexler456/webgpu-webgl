import { BufferObject_WebGL } from "../../../../graphics/backend/webgl/buffer_impl_webgl.js";
import { WebGLUtil } from "../../../../graphics/backend/webgl/gl_util.js";
import { Texture2D_WebGL } from "../../../../graphics/backend/webgl/texture_impl_webgl.js";
import { ScreenSpaceEffectBase_WebGL } from "../screen_space_effect_impl_webgl.js";

export class ScreenSpace_Atmosphere_WebGL extends ScreenSpaceEffectBase_WebGL {
   
    static #FRAGMENT_SOURCE = `#version 300 es
        precision highp float;

        in vec2 vf_UV;

        out vec4 out_Color;

        layout (std140) uniform Matrices {
            mat4 vpInv;
        } u_Matrices;

        uniform sampler2D u_Albedo;
        uniform sampler2D u_Position;
        uniform sampler2D u_Depth;

        const vec3 planet_pos = vec3(0, 0, 2.14833904E+02);
        const float planet_radius = 9.25929242E-02;
        const float atmosphere_thickness = .5E-02;
        const float atmosphere_radius = planet_radius + atmosphere_thickness;

        const vec3 LIGHT_POS = vec3(0, 0, 0);

        const float STEP_COUNT = 25.;
        const float STEP_INCREMENT = 1. / (STEP_COUNT - 1.);

        const float DENSITY_FALLOF = 1.;

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
            return base_color * base_color_transmittance + acc_light;;
        }

        void main() {


            vec3 base_color = texture(u_Albedo, vf_UV).xyz;
            vec3 base_position = texture(u_Position, vf_UV).xyz;
            float base_depth = texture(u_Depth, vf_UV).x;

            vec3 color = base_color;

            vec2 uv_normalized = vf_UV * 2. - 1.;
            vec4 eye = u_Matrices.vpInv * vec4(uv_normalized, -1., 1.0);
            vec4 end = u_Matrices.vpInv * vec4(uv_normalized,  1., 1.0);

            eye /= eye.w;
            end /= end.w;

            vec3 ro = eye.xyz;
            vec3 rd = normalize(end.xyz - eye.xyz);

            float dist = sphere_intersection(ro, rd, planet_pos, atmosphere_radius - 0.0);
            float lin_depth = linearize_depth(base_depth, 0.01, 10000.0);

            vec3 final_light = vec3(0.);

            vec3 result = vec3(0.);

            if(dist > 0. && dist < lin_depth) {

                vec3 intersection = ro + rd * dist;
                float other_side_dist = sphere_intersection(intersection + rd * 0.0001, rd, planet_pos, atmosphere_radius);
                float sample_dist = lin_depth < other_side_dist + dist ? length(base_position - intersection) : other_side_dist;

                final_light = calculate_light(intersection, rd, sample_dist, color);
            }
            else {
                final_light = color;
            }

            out_Color = vec4(final_light, 1.0);
        }`;
    
    /**
     * @type {WebGLFramebuffer}
     */
    #output_fbo;

    /**
    * 
    * @param {{
    *      albedo_texture:     Texture2D_WebGL,
    *      position_texture:   Texture2D_WebGL,
    *      depth_texture:      Texture2D_WebGL,
    *      vp_inverse_ub:      BufferObject_WebGL
    * }} input 
    * @param {Texture2D_WebGL} output 
    */
    constructor(input, output) {

        super(ScreenSpace_Atmosphere_WebGL.#FRAGMENT_SOURCE);

        this.input = input;
        this.output = output;

        const gl = WebGLUtil.get_context();


        this.#output_fbo = gl.createFramebuffer();
        
        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.#output_fbo);
        gl.framebufferTexture2D(
            WebGL2RenderingContext.FRAMEBUFFER, WebGL2RenderingContext.COLOR_ATTACHMENT0, 
            WebGL2RenderingContext.TEXTURE_2D, this.output.texture, 0);

        if(gl.checkFramebufferStatus(WebGL2RenderingContext.FRAMEBUFFER) !== WebGL2RenderingContext.FRAMEBUFFER_COMPLETE) {
            throw new Error(`failed to add color attachment (result): framebuffer incomplete`);
        }

        gl.useProgram(this.shader.program);

        gl.uniform1i(gl.getUniformLocation(this.shader.program, 'u_Albedo'), 0);
        gl.uniform1i(gl.getUniformLocation(this.shader.program, 'u_Position'), 1);
        gl.uniform1i(gl.getUniformLocation(this.shader.program, 'u_Depth'), 2);
    }


    /**
    * 
    */
    apply() {
        
        const gl = WebGLUtil.get_context();

        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.#output_fbo);
        gl.drawBuffers([WebGL2RenderingContext.COLOR_ATTACHMENT0]);
        gl.viewport(0, 0, this.output.size.width, this.output.size.height);
        gl.clearColor(0.0, 1.0, 0.0, 1.0);
        gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);

        gl.useProgram(this.shader.program);

        const block_binding = 1;
        const block_index = gl.getUniformBlockIndex(this.shader.program, 'Matrices');
        gl.uniformBlockBinding(this.shader.program, block_index, block_binding);
        gl.bindBuffer(WebGL2RenderingContext.UNIFORM_BUFFER, this.input.vp_inverse_ub.buffer);
        gl.bindBufferBase(WebGL2RenderingContext.UNIFORM_BUFFER, block_binding, this.input.vp_inverse_ub.buffer);

        gl.activeTexture(WebGL2RenderingContext.TEXTURE0);
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, this.input.albedo_texture.texture);
        gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + 1);
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, this.input.position_texture.texture);
        gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + 2);
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, this.input.depth_texture.texture);

        gl.drawArrays(WebGL2RenderingContext.TRIANGLES, 0, 6);
    } 
}