import { WebGPUUtil } from "../../../graphics/backend/webgpu/gpu_util.js";
import { RenderShader_WebGPU } from "../../../graphics/backend/webgpu/shader_impl_webgpu.js";

export class ScreenSpaceEffectBase_WebGPU {

    static DEFAULT_VERTEX_SHADER = `

        const quad_positions = array(
            vec3f(-1.0, -1.0,  0.0),
            vec3f( 1.0, -1.0,  0.0),
            vec3f( 1.0,  1.0,  0.0),

            vec3f( 1.0,  1.0,  0.0),
            vec3f(-1.0,  1.0,  0.0),
            vec3f(-1.0, -1.0,  0.0)
        );

        const quad_uvs = array(
            vec2f(0.0, 1.0),
            vec2f(1.0, 1.0),
            vec2f(1.0, 0.0),

            vec2f(1.0, 0.0),
            vec2f(0.0, 0.0),
            vec2f(0.0, 1.0)
        );

        struct VertexOutput {
            @builtin(position) position: vec4f,
            @location(0) uv: vec2f
        }

        @vertex
        fn vertex_main(@builtin(vertex_index) index: u32) -> VertexOutput {

            var vs_out = VertexOutput();

            vs_out.position = vec4f(quad_positions[index], 1.0);
            vs_out.uv       = quad_uvs[index];

            return vs_out;
        }
    `;

    static DEFAULT_FRAGMENT_SHADER = `

        @group(0) @binding(0) var main_sampler: sampler;
        @group(0) @binding(1) var main_texture: texture_2d<f32>;
        
        @fragment
        fn fragment_main(fs_input: VertexOutput) -> @location(0) vec4f {

            return textureSample(main_texture, main_sampler, fs_input.uv);
        }
    `;

    constructor(
        fragment_shader = ScreenSpaceEffectBase_WebGPU.DEFAULT_FRAGMENT_SHADER, 
        vertex_shader   = ScreenSpaceEffectBase_WebGPU.DEFAULT_VERTEX_SHADER
    ) {

        const device = WebGPUUtil.get_device();

        this.shader = new RenderShader_WebGPU(vertex_shader, fragment_shader);
    }   
}