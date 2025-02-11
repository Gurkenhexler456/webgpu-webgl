/**
 * 
 * @param {{min: number, max: number}} src_range 
 * @param {{min: number, max: number}} target_range 
 */
function get_linear_equation(src_range, target_range) {
    const m = (target_range.max - target_range.min) / (src_range.max - src_range.min);
    return {
        scale: m,
        offset: target_range.max - src_range.max * m
    }
}

class Matrix3 {

    static zero() {
        return new Matrix3([
            0, 0, 0, 
            0, 0, 0, 
            0, 0, 0
        ]);
    }

    static identity() {
        return new Matrix3([
            1, 0, 0, 
            0, 1, 0,
            0, 0, 1
        ]);
    }

    /**
     * 
     * @param {Matrix4} matrix 
     * @param {number} offset 
     * @returns {Matrix3}
     */
    static from_4x4(matrix, offset) {
        if (offset > 5 || offset < 0) {
            throw new Error(`invalid offset: ${offset}`);
        }

        const o = offset;
        const m = matrix.data;

        return new Matrix3([
            m[o],       m[o + 1],   m[o + 2],
            m[o + 4],   m[o + 5],   m[o + 6],
            m[o + 8],   m[o + 9],   m[o + 10]
        ]);
    }

    /**
     * 
     * @param {Vector3[]} v 
     */
    static from_vec3_rows(v){
        return new Matrix3([
            v[0].x, v[0].y, v[0].z,
            v[1].x, v[1].y, v[1].z,
            v[2].x, v[2].y, v[2].z,
        ]);
    }

    /**
     * 
     * @param {Vector3[]} v 
     */
    static from_vec3_cols(v){
        return new Matrix3([
            v[0].x, v[1].x, v[2].x,
            v[0].y, v[1].y, v[2].y,
            v[0].z, v[1].z, v[2].z
        ]);
    }

    constructor(values) {
        this.data = new Float32Array(9);
        this.data.set(values, 0);
    }

    /**
     * 
     * @returns {Vector3[]}
     */
    get_rows() {
        return [
            new Vector3(this.data[0], this.data[1], this.data[2]),
            new Vector3(this.data[3], this.data[4], this.data[5]),
            new Vector3(this.data[6], this.data[7], this.data[8])
        ]
    }


    /**
     * 
     * @returns {Vector3[]}
     */
    get_cols() {
        return [
            new Vector3(this.data[0], this.data[3], this.data[6]),
            new Vector3(this.data[1], this.data[4], this.data[7]),
            new Vector3(this.data[2], this.data[5], this.data[8])
        ]
    }
}

class Matrix4 {

    static zero() {
        return new Matrix4([
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0
        ]);
    }

    static identity() {
        return new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    static ortho(left, right, bottom, top, near, far) {
        const coeffs = {
            x: get_linear_equation({min: left, max: right}, {min: -1, max: 1}),
            y: get_linear_equation({min: bottom, max: top}, {min: -1, max: 1}),
            z: get_linear_equation({min: near, max: far}, {min: 0, max: 1})
        }

        return new Matrix4([
            coeffs.x.scale,     0,                  0,                  0,
            0,                  coeffs.y.scale,     0,                  0,
            0,                  0,                  coeffs.z.scale,     0,
            coeffs.x.offset,    coeffs.y.offset,    coeffs.z.offset,    1
        ]);
    }

    static perspective(fieldOfViewInRadians, aspect, near, far) {
        var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
        var rangeInv = 1.0 / (near - far);
    
        return new Matrix4([
          f / aspect,   0,  0,                          0,
          0,            f,  0,                          0,
          0,            0,  (near + far) * rangeInv,   -1,
          0,            0,  near * far * rangeInv * 2,  0
        ]);
    }

    static perspective_z01(fieldOfViewYInRadians, aspect, zNear, zFar) {
     
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
        const rangeInv = 1 / (zNear - zFar);
     
        return new Matrix4([
            f / aspect, 0, 0,                        0,
            0,          f, 0,                        0,
            0,          0, zFar * rangeInv,         -1,
            0,          0, zNear * zFar * rangeInv,  0
        ]);
      }

    /**
     * @param {Vector3} eye 
     * @param {Vector3} target 
     * @param {Vector3} up 
     */
    static look_at(eye, target, up) {

/*
        const dst = new Float32Array(16);
 
        const zAxis = Vector3.from(eye).sub(target).normalize();
        const xAxis = Vector3.cross(up, zAxis).normalize();
        const yAxis = Vector3.cross(zAxis, xAxis).normalize();

        dst[ 0] = xAxis.x;  dst[ 1] = xAxis.y;  dst[ 2] = xAxis.z;  dst[ 3] = 0;
        dst[ 4] = yAxis.x;  dst[ 5] = yAxis.y;  dst[ 6] = yAxis.z;  dst[ 7] = 0;
        dst[ 8] = zAxis.x;  dst[ 9] = zAxis.y;  dst[10] = zAxis.z;  dst[11] = 0;
        dst[12] = eye.x;    dst[13] = eye.y;    dst[14] = eye.z;    dst[15] = 1;

        return new Matrix4(dst);*/



        const z_axis = Vector3.from(eye).sub(target).normalize();
        const x_axis = Vector3.cross(up, z_axis).normalize();
        const y_axis = Vector3.cross(z_axis, x_axis);

        const position = new Vector3(
            -Vector3.from(x_axis).dot(eye),
            -Vector3.from(y_axis).dot(eye),
            -Vector3.from(z_axis).dot(eye)
        );

        return new Matrix4([
            x_axis.x,       y_axis.x,       z_axis.x,       0,
            x_axis.y,       y_axis.y,       z_axis.y,       0,
            x_axis.z,       y_axis.z,       z_axis.z,       0,
            position.x,     position.y,     position.z,     1
        ]);
    }

    /**
     * 
     * @param {Matrix3} matrix 
     * @param {number} offset
     * @returns {Matrix4} 
     */
    static from_3x3(matrix, offset) {
        const result = Matrix4.identity();
        
        result.data[offset]      = matrix.data[0];
        result.data[offset + 1]  = matrix.data[1];
        result.data[offset + 2]  = matrix.data[2];

        result.data[offset + 4]  = matrix.data[3];
        result.data[offset + 5]  = matrix.data[4];
        result.data[offset + 6]  = matrix.data[5];

        result.data[offset + 8]  = matrix.data[6];
        result.data[offset + 9]  = matrix.data[7];
        result.data[offset + 10] = matrix.data[8];

        return result;
    }

    constructor(values) {
        this.data = new Float32Array(16);
        this.data.set(values, 0);
    }

    set_scale(x, y, z) {
        this.data[0] = x;
        this.data[5] = y;
        this.data[10] = z;
    }

    set_uniform_scale(scalar) {
        this.set_scale(scalar, scalar, scalar);
    }

    set_translation(x, y, z) {
        this.data[12] = x;
        this.data[13] = y;
        this.data[14] = z;
    }

    set_rotation(q) {
        this.data[12] = x;
        this.data[13] = y;
        this.data[14] = z;
    }

    /**
     * 
     * @param {Matrix4} other 
     */
    multiply(other) {
        const A = this.data;
        const B = other.data;
        const result = [
            A[0] * B[0] +   A[1] * B[4] +   A[2] * B[8] +   A[3] * B[12],
            A[0] * B[1] +   A[1] * B[5] +   A[2] * B[9] +   A[3] * B[13],
            A[0] * B[2] +   A[1] * B[6] +   A[2] * B[10] +  A[3] * B[14],
            A[0] * B[3] +   A[1] * B[7] +   A[2] * B[11] +  A[3] * B[15],

            A[4] * B[0] +   A[5] * B[4] +   A[6] * B[8] +   A[7] * B[12],
            A[4] * B[1] +   A[5] * B[5] +   A[6] * B[9] +   A[7] * B[13],
            A[4] * B[2] +   A[5] * B[6] +   A[6] * B[10] +  A[7] * B[14],
            A[4] * B[3] +   A[5] * B[7] +   A[6] * B[11] +  A[7] * B[15],

            A[8] * B[0] +   A[9] * B[4] +   A[10] * B[8] +  A[11] * B[12],
            A[8] * B[1] +   A[9] * B[5] +   A[10] * B[9] +  A[11] * B[13],
            A[8] * B[2] +   A[9] * B[6] +   A[10] * B[10] + A[11] * B[14],
            A[8] * B[3] +   A[9] * B[7] +   A[10] * B[11] + A[11] * B[15],
            
            A[12] * B[0] +  A[13] * B[4] +  A[14] * B[8] +  A[15] * B[12],
            A[12] * B[1] +  A[13] * B[5] +  A[14] * B[9] +  A[15] * B[13],
            A[12] * B[2] +  A[13] * B[6] +  A[14] * B[10] + A[15] * B[14],
            A[12] * B[3] +  A[13] * B[7] +  A[14] * B[11] + A[15] * B[15]
        ];

        this.data.set(result, 0);

        return this;
    }

    /**
     * https://stackoverflow.com/questions/27600045/the-correct-way-to-calculate-normal-matrix
     * @returns {Matrix4}
     */
    calc_normal_matrix() {

        const rows = Matrix3.from_4x4(this, 0).get_rows().map((v) => v.normalize());
        const transformed = [
            Vector3.cross(rows[1], rows[2]),
            Vector3.cross(rows[2], rows[0]),
            Vector3.cross(rows[0], rows[1])
        ];

        return Matrix4.from_3x3(Matrix3.from_vec3_rows(transformed), 0);
    }
}