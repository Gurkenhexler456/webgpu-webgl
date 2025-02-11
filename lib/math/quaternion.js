/**
 * https://danceswithcode.net/engineeringnotes/quaternions/quaternions.html
 */
class Quaternion {

    /**
     * 
     * @param {number} q0 
     * @param {number} q1 
     * @param {number} q2 
     * @param {number} q3 
     */
    constructor(q0, q1, q2, q3) {
        this.q = [q0, q1, q2, q3];
    }

    /**
     * 
     * @param {number} angle 
     * @param {Vector3} axis 
     * @returns {Quaternion}
     */
    static from_axis_angle(angle, axis) {

        const theta_half = angle * 0.5;
        const cos = Math.cos(theta_half);
        const sin = Math.sin(theta_half);

        return new Quaternion(
            cos,
            axis.x * sin,
            axis.y * sin,
            axis.z * sin,
        );
    }


    static multiply(r, s) {
        return new Quaternion(
            r.q[0] * s.q[0] - r.q[1] * s.q[1] - r.q[2] * s.q[2] - r.q[3] * s.q[3],
            r.q[0] * s.q[1] + r.q[1] * s.q[0] - r.q[2] * s.q[3] + r.q[3] * s.q[2],
            r.q[0] * s.q[2] + r.q[1] * s.q[3] + r.q[2] * s.q[0] - r.q[3] * s.q[1],
            r.q[0] * s.q[3] - r.q[1] * s.q[2] + r.q[2] * s.q[1] + r.q[3] * s.q[0]
        );
    }


    /**
     * 
     * @returns {Matrix3}
     */
    to_rotation_matrix() {
        const q_sqr = this.q.map((q) => { return q * q; });
        return new Matrix3([
            1 - 2 * q_sqr[2] - 2 * q_sqr[3],    
            2 * this.q[1] * this.q[2] - 2 * this.q[0] * this.q[3],      
            2 * this.q[1] * this.q[3] + 2 * this.q[0] * this.q[2],

            2 * this.q[1] * this.q[2] + 2 * this.q[0] * this.q[3],
            1 - 2 * q_sqr[1] - 2 * q_sqr[3],          
            2 * this.q[2] * this.q[3] - 2 * this.q[0] * this.q[1],
    
            2 * this.q[1] * this.q[3] - 2 * this.q[0] * this.q[2],      
            2 * this.q[2] * this.q[3] + 2 * this.q[0] * this.q[1],
            1 - 2 * q_sqr[1] - 2 * q_sqr[2]
        ])
    }
}