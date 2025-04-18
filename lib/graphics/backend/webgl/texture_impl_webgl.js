import { Extents2D } from "../../../math/util.js";
import { Texture2D, TextureType } from "../../texture.js";
import { WebGLUtil } from "./gl_util.js";

function TextureProps(internal_format, format, data_type) {
    this.internal_format = internal_format;
    this.format = format;
    this.data_type = data_type;
}

export class Texture2D_WebGL extends Texture2D {

    /**
     * @param {string} type
     * @returns {TextureProps} 
     */
    static translate_texture_type(type) {
        switch(type) {
            case TextureType.COLOR:         return new TextureProps(
                                                WebGL2RenderingContext.RGBA8, 
                                                WebGL2RenderingContext.RGBA, 
                                                WebGL2RenderingContext.UNSIGNED_BYTE
                                            );
            case TextureType.COLOR_sRGB:    return new TextureProps(
                                                WebGL2RenderingContext.SRGB8_ALPHA8, 
                                                WebGL2RenderingContext.RGBA, 
                                                WebGL2RenderingContext.UNSIGNED_BYTE
                                            );
            case TextureType.COLOR_32_F:    return new TextureProps(
                                                WebGL2RenderingContext.RGBA32F, 
                                                WebGL2RenderingContext.RGBA, 
                                                WebGL2RenderingContext.FLOAT
                                            );
            case TextureType.DEPTH:         return new TextureProps(
                                                WebGL2RenderingContext.DEPTH_COMPONENT32F, 
                                                WebGL2RenderingContext.DEPTH_COMPONENT, 
                                                WebGL2RenderingContext.FLOAT
                                            );
            default:                        throw new Error(`Texture: type not supported '${type}'`);
        }
    }


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

        super(size, data);

        const gl = WebGLUtil.get_context();

        this.#type = type;

        this.#props = Texture2D_WebGL.translate_texture_type(this.#type);

        this.texture = gl.createTexture();
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, this.texture);
        gl.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_MIN_FILTER, WebGL2RenderingContext.NEAREST);
        gl.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_MAG_FILTER, WebGL2RenderingContext.NEAREST);
        gl.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_WRAP_S, WebGL2RenderingContext.REPEAT);
        gl.texParameteri(WebGL2RenderingContext.TEXTURE_2D, WebGL2RenderingContext.TEXTURE_WRAP_T, WebGL2RenderingContext.REPEAT);

        this.sampler = gl.createSampler();

        this.set_data(this.data);
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


    destroy() {
        super.destroy();

        const gl = WebGLUtil.get_context();
        gl.deleteTexture(this.texture);
    }
}