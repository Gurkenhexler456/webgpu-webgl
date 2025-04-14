import { Extents2D } from "../../../math/util.js";

export class WebGPUUtil {

    static INSTANCE = null;


    /**
     * 
     * @returns {boolean}
     */
    static is_webgpu_supported() {

        return navigator.gpu != null;
    }


    /**
     * @param {string} canvas_id 
     * @returns 
     */
    static async init(canvas_id) {

        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();

        if(!device) {
            return Promise.reject('failed to create device');
        }

        WebGPUUtil.INSTANCE = new WebGPUUtil(canvas_id, adapter, device);
    }

    /**
     * 
     * @param {string} canvas_id 
     * @param {GPUAdapter} adapter 
     * @param {GPUDevice} device 
     */
    constructor(canvas_id, adapter, device) {

        if(WebGPUUtil.INSTANCE !== null) {
            throw new Error('WebGPUUtil is a singleton');
        }

        this.adapter = adapter;
        this.device = device;

        /**
         * @type {HTMLCanvasElement}
         */
        this.canvas = document.getElementById(canvas_id);
        this.context = this.canvas.getContext('webgpu');
        this.preferred_format = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: this.preferred_format
        });
        /**
         * @type {Extents2D}
         */
        this.canvas_size = new Extents2D(this.canvas.width, this.canvas.height);
    }

    /**
     * 
     * @returns {GPUDevice}
     */
    static get_device() {
        return WebGPUUtil.INSTANCE.device;
    }

    /**
     * 
     */
    static get_context() {
        return WebGPUUtil.INSTANCE.context
    }
}