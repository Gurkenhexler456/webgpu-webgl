/**
 * @typedef {{
*      format: string,
*      usage: number
* }} TextureProps_WebGPU
*/

import { RenderSystem } from "../../render_system.js";
import { BufferLayout_WebGPU, BufferObject_WebGPU, Model_WebGPU } from "./buffer_impl_webgpu.js";
import { WebGPUUtil } from "./gpu_util.js";
import { RenderTarget_WebGPU } from "./render_target_impl_webgpu.js";
import { Renderer_WebGPU } from "./renderer_impl_webgpu.js";
import { ComputeShader_WebGPU, RenderShader_WebGPU } from "./shader_impl_webgpu.js";
import { Texture2D_WebGPU } from "./texture_impl_webgpu.js";

export class RenderSystem_WebGPU extends RenderSystem {

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

        super();

        this.renderer = new Renderer_WebGPU();
        this.backend = RenderSystem.BACKEND_WEBGPU;
    }


    /**
     * 
     * @param {string} type 
     * @param {number} size 
     * @returns {BufferObject_WebGPU}
     */
    create_buffer(type, size) {

        const buffer = new BufferObject_WebGPU(type, size);
        this.buffers.push(buffer);
        
        return buffer;
    }

    /**
     *  
     * @param {number} size 
     * @returns {BufferObject_WebGPU}
     */
    create_vertex_buffer(size) { return this.create_buffer(BufferObject.VERTEX, size); }

    /**
     *  
     * @param {number} size
     * @returns {BufferObject_WebGPU}
     */
    create_index_buffer(size) { return this.create_buffer(BufferObject.INDEX, size); }

    /**
     *  
     * @param {number} size
     * @returns {BufferObject_WebGPU}
     */
    create_uniform_buffer(size) { return this.create_buffer(BufferObject.UNIFORM, size);}

    /**
     * @param {BufferObject_WebGPU[]} vertex_buffers 
     * @param {BufferLayout[]} layout_list
     * @param {BufferObject_WebGPU} index_buffer
     * @param {number} vertex_count
     * @returns {Model_WebGPU}
     */
    create_model(vertex_buffers, layout_list, index_buffer, vertex_count) {

        const layouts = layout_list.map((layout) => BufferLayout_WebGPU.from(layout));
        return new Model_WebGPU(vertex_buffers, layouts, index_buffer, vertex_count);
    };




    /**
     * 
     * @param {string} vertex_source
     * @param {string} fragment_source
     * @returns {RenderShader_WebGPU}
     */
    create_render_shader(vertex_source, fragment_source) {
        const shader = new RenderShader_WebGPU(vertex_source, fragment_source);
        this.shaders.push(shader);

        return shader;
    }

    /**
     * 
     * @param {string} compute_source
     * @returns {ComputeShader_WebGPU}
     */
    create_compute_shader(compute_source) { 
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
    create_texture_2D(size, data, props) { 

        const texture = new Texture2D_WebGPU(size, data, props);
        this.textures.push(texture);

        return texture;
    }


    /**
     * @returns {RenderTarget_WebGPU}
     */
    get_default_render_target() {
        return RenderTarget_WebGPU.get_default();
    }

    /**
     * 
     * @param {Extents2D} size 
     * @returns {RenderTarget}
     */
    create_render_target(size) {
        return new RenderTarget_WebGPU(size);
    }

    /**
     * @returns {string}
     */
    get_renderer_info() {
        const device = WebGPUUtil.get_device();

        const info = device.adapterInfo;
        return `vendor: ${info.vendor}; architecture: ${info.architecture}; device: ${info.device}; description: ${info.description} `;
    }
}