import { BufferObject, DataType } from "../../buffer.js";
import { WebGPUUtil } from "./gpu_util.js";

export class BufferLayout_WebGPU {

    /**
     * 
     * @param {number} stride 
     * @param {AttributeDescription[]} attributes 
     */
    constructor(stride, attributes) {

        this.arrayStride = stride,
        this.attributes = attributes.map((attrib) => {
            return {
                shaderLocation : attrib.location,
                offset : attrib.offset,
                format : BufferLayout_WebGPU.get_format(attrib.type),
            }
        })
    }

    static from(layout) {
        return new BufferLayout_WebGPU  (layout.stride, layout.attributes);
    }

    /**
     * @param {AttributeType} attrib_type
     * @returns {string}
     */
    static get_format(attrib_type) {
        let format = '';
        switch(attrib_type.type) {
            case DataType.FLOAT_32 :            format = 'float32'
                                                break;
            case DataType.SIGNED_INTEGER_32 :   format = 'sint32'
                                                break;
            case DataType.UNSIGNED_INTEGER_32 : format = 'uint32'
                                                break;
            default:    throw new Error(`unsupported type: '${attrib_type.type}'`);
        }

        if (attrib_type.count === 1) {
            return format;
        }
        else if(attrib_type.count > 1 && attrib_type.count <= 4) {
            return `${format}x${attrib_type.count}`;
        }

        throw new Error(`attributes cannot be this long: ${attrib_type.count}`);
    }
}


export class BufferObject_WebGPU extends BufferObject {

    static type_map = new Map([
        [BufferObject.VERTEX, GPUBufferUsage.VERTEX],
        [BufferObject.INDEX, GPUBufferUsage.INDEX],
        [BufferObject.UNIFORM, GPUBufferUsage.UNIFORM]
    ]);

    /**
     * 
     * @param {string} type 
     * @param {number} size 
     */
    constructor(type, size) {

        super(type, size);
        
        if(BufferObject_WebGPU.type_map.has(this.type)) {
            this.internal_type = BufferObject_WebGPU.type_map.get(this.type);
        }
        else {
            throw new Error(`type '${this.type}' not supported`);
        }

        const device = WebGPUUtil.get_device();

        this.buffer = device.createBuffer({
            label: 'Buffer created',
            size: this.size,
            usage: this.internal_type | GPUBufferUsage.COPY_DST
        });
    }

    /**
     * 
     * @param {number} size
     * @returns {BufferObject_WebGPU} 
     */
    static vertex(size) {
        return new BufferObject_WebGPU(BufferObject.VERTEX, size);
    }

    /**
     * 
     * @param {number} size
     * @returns {BufferObject_WebGPU} 
     */
    static index(size) {
        return new BufferObject_WebGPU(BufferObject.INDEX, size);
    }

    /**
     * 
     * @param {number} size
     * @returns {BufferObject_WebGPU} 
     */
    static uniform(size) {
        return new BufferObject_WebGPU(BufferObject.UNIFORM, size);
    }

    /**
     * 
     * @param {Uint8Array} data 
     */
    write_data(data) {
        const device = WebGPUUtil.get_device();
        device.queue.writeBuffer(this.buffer, 0, data);
    }
}


export class Model_WebGPU {
    
    /**
     * @param {BufferObject_WebGPU[]} vertex_buffers 
     * @param {BufferLayout_WebGPU[]} layouts
     * @param {BufferObject_WebGPU} index_buffer
     * @param {number} vertex_count
     */
    constructor(vertex_buffers, layouts, index_buffer, vertex_count) {

        this.vertex_count = vertex_count;
        
        if(vertex_buffers.length != layouts.length) {
            throw new Error(`number of vbos and layouts do not match: ${vertex_buffers.length} != ${layouts.length}`);
        }


        this.vertices = vertex_buffers;
        this.layouts = layouts;
        this.indices = index_buffer;
    }
}