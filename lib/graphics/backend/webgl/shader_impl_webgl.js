import { RenderShader } from "../../shader.js";
import { WebGLUtil } from "./gl_util.js";


export class RenderShader_WebGL extends RenderShader {


    /**
     * @param {WebGL2RenderingContext} gl
     * @param {GLenum} type 
     * @param {string} source 
     * @returns {WebGLShader}
     */
    static #create_shader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if(!status) {
            const log = gl.getShaderInfoLog(shader);
            console.error(log);
            throw new Error('failed to compile shader');
        }
    
        return shader;
    }


    /**
     * 
     * @param {string} vertex_source 
     * @param {string} fragment_source 
     */
    constructor(vertex_source, fragment_source) {
        super(vertex_source, fragment_source);

        const gl = WebGLUtil.get_context();

        this.vertex     = RenderShader_WebGL.#create_shader(gl, WebGL2RenderingContext.VERTEX_SHADER, this.vertex_source);
        this.fragment   = RenderShader_WebGL.#create_shader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, this.fragment_source);

        /**
         * @type {WebGLProgram}
         */
        this.program = gl.createProgram();
        gl.attachShader(this.program, this.vertex);
        gl.attachShader(this.program, this.fragment);

        gl.linkProgram(this.program);
        const status = gl.getProgramParameter(this.program, WebGL2RenderingContext.LINK_STATUS);
        if(!status) {
            const log = gl.getProgramInfoLog(this.program);
            console.error(log);
            throw new Error('failed to link shader program');
        }
    }

    destroy() {
        super.destroy();
        
        const gl = WebGLUtil.get_context();
        
        gl.detachShader(this.program, this.vertex);
        gl.deleteShader(this.vertex);

        gl.detachShader(this.program, this.fragment);
        gl.deleteShader(this.fragment);

        gl.deleteProgram(this.program);
    }
}