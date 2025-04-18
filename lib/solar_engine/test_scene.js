import { Camera } from "../graphics/util/camera.js"
import { Matrix4 } from "../math/matrix.js";
import { Extents2D, to_radians } from "../math/util.js";
import { Vector3 } from "../math/vector.js";

import { AttributeDescription, AttributeType, BufferLayout } from "../graphics/buffer.js";
import { RenderSystem } from "../graphics/render_system.js";
import { create_checker_texture } from "../graphics/texture.js";

const quad_data = new Float32Array([
    -0.5, -0.5,  0.0,       0.0, 0.0,        0.0,  0.0, -1.0,
     0.5, -0.5,  0.0,       1.0, 0.0,        0.0,  0.0, -1.0,
     0.5,  0.5,  0.0,       1.0, 1.0,        0.0,  0.0, -1.0,
    -0.5,  0.5,  0.0,       0.0, 1.0,        0.0,  0.0, -1.0,
]);

const quad_indices = new Uint32Array([
    0, 1, 2,
    2, 3, 0
]);

const model_matrix = Matrix4.identity();
model_matrix.set_translation(0, 0, 0.5);

const texture_size = new Extents2D(100, 100);
const texture_data = create_checker_texture(texture_size);


const test_quad = {
    model: null,
    transform: null,
    texture: null
}

const test_camera = new Camera(new Vector3(0, 0, -1), new Vector3(0, 0, 1));

const test_camera_no_obj = {
    perspective:    Matrix4.perspective(to_radians(40), 100 / 100, 0.1, 100.),
    view:           Matrix4.look_at(new Vector3(0, 0, 2), new Vector3(0, 0, 0), new Vector3(0, 1, 0)) 
}

export function get_test_scene() {

    const vertex_buffer = RenderSystem.create_vertex_buffer(quad_data.byteLength);
    vertex_buffer.write_data(quad_data);
    const vertex_layout = new BufferLayout(
        (3 + 2 + 3) * 4,
        [
            new AttributeDescription(0, AttributeType.VEC3, 0),
            new AttributeDescription(1, AttributeType.VEC3, 12),
            new AttributeDescription(2, AttributeType.VEC3, 20)
        ]
    );
    const index_buffer = RenderSystem.create_index_buffer(quad_indices.byteLength);
    index_buffer.write_data(quad_indices);

    const model = RenderSystem.create_model(
        [vertex_buffer], [vertex_layout], 
        index_buffer, 
        quad_indices.length
    );


    const texture = RenderSystem.create_texture_2D(texture_size, texture_data);


    test_quad.model     = model;
    test_quad.transform = Matrix4.identity();
    test_quad.texture   = texture.texture;

    return {
        objs: [test_quad],
        camera: test_camera_no_obj,
    }
}