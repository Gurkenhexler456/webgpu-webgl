import { BufferObject_WebGPU } from "../../../graphics/backend/webgpu/buffer_impl_webgpu.js";
import { WebGPUUtil } from "../../../graphics/backend/webgpu/gpu_util.js";
import { RenderSystem_WebGPU } from "../../../graphics/backend/webgpu/render_system_impl_webgpu.js";
import { RenderTarget_WebGPU } from "../../../graphics/backend/webgpu/render_target_impl_webgpu.js";
import { Texture2D_WebGPU } from "../../../graphics/backend/webgpu/texture_impl_webgpu.js";
import { RenderSystem } from "../../../graphics/render_system.js";
import { Matrix4 } from "../../../math/matrix.js";
import { Extents2D } from "../../../math/util.js";
import { EngineBackend, SolarEngine } from "../../engine.js";
import { ScreenSpace_Atmosphere_WebGPU } from "../webgpu/screen_space_effects/ssfx_atmosphere_impl_webgpu.js";
import { DeferredRenderer_WebGPU } from "./deferred_renderer_impl_webgpu.js";
import { ScreenSpace_GammaCorrection_WebGPU } from "./screen_space_effects/ssfx_gamma_correction_impl_webgpu.js";
import { ScreenSpace_ToScreen_WebGPU } from "./screen_space_effects/ssfx_to_screen_impl_webgpu.js";

export class SolarEngine_WebGPU extends SolarEngine {


    #engine_ready = false;

    /**
     * @type {DeferredRenderer_WebGPU}
     */
    #renderer;



    /**
     * @type {Float32Array}
     */
    #atmosphere_buffer_data = new Float32Array(16);

    /**
     * @type {BufferObject_WebGPU}
     */
    #atmosphere_buffer;

    /**
     * @type {ScreenSpace_Atmosphere_WebGPU}
     */
    #atmosphere_effect;

    /**
     * @type {ScreenSpace_GammaCorrection_WebGPU}
     */
    #gamma_correction;

    /**
     * @type {ScreenSpace_ToScreen_WebGPU}
     */
    #to_screen_effect;


    #use_atmosphere_effect = true;


    /**
     * 
     * @param {HTMLCanvasElement} canvas
     * @param {Extents2D} render_resolution
     */
    constructor(canvas, render_resolution) {
        super(canvas, render_resolution, EngineBackend.BACKEND_WEBGPU);
    }

    async init() {

        await WebGPUUtil.init(this.canvas)
        let system = new RenderSystem_WebGPU();
        RenderTarget_WebGPU.init();
        system.renderer.switch_render_target({
            target: RenderTarget_WebGPU.get_default(),
            clear_color: [0.0, 0.0, 0.0, 0.0],
            enable_depth_test: false
        });




        this.#renderer = new DeferredRenderer_WebGPU(this.resolution);
        if(this.#use_atmosphere_effect) {

            this.#atmosphere_buffer = RenderSystem.create_uniform_buffer(this.#atmosphere_buffer_data.byteLength);
            this.#atmosphere_buffer.write_data(this.#atmosphere_buffer_data);

            this.#atmosphere_effect = new ScreenSpace_Atmosphere_WebGPU(
                {
                    albedo_texture:     this.#renderer.result,
                    position_texture:   this.#renderer.get_texture('position'),
                    depth_texture:      this.#renderer.get_texture('depth'),
                    vp_inverse_ub:      this.#atmosphere_buffer
                }, 
                new Texture2D_WebGPU(this.resolution, null, {
                    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
                })
            );

            this.#gamma_correction = new ScreenSpace_GammaCorrection_WebGPU(
                this.#atmosphere_effect.output,
                new Texture2D_WebGPU(this.resolution, null, {
                    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
                })
            );

            this.#to_screen_effect = new ScreenSpace_ToScreen_WebGPU(this.#gamma_correction.output);
        }



        this.#engine_ready = true;
    }

    render(scene, camera) {


        this.#renderer.process(scene, camera);

        if(this.#use_atmosphere_effect) {

            this.#atmosphere_buffer_data.set(Matrix4.inverse(new Matrix4(camera.view.data).multiply(camera.perspective).data).data);
            this.#atmosphere_buffer.write_data(this.#atmosphere_buffer_data);


            const device = WebGPUUtil.get_device();
            const encoder = device.createCommandEncoder({ label: 'PostProcessingStep: CommandEncoder' });

            this.#atmosphere_effect.apply(encoder);

            this.#gamma_correction.apply(encoder);

            this.#to_screen_effect.apply(encoder);

            device.queue.submit([encoder.finish()]);
        }
    }
}