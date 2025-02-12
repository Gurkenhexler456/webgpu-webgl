class RenderTarget_WebGPU {

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
    }

    /**
     * @type {Map<string,Texture2D_WebGPU>}
     */
    #color_attachments = new Map();
    
    /**
     * @type {Texture2D_WebGPU}
     */
    #depth_attachment = null;

    static get_default() {
        return {
            color_attachment: [
                WebGPUUtil.get_context().getCurrentTexture().createView()
            ],
            depth_attachment: RenderTarget_WebGPU.#DEFAULT_DEPTH_TEXTURE.texture.createView()
        }
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

        label = label || this.#color_attachments.size.toString();

        const texture = RenderSystem.create_texture_2D(this.size, null);

        this.#color_attachments.set(label, texture);
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

        this.#depth_attachment = texture;
    }
}