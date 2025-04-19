import { Extents2D } from "../math/util.js";

export const EngineBackend = {
    BACKEND_WEBGL_2:    'webgl2',
    BACKEND_WEBGPU:     'webgpu',
}

export class SolarEngine {

    /**
     * @type {SolarEngine}
     */
    static #INSTANCE = null;

    #backend;
    #canvas;

    /**
     * @type {Extents2D}
     */
    #render_resolution

    /**
     * 
     * @param {HTMLCanvasElement} canvas 
     * @param {Extents2D} render_resolution 
     * @param {string} backend 
     */
    constructor (canvas, render_resolution, backend) {

        if(SolarEngine.#INSTANCE !== null) {
            throw new Error('SolarEngine: cannot have more than one engine instance');
        }

        this.#canvas = canvas;
        this.#render_resolution = render_resolution;
        this.#backend = backend;

        SolarEngine.#INSTANCE = this;
    }


    async init() {}

    /**
     * 
     * @param {{
     *      objects: {
     *          model: Model,
     *          transform: Matrix4,
     *          texture: Texture2D
     *      }[],
     *      light_sources: {
     *          model: Model,
     *          transform: Matrix4,
     *          texture: Texture2D
     *      }[]
     * }} scene 
     * @param {Camera} camera 
     */
    render(scene, camera) {}


    /**
     * @returns {string}
     */
    get backend() { return this.#backend; }

    /**
     * @returns {HTMLCanvasElement}
     */
    get canvas() { return this.#canvas; }

    /**
     * @type {Extents2D}
     */
    get resolution() {
        return this.#render_resolution;
    }
}