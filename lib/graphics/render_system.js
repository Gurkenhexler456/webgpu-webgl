import { Extents2D } from "../math/util.js";

import { BufferObject, Model } from "./buffer.js";
import { RenderTarget } from "./render_target.js";
import { Renderer } from "./renderer.js";
import { ComputeShader, RenderShader } from "./shader.js";
import { Texture2D } from "./texture.js";

import { Shader } from "./backend/webgl/shader_impl_webgl.js";



export class RenderSystem {

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
     * @type {BufferObject[]}
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

    constructor() {
        if(RenderSystem.#INSTANCE) {
            throw new Error('There is already an instance of class RenderSystem');
        }
        RenderSystem.#INSTANCE = this;
    }


    /**
     * @returns {Renderer}
     */
    static get Renderer() { return RenderSystem.#INSTANCE.renderer; }


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
     * @param {string} type
     * @returns {Texture2D}
     */
    static create_texture_2D(size, data, type) { 
        return RenderSystem.#INSTANCE._create_texture_2D(size, data, type); 
    }

    /**
     * @returns {RenderTarget}
     */
    static get_default_render_target() {
        return RenderSystem.#INSTANCE._get_default_render_target();
    }

    /**
     * @param {Extents2D} size
     * @returns {RenderTarget}
     */
    static create_render_target(size) {
        return RenderSystem.#INSTANCE._create_render_target(size);
    }

    static get_current_backend() {
        return RenderSystem.#INSTANCE.backend;
    }

    /**
     * @returns {string}
     */
    static get_renderer_info() {
        return RenderSystem.#INSTANCE._get_renderer_info();
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


    /**
     * 
     * @param {Extents2D} size 
     * @returns {RenderTarget}
     */
    _create_render_target(size) {}

    /**
     * @returns {string}
     */
    _get_renderer_info() {}

}