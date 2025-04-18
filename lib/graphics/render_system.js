import { Extents2D } from "../math/util.js";

import { BufferObject, Model } from "./buffer.js";
import { RenderTarget } from "./render_target.js";
import { Renderer } from "./renderer.js";
import { ComputeShader, RenderShader } from "./shader.js";
import { Texture2D } from "./texture.js";



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
        return RenderSystem.#INSTANCE.create_buffer(type, size); 
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
        return RenderSystem.#INSTANCE.create_model(vertex_buffers, layouts, index_buffer, vertex_count); 
    }



    /**
     * 
     * @param {string} vertex_source
     * @param {string} fragment_source
     * @returns {RenderShader}
     */
    static create_render_shader(vertex_source, fragment_source) { 
        return RenderSystem.#INSTANCE.create_render_shader(vertex_source, fragment_source); 
    }

    /**
     * 
     * @param {string} compute_source
     * @returns {ComputeShader}
     */
    static create_compute_shader(compute_source) { 
        return RenderSystem.#INSTANCE.create_compute_shader(compute_source); 
    }


    /**
     * 
     * @param {Extents2D} size 
     * @param {Uint8Array} data
     * @param {string} type
     * @returns {Texture2D}
     */
    static create_texture_2D(size, data, type) { 
        return RenderSystem.#INSTANCE.create_texture_2D(size, data, type); 
    }

    /**
     * @returns {RenderTarget}
     */
    static get_default_render_target() {
        return RenderSystem.#INSTANCE.get_default_render_target();
    }

    /**
     * @param {Extents2D} size
     * @returns {RenderTarget}
     */
    static create_render_target(size) {
        return RenderSystem.#INSTANCE.create_render_target(size);
    }

    static get_current_backend() {
        return RenderSystem.#INSTANCE.backend;
    }

    /**
     * @returns {string}
     */
    static get_renderer_info() {
        return RenderSystem.#INSTANCE.get_renderer_info();
    }
}