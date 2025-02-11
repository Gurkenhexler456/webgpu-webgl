class WebGLUtil {


    /**
     * @type {WebGLUtil}
     */
    static INSTANCE = null;

    static init(canvas_id) {
        WebGLUtil.INSTANCE = new WebGLUtil(canvas_id);
    }

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
    }

    /**
     * 
     * @returns {WebGL2RenderingContext}
     */
    static get_context() {
        return WebGLUtil.INSTANCE.context;
    }
}