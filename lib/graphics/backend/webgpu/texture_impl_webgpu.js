import { Extents2D } from "../../../math/util.js";
import { Texture2D, TextureType } from "../../texture.js";
import { WebGPUUtil } from "./gpu_util.js";


export class Texture2D_WebGPU extends Texture2D {


    


    /**
     * @param {string} type
     * @returns {GPUTextureDescriptor}
     */
    static translate_texture_type(type) {
        switch(type) {
            case TextureType.COLOR:         return {
                                                format: 'rgba8unorm',
                                                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
                                            };
            case TextureType.COLOR_sRGB:    return {
                                                format: 'rgba8unorm-srgb',
                                                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
                                            };
            case TextureType.COLOR_32_F:    return {
                                                format: 'rgba32float',
                                                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
                                            };
            case TextureType.DEPTH:         return {
                                                format: 'depth',
                                                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
                                            };
            default:                        throw new Error(`Texture: type not supported '${type}'`);
        }
    }

    /**
     * 
     * @param {GPUTextureFormat} format 
     * @returns {GPUTextureSampleType}
     */
    static get_texture_sample_type(format) {
        switch(format) {
            case 'rgba8unorm': 
            case 'rgba8unorm-srgb': return 'float';
            case 'rgba32float':     return 'unfilterable-float';
            case 'depth32float':    return 'depth';
            default:                throw new Error(`Texture: texture format not supported '${format}'`); 
        }
    }

    /**
     * @param {Extents2D} size
     * @param {Uint8Array} data 
     * @param {GPUTextureDescriptor} props
     */
    constructor(size, data, props) {

        super(size, data);

        props = {
            label: `Texture (${this.id})`,
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            
            ...props,
            
            size: [this.size.width, this.size.height]
        };


        const device = WebGPUUtil.get_device();

        this.texture = device.createTexture(props);
        this.view = this.texture.createView();

        if(this.data) {
            this.set_data(this.data);
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
            { bytesPerRow: this.size.width * 4, rowsPerImage: this.size.height },
            { width: this.size.width, height: this.size.height },
        );
    }

    /**
     * 
     * @returns {GPUTextureBindingLayout}
     */
    get_layout() {

        return {
            sampleType: Texture2D_WebGPU.get_texture_sample_type(this.texture.format),
            viewDimension: '2d',
            multisampled: false
        }
    }

    destroy() {
        super.destroy();
        this.texture.destroy();
    }
}


export class Sampler_WebGPU {

    /**
     * 
     * @param {string} wrap_type 
     * @returns {GPUAddressMode}
     */
    static get_wrap(wrap_type) {
        switch(wrap_type) {
            case Texture2D.WRAP_REPEAT: return 'repeat';
            case Texture2D.WRAP_CLAMP:  return 'clamp-to-edge';
            default:                    throw new Error(`Sampler: wrap type not supported ${wrap_type}`);
        }
    }

    /**
     * 
     * @param {string} filter_type 
     * @returns {GPUFilterMode}
     */
    static get_filter(filter_type) {
        switch(filter_type) {
            case Texture2D.FILTER_LINEAR:   return 'linear';
            case Texture2D.FILTER_NEAREST:  return 'nearest';
            default:                        throw new Error(`Sampler: wrap type not supported ${filter_type}`);
        }
    }

    /**
     * 
     * @param {GPUTextureFormat} format
     * @returns {GPUSamplerBindingType}
     */
    static get_sampler_type(format) {
        switch(format) {
            case 'rgba8unorm': 
            case 'rgba8unorm-srgb': return 'filtering';
            case 'rgba32float':     return 'non-filtering';
            case 'depth32float':    return 'non-filtering';
            default:                throw new Error(`Texture: texture format not supported '${format}'`); 
        }
    }

    /**
     * 
     * @param {GPUTextureFormat} format 
     * @returns {GPUSamplerBindingLayout}
     */
    static get_layout(format) {
        return {
            type: Sampler_WebGPU.get_sampler_type(format)
        }
    }

    /**
     * 
     * @param {GPUSamplerDescriptor} props 
     */
    constructor(props) {

        const device = WebGPUUtil.get_device();

        props = {
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'linear',
            minFilter: 'linear',

            ...props
        }

        this.sampler = device.createSampler(props);
    }
}