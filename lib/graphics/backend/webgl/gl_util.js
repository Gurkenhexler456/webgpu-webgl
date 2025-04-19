export class WebGLUtil {


    /**
     * @type {WebGLUtil}
     */
    static INSTANCE = null;

    static init(canvas) {
        WebGLUtil.INSTANCE = new WebGLUtil(canvas);
    }

    #active_extensions = [];

    /**
     * 
     * @param {string} canvas 
     */
    constructor(canvas) {
        
        if(WebGLUtil.INSTANCE !== null) {
            throw new Error('only one instance allowed');
        }
        
        /**
         * @type {HTMLCanvasElement}
         */
        this.canvas = canvas;
        /**
         * @type {WebGL2RenderingContext}
         */
        this.context = this.canvas.getContext('webgl2');

        console.log(this.context.getSupportedExtensions());
        this.#enable_extension('EXT_color_buffer_float');
    }

    #enable_extension(extension) {
        const ext = this.context.getExtension(extension);

        if(ext) {
            this.#active_extensions.push(ext);
        }
        else {
            throw new Error(`Extension not supported: '${extension}'`);
        }
    }

    /**
     * 
     * @returns {WebGL2RenderingContext}
     */
    static get_context() {
        return WebGLUtil.INSTANCE.context;
    }
}