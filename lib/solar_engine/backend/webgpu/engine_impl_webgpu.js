import { BufferObject_WebGPU, Model_WebGPU } from "../../../graphics/backend/webgpu/buffer_impl_webgpu.js";
import { WebGPUUtil } from "../../../graphics/backend/webgpu/gpu_util.js";
import { RenderSystem_WebGPU } from "../../../graphics/backend/webgpu/render_system_impl_webgpu.js";
import { RenderTarget_WebGPU } from "../../../graphics/backend/webgpu/render_target_impl_webgpu.js";
import { Texture2D_WebGPU } from "../../../graphics/backend/webgpu/texture_impl_webgpu.js";
import { RenderSystem } from "../../../graphics/render_system.js";
import { Camera } from "../../../graphics/util/camera.js";
import { Matrix4 } from "../../../math/matrix.js";
import { Extents2D } from "../../../math/util.js";
import { EngineBackend, SolarEngine } from "../../engine.js";
import { MergeOperation } from "../../frame_merger.js";
import { ScreenSpace_Atmosphere_WebGPU } from "../webgpu/screen_space_effects/ssfx_atmosphere_impl_webgpu.js";
import { DeferredRenderer_WebGPU } from "./deferred_renderer_impl_webgpu.js";
import { FrameMerger_WebGPU } from "./frame_merger_impl_webgpu.js";
import { LightSourceRenderer_WebGPU } from "./light_source_renderer_impl_webgpu.js";
import { BlurDirection_WebGPU, ScreenSpace_Blur_WebGPU } from "./screen_space_effects/ssfx_blur_impl_webgpu.js";
import { ScreenSpace_Downscale_WebGPU } from "./screen_space_effects/ssfx_downscale_impl_webgpu.js";
import { ScreenSpace_GammaCorrection_WebGPU } from "./screen_space_effects/ssfx_gamma_correction_impl_webgpu.js";
import { ScreenSpace_ToScreen_WebGPU } from "./screen_space_effects/ssfx_to_screen_impl_webgpu.js";

export class SolarEngine_WebGPU extends SolarEngine {


    #engine_ready = false;

    /**
     * @type {DeferredRenderer_WebGPU}
     */
    #renderer;

    /**
     * @type {LightSourceRenderer_WebGPU}
     */
    #light_renderer;

    /**
     * @type {FrameMerger_WebGPU}
     */
    #light_merger;

    /**
     * @type {ScreenSpace_Downscale_WebGPU}
     */
    #scaler;

    /**
     * @type {ScreenSpace_Blur_WebGPU}
     */
    #horizontal_blur;

    /**
     * @type {ScreenSpace_Blur_WebGPU}
     */
    #vertical_blur;

    /**
     * @type {FrameMerger_WebGPU}
     */
    #final_merger;

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

        this.#light_renderer = new LightSourceRenderer_WebGPU(this.resolution, this.#renderer.get_texture('depth'));


        this.#scaler = new ScreenSpace_Downscale_WebGPU(this.#light_renderer.light_texture, new Extents2D(750, 750));

        this.#horizontal_blur = new ScreenSpace_Blur_WebGPU(
            this.#scaler.output, 
            new Texture2D_WebGPU(this.resolution, null, {
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
            })
        );

        this.#vertical_blur = new ScreenSpace_Blur_WebGPU(
            this.#horizontal_blur.output,
            new Texture2D_WebGPU(this.resolution, null, {
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
            }),
            BlurDirection_WebGPU.VERTICAL
        );

        this.#light_merger = new FrameMerger_WebGPU(this.#light_renderer.color_texture, this.#vertical_blur.output, MergeOperation.ADD);

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


        this.#final_merger = new FrameMerger_WebGPU(this.#atmosphere_effect.output, this.#light_merger.output_texture);


        this.#gamma_correction = new ScreenSpace_GammaCorrection_WebGPU(
            this.#final_merger.output_texture,
            new Texture2D_WebGPU(this.resolution, null, {
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
            })
        );

        this.#to_screen_effect = new ScreenSpace_ToScreen_WebGPU(this.#gamma_correction.output);


        this.#engine_ready = true;
    }

    /**
     * 
     * @param {{
     *      objects: {
     *          model: Model_WebGPU,
     *          transform: Matrix4,
     *          texture: Texture2D_WebGPU
     *      }[],
     *      light_sources: {
     *          model: Model_WebGPU,
     *          transform: Matrix4,
     *          texture: Texture2D_WebGPU
     *      }[]
     * }} scene 
     * @param {Camera} camera 
     */
    render(scene, camera) {

        this.#renderer.process(scene.objects, camera);

        this.#light_renderer.process(scene.light_sources, camera);



        const device = WebGPUUtil.get_device();
        const encoder = device.createCommandEncoder({ label: 'PostProcessingStep: CommandEncoder' });

        this.#scaler.apply(encoder);
        this.#horizontal_blur.apply(encoder);
        this.#vertical_blur.apply(encoder);


        this.#light_merger.render(encoder);


        this.#atmosphere_buffer_data.set(Matrix4.inverse(new Matrix4(camera.view.data).multiply(camera.perspective).data).data);
        this.#atmosphere_buffer.write_data(this.#atmosphere_buffer_data);

        this.#atmosphere_effect.apply(encoder);

        this.#final_merger.render(encoder);

        this.#gamma_correction.apply(encoder);

        this.#to_screen_effect.apply(encoder);

        device.queue.submit([encoder.finish()]);
    }
}