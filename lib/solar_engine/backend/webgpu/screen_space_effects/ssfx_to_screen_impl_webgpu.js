import { WebGPUUtil } from "../../../../graphics/backend/webgpu/gpu_util.js";
import { Sampler_WebGPU, Texture2D_WebGPU } from "../../../../graphics/backend/webgpu/texture_impl_webgpu.js";
import { ScreenSpaceEffectBase_WebGPU } from "../screen_space_effect_impl_webgpu.js";

export class ScreenSpace_ToScreen_WebGPU extends ScreenSpaceEffectBase_WebGPU {
    
    /**
     * 
     * @param {Texture2D_WebGPU} input 
     */
    constructor(input) {

        super();

        const device = WebGPUUtil.get_device();

        this.input = input;

        this.sampler_filtering = new Sampler_WebGPU({
            label: 'Effect: ToScreen: Sampler (Filtering)'
        });

        this.sampler_non_filtering = new Sampler_WebGPU({
            label: 'Effect: ToScreen: Sampler (Non-Filtering)',
            minFilter: 'nearest',
            magFilter: 'nearest',
        });

        this.bindgroup_layout = device.createBindGroupLayout({
            label: 'Effect: ToScreen: BindGroupLayout',
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
            label: 'Effect: ToScreen: PipelineLayout',
            bindGroupLayouts: [this.bindgroup_layout]
        });

        this.pipeline = device.createRenderPipeline({
            label: 'Effect: ToScreen: Pipeline',
            layout: this.pipeline_layout,
            vertex: {
                module: this.shader.module,
                entryPoint: 'vertex_main'
            },
            fragment: {
                module: this.shader.module,
                entryPoint: 'fragment_main',
                targets: [
                    { format: navigator.gpu.getPreferredCanvasFormat() }
                ]
            }
        });

        this.bindgroup = device.createBindGroup({
            label: 'Effect: ToScreen: BindGroup',
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {   binding: 0, resource: this.sampler_filtering.sampler },
                {   binding: 1, resource: this.input.texture.createView() }
            ]
        });
    }


    /**
     * 
     * @param {GPUCommandEncoder} encoder 
     */
    apply(encoder) {
        
        const ctx = WebGPUUtil.get_context();

        const pass = encoder.beginRenderPass({
            label: 'Effect: Atmosphere: RenderPass',
            colorAttachments: [
                { 
                    view: ctx.getCurrentTexture().createView(),
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