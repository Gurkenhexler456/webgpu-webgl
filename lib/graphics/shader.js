class Shader {

    static #SHADERS_CREATED = 0;
    static #SHADER_COUNT = 0;

    constructor() {
        this.id = Shader.#SHADERS_CREATED++;
        Shader.#SHADER_COUNT++;
    }

    destroy() {
        Shader.#SHADER_COUNT--;
    }
}

export class RenderShader extends Shader {

    /**
     * 
     * @param {string} vertex_source 
     * @param {string} fragment_source 
     */
    constructor(vertex_source, fragment_source) {
        super();
        this.vertex_source = vertex_source;
        this.fragment_source = fragment_source;
    }

    destroy() {
        super.destroy();
    }
}

export class ComputeShader extends Shader {
    
    /**
     * 
     * @param {string} compute_source 
     */
    constructor(compute_source) {
        super();
        this.compute_source = compute_source;
    }

    destroy() {
        super.destroy();
    }
}