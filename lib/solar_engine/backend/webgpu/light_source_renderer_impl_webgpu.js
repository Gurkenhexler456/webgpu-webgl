import { Extents2D } from "../../../math/util.js";
import { Sampler_WebGPU, Texture2D_WebGPU } from "../../../graphics/backend/webgpu/texture_impl_webgpu.js";
import { DeferredRenderer } from "../../deferred_renderer.js";
import { RenderShader_WebGPU } from "../../../graphics/backend/webgpu/shader_impl_webgpu.js";
import { WebGPUUtil } from "../../../graphics/backend/webgpu/gpu_util.js";
import { BufferObject_WebGPU, Model_WebGPU } from "../../../graphics/backend/webgpu/buffer_impl_webgpu.js";
import { Matrix4 } from "../../../math/matrix.js";

export class LightSourceRenderer_WebGPU {

    #color_texture;
    #color_texture_view

    #light_texture;
    #light_texture_view;

    #depth_texture;
    #depth_texture_view;


    /**
     * 
     * @param {Extents2D} resolution 
     * @param {Texture2D_WebGPU} depth_texture 
     */
    constructor(resolution, depth_texture) {

        this.resolution = resolution;

        const usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT;

        this.#color_texture = new Texture2D_WebGPU(this.resolution, null, { 
                label: 'albedo',
                usage
            });
        this.#color_texture_view = this.#color_texture.texture.createView();

        this.#light_texture = new Texture2D_WebGPU(this.resolution, null, { 
                label: 'light',
                usage
            });
        this.#light_texture_view = this.#light_texture.texture.createView();

        this.#depth_texture = depth_texture;
        this.#depth_texture_view = this.#depth_texture.texture.createView();


        // uniform buffers
        this.camera_buffer_data = new ArrayBuffer(4 * 16 * 4);
        this.camera_matrices = {
            projection: new Float32Array(this.camera_buffer_data, 0, 16),
            view:       new Float32Array(this.camera_buffer_data, 64, 16),
            model:      new Float32Array(this.camera_buffer_data, 128, 16),
            normal:     new Float32Array(this.camera_buffer_data, 192, 16),
        }

        this.camera_buffer = BufferObject_WebGPU.uniform(this.camera_buffer_data.byteLength);

        this.#init_buffer();

        // Pipeline-Definition
        this.light_pipeline = new LightPipeline_WebGPU(this, this.camera_buffer.buffer);
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

        WebGPUUtil.get_device().queue.writeBuffer(this.camera_buffer.buffer, 0, this.camera_buffer_data);
    }

    /**
     * 
     * @param {GPUCommandEncoder} encoder 
     */
    #clear(encoder) {

        const device = WebGPUUtil.get_device();

        const pass = encoder.beginRenderPass({
            label: 'DeferredRenderer: clear RenderPass',
            colorAttachments: [
                {
                    view: this.#color_texture_view,
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: [0.0, 0.0, 0.0, 1.0]
                },
                {
                    view: this.#light_texture_view,
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: [0.0, 0.0, 0.0, 1.0]
                }
            ],
            depthStencilAttachment: {
                view: this.#depth_texture_view,
                depthLoadOp: 'load',
                depthStoreOp: 'store',
            }
        });
        pass.end();
    }


    /**
     * 
     * @param {{
     *      model:          Model_WebGPU,
     *      transform:      Matrix4,
     *      texture:        GPUTexture
     * }[]} objects 
     * @param {{
     *      perspective:    Matrix4,
     *      view:           Matrix4
     * }} camera 
     */
    process(objects, camera) {

        const device = WebGPUUtil.get_device();

        this.camera_matrices.projection.set(camera.perspective.data);
        this.camera_matrices.view.set(camera.view.data);

        {
            const encoder = device.createCommandEncoder({ label: 'DeferredStep: CommandEncoder clear' });

            this.#clear(encoder);

            device.queue.submit([encoder.finish()]);
        }


        for(let i = 0; i < objects.length; i++) {

            const encoder = device.createCommandEncoder({ label: `DeferredStep: CommandEncoder LitPipeline (${i})` });

            const obj = objects[i];

            this.camera_matrices.model.set(obj.transform.data);
            this.camera_matrices.normal.set(obj.transform.calc_normal_matrix().data);
            this.camera_buffer.write_data(this.camera_buffer_data);

            const model = obj.model;

            this.light_pipeline.render_object(encoder, model.vertices[0].buffer, model.indices.buffer, model.vertex_count, obj.texture);
       
            device.queue.submit([encoder.finish()]);
        }
    }

    get color_texture() {
        return this.#color_texture;
    }  

    get light_texture() {
        return this.#light_texture;
    }

    get depth_texture() {
        return this.#depth_texture;
    }
}


class LightPipeline_WebGPU {

    static vertex_shader = `

        struct CommonData {
            projection: mat4x4f,
            view: mat4x4f,
            model: mat4x4f,
            normal: mat4x4f,
        }

        @group(0) @binding(0) var<uniform> u_common: CommonData;

        struct VertexInput {
            @location(0) position: vec3f,
            @location(1) uv: vec2f,
            @location(2) normal: vec3f
        }

        struct VertexOutput {
            @builtin(position) position: vec4f,
            @location(0) uv: vec2f
        }

        @vertex 
        fn vertex_main(vs_input: VertexInput) -> VertexOutput {
            

            var vsOut: VertexOutput;
            vsOut.position = u_common.projection * u_common.view * u_common.model * vec4f(vs_input.position, 1.);
            vsOut.uv = vec2f(1. - vs_input.uv.x, vs_input.uv.y);// * vec2f(21, 15);

            return vsOut;
        }`;

    static fragment_shader = `

        @group(0) @binding(1) var tex_sampler: sampler;
        @group(0) @binding(2) var tex_texture: texture_2d<f32>;

        struct FSOutput {
            @location(0) color: vec4f,
            @location(1) light: vec4f
        }

        @fragment
        fn fragment_main(fsIn: VertexOutput) -> FSOutput {

            var fs_output: FSOutput;

            fs_output.color             = textureSample(tex_texture, tex_sampler, fsIn.uv);
            fs_output.light             = vec4f(1.);

            return fs_output;
        }`;
    


    /**
     * 
     * @param {LightSourceRenderer_WebGPU} light_renderer
     * @param {BufferObject_WebGPU} buffer  
     */
    constructor(light_renderer, camera_buffer) {

        const device = WebGPUUtil.get_device();

        this.light_renderer = light_renderer;
        this.camera_buffer = camera_buffer;

        this.sampler = new Sampler_WebGPU( { label: 'LightPipeline: Sampler (filtering)' } );

        this.output_textures = [
            {
                texture: this.light_renderer.color_texture.texture,
                view: this.light_renderer.color_texture.texture.createView(),
            },
            {
                texture: this.light_renderer.light_texture.texture,
                view: this.light_renderer.light_texture.texture.createView(),
            },
            {
                texture: this.light_renderer.depth_texture.texture,
                view: this.light_renderer.depth_texture.texture.createView(),
            }
        ]

        this.shader = new RenderShader_WebGPU(LightPipeline_WebGPU.vertex_shader, LightPipeline_WebGPU.fragment_shader);
        this.bind_group_layout = device.createBindGroupLayout({
            label: 'LightPipeline: BindGroupLayout',
            entries: [
                { 
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: "filtering"
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'float'
                    }
                }
            ]
        });
        this.pipeline_layout = device.createPipelineLayout({
            label: 'LightPipeline: PipelineLayout',
            bindGroupLayouts: [ this.bind_group_layout ]
        });
        this.pipeline = device.createRenderPipeline({
            label: 'LightPipeline: RenderPipeline',
            layout: this.pipeline_layout,
            vertex: {
                module: this.shader.module,
                entryPoint: 'vertex_main',
                buffers: [
                    {
                        arrayStride: (3 + 3 + 2) * 4,
                        attributes: [
                            { shaderLocation: 0, format: 'float32x3', offset: 0},
                            { shaderLocation: 1, format: 'float32x2', offset: 12},
                            { shaderLocation: 2, format: 'float32x3', offset: 20},
                        ]
                    }
                ]
            },
            fragment: {
                module: this.shader.module,
                entryPoint: 'fragment_main',
                targets: [
                    { format: 'rgba8unorm' },
                    { format: 'rgba8unorm' }
                ]
            },
            depthStencil: {
                format: 'depth32float',
                depthWriteEnabled: 'true',
                depthCompare: 'less'
            }
        })
    }

    /**
     * 
     * @param {GPUCommandEncoder} encoder 
     * @param {GPUBuffer} vertex_buffer
     * @param {GPUBuffer} index_buffer
     * @param {number} index_count
     * @param {GPUTexture} texture
     */
    render_object(encoder, vertex_buffer, index_buffer, index_count, texture) {

        const device = WebGPUUtil.get_device();

        const bind_group = device.createBindGroup({
            label: 'LightPipeline: BindGroup',
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.camera_buffer }},
                { binding: 1, resource: this.sampler.sampler },
                { binding: 2, resource: texture.createView() }
            ]
        });

        const render_pass = encoder.beginRenderPass({
            label: 'LightPipeline: RenderPass',
            colorAttachments: [
                {
                    loadOp: 'load',
                    storeOp: 'store',
                    view: this.output_textures[0].view
                },
                {
                    loadOp: 'load',
                    storeOp: 'store',
                    view: this.output_textures[1].view
                }
            ],
            depthStencilAttachment: {
                depthLoadOp: 'load',
                depthStoreOp: 'store',
                view: this.output_textures[2].view
            }
        });

        render_pass.setPipeline(this.pipeline);
        render_pass.setBindGroup(0, bind_group);
        render_pass.setVertexBuffer(0, vertex_buffer);
        render_pass.setIndexBuffer(index_buffer, 'uint32');
        render_pass.drawIndexed(index_count);
        render_pass.end();
    }
}