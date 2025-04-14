import { WebGLUtil } from "./gl_util.js";

export class Shader {

    /**
     * @param {WebGL2RenderingContext} gl
     * @param {GLenum} type 
     * @param {string} source 
     * @returns {WebGLShader}
     */
    static create_shader(gl, type, source) {
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
}

export class RenderShader_WebGL {

    /**
     * 
     * @param {string} vertex_source 
     * @param {string} fragment_source 
     */
    constructor(vertex_source, fragment_source) {
        const gl = WebGLUtil.get_context();

        const vertex = Shader.create_shader(gl, WebGL2RenderingContext.VERTEX_SHADER, vertex_source);
        const fragment = Shader.create_shader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, fragment_source);

        /**
         * @type {WebGLProgram}
         */
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertex);
        gl.attachShader(this.program, fragment);

        gl.linkProgram(this.program);
        const status = gl.getProgramParameter(this.program, WebGL2RenderingContext.LINK_STATUS);
        if(!status) {
            const log = gl.getProgramInfoLog(this.program);
            console.error(log);
            throw new Error('failed to link shader program');
        }
    }
}