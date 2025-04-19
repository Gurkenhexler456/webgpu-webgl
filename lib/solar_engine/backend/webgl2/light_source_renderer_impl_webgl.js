import { Extents2D } from "../../../math/util.js";
import { Matrix4 } from "../../../math/matrix.js";
import { WebGLUtil } from "../../../graphics/backend/webgl/gl_util.js";
import { TextureType } from "../../../graphics/texture.js";
import { Texture2D_WebGL } from "../../../graphics/backend/webgl/texture_impl_webgl.js";
import { BufferObject_WebGL, Model_WebGL } from "../../../graphics/backend/webgl/buffer_impl_webgl.js";
import { RenderShader_WebGL } from "../../../graphics/backend/webgl/shader_impl_webgl.js";
import { Camera } from "../../../graphics/util/camera.js";


export class LightSourceRenderer_WebGL {

    #color_texture;
    #light_texture;

    /**
     * 
     * @param {Extents2D} resolution 
     * @param {Texture2D_WebGL} depth_texture 
     */
    constructor(resolution, depth_texture) {

        this.resolution = resolution;

        const gl = WebGLUtil.get_context();

        this.#color_texture = {
                label: 'color',
                attachment: WebGL2RenderingContext.COLOR_ATTACHMENT0,
                texture: new Texture2D_WebGL(this.resolution, null),
            };
        this.#light_texture = {
                label: 'light',
                attachment: WebGL2RenderingContext.COLOR_ATTACHMENT0 + 1,
                texture: new Texture2D_WebGL(this.resolution, null),
            };

        this.depth_texture = depth_texture;

        this.output_texture = new Texture2D_WebGL(this.resolution, null);

        this.output_fbo = gl.createFramebuffer();
        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.output_fbo);
        gl.framebufferTexture2D(
            WebGL2RenderingContext.FRAMEBUFFER, WebGL2RenderingContext.COLOR_ATTACHMENT0, 
            WebGL2RenderingContext.TEXTURE_2D, this.color_texture.texture, 0);
        gl.framebufferTexture2D(
            WebGL2RenderingContext.FRAMEBUFFER, WebGL2RenderingContext.COLOR_ATTACHMENT0 + 1, 
            WebGL2RenderingContext.TEXTURE_2D, this.light_texture.texture, 0);
        gl.framebufferTexture2D(
            WebGL2RenderingContext.FRAMEBUFFER, WebGL2RenderingContext.DEPTH_ATTACHMENT, 
            WebGL2RenderingContext.TEXTURE_2D, this.depth_texture.texture, 0);

        if(gl.checkFramebufferStatus(WebGL2RenderingContext.FRAMEBUFFER) !== WebGL2RenderingContext.FRAMEBUFFER_COMPLETE) {
            throw new Error(`failed to add color attachment (g_buffer '${buffer.label}'): framebuffer incomplete`);
        }

        // uniform buffers
        this.camera_buffer_data = new ArrayBuffer(4 * 16 * 4);
        this.camera_matrices = {
            projection: new Float32Array(this.camera_buffer_data, 0, 16),
            view:       new Float32Array(this.camera_buffer_data, 64, 16),
            model:      new Float32Array(this.camera_buffer_data, 128, 16),
            normal:     new Float32Array(this.camera_buffer_data, 192, 16),
        }

        /**
         * @type {BufferObject_WebGL}
         */
        this.camera_buffer = BufferObject_WebGL.uniform(this.camera_buffer_data.byteLength);

        this.#init_buffer();

        // Pipeline-Definition
        this.light_pipeline = new LightPipeline_WebGL(this, this.camera_buffer.buffer);
    }

    #init_buffer() {
        const identity = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]
        this.camera_matrices.projection.set(identity);
        this.camera_matrices.view.set(identity);
        this.camera_matrices.model.set(identity);
        this.camera_matrices.normal.set(identity);

        const gl = WebGLUtil.get_context();
        const cam_ubo = new Float32Array(this.camera_buffer_data);

        gl.bindBuffer(WebGL2RenderingContext.UNIFORM_BUFFER, this.camera_buffer.buffer);
        gl.bufferSubData(WebGL2RenderingContext.UNIFORM_BUFFER, 0, cam_ubo);
    }

    /**
     *  
     */
    #clear() {


        const gl = WebGLUtil.get_context();

        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.output_fbo);
        gl.viewport(0, 0, this.resolution.width, this.resolution.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.disable(WebGL2RenderingContext.DEPTH_TEST);
        gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);

        
    }


    /**
     * 
     * @param {{
     *      model:          Model_WebGL,
     *      transform:      Matrix4,
     *      texture:        WebGLTexture
     * }[]} objects
     * @param {Camera} camera 
     */
    process(objects, camera) {

        const gl = WebGLUtil.get_context();
        const cam_ubo = new Float32Array(this.camera_buffer_data);

        this.#clear();

        this.camera_matrices.projection.set(camera.perspective.data);
        this.camera_matrices.view.set(camera.view.data);
        gl.bindBuffer(WebGL2RenderingContext.UNIFORM_BUFFER, this.camera_buffer.buffer);
        gl.bufferSubData(WebGL2RenderingContext.UNIFORM_BUFFER, 0, cam_ubo);


        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.output_fbo);
        gl.drawBuffers([
            WebGL2RenderingContext.COLOR_ATTACHMENT0,
            WebGL2RenderingContext.COLOR_ATTACHMENT0 + 1,
        ]);
        gl.viewport(0, 0, this.resolution.width, this.resolution.height);

        gl.enable(WebGL2RenderingContext.DEPTH_TEST);
        gl.useProgram(this.light_pipeline.shader.program);
        
        this.light_pipeline.prepare();


        for(let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            this.camera_matrices.model.set(obj.transform.data);
            this.camera_matrices.normal.set(obj.transform.calc_normal_matrix().data);
            gl.bufferSubData(WebGL2RenderingContext.UNIFORM_BUFFER, 0, cam_ubo);

            this.light_pipeline.render_object(obj.model, obj.texture);
        }
    }  


    /**
     * @returns {Texture2D_WebGL}
     */
    get color_texture() {
        return this.#color_texture.texture;
    }

    /**
     * @returns {Texture2D_WebGL}
     */
    get light_texture() {
        return this.#light_texture.texture;
    }
}


class LightPipeline_WebGL {

    static vertex_shader = `#version 300 es

        layout (location = 0) in vec3 in_Position;
        layout (location = 1) in vec2 in_UV;
        layout (location = 2) in vec3 in_Normal;

        out vec2 vf_UV;

        layout (std140) uniform CommonData {
            mat4 projection;
            mat4 view;
            mat4 model;
            mat4 normal;
        } u_common;
 
        void main() {

            vf_UV               = vec2(1. - in_UV.x, in_UV.y); //in_UV * vec2(21, 15);

            gl_Position         = u_common.projection * u_common.view * u_common.model * vec4(in_Position, 1.);
        }`;

    static fragment_shader = `#version 300 es

        precision highp float;

        in vec2 vf_UV;

        layout (location = 0) out vec4 out_Color;
        layout (location = 1) out vec4 out_Light;

        uniform sampler2D u_Texture;

        void main() {

            out_Color           = texture(u_Texture, vf_UV);
            out_Light           = vec4(1.);
        }`;


    /**
     * 
     * @param {LightSourceRenderer_WebGL} light_renderer
     * @param {BufferObject_WebGL} buffer  
     */
    constructor(light_renderer, camera_buffer) {

        /**
         * @type {LightSourceRenderer_WebGL}
         */
        this.light_renderer = light_renderer;

        /**
         * @type {BufferObject_WebGL}
         */
        this.camera_buffer = camera_buffer;

        /**
         * @type {RenderShader_WebGL}
         */
        this.shader = new RenderShader_WebGL(LightPipeline_WebGL.vertex_shader, LightPipeline_WebGL.fragment_shader);
    }

    /**
     * 
     * @param {BufferObject_WebGL} ubo 
     */
    prepare() {
        const gl = WebGLUtil.get_context();

        const block_binding = 0;

        const block_index = gl.getUniformBlockIndex(this.shader.program, 'CommonData');
        gl.uniformBlockBinding(this.shader.program, block_index, block_binding);
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.light_renderer.camera_buffer.buffer);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, block_binding, this.light_renderer.camera_buffer.buffer);
    }

    /**
     *  
     * @param {Model_WebGL} model
     * @param {WebGLTexture} texture
     */
    render_object(model, texture) {

        const gl = WebGLUtil.get_context();
        
        gl.bindVertexArray(model.vao);

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);

        gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, model.ebo.buffer);

        gl.activeTexture(WebGL2RenderingContext.TEXTURE0);
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, texture);

        gl.drawElements(WebGL2RenderingContext.TRIANGLES, model.vertex_count, WebGL2RenderingContext.UNSIGNED_INT, 0);
    }
}