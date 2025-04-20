import { WebGPUUtil } from "../../../../graphics/backend/webgpu/gpu_util.js";
import { Sampler_WebGPU, Texture2D_WebGPU } from "../../../../graphics/backend/webgpu/texture_impl_webgpu.js";
import { ScreenSpaceEffectBase_WebGPU } from "../screen_space_effect_impl_webgpu.js";

export class ScreenSpace_GammaCorrection_WebGPU extends ScreenSpaceEffectBase_WebGPU {

    static #FRAGMENT_SOURCE = `
    
        @group(0) @binding(0) var tex_sampler: sampler;

        @group(0) @binding(1) var tex_image: texture_2d<f32>;

        @fragment
        fn fragment_main(fs_input: VertexOutput) -> @location(0) vec4f {


            let base_color = textureSample(tex_image, tex_sampler, fs_input.uv).xyz;

            let corrected = pow(base_color, vec3(1. / 2.2));

            return vec4f(corrected, 1.0);
        }`;
    
    /**
     * 
     * @param {Texture2D_WebGPU} input 
     * @param {Texture2D_WebGPU} output 
     */
    constructor(input, output) {

        super(ScreenSpace_GammaCorrection_WebGPU.#FRAGMENT_SOURCE);

        const device = WebGPUUtil.get_device();

        this.input = input;
        this.output = output;

        this.sampler = new Sampler_WebGPU({
            label: 'Effect: GammaCorrection: Sampler'
        });

        this.bindgroup_layout = device.createBindGroupLayout({
            label: 'Effect: GammaCorrection: BindGroupLayout',
            entries: [
                { 
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: { type: 'filtering' } 
                },
                { 
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: 'float' } 
                }
            ]
        });

        this.pipeline_layout = device.createPipelineLayout({
            label: 'Effect: GammaCorrection: PipelineLayout',
            bindGroupLayouts: [this.bindgroup_layout]
        });

        this.pipeline = device.createRenderPipeline({
            label: 'Effect: GammaCorrection: Pipeline',
            layout: this.pipeline_layout,
            vertex: {
                module: this.shader.module,
                entryPoint: 'vertex_main'
            },
            fragment: {
                module: this.shader.module,
                entryPoint: 'fragment_main',
                targets: [
                    { format: this.output.texture.format }
                ]
            }
        });

        this.bindgroup = device.createBindGroup({
            label: 'Effect: GammaCorrection: BindGroup',
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {   binding: 0, resource: this.sampler.sampler },
                {   binding: 1, resource: this.input.view }
            ]
        });
    }


    /**
     * 
     * @param {GPUCommandEncoder} encoder 
     */
    apply(encoder) {
        
        const pass = encoder.beginRenderPass({
            label: 'Effect: GammaCorrection: RenderPass',
            colorAttachments: [
                { 
                    view: this.output.view,
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: [0.0, 0.0, 0.0, 1.0]
                }
            ]
        });

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindgroup);
        pass.draw(6);
        pass.end();
    }
}