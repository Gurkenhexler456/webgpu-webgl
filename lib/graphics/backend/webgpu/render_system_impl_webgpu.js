/**
 * @typedef {{
*      format: string,
*      usage: number
* }} TextureProps_WebGPU
*/

class RenderSystem_WebGPU {

    static INSTANCE = null;

    /**
     * @type {Renderer_WebGPU}
     */
    renderer = null;

    /**
     * @type {BufferObject_WebGPU[]}
     */
    buffers = [];

    /**
     * @type {RenderShader_WebGPU[]}
     */
    shaders = [];

    /**
     * @type {Texture2D_WebGPU[]}
     */
    textures = [];

    /**
     * 
     */
    constructor() {

        this.renderer = new Renderer_WebGPU();
        this.backend = RenderSystem.BACKEND_WEBGPU;
    }


    /**
     * 
     * @param {string} type 
     * @param {number} size 
     * @returns {BufferObject_WebGPU}
     */
    _create_buffer(type, size) {

        const buffer = new BufferObject_WebGPU(type, size);
        this.buffers.push(buffer);
        
        return buffer;
    }

    /**
     *  
     * @param {number} size 
     * @returns {BufferObject_WebGPU}
     */
    _create_vertex_buffer(size) { return this.create_buffer(BufferObject.VERTEX, size); }

    /**
     *  
     * @param {number} size
     * @returns {BufferObject_WebGPU}
     */
    _create_index_buffer(size) { return this.create_buffer(BufferObject.INDEX, size); }

    /**
     *  
     * @param {number} size
     * @returns {BufferObject_WebGPU}
     */
    _create_uniform_buffer(size) { return this.create_buffer(BufferObject.UNIFORM, size);}

    /**
     * @param {BufferObject_WebGPU[]} vertex_buffers 
     * @param {BufferLayout[]} layout_list
     * @param {BufferObject_WebGPU} index_buffer
     * @param {number} vertex_count
     * @returns {Model_WebGPU}
     */
    _create_model(vertex_buffers, layout_list, index_buffer, vertex_count) {

        const layouts = layout_list.map((layout) => layout.to_WebGPU());
        return new Model_WebGPU(vertex_buffers, layouts, index_buffer, vertex_count);
    };




    /**
     * 
     * @param {string} vertex_source
     * @param {string} fragment_source
     * @returns {RenderShader_WebGPU}
     */
    _create_render_shader(vertex_source, fragment_source) {
        const shader = new RenderShader_WebGPU(vertex_source, fragment_source);
        this.shaders.push(shader);

        return shader;
    }

    /**
     * 
     * @param {string} compute_source
     * @returns {ComputeShader_WebGPU}
     */
    _create_compute_shader(compute_source) { 
        const shader = new ComputeShader_WebGPU(vertex_source, fragment_source);
        this.shaders.push(shader);

        return shader;
    }


    /**
     * 
     * @param {Extents2D} size 
     * @param {Uint8Array} data
     * @param {TextureProps_WebGPU} props
     * @returns {Texture2D_WebGPU}
     */
    _create_texture_2D(size, data, props) { 

        const texture = new Texture2D_WebGPU(size, data, props);
        this.textures.push(texture);

        return texture;
    }


    /**
     * @returns {RenderTarget_WebGPU}
     */
    _get_default_render_target() {
        return RenderTarget_WebGPU.get_default();
    }

    /**
     * 
     * @param {Extents2D} size 
     * @returns {RenderTarget}
     */
    _create_render_target(size) {
        return new RenderTarget_WebGPU(size);
    }
}