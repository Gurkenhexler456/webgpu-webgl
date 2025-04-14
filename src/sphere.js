import { from_spherical } from "../lib/math/util.js";
import { Vector2, Vector3 } from "../lib/math/vector.js";

/**
 * 
 * @param {Float32Array} vertex_data 
 * @param {Uint32Array} indices 
 */
export function IndexedModel(vertex_data, indices) {
    this.vertex_data = vertex_data;
    this.index_data = indices;
}


export function create_sphere(col_count, row_count, radius) {

    const step = new Vector2(1. / col_count, 1. / row_count);
    const step_angle = new Vector2(step.x * 2 * Math.PI, step.y * Math.PI);

    const vertex_data = [];
    const indices = [];

    let rect = 0;

    for(let row = 0; row < row_count; row++) {
        for(let col = 0; col < col_count; col++) {

            const quad = [ 
                // bottom right triangle
                new Vector2(col     , row + 1   ),
                new Vector2(col + 1 , row + 1   ),
                new Vector2(col + 1 , row       ),
                new Vector2(col     , row       )
            ];

            const quad_data = quad.map((vec) => {
                const yaw = vec.x * step_angle.x;
                const pitch = vec.y * step_angle.y;

                const normal = new Vector3(...from_spherical(yaw, pitch));

                const uv = new Vector2(
                    vec.x * step.x,
                    vec.y * step.y
                );

                const position = Vector3.from(normal).scale(radius);

                return [
                    position.x, position.y, position.z,
                    uv.x, uv.y,
                    normal.x, normal.y, normal.z
                ];
            }).flat();

            vertex_data.push(...quad_data);
            indices.push(...[
                rect,
                rect + 1,
                rect + 2,

                rect + 2,
                rect + 3,
                rect
            ]);

            rect += 4;
        }
    }

    return new IndexedModel(vertex_data, indices);
}


/**
 * 
 * @param {Extents2D} size 
 * @returns {IndexedModel}
 */
export function create_rect(size) {

    const center = new Vector2(size.width, size.height).scale(0.5);

    return new IndexedModel(
        new Float32Array([
            -center.x,  -center.y,  0.0,        0.0,    0.0,        0.0,    0.0,    1.0,
             center.x,  -center.y,  0.0,        1.0,    0.0,        0.0,    0.0,    1.0,
             center.x,   center.y,  0.0,        1.0,    1.0,        0.0,    0.0,    1.0,
            -center.x,   center.y,  0.0,        0.0,    1.0,        0.0,    0.0,    1.0
        ]),
        new Uint32Array([
            0, 1, 2,
            2, 3, 0
        ])
    );

}