function TextureProps(internal_format, format, data_type) {
    this.internal_format = internal_format;
    this.format = format;
    this.data_type = data_type;
}

class Texture2D_WebGL {

    /**
     * @type {Map<string, TextureProps>}
     */
    static #TEXTURE_TYPES = new Map([
        ['color', new TextureProps(
            WebGL2RenderingContext.SRGB8_ALPHA8, 
            WebGL2RenderingContext.RGBA, 
            WebGL2RenderingContext.UNSIGNED_BYTE
        )],
        ['color16f', new TextureProps(
            WebGL2RenderingContext.RGBA16F, 
            WebGL2RenderingContext.RGBA, 
            WebGL2RenderingContext.FLOAT
        )],
        ['color32f', new TextureProps(
            WebGL2RenderingContext.RGBA32F, 
            WebGL2RenderingContext.RGBA, 
            WebGL2RenderingContext.FLOAT
        )],
        ['depth', new TextureProps(
            WebGL2RenderingContext.DEPTH_COMPONENT32F, 
            WebGL2RenderingContext.DEPTH_COMPONENT, 
            WebGL2RenderingContext.FLOAT
        )],
    ]);


    static sampler_map = new Map([
        [Texture2D.WRAP_REPEAT, WebGL2RenderingContext.REPEAT],
        [Texture2D.WRAP_CLAMP, WebGL2RenderingContext.CLAMP_TO_EDGE],
        [Texture2D.FILTER_LINEAR, WebGL2RenderingContext.LINEAR],
        [Texture2D.FILTER_NEAREST, WebGL2RenderingContext.NEAREST]
    ]);

    /**
     * @type {string}
     */
    #type;

    /**
     * @type {TextureProps}
     */
    #props;

    /**
     * 
     * @param {Extents2D} size 
     * @param {Uint8Array} data
     * @param {string} type
     */
    constructor(size, data, type = 'color') {
        const gl = WebGLUtil.get_context();

        this.#type = type;
    
        if(!Texture2D_WebGL.#TEXTURE_TYPES.has(this.#type)) {
            throw new Error(`Texture: type not supported: ${this.#type}`);
        }

        this.#props = Texture2D_WebGL.#TEXTURE_TYPES.get(this.#type);

        this.size = size;
        this.texture = gl.createTexture();
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, this.texture);
        gl.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_MIN_FILTER, WebGL2RenderingContext.NEAREST);
        gl.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_MAG_FILTER, WebGL2RenderingContext.NEAREST);
        gl.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_WRAP_S, WebGL2RenderingContext.REPEAT);
        gl.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_WRAP_T, WebGL2RenderingContext.REPEAT);

        this.sampler = gl.createSampler();

        this.set_data(data);
    }

    /**
     * 
     * @param {Uint8Array} data 
     */
    set_data(data) {
        const gl = WebGLUtil.get_context();

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, 
            this.#props.internal_format, 
            this.size.width, this.size.height, 
            0, 
            this.#props.format, 
            this.#props.data_type, 
            data);
        if(this.#type === 'color') {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
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