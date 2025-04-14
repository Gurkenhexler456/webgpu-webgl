export function Extents2D(width, height) {
    this.width = width;
    this.height = height;
}

export function Extents3D(width, height, depth) {
    this.width = width;
    this.height = height;
    this.depth = depth;
}


/**
 * 
 * @param {*} key 
 * @param {Map} map 
 * @param {*} default_value 
 */
export function get_value_or_default(key, map, default_value) {
    return (key && map.has(key)) ? map.get(key) : default_value;
}

/**
 * 
 * @param {number} theta 
 * @param {number} phi 
 * @returns 
 */
export function from_spherical(yaw, pitch) {

    return [
        Math.sin(pitch) * Math.cos(yaw),
        Math.cos(pitch),
        Math.sin(pitch) * Math.sin(yaw)
    ];
}

/**
 * 
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clamp(value, min, max) {
    return value <= min ? min : (value >= max ? max : value);
}


export function to_radians(degrees) {
    return degrees * (Math.PI / 180);
}