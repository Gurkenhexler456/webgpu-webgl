import { RenderSystem } from "../lib/graphics/render_system.js";
import { create_checker_texture, load_texture } from "../lib/graphics/texture.js";
import { Matrix4 } from "../lib/math/matrix.js";
import { Extents2D, to_radians } from "../lib/math/util.js";
import { Vector3 } from "../lib/math/vector.js";
import { Diagnostics } from "../lib/util/diagnostics.js";

import { PlanetViewer } from "./input/mouse_handler.js";
import { Planet } from "./solar_system/planet.js";
import { get_test_scene } from "../lib/solar_engine/test_scene.js";
import { EngineHelper } from "../lib/solar_engine/engine_helper.js";
import { EngineBackend } from "../lib/solar_engine/engine.js";



const perspective_props = {
    fov: to_radians(75),
    ratio: 1,
    z_near: 0.01,
    z_far: 10000.0
};

const RENDER_RESOLUTION = new Extents2D(1000, 1000);

/**
 * @type {Planet[]}
 */
let planets = [];

/** 
 * @type {number}
 */
let selected_planet;

/**
 * @type {PlanetViewer}
 */
let planet_viewer;


/**
 * @type {SolarEngine}
 */
let engine;


let WEBGPU_SUPPORTED = false;



/**
 * @type {Texture2D}
 */
let texture;



/**
 * @type {Planet}
 */
let sun;



let scene;


let last_frame = 0;
let this_frame = 0;

let time = 0;

let frame_count = 0;

function loop() {

    // timing
    this_frame = Date.now();
    const delta = this_frame - last_frame;
    const delta_s = delta / 1000;
    last_frame = this_frame;

    time += delta_s;

    // update frame time
    Diagnostics.log(`Frame ${frame_count}: ${delta}ms`);
    document.getElementById('frame_time').innerText = `last frame took: ${delta}ms`;

    planets.forEach((current_planet) => {
        current_planet.update(24 * delta_s);
    });

    sun.update(24 * delta_s);

    
    scene.objs[0].transform = Matrix4.identity();
    scene.objs[0].transform.set_translation(0, 0, -3 + Math.sin(time));


        
    let tex = texture.texture;

    const objs = planets.map((planet) => {

        /**
         * @type {Model_WebGL}
         */
        const model = planet.model;

        tex = texture;
        if(planet.texture) {
            tex = planet.texture;
        }

        return {
            model,
            transform: planet.transform,
            texture: tex
        }
    });

    if(sun.texture) {
        tex = sun.texture;
    }
    const sun_scene_obj = {
        model: sun.model,
        transform: sun.transform,
        texture: tex
    }

    engine.render({
        objects: objs,
        light_sources: [sun_scene_obj]
    }, planet_viewer.camera.camera);


    frame_count++;

    requestAnimationFrame(loop);
   
}

async function start_app() {

    const url = new URL(window.location.href);
    let current_backend = url.searchParams.get('request_backend') || 'webgl2';
    let use_compute = false;



    // preparing test texture
    let texture_size = new Extents2D(1000, 500);

    /**
     * @type {{size: Extents2D, data: Uint8Array}}
     */
    let texture_info = {
        size: texture_size,
        data: create_checker_texture(texture_size)
    };
    

    planet_viewer = new PlanetViewer('planet_canvas');

    
    engine = EngineHelper.create(document.getElementById('planet_canvas'), RENDER_RESOLUTION, current_backend);


    if(engine.backend === EngineBackend.BACKEND_WEBGPU && url.searchParams.get('use_compute')) {
        use_compute = (url.searchParams.get('use_compute') === 'true');
    }

    

    Diagnostics.init();

    document.getElementById('initiate_log_download').addEventListener('click', (event) => {
        const link = document.createElement("a");

        const file = new Blob([Diagnostics.get_log_as_string()], { type: 'text/plain' });

        link.href = URL.createObjectURL(file);

        link.download = "log.txt";

        link.click();
        URL.revokeObjectURL(link.href);

    })


    document.getElementById('intiate_backend_change').addEventListener('click', (event) => {
        const backend_request = current_backend !== EngineBackend.BACKEND_WEBGPU ? 
                                    EngineBackend.BACKEND_WEBGPU : EngineBackend.BACKEND_WEBGL_2
        url.searchParams.set('request_backend', backend_request);

        if(backend_request === EngineBackend.BACKEND_WEBGL_2 && url.searchParams.get('use_compute')) {
            url.searchParams.delete('use_compute');
        }

        window.location.href = url.href;
    })

    
    if(engine.backend === EngineBackend.BACKEND_WEBGL_2) {
        document.getElementById('toggle_compute_shader').hidden = true;
    }
    else {
        document.getElementById('toggle_compute_shader').addEventListener('click', (event) => {
            url.searchParams.set('use_compute', !use_compute);
            window.location.href = url.href;
        })
    }

    engine.set_props({ use_compute });
    await engine.init();
    console.log(engine);

    if(engine.backend === EngineBackend.BACKEND_WEBGPU) {
        planet_viewer.camera.camera.perspective = Matrix4.perspective_z01(
            perspective_props.fov,
            perspective_props.ratio,
            perspective_props.z_near,
            perspective_props.z_far
        );
    }
    else {
        planet_viewer.camera.camera.perspective = Matrix4.perspective(
            perspective_props.fov,
            perspective_props.ratio,
            perspective_props.z_near,
            perspective_props.z_far
        );
    }

    scene = get_test_scene();
    
    document.getElementById('backend').innerHTML = `Backend: ${engine.backend}`;

    Diagnostics.log(`using backend: ${engine.backend}`);
    Diagnostics.log(`renderer info: ${RenderSystem.get_renderer_info()}`);

    texture = RenderSystem.create_texture_2D(texture_info.size, texture_info.data);

    planets = [
        new Planet('mercury',   3.50359450E-03, new Vector3(0, 0, 8.65780635E+01)),
        new Planet('venus',     8.69041362E-03, new Vector3(0, 0, 1.54895245E+02)),
        new Planet('earth',     9.15929242E-03, new Vector3(0, 0, 2.14833904E+02)),
        new Planet('mars',      4.86757944E-03, new Vector3(0, 0, 3.27406870E+02)),
        new Planet('jupiter',   1.00397506E-01, new Vector3(0, 0, 1.11713630E+03)),
        new Planet('saturn',    8.36255748E-02, new Vector3(0, 0, 2.05810880E+03)),
        new Planet('uranus',    3.64217583E-02, new Vector3(0, 0, 4.12266263E+03)),
        new Planet('neptune',   3.53590621E-02, new Vector3(0, 0, 6.48390207E+03)),
        new Planet('pluto',     1.70648905E-03, new Vector3(0, 0, 8.48207222E+03)),

        new Planet('moon',      2.49503836E-03, new Vector3(0.5520276, 0, 2.14833904E+02))
    ]

    sun = new Planet('sun', 1,  new Vector3(0, 0, 0))

    planets.forEach((planet) => {
        planet.radius *= 10;
    });

    sun.radius *= 10;

    console.log(planets);

    select_planet(2);

    requestAnimationFrame(loop);
}

window.onload = start_app();


function select_planet(planet_index) {

    if(selected_planet === planet_index) {
        return;
    }
    
    const old_planet = selected_planet;
    selected_planet = planet_index;

    planet_viewer.camera.target = planets[selected_planet].position;

    if(old_planet >= 0 && old_planet < planets.length) {
        const current_distance = planet_viewer.camera.distance;
        const current_radius = planets[old_planet].radius;

        const new_radius = planets[selected_planet].radius;
        const ratio = new_radius / current_radius;

        planet_viewer.camera.distance = current_distance * ratio;
    }
}

/**
 * @type {HTMLSelectElement}
 */
const planet_selection = document.getElementById('planet_list');
planet_selection.addEventListener('change', (e) => {
    const option = e.target.options[e.target.selectedIndex].value;
    let found = false;

    planets.forEach((planet, i) => {
        if(planet.name == option) {
            found = true;
            select_planet(i);
        }
    });
});