import { Extents2D } from "../../../math/util.js";
import { DeferredRenderer } from "../../deferred_renderer.js";
import { Matrix4 } from "../../../math/matrix.js";
import { WebGLUtil } from "../../../graphics/backend/webgl/gl_util.js";
import { TextureType } from "../../../graphics/texture.js";
import { Texture2D_WebGL } from "../../../graphics/backend/webgl/texture_impl_webgl.js";
import { BufferObject_WebGL, Model_WebGL } from "../../../graphics/backend/webgl/buffer_impl_webgl.js";
import { RenderShader_WebGL } from "../../../graphics/backend/webgl/shader_impl_webgl.js";
import { Camera } from "../../../graphics/util/camera.js";

/**
 *  This class implements the whole deferred rendering pipeline
 * 
 *  There is a GBuffer consisting of textures that hold values for albedo, positions, normals, light, and depth
 *      albedo:     color or texture values of the objects in the scene
 *      positions:  positions of the objects in the scene in world space
 *      normals:    normals of the objects in the scene in world space
 *      light:      light color values of objects in the scene. Only used by objects that emit light
 *      depth:      depth values of the objects in the scene
 *  
 *  There is also a texture to store the resulting Image
 *  
 *  The whole pipeline consists of two sub-pipelines:
 *      LitPipeline:    renders objects that are lit by other light sources - uses ['albedo', 'positions', 'normals', 'depth']
 *      MergePipeline:  uses ['albedo', 'light', 'positions', 'normals', 'depth'] to produce the resulting image
 */
export class DeferredRenderer_WebGL extends DeferredRenderer {

    #g_buffer = [];

    /**
     * 
     * @param {Extents2D} resolution 
     */
    constructor(resolution) {

        super(resolution);

        const gl = WebGLUtil.get_context();

        // GBuffer-Definition
        this.#g_buffer.push(...[
            {
                label: 'albedo',
                attachment: WebGL2RenderingContext.COLOR_ATTACHMENT0,
                texture: new Texture2D_WebGL(this.resolution, null),
            },
            {
                label: 'position',
                attachment: WebGL2RenderingContext.COLOR_ATTACHMENT0 + 1,
                texture: new Texture2D_WebGL(this.resolution, null, TextureType.COLOR_32_F),
            },
            {
                label: 'normal',
                attachment: WebGL2RenderingContext.COLOR_ATTACHMENT0 + 2,
                texture: new Texture2D_WebGL(this.resolution, null, TextureType.COLOR_32_F),
            },
            {
                label: 'depth',
                attachment: WebGL2RenderingContext.DEPTH_ATTACHMENT,
                texture: new Texture2D_WebGL(this.resolution, null, TextureType.DEPTH),
            }
        ]);

        this.g_buffer_fbo = gl.createFramebuffer();
        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.g_buffer_fbo);
        this.#g_buffer.forEach((buffer) => {
            gl.framebufferTexture2D(
                WebGL2RenderingContext.FRAMEBUFFER, buffer.attachment, 
                WebGL2RenderingContext.TEXTURE_2D, buffer.texture.texture, 0);

            if(gl.checkFramebufferStatus(WebGL2RenderingContext.FRAMEBUFFER) !== WebGL2RenderingContext.FRAMEBUFFER_COMPLETE) {
                throw new Error(`failed to add color attachment (g_buffer '${buffer.label}'): framebuffer incomplete`);
            }
        });

        // Result-Definition
        this.result_texture = new Texture2D_WebGL(this.resolution, null);
        this.result_fbo = gl.createFramebuffer();
        
        if(this.result_fbo) {
            gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.result_fbo);
            gl.framebufferTexture2D(
                WebGL2RenderingContext.FRAMEBUFFER, WebGL2RenderingContext.COLOR_ATTACHMENT0, 
                WebGL2RenderingContext.TEXTURE_2D, this.result_texture.texture, 0);

            if(gl.checkFramebufferStatus(WebGL2RenderingContext.FRAMEBUFFER) !== WebGL2RenderingContext.FRAMEBUFFER_COMPLETE) {
                throw new Error(`failed to add color attachment (result): framebuffer incomplete`);
            }
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
        this.lit_pipeline = new LitPipeline_WebGL(this, this.camera_buffer.buffer);
        this.merge_pipeline = new MergePipeline_WebGL(this);
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

        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.g_buffer_fbo);
        gl.viewport(0, 0, this.resolution.width, this.resolution.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(WebGL2RenderingContext.DEPTH_TEST);
        gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT | WebGL2RenderingContext.DEPTH_BUFFER_BIT);

        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.result_fbo);
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


        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.g_buffer_fbo);
        gl.drawBuffers([
            WebGL2RenderingContext.COLOR_ATTACHMENT0,
            WebGL2RenderingContext.COLOR_ATTACHMENT0 + 1,
            WebGL2RenderingContext.COLOR_ATTACHMENT0 + 2
        ]);
        gl.viewport(0, 0, this.resolution.width, this.resolution.height);

        gl.enable(WebGL2RenderingContext.DEPTH_TEST);
        gl.useProgram(this.lit_pipeline.shader.program);
        
        this.lit_pipeline.prepare();


        for(let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            this.camera_matrices.model.set(obj.transform.data);
            this.camera_matrices.normal.set(obj.transform.calc_normal_matrix().data);
            gl.bufferSubData(WebGL2RenderingContext.UNIFORM_BUFFER, 0, cam_ubo);

            this.lit_pipeline.render_object(obj.model, obj.texture);
        }

        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.result_fbo);
        if(this.result_fbo) {
            gl.drawBuffers([
                WebGL2RenderingContext.COLOR_ATTACHMENT0
            ]);
        }
        gl.viewport(0, 0, this.resolution.width, this.resolution.height);

        gl.useProgram(this.merge_pipeline.shader.program);

        this.merge_pipeline.render();


    }

    /**
     * 
     * @param {string} label
     * @returns {Texture2D_WebGL} 
     */
    get_texture(label) {
        for(let i = 0; i < this.#g_buffer.length; i++) {
            if(this.#g_buffer[i].label === label) {
                return this.#g_buffer[i].texture;
            }
        }

        throw new Error(`DeferredStep: texture with label '${label}' not found!`);
    }   
}


class LitPipeline_WebGL {

    static vertex_shader = `#version 300 es

        layout (location = 0) in vec3 in_Position;
        layout (location = 1) in vec2 in_UV;
        layout (location = 2) in vec3 in_Normal;

        out vec3 vf_World_Position;
        out vec2 vf_UV;
        out vec3 vf_Normal;

        layout (std140) uniform CommonData {
            mat4 projection;
            mat4 view;
            mat4 model;
            mat4 normal;
        } u_common;
 
        void main() {
            
            vec4 world_pos = u_common.model * vec4(in_Position, 1.);

            vf_World_Position   = world_pos.xyz;
            vf_UV               = vec2(1. - in_UV.x, in_UV.y); //in_UV * vec2(21, 15);
            vf_Normal           = (u_common.normal * vec4(in_Normal, 0)).xyz;

            gl_Position = u_common.projection * u_common.view * world_pos;
        }`;

    static fragment_shader = `#version 300 es

        precision highp float;

        in vec3 vf_World_Position;
        in vec2 vf_UV;
        in vec3 vf_Normal;

        layout (location = 0) out vec4 out_Color;
        layout (location = 1) out vec4 out_World_Position;
        layout (location = 2) out vec4 out_Normal;

        uniform sampler2D u_Texture;

        void main() {

            out_Color           = texture(u_Texture, vf_UV);
            out_World_Position  = vec4(vf_World_Position, 1.0);
            out_Normal          = vec4(vf_Normal, 1.0);
        }`;


    /**
     * 
     * @param {DeferredStep_WebGL} deferred_step
     * @param {BufferObject_WebGL} buffer  
     */
    constructor(deferred_step, camera_buffer) {

        /**
         * @type {DeferredRenderer_WebGL}
         */
        this.deferred_step = deferred_step;

        /**
         * @type {BufferObject_WebGL}
         */
        this.camera_buffer = camera_buffer;

        /**
         * @type {Texture2D_WebGL[]}
         */
        this.output_textures = [
            this.deferred_step.get_texture('albedo'),
            this.deferred_step.get_texture('position'),
            this.deferred_step.get_texture('normal'),
            this.deferred_step.get_texture('depth')
        ]

        /**
         * @type {RenderShader_WebGL}
         */
        this.shader = new RenderShader_WebGL(LitPipeline_WebGL.vertex_shader, LitPipeline_WebGL.fragment_shader);
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
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.deferred_step.camera_buffer.buffer);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, block_binding, this.deferred_step.camera_buffer.buffer);
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



class MergePipeline_WebGL {

    static vertex_shader = `#version 300 es

        out vec2 vf_UV;
        
        vec3 positions[6] = vec3[6](
            vec3(-1.0, -1.0, 0.0),
            vec3( 1.0, -1.0, 0.0),
            vec3( 1.0,  1.0, 0.0),

            vec3( 1.0,  1.0, 0.0),
            vec3(-1.0,  1.0, 0.0),
            vec3(-1.0, -1.0, 0.0)
        );

        vec2 uvs[6] = vec2[6](
            vec2(0.0, 0.0),
            vec2(1.0, 0.0),
            vec2(1.0, 1.0),

            vec2(1.0, 1.0),
            vec2(0.0, 1.0),
            vec2(0.0, 0.0)
        );

        void main() {
            
            vf_UV = uvs[gl_VertexID];
            gl_Position = vec4(positions[gl_VertexID], 1.0);
        }`;

    static fragment_shader = `#version 300 es
        precision highp float;

        in vec2 vf_UV;

        out vec4 out_Color;

        uniform sampler2D u_Albedo;
        uniform sampler2D u_Position;
        uniform sampler2D u_Normal;


        void main() {


            vec3 base_color = texture(u_Albedo, vf_UV).xyz;
            vec3 base_position = texture(u_Position, vf_UV).xyz;
            vec3 base_normal = texture(u_Normal, vf_UV).xyz;

            vec3 to_light = -base_position;
            float dist = length(to_light) * 0.005;
            vec3 to_light_norm = normalize(to_light);
            float ambient = 0.1;
            float diff = max(dot(to_light_norm, base_normal), 0.) / (dist * dist);

            vec3 final_light = diff * (1. - ambient) * base_color;

            out_Color = vec4(final_light, 1.0);
        }`;


    /**
     * 
     * @param {DeferredStep_WebGPU} deferred_step
     */
    constructor(deferred_step) {

        /**
         * @type {DeferredRenderer_WebGL}
         */
        this.deferred_step = deferred_step;

        /**
         * @type {Texture2D_WebGL[]}
         */
        this.input_textures = [
            this.deferred_step.get_texture('albedo'),
            this.deferred_step.get_texture('position'),
            this.deferred_step.get_texture('normal')
        ]

        /**
         * @type {RenderShader_WebGL}
         */
        this.shader = new RenderShader_WebGL(MergePipeline_WebGL.vertex_shader, MergePipeline_WebGL.fragment_shader);

        const gl = WebGLUtil.get_context();

        gl.useProgram(this.shader.program);
        gl.uniform1i(gl.getUniformLocation(this.shader.program, 'u_Albedo'), 0);
        gl.uniform1i(gl.getUniformLocation(this.shader.program, 'u_Position'), 1);
        gl.uniform1i(gl.getUniformLocation(this.shader.program, 'u_Normal'), 2);
    }

    /**
     * 
     */
    render() {

        const gl = WebGLUtil.get_context();

        gl.activeTexture(WebGL2RenderingContext.TEXTURE0);
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, this.input_textures[0].texture);
        gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + 1);
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, this.input_textures[1].texture);
        gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + 2);
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, this.input_textures[2].texture);

        gl.drawArrays(WebGL2RenderingContext.TRIANGLES, 0, 6);
    }
}