export class Vector2 {

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * 
     * @returns {Vector2} a new 2-dimensional vector with all components set to zero
     */
    static zero() {
        return new Vector2(0, 0);
    }

    /**
     * 
     * @param {Vector2} v 
     * @returns {Vector2} a new 2-dimensional vector with the components set to the values provided by v
     */
    static from(v) {
        return new Vector2(v.x, v.y);
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @returns {Vector2}
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * 
     * @param {Vector2} other 
     * @returns {Vector2} 
     */
    add(other) {
        this.x += other.x;
        this.y += other.y;

        return this;
    }

    /**
     * 
     * @param {Vector2} other 
     * @returns {Vector2}
     */
    sub(other) {
        this.x -= other.x;
        this.y -= other.y;

        return this;
    }

    /**
     * 
     * @param {number} scalar 
     * @returns {Vector2}
     */
    scale(scalar) {
        this.x *= scalar;
        this.y *= scalar;

        return this;
    }

    /**
     * 
     * @param {Vector2} other 
     * @returns {number}
     */
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    /**
     * 
     * @returns {number}
     */
    magnitude() {
        return Math.sqrt(this.dot(this));
    }

    /**
     * 
     * @returns {Vector2}
     */
    normalize() {
        const length = this.magnitude();
        if(length !== 0) {
            this.scale(1. / length);
        }
        return this;
    }

    toString() { return `(${this.x}, ${this.y})`; }
}

export class Vector3 {

    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     */
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * 
     * @returns {Vector3}
     */
    static zero() {
        return new Vector3(0, 0, 0);
    }

    /**
     * 
     * @param {Vector3} v 
     * @returns {Vector3}
     */
    static from(v) {
        return new Vector3(v.x, v.y, v.z);
    }


    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {Vector3}
     */
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }


    /**
     * 
     * @param {Vector3} other 
     * @returns {Vector3}
     */
    add(other) {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;

        return this;
    }

    /**
     * 
     * @param {Vector3} other 
     * @returns {Vector3}
     */
    sub(other) {
        this.x -= other.x;
        this.y -= other.y;
        this.z -= other.z;

        return this;
    }

    /**
     * 
     * @param {number} scalar 
     * @returns {Vector3}
     */
    scale(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;

        return this;
    }

    /**
     * 
     * @param {Vector3} other 
     * @returns {number}
     */
    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    /**
     * 
     * @param {Vector3} a
     * @param {Vector3} b
     * @returns {Vector3} 
     */
    static cross(a, b) {
        let result = Vector3.zero();
        
        result.x = a.y * b.z - a.z * b.y;
        result.y = a.z * b.x - a.x * b.z;
        result.z = a.x * b.y - a.y * b.x;

        return result;
    }

    /**
     * 
     * @returns {number}
     */
    magnitude() {
        return Math.sqrt(this.dot(this));
    }

    /**
     * 
     * @returns {Vector3}
     */
    normalize() {
        const length = this.magnitude();
        if(length !== 0) {
            this.scale(1. / length);
        } else {
            throw new ArithmeticError('division by zero');
        }
        return this;
    }

    toString() { return `(${this.x}, ${this.y}, ${this.z})`; }
}