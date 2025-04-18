import { ComputeShader, RenderShader } from "../../shader.js";
import { WebGPUUtil } from "./gpu_util.js";

export class RenderShader_WebGPU extends RenderShader {

    /**
     * 
     * @param {string} vertex_source 
     * @param {string} fragment_source 
     */
    constructor(vertex_source, fragment_source) {
        super(vertex_source, fragment_source);

        this.source = `${this.vertex_source}\n${this.fragment_source}`;

        const device = WebGPUUtil.get_device();

        /**
         * @type {GPUShaderModule}
         */
        this.module = device.createShaderModule({
            label: 'shader',
            code: this.source
        });
    }

    destroy() {
        super.destroy();
        console.log('GPUShaderModule does not provide a destroy() method');
    }
}

export class ComputeShader_WebGPU extends ComputeShader {
    
    /**
     * 
     * @param {string} compute_source 
     */
    constructor(compute_source) {
        super(compute_source);

        const device = WebGPUUtil.get_device();

        /**
         * @type {GPUShaderModule}
         */
        this.module = device.createShaderModule({
            label: 'shader',
            code: this.compute_source
        });
    }

    destroy() {
        super.destroy();
        console.log('GPUShaderModule does not provide a destroy() method');
    }
}