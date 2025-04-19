import { WebGLUtil } from "../../../../graphics/backend/webgl/gl_util.js";
import { ScreenSpaceEffectBase_WebGL } from "../screen_space_effect_impl_webgl.js";

export class ScreenSpace_ToScreen_WebGL extends ScreenSpaceEffectBase_WebGL {
    
    /**
     * 
     * @param {Texture2D_WebGL} input 
     */
    constructor(input) {

        super();

        this.input = input;

        const gl = WebGLUtil.get_context();
        
        gl.useProgram(this.shader.program);

        gl.uniform1i(gl.getUniformLocation(this.shader.program, 'u_Texture'), 0);
    }


    /**
     * 
     * @param {GPUCommandEncoder} encoder 
     */
    apply(encoder) {
        
        const gl = WebGLUtil.get_context();
        
        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, null);
        gl.disable(WebGL2RenderingContext.DEPTH_TEST);
        gl.clearColor(1.0, 0.0, 0.0, 1.0);
        gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);

        gl.useProgram(this.shader.program);

        gl.activeTexture(WebGL2RenderingContext.TEXTURE0);
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, this.input.texture);

        gl.drawArrays(WebGL2RenderingContext.TRIANGLES, 0, 6);
    }
}