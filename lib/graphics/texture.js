/**
 * @typedef {{
 *      type: any,
 *      usage: any
 * }} TextureProps
 */

class Texture2D {

    static WRAP_REPEAT = 'repeat';
    static WRAP_CLAMP = 'clamp';

    static FILTER_LINEAR = 'linear';
    static FILTER_NEAREST = 'nearest';

    /**
     * 
     * @param {Extents2D} size 
     * @param {Uint8Array} data
     * @param {TextureProps} props
     */
    constructor(size, data, props) {}

    /**
     * 
     * @param {Uint8Array} data 
     */
    set_data(data) {}

    /**
     * 
     * @param {{
     *  wrap_mode: {
     *      x:  string,
     *      y:  string
     *  },
     *  filter: {
     *      mag: string,
     *      min: string
     *  }
     * }} sampling_props 
     */
    set_sampling(sampling_props) {}


    /**
     * @param {Extents2D} size
     * @param {Uint8Array} data 
     * @returns {boolean} true if the data size provided matches the size of the texture; throws an Error otherwise
     */
    static validate_data_size(size, data) {
        const bytes_needed = size.width * size.height * 4;
        if (data.length != bytes_needed) {
            throw Error(`texture data size does not match the provided texture size: ${data.length} != ${bytes_needed}`);
        }

        return true;
    }
}


/**
 * 
 * @param {string} image_path 
 * @param {function (Texture2D)} on_load 
 * @param {function (string | Event)} on_error 
 */
async function load_texture(image_path, on_load, on_error) {

    on_error = on_error || function (err) { throw new Error(err); };

    const img = new Image();
    img.src = image_path;
    img.crossOrigin = 'Anonymous';

    img.onload = () => {

        const off_canvas = new OffscreenCanvas(img.width, img.height);
        const ctx = off_canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, img.width, img.height);

        const texture = RenderSystem.create_texture_2D(new Extents2D(data.width, data.height), data.data);
        texture.set_data(data.data);

        on_load(texture);
    }

    img.onerror = (err) => {
        on_error(err);
    }
}

/**
 * 
 * @param {Extents2D} size 
 * @returns 
 */
function create_checker_texture(size) {

    const checkers_size = new Extents2D(size.width / 10, size.height / 10);
    const bytes_needed = 4 * size.width * size.height;
    const data = [];
    for(let y = 0; y < size.height; y++) {
        for(let x = 0; x < size.width; x++) {
            
            const checker = ((Math.floor(x / checkers_size.width) + Math.floor(y / checkers_size.height)) % 2) * 255;

            const color = [checker, checker, checker, 255];
            data.push(...color);
        }
    }
    const result = new Uint8Array(data);

    return result;
}
