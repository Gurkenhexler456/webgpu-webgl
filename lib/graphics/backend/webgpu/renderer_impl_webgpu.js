class Renderer_WebGPU {

    constructor() {}

    /**
     * @param {{ 
     *  target: { 
     *      color_attachment: Texture2D_WebGPU[],
     *      depth_attachment: Texture2D_WebGPU
     *  },
     *  clear_color: [number, number, number, number],
     *  enable_depth_test: boolean
     *  }} target 
     */
    clear(target) {

        let render_pass_descriptor = {
            label: 'render pass',
            colorAttachments: [
                {
                    view: target.target.color_attachment[0],
                    clearValue: target.clear_color,
                    loadOp: 'clear',
                    storeOp: 'store',
                }
            ],
        }

        if(target.enable_depth_test) {
            render_pass_descriptor.depthStencilAttachment = {
                view: target.target.depth_attachment,
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store'
            }
        }

        const device = WebGPUUtil.get_device();
        const command_encoder = device.createCommandEncoder({label: 'clear command encoder'});

        const pass = command_encoder.beginRenderPass(render_pass_descriptor);
        pass.end();

        const command_buffer = command_encoder.finish();
        device.queue.submit([command_buffer]);
    }


    /**
     * 
     * @param {{ 
     *  model: Model_WebGPU, 
     *  shader: { 
     *      program: RenderShader_WebGPU,
     *      uniforms: BufferObject_WebGPU,
     *      textures: Texture []
     *  }}} render_pass 
     * 
     * @param {{ 
     *  target: { 
     *      color_attachment: Texture2D_WebGPU[],
     *      depth_attachment: Texture2D_WebGPU
     *  },
     *  clear_color: [number, number, number, number],
     *  enable_depth_test: boolean
     *  }} target 
     */
    render_to_target(render_pass, target) {

        const device = WebGPUUtil.get_device();

        const command_encoder = device.createCommandEncoder({label: 'command encoder'});
            

        let render_pass_descriptor = {
            label: 'render pass',
            colorAttachments: [
                {
                    view: target.target.color_attachment[0],
                    clearValue: target.clear_color,
                    loadOp: 'load',
                    storeOp: 'store',
                }
            ],
        }

        if(target.enable_depth_test) {
            render_pass_descriptor.depthStencilAttachment = {
                view: target.target.depth_attachment,
                depthClearValue: 1.0,
                depthLoadOp: 'load',
                depthStoreOp: 'store'
            }
        }

        const pass = command_encoder.beginRenderPass(render_pass_descriptor);
    

        const pipeline = device.createRenderPipeline({
            label: 'render pipeline',
            layout: 'auto',
            vertex: {
                entryPoint: 'vertex_main',
                module: render_pass.shader.program.module,
                buffers: render_pass.model.layouts,
            },
            fragment: {
                entryPoint: 'fragment_main',
                module: render_pass.shader.program.module,
                targets: [{format: WebGPUUtil.INSTANCE.preferred_format}],
            },
            depthStencil: {
                depthWriteEnabled: target.enable_depth_test,
                depthCompare: 'less',
                format: 'depth24plus'
            }
        });
    
        const bind_group = device.createBindGroup({
            label: 'bind group',
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: render_pass.shader.uniforms.buffer }},
                { binding: 1, resource: render_pass.shader.textures[0].sampler},
                { binding: 2, resource: render_pass.shader.textures[0].texture.createView() },
            ],
        });
    
        pass.setPipeline(pipeline);
        pass.setVertexBuffer(0, render_pass.model.vertices[0].buffer);
        pass.setIndexBuffer(render_pass.model.indices.buffer, 'uint32');
        pass.setBindGroup(0, bind_group);
    
        pass.drawIndexed(render_pass.model.vertex_count);
        pass.end();
    
        const command_buffer = command_encoder.finish();
        device.queue.submit([command_buffer]);
    }
    
}