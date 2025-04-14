//import { BufferLayout_WebGL } from "./backend/webgl/buffer_impl_webgl.js";
//import { BufferLayout_WebGPU } from "./backend/webgpu/buffer_impl_webgpu.js";

export class DataType {
    static FLOAT_32 = 'float32';
    static SIGNED_INTEGER_32 = 'int32';
    static UNSIGNED_INTEGER_32 = 'uint32';
}

export class AttributeType {

    static FLOAT =  new AttributeType(DataType.FLOAT_32, 1);
    static VEC2 =   new AttributeType(DataType.FLOAT_32, 2);
    static VEC3 =   new AttributeType(DataType.FLOAT_32, 3);
    static VEC4 =   new AttributeType(DataType.FLOAT_32, 4);

    static INTEGER =    new AttributeType(DataType.SIGNED_INTEGER_32, 1);
    static IVEC2 =      new AttributeType(DataType.SIGNED_INTEGER_32, 2);
    static IVEC3 =      new AttributeType(DataType.SIGNED_INTEGER_32, 3);
    static IVEC4 =      new AttributeType(DataType.SIGNED_INTEGER_32, 4);

    static UNSIGNED_INTEGER =   new AttributeType(DataType.UNSIGNED_INTEGER_32, 1);
    static UVEC2 =              new AttributeType(DataType.UNSIGNED_INTEGER_32, 2);
    static UVEC3 =              new AttributeType(DataType.UNSIGNED_INTEGER_32, 3);
    static UVEC4 =              new AttributeType(DataType.UNSIGNED_INTEGER_32, 4);

    constructor(type, count) {
        this.type = type;
        this.count = count;
    }
}

export class AttributeDescription {

    /**
     * 
     * @param {number} location 
     * @param {AttributeType} type 
     * @param {number} offset 
     */
    constructor (location, type, offset) {
        this.location = location;
        this.type = type;
        this.offset = offset;
    }
}

/**
 * 
 * @param {number} stride 
 * @param {AttributeDescription[]} attributes 
 */
export function BufferLayout(stride, attributes) {
    this.stride = stride;
    this.attributes = attributes;
}

export class BufferObject {

    static {
        console.log('BufferObject static block');
        this.VERTEX = 'vertex';
        this.INDEX = 'index';
        this.UNIFORM = 'uniform';
    }

    /**
     * 
     * @param {string} type 
     * @param {number} size 
     */
    constructor(type, size) {
        this.type = type;
        this.size = size;
    }

    /**
     * 
     * @param {number} size
     * @returns {Buffer} 
     */
    static vertex(size) {}

    /**
     * 
     * @param {number} size
     * @returns {Buffer} 
     */
    static index(size) {}

    /**
     * 
     * @param {number} size
     * @returns {Buffer} 
     */
    static uniform(size) {}

    /**
     * 
     * @param {Uint8Array} data 
     */
    write_data(data) {}
}

export class Model {
    
    /**
     * @param {BufferObject[]} vertex_buffers 
     * @param {BufferLayout[]} layouts
     * @param {BufferObject} index_buffer
     * @param {number}
     */
    constructor(vertex_buffers, layouts, index_buffer, vertex_count) {}
}