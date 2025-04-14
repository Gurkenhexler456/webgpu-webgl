import { CelestialBody } from "./solar_sytem.js";

export class Planet extends CelestialBody {

    /**
     * 
     * @param {string} name 
     * @param {number} radius 
     */
    constructor(name, radius, position, spin_speed) {
        super(name, radius, position, spin_speed);
    }
}