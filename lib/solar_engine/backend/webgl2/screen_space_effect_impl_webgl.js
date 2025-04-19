import { RenderShader_WebGL } from "../../../graphics/backend/webgl/shader_impl_webgl.js";

export class ScreenSpaceEffectBase_WebGL {

    static DEFAULT_VERTEX_SHADER = `#version 300 es

        out vec2 vf_UV;
        
        vec3 positions[6] = vec3[6](
            vec3(-1.0, -1.0, 0.0),
            vec3( 1.0, -1.0, 0.0),
            vec3( 1.0,  1.0, 0.0),

            vec3( 1.0,  1.0, 0.0),
            vec3(-1.0,  1.0, 0.0),
            vec3(-1.0, -1.0, 0.0)
        );

        vec2 uvs[6] = vec2[6](
            vec2(0.0, 0.0),
            vec2(1.0, 0.0),
            vec2(1.0, 1.0),

            vec2(1.0, 1.0),
            vec2(0.0, 1.0),
            vec2(0.0, 0.0)
        );

        void main() {
            
            vf_UV = uvs[gl_VertexID];
            gl_Position = vec4(positions[gl_VertexID], 1.0);
        }`;

    static DEFAULT_FRAGMENT_SHADER = `#version 300 es

        precision highp float;

        in vec2 vf_UV;

        out vec4 out_Color;

        uniform sampler2D u_Texture;

        void main() {

            out_Color = texture(u_Texture, vf_UV);
        }
    `;

    constructor(
        fragment_shader = ScreenSpaceEffectBase_WebGL.DEFAULT_FRAGMENT_SHADER, 
        vertex_shader   = ScreenSpaceEffectBase_WebGL.DEFAULT_VERTEX_SHADER
    ) {

        this.shader = new RenderShader_WebGL(vertex_shader, fragment_shader);
    }   
}