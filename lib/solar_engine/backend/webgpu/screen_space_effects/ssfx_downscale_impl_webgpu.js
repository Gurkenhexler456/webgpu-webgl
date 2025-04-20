import { WebGPUUtil } from "../../../../graphics/backend/webgpu/gpu_util.js";
import { Sampler_WebGPU, Texture2D_WebGPU } from "../../../../graphics/backend/webgpu/texture_impl_webgpu.js";
import { ScreenSpaceEffectBase_WebGPU } from "../screen_space_effect_impl_webgpu.js";

export class ScreenSpace_Downscale_WebGPU extends ScreenSpaceEffectBase_WebGPU {
   
    /**
    * 
    * @param {Texture2D_WebGPU} input 
    * @param {Extents2D} output 
    */
    constructor(input, target_resolution) {

        super();

        const device = WebGPUUtil.get_device();

        this.input = input;
        this.output = new Texture2D_WebGPU(target_resolution, null, {
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
        });

        this.sampler = new Sampler_WebGPU({
            label: 'Effect: Downscale: Sampler'
        });

        this.bindgroup_layout = device.createBindGroupLayout({
            label: 'Effect: Downscale: BindGroupLayout',
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
            label: 'Effect: Downscale: PipelineLayout',
            bindGroupLayouts: [this.bindgroup_layout]
        });

        this.pipeline = device.createRenderPipeline({
            label: 'Effect: Downscale: Pipeline',
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
            label: 'Effect: Downscale: BindGroup',
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
            label: 'Effect: Downscale: RenderPass',
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