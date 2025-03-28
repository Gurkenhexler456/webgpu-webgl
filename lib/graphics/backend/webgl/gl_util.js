class WebGLUtil {


    /**
     * @type {WebGLUtil}
     */
    static INSTANCE = null;

    static init(canvas_id) {
        WebGLUtil.INSTANCE = new WebGLUtil(canvas_id);
    }

    #active_extensions = [];

    /**
     * 
     * @param {string} canvas_id 
     */
    constructor(canvas_id) {
        
        if(WebGLUtil.INSTANCE !== null) {
            throw new Error('only one instance allowed');
        }
        
        /**
         * @type {HTMLCanvasElement}
         */
        this.canvas = document.getElementById(canvas_id);
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