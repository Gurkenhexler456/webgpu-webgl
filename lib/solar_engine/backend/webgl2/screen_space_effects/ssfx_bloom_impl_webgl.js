import { WebGLUtil } from "../../../../graphics/backend/webgl/gl_util.js";
import { Texture2D_WebGL } from "../../../../graphics/backend/webgl/texture_impl_webgl.js";
import { ScreenSpaceEffectBase_WebGL } from "../screen_space_effect_impl_webgl.js";

export const BlurDirection_WebGL = {
    HORIZONTAL: 'vec2(1, 0)',
    VERTICAL: 'vec2(0, 1)',
};

export class ScreenSpace_Blur_WebGL extends ScreenSpaceEffectBase_WebGL {

    static #build_fragment_source(direction){
        return `#version 300 es
        precision highp float;

        const float kernel[4] = float[4](0.383, 0.242, 0.061, 0.006);
        //const float kernel[5] = float[5](0.3829, 0.2417, 0.0606, 0.0060, 0.0002);

        in vec2 vf_UV;

        out vec4 out_Color;

        uniform sampler2D u_Texture;

        void main() {

            
            vec2 pixel_step = vec2(1.) / vec2(750, 750);
            vec2 direction = ${direction} * pixel_step;

            vec3 color = vec3(0.);

            //color += kernel[4] * texture(u_Texture, vf_UV + direction *  4.).xyz;
            color += kernel[3] * texture(u_Texture, vf_UV + direction *  3.).xyz;
            color += kernel[2] * texture(u_Texture, vf_UV + direction *  2.).xyz;
            color += kernel[1] * texture(u_Texture, vf_UV + direction *  1.).xyz;
            
            color += kernel[0] * texture(u_Texture, vf_UV + direction     ).xyz;

            color += kernel[1] * texture(u_Texture, vf_UV + direction * -1.).xyz;
            color += kernel[2] * texture(u_Texture, vf_UV + direction * -2.).xyz;
            color += kernel[3] * texture(u_Texture, vf_UV + direction * -3.).xyz;
            //color += kernel[4] * texture(u_Texture, vf_UV + direction * -4.).xyz;

            out_Color = vec4(color, 1.0);
        }`
    };
    
    /**
     * @type {WebGLFramebuffer}
     */
    #output_fbo;

    /**
    * 
    * @param {Texture2D_WebGL} input 
    * @param {Texture2D_WebGL} output 
    */
    constructor(input, output, direction = BlurDirection_WebGL.HORIZONTAL) {

        super(ScreenSpace_Blur_WebGL.#build_fragment_source(direction));

        this.input = input;
        this.output = output;

        this.input.set_sampling(
            {
                mag_filter: WebGL2RenderingContext.LINEAR,
                min_filter: WebGL2RenderingContext.LINEAR,
                wrap_s: WebGL2RenderingContext.CLAMP_TO_EDGE,
                wrap_t: WebGL2RenderingContext.CLAMP_TO_EDGE
            }
        );

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

        gl.uniform1i(gl.getUniformLocation(this.shader.program, 'u_Texture'), 0);
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

        gl.activeTexture(WebGL2RenderingContext.TEXTURE0);
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, this.input.texture);

        gl.drawArrays(WebGL2RenderingContext.TRIANGLES, 0, 6);
    } 
}