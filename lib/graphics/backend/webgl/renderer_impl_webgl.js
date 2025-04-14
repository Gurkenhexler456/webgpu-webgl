import { WebGLUtil } from "./gl_util.js";

export class Renderer_WebGL {


    /**
     * @param {[number, number, number, number]} clear_color 
     * @param {boolean} [clear_depth=false] 
     */
    clear(clear_color, clear_depth = false) {

        // to be abstracted
        const gl = WebGLUtil.get_context();

        gl.clearColor(...clear_color);

        let bit_mask = gl.COLOR_BUFFER_BIT;

        if(clear_depth) {
            bit_mask |= gl.DEPTH_BUFFER_BIT;
        }

        gl.clear(bit_mask);
    }

    /**
     * 
     * @param {{
     *          shader: RenderShader_WebGL,
     *          textures: [{
     *              unit: number,
     *              texture: Texture2D_WebGL,
     *              uniform_name: string
     *          }],
     *          uniforms: [{
     *              buffer: BufferObject_WebGL,
     *              binding: number;
     *              uniform_name: string
     *          }]
     * }} pipeline 
     * @param {number} vert_count
     * @param {number} [vert_index_start=0]  
     */
    render_vertices(pipeline, vert_count, vert_index_start = 0) {

        const gl = WebGLUtil.get_context();

        gl.useProgram(pipeline.shader.program);

        pipeline.textures.forEach((tex) => {
            const loc = gl.getUniformLocation(pipeline.shader.program, tex.uniform_name);
            gl.uniform1i(loc, tex.unit);
            gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + tex.unit);
            gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, tex.texture.texture);
        });

        pipeline.uniforms.forEach((uniform) => {
            const mat_index = gl.getUniformBlockIndex(pipeline.shader.program, uniform.uniform_name);
            gl.uniformBlockBinding(pipeline.shader.program, mat_index, uniform.binding);
            gl.bindBuffer(gl.UNIFORM_BUFFER, uniform.buffer.buffer);
            gl.bindBufferBase(gl.UNIFORM_BUFFER, uniform.binding, uniform.buffer.buffer);
        });

        gl.drawArrays(WebGL2RenderingContext.TRIANGLES, vert_index_start, vert_count);
    }

    /**
     * 
     * @param {{ 
     *      target: RenderTarget_WebGL,
     *      clear_color: [number, number, number, number],
     *      enable_depth_test: boolean,
     *      output_buffers: string[]
     * }} target 
     */
    switch_render_target(target) {
        const gl = WebGLUtil.get_context();

        // setup and clear frame buffer
        if(target.target == undefined) {
            const canvas = WebGLUtil.INSTANCE.canvas;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        else {
            gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, target.target.frame_buffer);
            gl.viewport(0, 0, target.target.size.width, target.target.size.height);

            let output_buffers = [];
            if(target.output_buffers === undefined) {
                output_buffers = new Array(target.target.color_attachment_count)
                    .fill(0)
                    .map((v, i) => WebGL2RenderingContext.COLOR_ATTACHMENT0 + i);
            }
            else {
                target.output_buffers.forEach((buffer_name) => {
                    if(target.target.attachments.has(buffer_name)) {
                        output_buffers.push(target.target.attachments.get(buffer_name).index);
                    }
                });
            }

            gl.drawBuffers(output_buffers);
        }

        if(target.enable_depth_test) {
            gl.enable(gl.DEPTH_TEST);
        }
        else {
            gl.disable(gl.DEPTH_TEST);
        }
    }
    
    /**
     * 
     * @param {{ 
     *  model: Model_WebGL, 
     *  shader: { 
     *      program: RenderShader_WebGL,
     *      uniforms: BufferObject_WebGL,
     *      textures: Texture2D_WebGL []
     *  }}} render_pass 
     * 
     * @param {{ 
     *  target: RenderTarget_WebGL,
     *  clear_color: [number, number, number, number],
     *  enable_depth_test: boolean
     *  }} target 
     */
    render_to_target(render_pass, target) {

        // to be abstracted
        const gl = WebGLUtil.get_context();

        // load model
        gl.useProgram(render_pass.shader.program.program);

        const mat_index = gl.getUniformBlockIndex(render_pass.shader.program.program, 'CommonData');
        gl.uniformBlockBinding(render_pass.shader.program.program, mat_index, 0);
        gl.bindBuffer(gl.UNIFORM_BUFFER, render_pass.shader.uniforms.buffer);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, render_pass.shader.uniforms.buffer);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, render_pass.shader.textures[0].texture);

        gl.bindVertexArray(render_pass.model.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, render_pass.model.ebo.buffer);
        render_pass.model.layouts.forEach((layout) => {
            layout.attributes.forEach((attrib) => {
                gl.enableVertexAttribArray(attrib.index);
            });
        });

        gl.drawElements(gl.TRIANGLES, render_pass.model.vertex_count, gl.UNSIGNED_INT, 0);
    }
}