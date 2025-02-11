

class RenderSystem {

    static BACKEND_WEBGL_2 = 'webgl2';
    static BACKEND_WEBGPU = 'webgpu';

    /**
     * @type {RenderSystem}
     */
    static #INSTANCE = null;

    /**
     * @type {string}
     */
    backend = '';

    /**
     * @type {Renderer}
     */
    renderer = null;

    /**
     * @type {RenderTarget}
     */
    default_target = null;

    /**
     * @type {Buffer[]}
     */
    buffers = [];

    /**
     * @type {Shader[]}
     */
    shaders = [];

    /**
     * @type {Texture2D[]}
     */
    texture = [];

    constructor(backend) {

    }


    /**
     * @returns {Renderer}
     */
    static get Renderer() { return RenderSystem.#INSTANCE.renderer; }

    /**
     * 
     */
    static async init(canvas_id, backend) {

        backend = backend || RenderSystem.BACKEND_WEBGL_2;

        if(backend === RenderSystem.BACKEND_WEBGPU) {
            await WebGPUUtil.init(canvas_id);

            RenderSystem.#INSTANCE = new RenderSystem_WebGPU();
            RenderTarget_WebGPU.init();
        }
        else if(backend === RenderSystem.BACKEND_WEBGL_2) {
            WebGLUtil.init(canvas_id);

            RenderSystem.#INSTANCE = new RenderSystem_WebGL();
        }
        else {
            throw new Error(`backend not supported: ${backend}`);
        }

        console.log(`RenderSystem: using '${backend}'`);
    }


    /**
     * 
     * @param {string} type 
     * @param {number} size 
     * @returns {BufferObject}
     */
    static create_buffer(type, size) { 
        return RenderSystem.#INSTANCE._create_buffer(type, size); 
    }

    /**
     *  
     * @param {number} size 
     * @returns {BufferObject}
     */
    static create_vertex_buffer(size) { 
        return RenderSystem.create_buffer(BufferObject.VERTEX, size); 
    }

    /**
     *  
     * @param {number} size
     * @returns {BufferObject}
     */
    static create_index_buffer(size) { 
        return RenderSystem.create_buffer(BufferObject.INDEX, size); 
    }

    /**
     *  
     * @param {number} size
     * @returns {BufferObject}
     */
    static create_uniform_buffer(size) { 
        return RenderSystem.create_buffer(BufferObject.UNIFORM, size);
    }


    /**
     * @param {BufferObject[]} vertex_buffers 
     * @param {BufferLayout[]} layouts
     * @param {BufferObject} index_buffer
     * @param {number} vertex_count
     * @returns {Model}
     */
    static create_model(vertex_buffers, layouts, index_buffer, vertex_count) { 
        return RenderSystem.#INSTANCE._create_model(vertex_buffers, layouts, index_buffer, vertex_count); 
    }



    /**
     * 
     * @param {string} vertex_source
     * @param {string} fragment_source
     * @returns {RenderShader}
     */
    static create_render_shader(vertex_source, fragment_source) { 
        return RenderSystem.#INSTANCE._create_render_shader(vertex_source, fragment_source); 
    }

    /**
     * 
     * @param {string} compute_source
     * @returns {ComputeShader}
     */
    static create_compute_shader(compute_source) { 
        return RenderSystem.#INSTANCE._create_compute_shader(compute_source); 
    }


    /**
     * 
     * @param {Extents2D} size 
     * @param {Uint8Array} data
     * @returns {Texture2D}
     */
    static create_texture_2D(size, data, props) { 
        return RenderSystem.#INSTANCE._create_texture_2D(size, data, props); 
    }

    /**
     * @returns {RenderTarget}
     */
    static get_default_render_target() {
        return RenderSystem.#INSTANCE._get_default_render_target();
    }

    static get_current_backend() {
        return RenderSystem.#INSTANCE.backend;
    }







    /**
     * 
     * @param {string} type 
     * @param {number} size 
     * @returns {BufferObject}
     */
    _create_buffer(type, size) {  }

    /**
     *  
     * @param {number} size 
     * @returns {BufferObject}
     */
    _create_vertex_buffer(size) { }

    /**
     *  
     * @param {number} size
     * @returns {BufferObject}
     */
    _create_index_buffer(size) {  }

    /**
     *  
     * @param {number} size
     * @returns {BufferObject}
     */
    _create_uniform_buffer(size) { }


    /**
     * @param {BufferObject[]} vertex_buffers 
     * @param {BufferLayout[]} layouts
     * @param {BufferObject} index_buffer
     * @param {number} vertex_count
     * @returns {Model}
     */
    _create_model(vertex_buffers, layouts, index_buffer, vertex_count) {  }



    /**
     * 
     * @param {string} vertex_source
     * @param {string} fragment_source
     * @returns {RenderShader}
     */
    _create_render_shader(vertex_source, fragment_source) {  }

    /**
     * 
     * @param {string} compute_source
     * @returns {ComputeShader}
     */
    _create_compute_shader(compute_source) {  }


    /**
     * 
     * @param {Extents2D} size 
     * @param {Uint8Array} data
     * @returns {Texture2D}
     */
    _create_texture_2D(size, data) {  }

}