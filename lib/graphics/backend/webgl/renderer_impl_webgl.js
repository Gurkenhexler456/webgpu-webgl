class Renderer_WebGL {


    /**
     * @param {{ 
     *  target: { 
     *      color_attachment: Texture2D_WebGL[],
     *      depth_attachment: Texture2D_WebGL
     *  },
     *  clear_color: [number, number, number, number],
     *  enable_depth_test: boolean
     *  }} target 
     */
    clear(target) {

        // to be abstracted
        const gl = WebGLUtil.get_context();

        // setup and clear frame buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(...target.clear_color);

        let bit_mask = gl.COLOR_BUFFER_BIT;

        if(target.enable_depth_test) {
            gl.enable(gl.DEPTH_TEST);
            bit_mask |= gl.DEPTH_BUFFER_BIT;
        }
        else {
            gl.disable(gl.DEPTH_TEST);
        }

        gl.clear(bit_mask);
    }

    /**
     * 
     * @param {Buffer_WebGL} buffer 
     * @param {RenderShader_WebGL} shader 
     */
    render(buffer, shader) {
        const gl = WebGLUtil.get_context();

        gl.useProgram(shader.program);
        gl.drawArrays(WebGL2RenderingContext.TRIANGLES, 0, 3);
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
     *  target: { 
     *      color_attachment: Texture2D_WebGL[],
     *      depth_attachment: Texture2D_WebGL
     *  },
     *  clear_color: [number, number, number, number],
     *  enable_depth_test: boolean
     *  }} target 
     */
    render_to_target(render_pass, target) {

        // to be abstracted
        const gl = WebGLUtil.get_context();

        // setup and clear frame buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        if(target.enable_depth_test) {
            gl.enable(gl.DEPTH_TEST);
        }
        else {
            gl.disable(gl.DEPTH_TEST);
        }

        // load model
        gl.useProgram(render_pass.shader.program.program);

        const mat_index = gl.getUniformBlockIndex(render_pass.shader.program.program, 'CommonData');
        gl.uniformBlockBinding(render_pass.shader.program.program, mat_index, 0);
        gl.bindBuffer(gl.UNIFORM_BUFFER, render_pass.shader.uniforms.buffer);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, render_pass.shader.uniforms.buffer);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindSampler(0, render_pass.shader.textures[0].sampler);
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