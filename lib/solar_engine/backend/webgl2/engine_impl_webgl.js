import { BufferObject_WebGL } from "../../../graphics/backend/webgl/buffer_impl_webgl.js";
import { WebGLUtil } from "../../../graphics/backend/webgl/gl_util.js";
import { RenderSystem_WebGL } from "../../../graphics/backend/webgl/render_system_impl_webgl.js";
import { Texture2D_WebGL } from "../../../graphics/backend/webgl/texture_impl_webgl.js";
import { RenderSystem } from "../../../graphics/render_system.js";
import { Matrix4 } from "../../../math/matrix.js";
import { Extents2D } from "../../../math/util.js";
import { EngineBackend, SolarEngine } from "../../engine.js";
import { DeferredRenderer_WebGL } from "./deferred_renderer_impl_webgl.js";
import { ScreenSpace_Atmosphere_WebGL } from "./screen_space_effects/ssfx_atmosphere_impl_webgl.js";
import { ScreenSpace_Gamma_Correction_WebGL } from "./screen_space_effects/ssfx_gamma_correction_impl_webgl.js";
import { ScreenSpace_ToScreen_WebGL } from "./screen_space_effects/ssfx_to_screen_impl_webgl.js";

export class SolarEngine_WebGL extends SolarEngine {


    #engine_ready = false;

    /**
     * @type {DeferredRenderer_WebGL}
     */
    #renderer;



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

        this.#gamma_correction = new ScreenSpace_Gamma_Correction_WebGL(
            this.#atmosphere_effect.output,
            new Texture2D_WebGL(this.resolution, null) 
        )

        this.#to_screen_effect = new ScreenSpace_ToScreen_WebGL(this.#gamma_correction.output);


        this.#engine_ready = true;
    }

    render(scene, camera) {
        
        this.#renderer.process(scene, camera);


        this.#atmosphere_buffer_data.set(Matrix4.inverse(new Matrix4(camera.view.data).multiply(camera.perspective).data).data);
        this.#atmosphere_buffer.write_data(this.#atmosphere_buffer_data);

        this.#atmosphere_effect.apply();

        this.#gamma_correction.apply();
        this.#to_screen_effect.apply();
    }
}