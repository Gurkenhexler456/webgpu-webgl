import { AttributeDescription, AttributeType, BufferObject, DataType, BufferLayout } from "../../buffer.js";
import { WebGLUtil } from "./gl_util.js";

export class BufferLayout_WebGL extends BufferLayout{

    /**
     * 
     * @param {number} stride 
     * @param {AttributeDescription[]} attributes 
     */
    constructor(stride, attributes) {

        super(stride, attributes);

        /**
         * @type {number}
         */
        this.stride = stride,
        this.attributes = this.attributes.map((attrib) => {
            return {
                /**
                 * @type {number}
                 */
                index : attrib.location,

                /**
                 * @type {number}
                 */
                offset : attrib.offset,
                /**
                 * @type {{
                 *  type: number,
                 *  size: number
                 * }}
                 */
                format : BufferLayout_WebGL.get_format(attrib.type),
            }
        });
    }

    /**
     * @type {}
     */
    static from(layout) {
        return new BufferLayout_WebGL(layout.stride, layout.attributes);
    }

    /**
     * @param {AttributeType} attrib_type
     * @returns {{}}
     */
    static get_format(attrib_type) {
        const gl = WebGLUtil.get_context();

        let type = 0;
        switch(attrib_type.type) {
            case DataType.FLOAT_32 :            type = gl.FLOAT;
                                                break;
            case DataType.SIGNED_INTEGER_32 :   type = gl.SIGNED_INTEGER_32
                                                break;
            case DataType.UNSIGNED_INTEGER_32 : type = gl.UNSIGNED_INT
                                                break;
            default:    throw new Error(`unsupported type: '${attrib_type.type}'`);
        }

        if(attrib_type.count >= 1 && attrib_type.count <= 4) {
            return {
                type,
                size: attrib_type.count
            };
        }

        throw new Error(`attributes cannot be this long: ${attrib_type.count}`);
    }
}



export class BufferObject_WebGL extends BufferObject {

    static {
        console.log('BufferObject_GL static block');
        this.TYPE_MAP = new Map([
            [BufferObject.VERTEX, WebGL2RenderingContext.ARRAY_BUFFER],
            [BufferObject.INDEX, WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER],
            [BufferObject.UNIFORM, WebGL2RenderingContext.UNIFORM_BUFFER]
        ]);
    }

    /**
     * 
     * @param {string} type 
     * @param {number} size 
     */
    constructor(type, size) {
        
        super(type, size);

        this.type = type;
        this.size = size;

        
        if(BufferObject_WebGL.TYPE_MAP.has(this.type)) {
            this.internal_type = BufferObject_WebGL.TYPE_MAP.get(this.type);
        }
        else {
            throw new Error(`type '${this.type}' not supported`);
        }

        const gl = WebGLUtil.get_context();

        this.buffer = gl.createBuffer();
        gl.bindBuffer(this.internal_type, this.buffer);
        gl.bufferData(this.internal_type, this.size, WebGL2RenderingContext.STATIC_DRAW);
    }

    /**
     * 
     * @param {number} size
     * @returns {BufferObject_WebGL} 
     */
    static vertex(size) {
        return new BufferObject_WebGL(BufferObject.VERTEX, size);
    }

    /**
     * 
     * @param {number} size
     * @returns {BufferObject_WebGL} 
     */
    static index(size) {
        return new BufferObject_WebGL(BufferObject.INDEX, size);
    }

    /**
     * 
     * @param {number} size
     * @returns {BufferObject_WebGL} 
     */
    static uniform(size) {
        return new BufferObject_WebGL(BufferObject.UNIFORM, size);
    }

    /**
     * 
     * @param {Uint8Array} data 
     */
    write_data(data) {
        const gl = WebGLUtil.get_context();
        
        gl.bindBuffer(this.internal_type, this.buffer);
        gl.bufferSubData(this.internal_type, 0, data);
    }
}

export class Model_WebGL {
    
    /**
     * @param {BufferObject_WebGL[]} vertex_buffers 
     * @param {BufferLayout_WebGL[]} layouts
     * @param {BufferObject_WebGL} index_buffer
     * @param {number} vertex_count
     */
    constructor(vertex_buffers, layouts, index_buffer, vertex_count) {

        this.vertex_count = vertex_count;

        if(vertex_buffers.length != layouts.length) {
            throw new Error(`number of vbos and layouts do not match: ${vertex_buffers.length} != ${layouts.length}`);
        }

        const gl = WebGLUtil.get_context();

        this.vbos = vertex_buffers;
        this.layouts = layouts;
        this.ebo = index_buffer;

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        for(let i = 0; i < vertex_buffers.length; i++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbos[i].buffer);
            const stride = this.layouts[0].stride;
            this.layouts[i].attributes.forEach((attr) => {
                gl.vertexAttribPointer(attr.index, attr.format.size, attr.format.type, false, stride, attr.offset);
            });
        }

        gl.bindVertexArray(null);

    }
}