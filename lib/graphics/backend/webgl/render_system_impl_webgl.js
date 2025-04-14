import { BufferLayout, BufferObject } from "../../buffer.js";
import { RenderSystem } from "../../render_system.js";

import { BufferLayout_WebGL, BufferObject_WebGL, Model_WebGL } from "./buffer_impl_webgl.js";
import { WebGLUtil } from "./gl_util.js";
import { RenderTarget_WebGL } from "./render_target_impl_webgl.js";
import { Renderer_WebGL } from "./renderer_impl_webgl.js";
import { RenderShader_WebGL } from "./shader_impl_webgl.js";
import { Texture2D_WebGL } from "./texture_impl_webgl.js";

export class RenderSystem_WebGL extends RenderSystem {

    static INSTANCE = null;

    /**
     * @type {Renderer_WebGL}
     */
    renderer = null;

    /**
     * @type {BufferObject_WebGL[]}
     */
    buffers = [];

    /**
     * @type {RenderShader_WebGL[]}
     */
    shaders = [];

    /**
     * @type {Texture2D_WebGL[]}
     */
    textures = [];

    /**
     * 
     */
    constructor() {

        super();
        this.renderer = new Renderer_WebGL();
        this.backend = RenderSystem.BACKEND_WEBGL_2;
    }


    /**
     * 
     * @param {string} type 
     * @param {number} size 
     * @returns {BufferObject_WebGL}
     */
    _create_buffer(type, size) {

        const buffer = new BufferObject_WebGL(type, size);
        this.buffers.push(buffer);
        
        return buffer;
    }

    /**
     *  
     * @param {number} size 
     * @returns {BufferObject_WebGL}
     */
    _create_vertex_buffer(size) { return this.create_buffer(BufferObject.VERTEX, size); }

    /**
     *  
     * @param {number} size
     * @returns {BufferObject_WebGL}
     */
    _create_index_buffer(size) { return this.create_buffer(BufferObject.INDEX, size); }

    /**
     *  
     * @param {number} size
     * @returns {BufferObject_WebGL}
     */
    _create_uniform_buffer(size) { return this.create_buffer(BufferObject.UNIFORM, size);}

    /**
     * @param {BufferObject_WebGL[]} vertex_buffers 
     * @param {BufferLayout[]} layout_list
     * @param {BufferObject_WebGL} index_buffer
     * @param {number} vertex_count
     * @returns {Model_WebGL}
     */
    _create_model(vertex_buffers, layout_list, index_buffer, vertex_count) {

        const layouts = layout_list.map((layout) => BufferLayout_WebGL.from(layout) );
        return new Model_WebGL(vertex_buffers, layouts, index_buffer, vertex_count);
    };




    /**
     * 
     * @param {string} vertex_source
     * @param {string} fragment_source
     * @returns {RenderShader_WebGL}
     */
    _create_render_shader(vertex_source, fragment_source) {
        const shader = new RenderShader_WebGL(vertex_source, fragment_source);
        this.shaders.push(shader);

        return shader;
    }

    /**
     * 
     * @param {string} compute_source
     * @returns {ComputeShader}
     */
    _create_compute_shader(compute_source) { throw new Error('unimplemented method'); }


    /**
     * 
     * @param {Extents2D} size 
     * @param {Uint8Array} data
     * @param {string} type 
     * @returns {Texture2D_WebGL}
     */
    _create_texture_2D(size, data, type) { 

        const texture = new Texture2D_WebGL(size, data, type);
        this.textures.push(texture);

        return texture;
    }


    _get_default_render_target() {
        return RenderTarget_WebGL.get_default();
    }

    /**
     * 
     * @param {Extents2D} size 
     * @returns {RenderTarget}
     */
    _create_render_target(size) {
        return new RenderTarget_WebGL(size);
    }

    /**
     * @returns {string}
     */
    _get_renderer_info() {
        const gl = WebGLUtil.get_context();
        const result = [
            `vendor: ${gl.getParameter(WebGL2RenderingContext.VENDOR)}`,
            `renderer: ${gl.getParameter(WebGL2RenderingContext.RENDERER)}`,
            `version: ${gl.getParameter(WebGL2RenderingContext.VERSION)}`,
            `GLSL version: ${gl.getParameter(WebGL2RenderingContext.SHADING_LANGUAGE_VERSION)}`
        ].join('; ');
        return result;
    }
}