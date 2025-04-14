import { SphereCamera } from "../../lib/graphics/util/sphere_camera.js";
import { Vector2, Vector3 } from "../../lib/math/vector.js";

export class PlanetViewer {

    #mouse_down = false;

    constructor(canvas_id) {

        /**
         * @type {HTMLCanvasElement}
         */
        this.canvas = document.getElementById(canvas_id);

        /**
         * @type {SphereCamera}
         */
        this.camera = new SphereCamera(new Vector3(0, 0, -214.833904), .25);

        this.last_position = new Vector2(0, 0);
        this.#setup_listeners(this.canvas);
    }


    zoom(delta_zoom) {

        this.camera.distance += delta_zoom;
    
        console.log(`camera: distance: ${this.camera.distance}`);
    }

    /**
     * 
     * @param {Vector2} delta_rotation 
     */
    rotate(delta_rotation) {

        this.camera.yaw += delta_rotation.x;
        this.camera.pitch -= delta_rotation.y;

        //console.log(`camera: yaw: ${this.camera.yaw}, pitch: ${this.camera.pitch}`);
    }

    

    #setup_listeners(canvas) {

        this.canvas.addEventListener('wheel', (event) => { this.zoom(event.deltaY * 0.0001); });
    
        this.canvas.addEventListener('pointerdown', (event) => {
            console.log(`clicking`);
            this.last_position.set(event.clientX, event.clientY);
            this.#mouse_down = true;
        });
    
        this.canvas.addEventListener('pointermove', (event) => {
            if(this.#mouse_down) {
                const current_position = new Vector2(event.clientX, event.clientY);
                const diff = Vector2.from(current_position).sub(this.last_position);
                this.last_position.set(current_position.x, current_position.y);

                diff.scale(0.01);
                this.rotate(diff);
            }
        });
    
        this.canvas.addEventListener('pointerup', (event) => {
            console.log(`releasing`);
            this.#mouse_down = false;
        });
    }
}