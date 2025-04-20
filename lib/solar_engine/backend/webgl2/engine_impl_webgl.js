import { BufferObject_WebGL } from "../../../graphics/backend/webgl/buffer_impl_webgl.js";
import { WebGLUtil } from "../../../graphics/backend/webgl/gl_util.js";
import { RenderSystem_WebGL } from "../../../graphics/backend/webgl/render_system_impl_webgl.js";
import { Texture2D_WebGL } from "../../../graphics/backend/webgl/texture_impl_webgl.js";
import { RenderSystem } from "../../../graphics/render_system.js";
import { Matrix4 } from "../../../math/matrix.js";
import { Extents2D } from "../../../math/util.js";
import { EngineBackend, SolarEngine } from "../../engine.js";
import { MergeOperation } from "../../frame_merger.js";
import { DeferredRenderer_WebGL } from "./deferred_renderer_impl_webgl.js";
import { FrameMerger_WebGL } from "./frame_merger_impl_webgl.js";
import { LightSourceRenderer_WebGL } from "./light_source_renderer_impl_webgl.js";
import { ScreenSpace_Atmosphere_WebGL } from "./screen_space_effects/ssfx_atmosphere_impl_webgl.js";
import { BlurDirection_WebGL, ScreenSpace_Blur_WebGL } from "./screen_space_effects/ssfx_bloom_impl_webgl.js";
import { ScreenSpace_Downscale_WebGL } from "./screen_space_effects/ssfx_downscale_impl_webgl.js";
import { ScreenSpace_Gamma_Correction_WebGL } from "./screen_space_effects/ssfx_gamma_correction_impl_webgl.js";
import { ScreenSpace_ToScreen_WebGL } from "./screen_space_effects/ssfx_to_screen_impl_webgl.js";

export class SolarEngine_WebGL extends SolarEngine {


    #engine_ready = false;

    /**
     * @type {DeferredRenderer_WebGL}
     */
    #renderer;


    /**
     * @type {LightSourceRenderer_WebGL}
     */
    #light_renderer;

    /**
     * @type {FrameMerger_WebGL}
     */
    #cutout_merger;

    /**
     * @type {FrameMerger_WebGL}
     */
    #light_merger;



    /**
     * @type {Texture2D_WebGL[]}
     */
    #ping_pong_buffer = [];

    /**
     * @type {ScreenSpace_Blur_WebGL}
     */
    #horizontal_blur;

    /**
     * @type {ScreenSpace_Blur_WebGL}
     */
    #vertical_blur;



    /**
     * @type {FrameMerger_WebGL}
     */
    #final_merger;



    /**
     * @type {Float32Array}
     */
    #atmosphere_buffer_data = new Float32Array(16);

    /**
     * @type {BufferObject_WebGL}
     */
    #atmosphere_buffer;

    /**
     * @type {ScreenSpace_Atmosphere_WebGL}
     */
    #atmosphere_effect;

    /**
     * @type {ScreenSpace_Gamma_Correction_WebGL}
     */
    #gamma_correction;

    /**
     * @type {ScreenSpace_ToScreen_WebGL}
     */
    #to_screen_effect;





    /**
     * 
     * @param {HTMLCanvasElement} canvas 
     * @param {Extents2D} render_resolution 
     */
    constructor(canvas, render_resolution) {
        super(canvas, render_resolution, EngineBackend.BACKEND_WEBGL_2);
    }

    async init() {

        WebGLUtil.init(this.canvas);

        let system = new RenderSystem_WebGL();

        this.#renderer = new DeferredRenderer_WebGL(this.resolution);


        this.#light_renderer = new LightSourceRenderer_WebGL(this.resolution, this.#renderer.get_texture('depth'));

        const resolution_scale = 0.75;
        const light_resolution = new Extents2D(
            this.resolution.width * resolution_scale, 
            this.resolution.height * resolution_scale
        );

        this.#horizontal_blur = new ScreenSpace_Blur_WebGL(
            this.#light_renderer.light_texture,
            new Texture2D_WebGL(this.resolution, null)
        );

        this.#vertical_blur = new ScreenSpace_Blur_WebGL(
            this.#horizontal_blur.output,
            new Texture2D_WebGL(this.resolution, null),
            BlurDirection_WebGL.VERTICAL
        );

        this.#cutout_merger = new FrameMerger_WebGL(this.#light_renderer.color_texture, this.#light_renderer.light_texture, MergeOperation.SUBTRACT);

        this.#ping_pong_buffer = [
            new Texture2D_WebGL(this.resolution, null),
            new Texture2D_WebGL(this.resolution, null),
        ]

        this.#light_merger = new FrameMerger_WebGL(this.#light_renderer.color_texture, this.#vertical_blur.output, MergeOperation.ADD);

        
        this.#atmosphere_buffer = RenderSystem.create_uniform_buffer(this.#atmosphere_buffer_data.byteLength);
        this.#atmosphere_buffer.write_data(this.#atmosphere_buffer_data);

        this.#atmosphere_effect = new ScreenSpace_Atmosphere_WebGL(
            {
                albedo_texture:     this.#renderer.result_texture,
                position_texture:   this.#renderer.get_texture('position'),
                depth_texture:      this.#renderer.get_texture('depth'),
                vp_inverse_ub:      this.#atmosphere_buffer
            }, 
            new Texture2D_WebGL(this.resolution, null)
        );

        this.#final_merger = new FrameMerger_WebGL(this.#atmosphere_effect.output, this.#light_merger.output_texture);

        this.#gamma_correction = new ScreenSpace_Gamma_Correction_WebGL(
            this.#final_merger.output_texture,
            new Texture2D_WebGL(this.resolution, null) 
        )

        this.#to_screen_effect = new ScreenSpace_ToScreen_WebGL(this.#gamma_correction.output);


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

        this.#horizontal_blur.input = this.#light_renderer.light_texture;
        this.#horizontal_blur.output = this.#ping_pong_buffer[0];

        this.#horizontal_blur.apply();

        let in_tex = 1;
        let out_tex = 0;

        for(let i = 0; i < 4; i++) {
            in_tex = i % 2;
            out_tex = (in_tex + 1) % 2;
            this.#horizontal_blur.input = this.#ping_pong_buffer[in_tex];
            this.#horizontal_blur.output = this.#ping_pong_buffer[out_tex];
            this.#horizontal_blur.apply();
        }

        this.#vertical_blur.input = this.#ping_pong_buffer[out_tex];
        this.#vertical_blur.output = this.#ping_pong_buffer[in_tex];

        this.#vertical_blur.apply();

        for(let i = 0; i < 4; i++) {
            in_tex = (in_tex + i) % 2;
            out_tex = (in_tex + 1) % 2;
            this.#vertical_blur.input = this.#ping_pong_buffer[in_tex];
            this.#vertical_blur.output = this.#ping_pong_buffer[out_tex];
            this.#vertical_blur.apply();
        }


        this.#cutout_merger.texture_a = this.#vertical_blur.output;
        this.#cutout_merger.render(); 

        this.#light_merger.texture_b = this.#cutout_merger.output_texture;
        this.#light_merger.render();

        this.#atmosphere_buffer_data.set(Matrix4.inverse(new Matrix4(camera.view.data).multiply(camera.perspective).data).data);
        this.#atmosphere_buffer.write_data(this.#atmosphere_buffer_data);

        this.#atmosphere_effect.apply();

        this.#final_merger.render();

        this.#gamma_correction.apply();
        this.#to_screen_effect.apply();
    }
}