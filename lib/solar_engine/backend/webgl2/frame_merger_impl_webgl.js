import { WebGLUtil } from "../../../graphics/backend/webgl/gl_util.js";
import { RenderShader_WebGL } from "../../../graphics/backend/webgl/shader_impl_webgl.js";
import { Texture2D_WebGL } from "../../../graphics/backend/webgl/texture_impl_webgl.js";
import { MergeOperation } from "../../frame_merger.js";

export class FrameMerger_WebGL {

    static #vertex_shader = `#version 300 es

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

    /**
     * 
     * @param {MergeOperation} operation 
     * @returns 
     */
    static #get_fragment_shader(operation) {

        return `#version 300 es
        precision highp float;

        in vec2 vf_UV;

        out vec4 out_Color;

        uniform sampler2D u_Texture_A;
        uniform sampler2D u_Texture_B;

        void main() {


            vec3 a = texture(u_Texture_A, vf_UV).xyz;
            vec3 b = texture(u_Texture_B, vf_UV).xyz;

            out_Color = vec4((a ${operation} b), 1.0);
        }`;
    }


    #output_fbo;

    /**
     * 
     * @param {Texture2D_WebGL} texture_a
     * @param {Texture2D_WebGL} texture_b
     * @param {string} operation
     * @param {Texture2D_WebGL} output_texture 
     */
    constructor(texture_a, texture_b, operation = MergeOperation.ADD, output_texture) {

        /**
         * @type {Texture2D_WebGL[]}
         */
        this.input_textures = [
            texture_a,
            texture_b
        ]

        /**
         * @type {RenderShader_WebGL}
         */
        this.shader = new RenderShader_WebGL(FrameMerger_WebGL.#vertex_shader, FrameMerger_WebGL.#get_fragment_shader(operation));

        /**
         * @type {Texture2D_WebGL}
         */
        this.output_texture = output_texture || new Texture2D_WebGL(texture_a.size, null);

        const gl = WebGLUtil.get_context();

        this.#output_fbo = gl.createFramebuffer();
        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.#output_fbo);
        gl.framebufferTexture2D(
            WebGL2RenderingContext.FRAMEBUFFER, WebGL2RenderingContext.COLOR_ATTACHMENT0, 
            WebGL2RenderingContext.TEXTURE_2D, this.output_texture.texture, 0);

        if(gl.checkFramebufferStatus(WebGL2RenderingContext.FRAMEBUFFER) !== WebGL2RenderingContext.FRAMEBUFFER_COMPLETE) {
            throw new Error(`failed to add color attachment (g_buffer '${buffer.label}'): framebuffer incomplete`);
        }

        gl.useProgram(this.shader.program);
        gl.uniform1i(gl.getUniformLocation(this.shader.program, 'u_Texture_A'), 0);
        gl.uniform1i(gl.getUniformLocation(this.shader.program, 'u_Texture_B'), 1);
    }

    /**
     * 
     */
    render() {

        const gl = WebGLUtil.get_context();

        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.#output_fbo);
        gl.viewport(0, 0, this.output_texture.size.width, this.output_texture.size.height);

        gl.useProgram(this.shader.program);

        gl.activeTexture(WebGL2RenderingContext.TEXTURE0);
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, this.input_textures[0].texture);
        gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + 1);
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, this.input_textures[1].texture);

        gl.drawArrays(WebGL2RenderingContext.TRIANGLES, 0, 6);
    }
}