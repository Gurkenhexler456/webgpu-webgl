import { WebGPUUtil } from "../../../graphics/backend/webgpu/gpu_util.js";
import { RenderShader_WebGPU } from "../../../graphics/backend/webgpu/shader_impl_webgpu.js";
import { Sampler_WebGPU, Texture2D_WebGPU } from "../../../graphics/backend/webgpu/texture_impl_webgpu.js";
import { MergeOperation } from "../../frame_merger.js";

export class FrameMerger_WebGPU {

    static #vertex_shader = `

        const positions = array(
            vec3f(-1.0, -1.0,  0.0),
            vec3f( 1.0, -1.0,  0.0),
            vec3f( 1.0,  1.0,  0.0),

            vec3f( 1.0,  1.0,  0.0),
            vec3f(-1.0,  1.0,  0.0),
            vec3f(-1.0, -1.0,  0.0)
        );

        const uvs = array(
            vec2f(0.0, 1.0),
            vec2f(1.0, 1.0),
            vec2f(1.0, 0.0),

            vec2f(1.0, 0.0),
            vec2f(0.0, 0.0),
            vec2f(0.0, 1.0),
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

    static #get_fragment_shader(operation = MergeOperation.ADD) { 
        
        return `
            @group(0) @binding(0) var tex_sampler: sampler;

            @group(0) @binding(1) var tex_a: texture_2d<f32>;
            @group(0) @binding(2) var tex_b: texture_2d<f32>;


            @fragment
            fn fragment_main(fs_input: VSOutput) -> @location(0) vec4f {

                let a  = textureSample(tex_a,  tex_sampler, fs_input.uv).xyz;
                let b  = textureSample(tex_b,  tex_sampler, fs_input.uv).xyz;

                return vec4f(a ${operation} b, 1.0);
            }`
    };


    /**
     * 
     * @param {Texture2D_WebGPU} texture_a
     * @param {Texture2D_WebGPU} texture_b
     * @param {string} operation
     * @param {Texture2D_WebGPU} output_texture 
     */
    constructor(texture_a, texture_b, operation = MergeOperation.ADD, output_texture) {

        const device = WebGPUUtil.get_device();

        this.texture_a = texture_a;
        this.texture_b = texture_b;

        this.sampler_filtering = new Sampler_WebGPU( { label: 'FrameMerger: Sampler' } );

        this.input_textures = [
            {
                texture:    texture_a.texture,
                view:       texture_a.texture.createView(),
            },
            {
                texture:    texture_b.texture,
                view:       texture_b.texture.createView(),
            }
        ]

        
        /**
         * @type {Texture2D_WebGPU}
         */
        this.output_texture = output_texture || new Texture2D_WebGPU(texture_a.size, null, {
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        /**
         * @type {GPUTextureView}
         */
        this.output_texture_view = this.output_texture.texture.createView();

        this.shader = new RenderShader_WebGPU(
            FrameMerger_WebGPU.#vertex_shader, 
            FrameMerger_WebGPU.#get_fragment_shader(operation)
        );
        
        this.bind_group_layout = device.createBindGroupLayout({
            label: 'FrameMerger: BindGroupLayout',
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
                    texture: {
                        sampleType: 'float'
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
            label: 'FrameMerger: PipelineLayout',
            bindGroupLayouts: [ this.bind_group_layout ]
        });
        this.pipeline = device.createRenderPipeline({
            label: 'FrameMerger: RenderPipeline',
            layout: this.pipeline_layout,
            vertex: {
                module: this.shader.module,
                entryPoint: 'vertex_main'
            },
            fragment: {
                module: this.shader.module,
                entryPoint: 'fragment_main',
                targets: [
                    { format: this.output_texture.texture.format }
                ]
            }
        });

        this.bind_group = device.createBindGroup({
            label: 'FrameMerger: BindGroup',
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.sampler_filtering.sampler },
                { binding: 1, resource: this.input_textures[0].view },
                { binding: 2, resource: this.input_textures[1].view }
            ]
        });
    }

    /**
     * 
     * @param {GPUCommandEncoder} encoder
     */
    render(encoder) {

        const render_pass = encoder.beginRenderPass({
            label: 'FrameMerger: RenderPass',
            colorAttachments: [
                {
                    loadOp: 'clear',
                    storeOp: 'store',
                    view: this.output_texture_view,
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