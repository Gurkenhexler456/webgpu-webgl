class Camera {

    /**
     * 
     * @param {Vector3} position 
     * @param {Vector3} direction 
     */
    constructor(position, direction) {

        this.perspective = Matrix4.identity();
        this.view = Matrix4.identity();

        this.position = position;
        this.direction = direction || new Vector3(0, 0, 1);
        try {
            this.direction.normalize();
        } catch(error) {
            this.direction = new Vector3(0, 0, 1);
            console.log(`invalid direction vector: defaulting to ${this.direction}.`);
        }

        this.update_view_matrix();
    }

    update_view_matrix() {
        this.view = Matrix4.look_at(this.position, Vector3.from(this.position).add(this.direction), new Vector3(0, 1, 0));
    }
}