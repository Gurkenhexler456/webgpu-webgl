class Renderer {

    /**
     * @param {[number, number, number, number]} clear_color 
     * @param {boolean} [clear_depth=false] 
     */
    clear(clear_color, clear_depth = false) {}

    /**
     * 
     * @param {{
     *          shader: RenderShader,
     *          textures: [{
    *              unit: number,
    *              texture: Texture2D,
    *              uniform_name: string
    *          }],
    *          uniforms: [{
    *              buffer: BufferObject,
    *              binding: number;
    *              uniform_name: string
    *          }]
     * }} pipeline 
     * @param {number} vert_count
     * @param {number} [vert_index_start=0]  
     */
    render_vertices(pipeline, vert_count, vert_index_start = 0) {}

    /**
     * 
     * @param {{ 
     *      target: RenderTarget,
     *      clear_color: [number, number, number, number],
     *      enable_depth_test: boolean
     * }} target 
     */
   switch_render_target(target) {}

    /**
     * 
     * @param {{ 
     *  model: { 
     *      vertices: {
     *          buffer: BufferObject, 
     *          count : number, 
     *          layout: BufferLayout 
     *      }, 
     *      indices: BufferObject 
     *  }, 
     *  shader: { 
     *      program: Shader,
     *      uniforms: BufferObject,
     *      textures: Texture []
     *  }}} render_pass 
     * 
     * @param {{ 
     *  target: { 
     *      color_attachment: Texture[],
     *      depth_attachment: Texture
     *  },
     *  clear_color: [number, number, number, number],
     *  enable_depth_test: boolean
     *  }} target 
     */
    render_to_target(render_pass, target) {}

    /**
     * @param {string} type
     * @param {number} size
     */
    create_buffer(type, size) {

    }
}