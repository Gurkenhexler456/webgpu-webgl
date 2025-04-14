import { Vector3 } from "./vector.js";

/**
 * 
 * @param {{min: number, max: number}} src_range 
 * @param {{min: number, max: number}} target_range 
 */
export function get_linear_equation(src_range, target_range) {
    const m = (target_range.max - target_range.min) / (src_range.max - src_range.min);
    return {
        scale: m,
        offset: target_range.max - src_range.max * m
    }
}

export class Matrix3 {

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

export class Matrix4 {

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

    /**
     * 
     * @param {Float32Array} m 
     * @param {Float32Array} dst 
     * @returns {Matrix4} 
     */
    static inverse(m, dst) {
        dst = dst || new Float32Array(16);

        const m00 = m[0 * 4 + 0];
        const m01 = m[0 * 4 + 1];
        const m02 = m[0 * 4 + 2];
        const m03 = m[0 * 4 + 3];
        const m10 = m[1 * 4 + 0];
        const m11 = m[1 * 4 + 1];
        const m12 = m[1 * 4 + 2];
        const m13 = m[1 * 4 + 3];
        const m20 = m[2 * 4 + 0];
        const m21 = m[2 * 4 + 1];
        const m22 = m[2 * 4 + 2];
        const m23 = m[2 * 4 + 3];
        const m30 = m[3 * 4 + 0];
        const m31 = m[3 * 4 + 1];
        const m32 = m[3 * 4 + 2];
        const m33 = m[3 * 4 + 3];

        const tmp0 = m22 * m33;
        const tmp1 = m32 * m23;
        const tmp2 = m12 * m33;
        const tmp3 = m32 * m13;
        const tmp4 = m12 * m23;
        const tmp5 = m22 * m13;
        const tmp6 = m02 * m33;
        const tmp7 = m32 * m03;
        const tmp8 = m02 * m23;
        const tmp9 = m22 * m03;
        const tmp10 = m02 * m13;
        const tmp11 = m12 * m03;
        const tmp12 = m20 * m31;
        const tmp13 = m30 * m21;
        const tmp14 = m10 * m31;
        const tmp15 = m30 * m11;
        const tmp16 = m10 * m21;
        const tmp17 = m20 * m11;
        const tmp18 = m00 * m31;
        const tmp19 = m30 * m01;
        const tmp20 = m00 * m21;
        const tmp21 = m20 * m01;
        const tmp22 = m00 * m11;
        const tmp23 = m10 * m01;

        const t0 = (tmp0 * m11 + tmp3 * m21 + tmp4 * m31) -
                    (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
        const t1 = (tmp1 * m01 + tmp6 * m21 + tmp9 * m31) -
                    (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
        const t2 = (tmp2 * m01 + tmp7 * m11 + tmp10 * m31) -
                    (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
        const t3 = (tmp5 * m01 + tmp8 * m11 + tmp11 * m21) -
                    (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);

        const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

        dst[0] = d * t0;
        dst[1] = d * t1;
        dst[2] = d * t2;
        dst[3] = d * t3;

        dst[4] = d * ((tmp1 * m10 + tmp2 * m20 + tmp5 * m30) -
                        (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
        dst[5] = d * ((tmp0 * m00 + tmp7 * m20 + tmp8 * m30) -
                        (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
        dst[6] = d * ((tmp3 * m00 + tmp6 * m10 + tmp11 * m30) -
                        (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
        dst[7] = d * ((tmp4 * m00 + tmp9 * m10 + tmp10 * m20) -
                        (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));

        dst[8] = d * ((tmp12 * m13 + tmp15 * m23 + tmp16 * m33) -
                        (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
        dst[9] = d * ((tmp13 * m03 + tmp18 * m23 + tmp21 * m33) -
                        (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
        dst[10] = d * ((tmp14 * m03 + tmp19 * m13 + tmp22 * m33) -
                        (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
        dst[11] = d * ((tmp17 * m03 + tmp20 * m13 + tmp23 * m23) -
                        (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));

        dst[12] = d * ((tmp14 * m22 + tmp17 * m32 + tmp13 * m12) -
                        (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
        dst[13] = d * ((tmp20 * m32 + tmp12 * m02 + tmp19 * m22) -
                        (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
        dst[14] = d * ((tmp18 * m12 + tmp23 * m32 + tmp15 * m02) -
                        (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
        dst[15] = d * ((tmp22 * m22 + tmp16 * m02 + tmp21 * m12) -
                        (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
        return new Matrix4(dst);
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