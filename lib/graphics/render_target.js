export class RenderTarget {

    static get_default() {}

    /**
     * @type {Map<string, Texture2D>}
     */
    textures;

    /**
     * 
     * @param {Extents2D} size 
     */
    constructor(size) {}

    /**
     * 
     * @param {string} label 
     * @param {string} type 
     */
    add_color_attachment(label, type = 'color') {}

    /**
     * 
     * @param {string} label 
     */
    add_depth_attachment(label) {}
}