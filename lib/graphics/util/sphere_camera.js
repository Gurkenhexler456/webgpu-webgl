import { clamp, from_spherical } from "../../math/util.js";
import { Vector3 } from "../../math/vector.js";
import { Camera } from "./camera.js";

export class SphereCamera {

    static #MIN_PITCH = 0.01;
    static #MAX_PITCH = Math.PI - SphereCamera.#MIN_PITCH;

    #yaw = 0;
    #pitch = Math.PI / 2;
    #distance = 1;
    #target = Vector3.zero();

    /**
     * 
     * @param {Vector3} target 
     * @param {number} distance 
     */
    constructor(target, distance) {

        this.#target = target || Vector3.zero();
        this.#distance = distance || 1;

        const position = this.#calculate_position_on_sphere().add(this.#target);
        const direction = Vector3.from(this.#target).sub(position).normalize();


        this.camera = new Camera(position, direction);
    }

    /**
     * 
     * @returns {Vector3}
     */
    #calculate_position_on_sphere() {
        return new Vector3(...from_spherical(this.#yaw, this.#pitch)).scale(this.#distance);
    }

    update_camera() {

        const position = this.#calculate_position_on_sphere().add(this.#target);
        this.camera.position = position;
        this.camera.direction = Vector3.from(this.#target).sub(position).normalize();
        this.camera.update_view_matrix();
    }

    /**
     * @param {number} new_yaw
     */
    set yaw(new_yaw) { 
        this.#yaw = new_yaw; 
        this.update_camera();
    }

    get yaw() { return this.#yaw; }

    /**
     * @param {number} new_pitch
     */
    set pitch(new_pitch) {
        new_pitch = clamp(new_pitch, SphereCamera.#MIN_PITCH, SphereCamera.#MAX_PITCH);
        this.#pitch = new_pitch;
        this.update_camera();
    }

    get pitch() { return this.#pitch; }

    /**
     * @param {number} new_distance
     */
    set distance(new_distance) { 
        this.#distance = new_distance; 
        this.update_camera();
    }

    get distance() { return this.#distance; }

    /**
     * @param {Vector3} new_target
     */
    set target(new_target) { 
        this.#target = new_target; 
        this.update_camera();
    }
}