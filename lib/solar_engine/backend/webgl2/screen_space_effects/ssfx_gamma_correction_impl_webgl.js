import { WebGLUtil } from "../../../../graphics/backend/webgl/gl_util.js";
import { Texture2D_WebGL } from "../../../../graphics/backend/webgl/texture_impl_webgl.js";
import { ScreenSpaceEffectBase_WebGL } from "../screen_space_effect_impl_webgl.js";

export class ScreenSpace_Gamma_Correction_WebGL extends ScreenSpaceEffectBase_WebGL {

    static #FRAGMENT_SOURCE = `#version 300 es
        precision highp float;

        in vec2 vf_UV;

        out vec4 out_Color;

        uniform sampler2D u_Texture;

        void main() {

            vec3 base_color = texture(u_Texture, vf_UV).xyz;

            vec3 corrected = pow(base_color, vec3(1. / 2.2));

            out_Color = vec4(corrected, 1.0);
        }`;
    
    /**
     * @type {WebGLFramebuffer}
     */
    #output_fbo;

    /**
    * 
    * @param {Texture2D_WebGL} input 
    * @param {Texture2D_WebGL} output 
    */
    constructor(input, output) {

        super(ScreenSpace_Gamma_Correction_WebGL.#FRAGMENT_SOURCE);

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