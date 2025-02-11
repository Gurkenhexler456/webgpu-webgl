class DataType {
    static FLOAT_32 = 'float32';
    static SIGNED_INTEGER_32 = 'int32';
    static UNSIGNED_INTEGER_32 = 'uint32';
}

class AttributeType {

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

class AttributeDescription {

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

class BufferLayout {

    /**
     * 
     * @param {number} stride 
     * @param {AttributeDescription[]} attributes 
     */
    constructor(stride, attributes) {
        this.stride = stride;
        this.attributes = attributes;
    }

    to_WebGL() {
        return new BufferLayout_WebGL(this.stride, this.attributes);
    }

    to_WebGPU() {
        return new BufferLayout_WebGPU(this.stride, this.attributes);
    }
}

class BufferObject {

    static VERTEX = 'vertex';
    static INDEX = 'index';
    static UNIFORM = 'uniform';

    /**
     * 
     * @param {string} type 
     * @param {number} size 
     */
    constructor(type, size) {}

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

class Model {
    
    /**
     * @param {BufferObject[]} vertex_buffers 
     * @param {BufferLayout[]} layouts
     * @param {BufferObject} index_buffer
     * @param {number}
     */
    constructor(vertex_buffers, layouts, index_buffer, vertex_count) {}
}