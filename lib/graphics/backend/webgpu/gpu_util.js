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
     * @param {HTMLCanvasElement} canvas
     * @returns 
     */
    static async init(canvas) {

        const adapter = await navigator.gpu.requestAdapter();

        const device = await adapter.requestDevice();

        if(!device) {
            return Promise.reject('failed to create device');
        }

        WebGPUUtil.INSTANCE = new WebGPUUtil(canvas, adapter, device);
    }

    /**
     * 
     * @param {HTMLCanvasElement} canvas
     * @param {GPUAdapter} adapter 
     * @param {GPUDevice} device 
     */
    constructor(canvas, adapter, device) {

        if(WebGPUUtil.INSTANCE !== null) {
            throw new Error('WebGPUUtil is a singleton');
        }

        this.adapter = adapter;
        this.device = device;

        this.canvas = canvas;
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
     * @returns {GPUCanvasContext}
     */
    static get_context() {
        return WebGPUUtil.INSTANCE.context
    }
}