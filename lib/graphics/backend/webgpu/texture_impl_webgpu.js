/**
 * @typedef {{
 *      format: string,
 *      usage: number
 * }} TextureProps_WebGPU
 */

import { Texture2D } from "../../texture.js";
import { WebGPUUtil } from "./gpu_util.js";


export class Texture2D_WebGPU extends Texture2D {

    


    static #DEFAULT_PROPS = {
        format: 'rgba8unorm-srgb',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    }

    static sampler_map = new Map([
        [Texture2D.WRAP_REPEAT, 'repeat'],
        [Texture2D.WRAP_CLAMP, 'clamp-to-edge'],
        [Texture2D.FILTER_LINEAR, 'linear'],
        [Texture2D.FILTER_NEAREST, 'nearest']
    ]);

    /**
     * @param {Extents2D} size
     * @param {Uint8Array} data 
     * @param {TextureProps_WebGPU} props
     */
    constructor(size, data, props) {

        super(size, data, 'type');

        props = props || Texture2D_WebGPU.#DEFAULT_PROPS;

        const device = WebGPUUtil.get_device();

        this.size = size;
        this.texture = device.createTexture({
            size: [this.size.width, this.size.height],
            format: props.format,
            usage: props.usage,
        });

        this.sampler = device.createSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',
        });

        if(data) {
            this.set_data(data);
        }
    }

    /**
     * 
     * @param {Uint8Array} data 
     */
    set_data(data) {
        const device = WebGPUUtil.get_device();

        if(! Texture2D.validate_data_size(this.size, data)) {
            // there probably should be some error handling going on here...
            return;
        }

        this.data = data;

        device.queue.writeTexture(
            { texture: this.texture },
            this.data,
            { bytesPerRow: this.size.width * 4 },
            { width: this.size.width, height: this.size.height },
        );
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
        const device = WebGPUUtil.get_device();

        this.sampler = device.createSampler({
            addressModeU: get_value_or_default(sampling_props.wrap_mode.x, Texture2D_WebGPU.sampler_map, 'repeat'),
            addressModeV: get_value_or_default(sampling_props.wrap_mode.y, Texture2D_WebGPU.sampler_map, 'repeat'),
            minFilter: get_value_or_default(sampling_props.filter.min, Texture2D_WebGPU.sampler_map, 'linear'),
            magFilter: get_value_or_default(sampling_props.filter.mag, Texture2D_WebGPU.sampler_map, 'linear'), 
        });
    }
}