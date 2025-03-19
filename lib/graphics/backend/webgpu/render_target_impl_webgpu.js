/**
 * 
 * @param {number} index 
 * @param {Texture2D_WebGPU} texture 
 * @param {string} format 
 */
function AttachmentInfo(index, texture, format) {
    this.index = index;
    this.texture = texture;
    this.format = format;
}

class RenderTarget_WebGPU {

    /**
     * @type {RenderTarget_WebGPU}
     */
    static #DEFAULT_RENDER_TARGET;

    /**
     * @type {Texture2D_WebGPU}
     */
    static #DEFAULT_DEPTH_TEXTURE

    static init() {

        RenderTarget_WebGPU.#DEFAULT_DEPTH_TEXTURE = RenderSystem.create_texture_2D(
            WebGPUUtil.INSTANCE.canvas_size, 
            null, 
            {
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT    
            }
        );

        RenderTarget_WebGPU.#DEFAULT_RENDER_TARGET = {
            color_attachments: new Map([[
                'canvas_texture',
                new AttachmentInfo(0, {texture: WebGPUUtil.get_context().getCurrentTexture()}, WebGPUUtil.INSTANCE.preferred_format)
            ]]),
            color_attachment_count: 1,
            depth_attachment: RenderTarget_WebGPU.#DEFAULT_DEPTH_TEXTURE
        };
    }

    /**
     * @type {Map<string, AttachmentInfo>}
     */
    color_attachments = new Map();

    /**
     * @type {number}
     */
    color_attachment_count = 0;
    
    /**
     * @type {Texture2D_WebGPU}
     */
    depth_attachment = null;

    /**
     * @type {Map<string, AttachmentInfo>}
     */
    attachments = new Map();

    static get_default() {
        RenderTarget_WebGPU.#DEFAULT_RENDER_TARGET.color_attachments.get('canvas_texture').texture = {texture: WebGPUUtil.get_context().getCurrentTexture()};
        return RenderTarget_WebGPU.#DEFAULT_RENDER_TARGET;
    }

    /**
     * 
     * @param {Extents2D} size 
     */
    constructor(size) {
        this.size = size;
    }

    /**
     * 
     * @param {string} label 
     */
    add_color_attachment(label) {

        label = label || this.color_attachments.size.toString();

        const texture = RenderSystem.create_texture_2D(this.size, null, {
            format: 'rgba8unorm-srgb',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
        });

        this.color_attachments.set(label, new AttachmentInfo(this.color_attachment_count, texture, 'rgba8unorm-srgb'));
        this.attachments.set(label, new AttachmentInfo(this.color_attachment_count, texture, 'rgba8unorm-srgb'));
        this.color_attachment_count++;
    }

    /**
     * 
     * @param {string} label 
     */
    add_depth_attachment(label) {

        label = label || 'depth';

        const texture = RenderSystem.create_texture_2D(this.size, null,
            {
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
            }
        );

        this.attachments.set(label, new AttachmentInfo(this.color_attachment_count, texture, 'depth24plus'));
        this.depth_attachment = texture;
    }
}