import { Extents2D } from "../math/util.js";
import { SolarEngine_WebGL } from "./backend/webgl2/engine_impl_webgl.js";
import { SolarEngine_WebGPU } from "./backend/webgpu/engine_impl_webgpu.js";
import { EngineBackend } from "./engine.js";

function is_backend_supported(backend) {
    const oc = new OffscreenCanvas(100, 100);
    if(backend === EngineBackend.BACKEND_WEBGPU) {
        return (navigator.gpu !== undefined) && (oc.getContext('webgpu') !== null)
    }
    else if(backend === EngineBackend.BACKEND_WEBGL_2) {
        return (oc.getContext('webgl2') !== null);
    }

    throw new Error(`SolarEngine: backend not supported '${backend}'`);
}

function request_backend(backend) {

    if(is_backend_supported(backend)) {
        return backend;
    }
    else if(backend === EngineBackend.BACKEND_WEBGPU) {
        if (is_backend_supported(EngineBackend.BACKEND_WEBGL_2)) {
            return EngineBackend.BACKEND_WEBGL_2;
        }
    }

    throw new Error(`SolarEngine: backend fallback not supported`);
}


export const EngineHelper = {

    /**
     * 
     * @param {HTMLCanvasElement} canvas 
     * @param {Extents2D} render_resolution
     * @param {string} backend 
     * @returns {SolarEngine_WebGL | SolarEngine_WebGPU}
     */
    create: function (canvas, render_resolution = new Extents2D(1280, 720), backend = EngineBackend.BACKEND_WEBGL_2, props = {}) {
        
        backend = request_backend(backend);

        if(backend === EngineBackend.BACKEND_WEBGPU) {
            return new SolarEngine_WebGPU(canvas, render_resolution, props); 
        }
        else {
            return new SolarEngine_WebGL(canvas, render_resolution, props);
        }
    }
}