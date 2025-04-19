import { WebGLUtil } from "../../../../graphics/backend/webgl/gl_util.js";
import { Texture2D_WebGL } from "../../../../graphics/backend/webgl/texture_impl_webgl.js";
import { Extents2D } from "../../../../math/util.js";
import { ScreenSpaceEffectBase_WebGL } from "../screen_space_effect_impl_webgl.js";


export class ScreenSpace_Downscale_WebGL extends ScreenSpaceEffectBase_WebGL {

    
    /**
     * @type {WebGLFramebuffer}
     */
    #output_fbo;

    /**
    * 
    * @param {Texture2D_WebGL} input 
    * @param {Extents2D} output 
    */
    constructor(input, target_resolution) {

        super();

        this.input = input;
        this.output = new Texture2D_WebGL(target_resolution, null);

        this.output.set_sampling({
            mag_filter: WebGL2RenderingContext.LINEAR,
            min_filter: WebGL2RenderingContext.LINEAR,
            wrap_s: WebGL2RenderingContext.REPEAT,
            wrap_t: WebGL2RenderingContext.REPEAT,
        });

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