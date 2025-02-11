class Universe {
    /**
     * used to scale seconds
     * @type {number}
     */
    #TIME_SCALE = 1440;

    #CURRENT_TIME = 0;
    
    #CURRENT_DELTA = 0;

    get CURRENT_TIME() {
        return this.#CURRENT_TIME;
    }

    update(delta_seconds) {

        this.#CURRENT_DELTA = delta_seconds * this.#TIME_SCALE;
        this.#CURRENT_TIME += this.#CURRENT_DELTA;
    }
}

class CelestialBody {

    static #BUFFER_LAYOUT = new BufferLayout(3 * 4 + 2 * 4 + 3 * 4, [
        new AttributeDescription(0, AttributeType.VEC3, 0),
        new AttributeDescription(1, AttributeType.VEC2, 12),
        new AttributeDescription(2, AttributeType.VEC3, 20),
    ]);

    /**
     * 
     * @param {string} name 
     * @param {number} radius 
     */
    constructor(name, radius, position, spin_speed) {
        this.name = name;
        
        this.radius = radius;
        this.position = position;
        this.spin_speed = spin_speed || 360. / (24 * 60 * 60);
        this.spin = 0;

        this.transform = Matrix4.identity();
        this.transform.set_uniform_scale(this.radius);
        this.transform.set_translation(this.position.x, this.position.y, this.position.z);

        this.model = this.#generate_sphere_model();
    }

    update(delta_seconds) {
        this.spin += this.spin_speed * delta_seconds;

        this.update_transform();
    }

    update_transform() {
        this.transform = Matrix4.identity();

        const translation = Matrix4.identity();
        translation.set_translation(this.position.x, this.position.y, this.position.z);

        const scale = Matrix4.identity();
        scale.set_uniform_scale(this.radius);
        
        const tilt = Quaternion.from_axis_angle(23.5 * (Math.PI / 180), new Vector3(0, 0, 1));
        const rotation_axis = new Vector3(0, 1, 0);
        let spin = Quaternion.from_axis_angle(this.spin, rotation_axis.normalize());
        const rotation = Matrix4.from_3x3(Quaternion.multiply(tilt, spin).to_rotation_matrix(), 0);

        this.transform = rotation.multiply(scale).multiply(translation);
    }

    #generate_sphere_model() {

        const model_data = create_sphere(50, 50, 1.);

        const verts = new Float32Array(model_data.vertex_data);
        const index = new Uint32Array(model_data.index_data);

        const vertex_buffer = RenderSystem.create_vertex_buffer(verts.byteLength);
        vertex_buffer.write_data(verts);

        const index_buffer = RenderSystem.create_index_buffer(index.byteLength);
        index_buffer.write_data(index);

        return RenderSystem.create_model([vertex_buffer], [CelestialBody.#BUFFER_LAYOUT], index_buffer, index.length);
    }
}