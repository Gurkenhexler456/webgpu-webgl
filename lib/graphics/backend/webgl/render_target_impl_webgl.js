function AttachmentInfo(index, texture) {
    this.index = index;
    this.texture = texture;
}

class RenderTarget_WebGL {

    static get_default() {
        return null;
    }

    /**
     * @type {WebGLFramebuffer}
     */
    frame_buffer = null

    /**
     * @type {Map<string, AttachmentInfo>}
     */
    attachments = new Map();

    #color_attachment_count = 0;

    /**
     * 
     * @param {Extents2D} size 
     */
    constructor(size) {
        const gl = WebGLUtil.get_context();

        this.size = size;
        this.frame_buffer = gl.createFramebuffer();
    }

    get color_attachment_count() {
        return this.#color_attachment_count;
    }

    /**
     * 
     * @param {string} label 
     * @param {string} type 
     */
    add_color_attachment(label, type = 'color') {

        label = label || this.attachments.size.toString();

        const texture = RenderSystem.create_texture_2D(this.size, null, type);

        const gl = WebGLUtil.get_context();

        const index = WebGL2RenderingContext.COLOR_ATTACHMENT0 + this.#color_attachment_count;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frame_buffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, index, gl.TEXTURE_2D, texture.texture, 0);

        if(gl.checkFramebufferStatus(WebGL2RenderingContext.FRAMEBUFFER) !== WebGL2RenderingContext.FRAMEBUFFER_COMPLETE) {
            throw new Error(`failed to add color attachment (${label}): framebuffer incomplete`);
        }

        this.attachments.set(label, new AttachmentInfo(index, texture));
        this.#color_attachment_count++;
    }

    /**
     * 
     * @param {string} label 
     */
    add_depth_attachment(label) {

        label = label || this.attachments.size.toString();
        const texture = RenderSystem.create_texture_2D(this.size, null, 'depth');

        const gl = WebGLUtil.get_context();

        const index = WebGL2RenderingContext.DEPTH_ATTACHMENT;

        gl.bindFramebuffer(WebGL2RenderingContext.FRAMEBUFFER, this.frame_buffer);
        gl.framebufferTexture2D(WebGL2RenderingContext.FRAMEBUFFER, index, gl.TEXTURE_2D, texture.texture, 0);

        if(gl.checkFramebufferStatus(WebGL2RenderingContext.FRAMEBUFFER) !== WebGL2RenderingContext.FRAMEBUFFER_COMPLETE) {
            throw new Error(`failed to add depth attachment (${label}): framebuffer incomplete`);
        }

        this.attachments.set(label, new AttachmentInfo(index, texture));
    }
}