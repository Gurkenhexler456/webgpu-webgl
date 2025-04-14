import { WebGPUUtil } from "./gpu_util.js";

export class Renderer_WebGPU {

    /**
     * @type {AttachmentInfo[]}
     */
    #current_color_attachments = [];

    #current_render_pass_descriptor = {
        label: 'current_target'
    };

    #enable_depth_testing = false;

    constructor() {
    }


    #set_attachments(attachments, attachment_names) {
        /**
         * @type {AttachmentInfo[]}
         */
        this.#current_color_attachments = [];
        if(attachment_names === undefined) {
            const vals = attachments.values().toArray();
            this.#current_color_attachments = vals.toSorted((a, b) => {
                return a.index - b.index;
            });
        }
        else {
            attachment_names.forEach((buffer_name) => {
                if(attachments.has(buffer_name)) {
                    this.#current_color_attachments.push(attachments.get(buffer_name));
                }
            });
        }
    }

    /**
     * 
     * @param {{ 
     *      target: RenderTarget_WebGPU,
     *      clear_color: [number, number, number, number],
     *      enable_depth_test: boolean,
     *      output_buffers: string[]
     * }} target 
     */
    switch_render_target(target) {

        this.#set_attachments(target.target.color_attachments, target.output_buffers);

        this.#current_render_pass_descriptor.colorAttachments = this.#current_color_attachments.map((val) => {
            return {
                view: val.texture.texture.createView(),
                clearValue: target.clear_color,
                loadOp: 'load',
                storeOp: 'store'
            }
        });

        this.#enable_depth_testing = target.enable_depth_test;

        if(target.enable_depth_test) {
            this.#current_render_pass_descriptor.depthStencilAttachment = {
                view: target.target.depth_attachment.texture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'load',
                depthStoreOp: 'store'
            }
        }
    }



    /**
     * @param {[number, number, number, number]} clear_color 
     * @param {boolean} clear_depth
     */
    clear(clear_color, clear_depth) {

        this.#current_render_pass_descriptor.colorAttachments.forEach((attachment) => {
            attachment.clearValue = clear_color;
            attachment.loadOp = 'load';
            attachment.storeOp = 'store';
        });

        if(clear_depth) {
            this.#current_render_pass_descriptor.depthStencilAttachment.depthClearValue = 1.0;
            this.#current_render_pass_descriptor.depthStencilAttachment.depthLoadOp = 'load';
            this.#current_render_pass_descriptor.depthStencilAttachment.depthStoreOp = 'store';
        }


        const device = WebGPUUtil.get_device();
        const command_encoder = device.createCommandEncoder({label: 'clear command encoder'});

        const pass = command_encoder.beginRenderPass(this.#current_render_pass_descriptor);
        pass.end();

        const command_buffer = command_encoder.finish();
        device.queue.submit([command_buffer]);
    }



    /**
     * 
     * @param {{
     *          shader: RenderShader_WebGPU,
     *          textures: [{
     *              unit: number,
     *              texture: Texture2D_WebGPU,
     *              uniform_name: string
     *          }],
     *          uniforms: [{
     *              buffer: BufferObject_WebGPU,
     *              binding: number;
     *              uniform_name: string
     *          }]
     * }} pipeline_desciption 
     * @param {number} vert_count
     * @param {number} [vert_index_start=0]  
     */
    render_vertices(pipeline_desciption, vert_count, vert_index_start = 0) {

        const device = WebGPUUtil.get_device();

        const command_encoder = device.createCommandEncoder({label: 'render_vertices'});

        const pass = command_encoder.beginRenderPass(this.#current_render_pass_descriptor);
    

        const targets = this.#current_color_attachments.map((attachment) => {
            return { format: attachment.format }
        });

        const pipeline = device.createRenderPipeline({
            label: 'render pipeline',
            layout: 'auto',
            vertex: {
                entryPoint: 'vertex_main',
                module: pipeline_desciption.shader.module,
            },
            fragment: {
                entryPoint: 'fragment_main',
                module: pipeline_desciption.shader.module,
                targets: targets,
            },
            depthStencil: {
                depthWriteEnabled: this.#enable_depth_testing,
                depthCompare: 'less',
                format: 'depth24plus'
            }
        });

        let binding = 0;
        let entries = [];
        pipeline_desciption.uniforms.forEach((buffers) => {
            entries.push({ binding: binding, resource: {buffer: buffers.buffer.buffer}});
            binding++;
        });

        if(pipeline_desciption.textures) {
            entries.push({ binding: binding, resource: pipeline_desciption.textures[0].texture.sampler });
            binding++;

            pipeline_desciption.textures.forEach((texture) => {
                entries.push({ binding: binding, resource: texture.texture.texture.createView() });
                binding++;
            });
        }
    
        const bind_group = device.createBindGroup({
            label: 'bind group',
            layout: pipeline.getBindGroupLayout(0),
            entries: entries,
        });
    
        pass.setPipeline(pipeline);

        pass.setBindGroup(0, bind_group);
    
        pass.draw(vert_count, 0, vert_index_start);
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
     */
    render_to_target(render_pass) {

        const device = WebGPUUtil.get_device();

        const command_encoder = device.createCommandEncoder({label: 'command encoder'});
            
        const pass = command_encoder.beginRenderPass(this.#current_render_pass_descriptor);
    
        const targets = this.#current_color_attachments.map((attachment) => {
            return { format: attachment.format }
        });

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
                targets: targets,
            },
            depthStencil: {
                depthWriteEnabled: this.#enable_depth_testing,
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