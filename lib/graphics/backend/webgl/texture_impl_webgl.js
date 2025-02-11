class Texture2D_WebGL {

    static sampler_map = new Map([
        [Texture2D.WRAP_REPEAT, WebGL2RenderingContext.REPEAT],
        [Texture2D.WRAP_CLAMP, WebGL2RenderingContext.CLAMP_TO_EDGE],
        [Texture2D.FILTER_LINEAR, WebGL2RenderingContext.LINEAR],
        [Texture2D.FILTER_NEAREST, WebGL2RenderingContext.NEAREST]
    ]);

    /**
     * @param {Extents2D} size
     * @param {Uint8Array} data 
     */
    constructor(size, data) {
        const gl = WebGLUtil.get_context();

        this.size = size;
        this.texture = gl.createTexture();
        this.sampler = gl.createSampler();

        if(data) {
            this.set_data(data);
        }
    }

    /**
     * 
     * @param {Uint8Array} data 
     */
    set_data(data) {
        const gl = WebGLUtil.get_context();

        if(! Texture2D.validate_data_size(this.size, data)) {
            // there should probably be some error handling going on here...
            return;
        }

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, this.size.width, this.size.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    /**
     * 
     * @param {{
     *  wrap_mode: {
     *      x:  string,
     *      y:  string
     *  },
     *  filter: {
     *      mag: string,
     *      min: string
     *  }
     * }} sampling_props 
     */
    set_sampling(sampling_props) {
        const gl = WebGLUtil.get_context();

        const wrap = sampling_props.wrap_mode;
        const filter = sampling_props.filter;

        gl.samplerParameteri(this.sampler, gl.TEXTURE_WRAP_R, 
            get_value_or_default(wrap.x, Texture2D_WebGL.sampler_map, gl.REPEAT));
        gl.samplerParameteri(this.sampler, gl.TEXTURE_WRAP_R, 
            get_value_or_default(wrap.y, Texture2D_WebGL.sampler_map, gl.REPEAT));

        gl.samplerParameteri(this.sampler, gl.TEXTURE_MIN_FILTER, 
            get_value_or_default(filter.min, Texture2D_WebGL.sampler_map, gl.LINEAR));
        gl.samplerParameteri(this.sampler, gl.TEXTURE_MAG_FILTER, 
            get_value_or_default(filter.mag, Texture2D_WebGL.sampler_map, gl.LINEAR));
    }
}