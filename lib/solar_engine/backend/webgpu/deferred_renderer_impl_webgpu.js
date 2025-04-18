import { Extents2D } from "../../../math/util.js";
import { Sampler_WebGPU, Texture2D_WebGPU } from "../../../graphics/backend/webgpu/texture_impl_webgpu.js";
import { DeferredRenderer } from "../../deferred_renderer.js";
import { RenderShader_WebGPU } from "../../../graphics/backend/webgpu/shader_impl_webgpu.js";
import { WebGPUUtil } from "../../../graphics/backend/webgpu/gpu_util.js";
import { BufferObject_WebGPU, Model_WebGPU } from "../../../graphics/backend/webgpu/buffer_impl_webgpu.js";
import { Matrix4 } from "../../../math/matrix.js";

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
 *  The whole pipeline consists of three sub-pipelines:
 *      LitPipeline:    renders objects that are lit by other light sources - uses ['albedo', 'positions', 'normals', 'depth']
 *      LightPipeline:  renders objects that represent light sources - uses ['albedo', 'light', 'positions', 'normals', 'depth']
 *      MergePipeline:  uses ['albedo', 'light', 'positions', 'normals', 'depth'] to produce the resulting image
 */
export class DeferredRenderer_WebGPU extends DeferredRenderer {

    #g_buffer = [];

    /**
     * 
     * @param {Extents2D} resolution 
     */
    constructor(resolution) {

        super(resolution);

        const device = WebGPUUtil.get_device();

        const usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT;

        // GBuffer-Definition
        this.#g_buffer.push(...[
            new Texture2D_WebGPU(this.resolution, null, { 
                label: 'albedo',
                usage
            }),
            new Texture2D_WebGPU(this.resolution, null, { 
                label: 'light',
                usage
            }),
            new Texture2D_WebGPU(this.resolution, null, { 
                label: 'position',
                format: 'rgba32float',
                usage
            }),
            new Texture2D_WebGPU(this.resolution, null, { 
                label: 'normal',
                format: 'rgba32float',
                usage 
            }),
            new Texture2D_WebGPU(this.resolution, null, { 
                label: 'depth',
                format: 'depth32float',
                usage
            }),
        ]);

        this.g_buffer_views = this.#g_buffer.map((buffer) => buffer.texture.createView());

        // Result-Definition
        this.result = new Texture2D_WebGPU(this.resolution, null, { 
            label: 'deferred_output',
            usage 
        });
        this.result_view = this.result.texture.createView();

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
        this.lit_pipeline = new LitPipeline_WebGPU(this, this.camera_buffer.buffer);
        this.merge_pipeline = new MergePipeline_WebGPU(this);
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
                    view: this.g_buffer_views[0],
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: [0.0, 0.0, 0.0, 1.0]
                },
                {
                    view: this.g_buffer_views[1],
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: [0.0, 0.0, 0.0, 1.0]
                },
                {
                    view: this.g_buffer_views[2],
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: [0.0, 0.0, 0.0, 1.0]
                },
                {
                    view: this.g_buffer_views[3],
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: [0.0, 0.0, 0.0, 1.0]
                },
                {
                    view: this.result_view,
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: [0.0, 0.0, 0.0, 1.0]
                },
            ],
            depthStencilAttachment: {
                view: this.g_buffer_views[4],
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                depthClearValue: 1.0
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

            this.lit_pipeline.render_object(encoder, model.vertices[0].buffer, model.indices.buffer, model.vertex_count, obj.texture);
       
            device.queue.submit([encoder.finish()]);
        }


        {
            const encoder = device.createCommandEncoder({ label: 'DeferredStep: CommandEncoder MergeStep' });

            this.merge_pipeline.render(encoder);

            device.queue.submit([encoder.finish()]);
        }
    }

    /**
     * 
     * @param {string} label
     * @returns {GPUTexture} 
     */
    get_texture(label) {
        for(let i = 0; i < this.#g_buffer.length; i++) {
            if(this.#g_buffer[i].texture.label === label) {
                return this.#g_buffer[i].texture;
            }
        }

        throw new Error(`DeferredStep: texture with label '${label}' not found!`);
    }   
}


class LitPipeline_WebGPU {

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
            @location(0) uv: vec2f,
            @location(1) normal: vec3f,
            @location(2) world_position: vec3f
        }

        @vertex 
        fn vertex_main(vs_input: VertexInput) -> VertexOutput {
            
            let world_pos = u_common.model * vec4f(vs_input.position, 1.);

            var vsOut: VertexOutput;
            vsOut.world_position = world_pos.xyz;
            vsOut.position = u_common.projection * u_common.view * world_pos;
            vsOut.uv = vec2f(1. - vs_input.uv.x, vs_input.uv.y);// * vec2f(21, 15);

            vsOut.normal = (u_common.normal * vec4f(vs_input.normal, 0)).xyz;

            return vsOut;
        }`;

    static fragment_shader = `

        @group(0) @binding(1) var tex_sampler: sampler;
        @group(0) @binding(2) var tex_texture: texture_2d<f32>;

        struct FSOutput {
            @location(0) color: vec4f,
            @location(1) world_position: vec4f,
            @location(2) normal: vec4f
        }

        @fragment
        fn fragment_main(fsIn: VertexOutput) -> FSOutput {

            var fs_output: FSOutput;

            fs_output.color             = textureSample(tex_texture, tex_sampler, fsIn.uv);
            fs_output.world_position    = vec4f(fsIn.world_position, 1.0);
            fs_output.normal            = vec4f(fsIn.normal, 1.0);

            return fs_output;
        }`;


    /**
     * 
     * @param {DeferredStep_WebGPU} deferred_step
     * @param {BufferObject_WebGPU} buffer  
     */
    constructor(deferred_step, camera_buffer) {

        const device = WebGPUUtil.get_device();

        this.deferred_step = deferred_step;
        this.camera_buffer = camera_buffer;

        this.sampler = new Sampler_WebGPU( { label: 'LitPipeline: Sampler (filtering)' } );

        this.output_textures = [
            {
                texture: this.deferred_step.get_texture('albedo'),
                view: this.deferred_step.get_texture('albedo').createView(),
            },
            {
                texture: this.deferred_step.get_texture('position'),
                view: this.deferred_step.get_texture('position').createView(),
            },
            {
                texture: this.deferred_step.get_texture('normal'),
                view: this.deferred_step.get_texture('normal').createView(),
            },
            {
                texture: this.deferred_step.get_texture('depth'),
                view: this.deferred_step.get_texture('depth').createView(),
            }
        ]

        this.shader = new RenderShader_WebGPU(LitPipeline_WebGPU.vertex_shader, LitPipeline_WebGPU.fragment_shader);
        this.bind_group_layout = device.createBindGroupLayout({
            label: 'LitPipeline: BindGroupLayout',
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
            label: 'LitPipeline: PipelineLayout',
            bindGroupLayouts: [ this.bind_group_layout ]
        });
        this.pipeline = device.createRenderPipeline({
            label: 'LitPipeline: RenderPipeline',
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
                    { format: 'rgba32float' },
                    { format: 'rgba32float' }
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
            label: 'LitPipeline: BindGroup',
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.camera_buffer }},
                { binding: 1, resource: this.sampler.sampler },
                { binding: 2, resource: texture.createView() }
            ]
        });

        const render_pass = encoder.beginRenderPass({
            label: 'LitPipeline: RenderPass',
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
                },
                {
                    loadOp: 'load',
                    storeOp: 'store',
                    view: this.output_textures[2].view
                }
            ],
            depthStencilAttachment: {
                depthLoadOp: 'load',
                depthStoreOp: 'store',
                view: this.output_textures[3].view
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



class MergePipeline_WebGPU {

    static vertex_shader = `

        const positions = array(
            vec3f(-1.0, -1.0,  0.0),
            vec3f( 1.0, -1.0,  0.0),
            vec3f( 1.0,  1.0,  0.0),

            vec3f( 1.0,  1.0,  0.0),
            vec3f(-1.0,  1.0,  0.0),
            vec3f(-1.0, -1.0,  0.0)
        );

        const uvs = array(
            vec2f(0.0, 0.0),
            vec2f(1.0, 0.0),
            vec2f(1.0, 1.0),

            vec2f(1.0, 1.0),
            vec2f(0.0, 1.0),
            vec2f(0.0, 0.0),
        );

        struct VSOutput {
            @builtin(position) position: vec4f,
            @location(0) uv: vec2f
        }

        @vertex
        fn vertex_main(@builtin(vertex_index) index: u32) -> VSOutput {
            
            var vs_output: VSOutput;

            vs_output.uv = uvs[index];
            vs_output.position = vec4f(positions[index], 1.0);
        
            return vs_output;
        }`;

    static fragment_shader = `


        @group(0) @binding(0) var tex_sampler_filtering: sampler;
        @group(0) @binding(1) var tex_sampler_non_filtering: sampler;

        @group(0) @binding(2) var tex_albedo: texture_2d<f32>;
        @group(0) @binding(3) var tex_position: texture_2d<f32>;
        @group(0) @binding(4) var tex_normal: texture_2d<f32>;


        @fragment
        fn fragment_main(fs_input: VSOutput) -> @location(0) vec4f {


            let uv = vec2f(fs_input.uv.x, 1. - fs_input.uv.y);

            let base_color      = textureSample(tex_albedo,     tex_sampler_filtering,      uv).xyz;
            let base_position   = textureSample(tex_position,   tex_sampler_non_filtering,  uv).xyz;
            let base_normal     = textureSample(tex_normal,     tex_sampler_non_filtering,  uv).xyz;


            let to_sun = normalize(-base_position);
            let ambient = 0.1;
            let diff = max(dot(to_sun, base_normal), 0.) * (1. - ambient);

            let final_light = diff * base_color;

            let corrected = pow(final_light, vec3f(1. / 2.2));

            return vec4f(corrected, 1.0);
        }`;


    /**
     * 
     * @param {DeferredStep_WebGPU} deferred_step
     */
    constructor(deferred_step) {

        const device = WebGPUUtil.get_device();

        this.deferred_step = deferred_step;

        this.sampler_filtering = new Sampler_WebGPU( { label: 'MergePipeline: Sampler (filtering)' } );
        this.sampler_non_filtering = new Sampler_WebGPU( { 
            label: 'MergePipeline: Sampler (non-filtering)',
            minFilter: 'nearest',
            magFilter: 'nearest'
        } );

        this.input_textures = [
            {
                texture: this.deferred_step.get_texture('albedo'),
                view: this.deferred_step.get_texture('albedo').createView(),
            },
            {
                texture: this.deferred_step.get_texture('position'),
                view: this.deferred_step.get_texture('position').createView(),
            },
            {
                texture: this.deferred_step.get_texture('normal'),
                view: this.deferred_step.get_texture('normal').createView(),
            }
        ]

        this.output_texture_view = this.deferred_step.result.texture.createView();

        this.shader = new RenderShader_WebGPU(MergePipeline_WebGPU.vertex_shader, MergePipeline_WebGPU.fragment_shader);
        this.bind_group_layout = device.createBindGroupLayout({
            label: 'MergePipeline: BindGroupLayout',
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: 'filtering'
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {
                        type: 'non-filtering'
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'float'
                    }
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'unfilterable-float'
                    }
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                        sampleType: 'unfilterable-float'
                    }
                }
            ]
        });
        this.pipeline_layout = device.createPipelineLayout({
            label: 'MergePipeline: PipelineLayout',
            bindGroupLayouts: [ this.bind_group_layout ]
        });
        this.pipeline = device.createRenderPipeline({
            label: 'MergePipeline: RenderPipeline',
            layout: this.pipeline_layout,
            vertex: {
                module: this.shader.module,
                entryPoint: 'vertex_main'
            },
            fragment: {
                module: this.shader.module,
                entryPoint: 'fragment_main',
                targets: [
                    { format: navigator.gpu.getPreferredCanvasFormat()/*'rgba8unorm'*/ }
                ]
            }
        });

        this.bind_group = device.createBindGroup({
            label: 'MergePipeline: BindGroup',
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.sampler_filtering.sampler },
                { binding: 1, resource: this.sampler_non_filtering.sampler },
                { binding: 2, resource: this.input_textures[0].view },
                { binding: 3, resource: this.input_textures[1].view },
                { binding: 4, resource: this.input_textures[2].view }
            ]
        });
    }

    /**
     * 
     * @param {GPUCommandEncoder} encoder
     */
    render(encoder) {

        const render_pass = encoder.beginRenderPass({
            label: 'MergePipeline: RenderPass',
            colorAttachments: [
                {
                    loadOp: 'clear',
                    storeOp: 'store',
                    view: WebGPUUtil.get_context().getCurrentTexture().createView(), //this.output_texture_view,
                    clearValue: [1.0, 0.0, 0.0, 1.0]
                }
            ]
        });

        render_pass.setPipeline(this.pipeline);
        render_pass.setBindGroup(0, this.bind_group);
        render_pass.draw(6);
        render_pass.end();
    }
}