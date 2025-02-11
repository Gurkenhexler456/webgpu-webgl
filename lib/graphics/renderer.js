class Renderer {

    /**
     * @param {{ 
    *  target: { 
    *      color_attachment: Texture2D[],
    *      depth_attachment: Texture2D
    *  },
    *  clear_color: [number, number, number, number],
    *  enable_depth_test: boolean
    *  }} target 
    */
   clear(target) {}

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