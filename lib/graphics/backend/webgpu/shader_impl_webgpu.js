class RenderShader_WebGPU {

    /**
     * 
     * @param {string} vertex_source 
     * @param {string} fragment_source 
     */
    constructor(vertex_source, fragment_source) {
        this.source = `${vertex_source}\n${fragment_source}`;

        const device = WebGPUUtil.get_device();

        /**
         * @type {GPUShaderModule}
         */
        this.module = device.createShaderModule({
            label: 'shader',
            code: this.source
        });
    }
}

class ComputeShader_WebGPU {
    
    /**
     * 
     * @param {string} compute_source 
     */
    constructor(compute_source) {
        this.source = compute_source;

        const device = WebGPUUtil.get_device();

        /**
         * @type {GPUShaderModule}
         */
        this.module = device.createShaderModule({
            label: 'shader',
            code: this.source
        });
    }
}