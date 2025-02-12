class RenderTarget_WebGL {

    static get_default() {
        return null;
    }

    /**
     * @type {WebGLFramebuffer}
     */
    #frame_buffer = null

    /**
     * @type {Map<string, Texture2D_WebGL>}
     */
    #textures = new Map();

    #color_attachment_count = 0;

    /**
     * 
     * @param {Extents2D} size 
     */
    constructor(size) {
        const gl = WebGLUtil.get_context();

        this.size = size;
        this.#frame_buffer = gl.createFramebuffer();
    }

    /**
     * 
     * @param {string} label 
     */
    add_color_attachment(label) {

        label = label || this.#textures.size.toString();

        const texture = RenderSystem.create_texture_2D(this.size, null);

        const gl = WebGLUtil.get_context();

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#frame_buffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + this.#color_attachment_count, gl.TEXTURE_2D, texture.texture, 0);

        this.#textures.set(label, texture);
        this.#color_attachment_count++;
    }

    /**
     * 
     * @param {string} label 
     */
    add_depth_attachment(label) {

        label = label || this.#textures.size.toString();
        const texture = RenderSystem.create_texture_2D(this.size, null, {type: 'depth'});

        const gl = WebGLUtil.get_context();

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#frame_buffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture.texture, 0);

        this.#textures.set(label, texture);
    }
}