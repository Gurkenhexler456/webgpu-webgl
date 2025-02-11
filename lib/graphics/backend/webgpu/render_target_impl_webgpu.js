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
    constructor(size) {}

    add_color_attachment() {}

    add_depth_attachment() {}
}