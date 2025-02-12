/**
 * @typedef {{
*      type: any,
*      usage: any
* }} TextureProps
*/


class Texture2D_WebGL {

    static #DEFAULT_PROPS = {
        type: 'color',
    }

    static sampler_map = new Map([
        [Texture2D.WRAP_REPEAT, WebGL2RenderingContext.REPEAT],
        [Texture2D.WRAP_CLAMP, WebGL2RenderingContext.CLAMP_TO_EDGE],
        [Texture2D.FILTER_LINEAR, WebGL2RenderingContext.LINEAR],
        [Texture2D.FILTER_NEAREST, WebGL2RenderingContext.NEAREST]
    ]);

    #internal_format = WebGL2RenderingContext.SRGB8_ALPHA8;
    #format = WebGL2RenderingContext.RGBA;
    #type = WebGL2RenderingContext.UNSIGNED_BYTE;

    /**
     * 
     * @param {Extents2D} size 
     * @param {Uint8Array} data
     * @param {TextureProps} props
     */
    constructor(size, data, props) {
        const gl = WebGLUtil.get_context();

        props = props || Texture2D_WebGL.#DEFAULT_PROPS;

        if(props.type === 'depth') {
            this.#internal_format = WebGL2RenderingContext.DEPTH_COMPONENT;
            this.#format = WebGL2RenderingContext.DEPTH_COMPONENT;
            this.#type = WebGL2RenderingContext.UNSIGNED_INT;
        }

        this.size = size;
        this.texture = gl.createTexture();
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
        gl.texImage2D(gl.TEXTURE_2D, 0, this.#internal_format, this.size.width, this.size.height, 0, this.#format, this.#type, data);
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