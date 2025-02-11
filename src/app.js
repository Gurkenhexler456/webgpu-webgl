const perspective_props = {
    fov: to_radians(75),
    ratio: 720.0 / 450.0,
    z_near: 0.01,
    z_far: 10000.0
};


const uniform_buffer_data = new Float32Array([
    ...Matrix4.identity().data,

    ...Matrix4.look_at(new Vector3(0, 0, 214.875), Vector3.zero(), new Vector3(0, 1, 0)).data,

    ...Matrix4.identity().data,
    ...Matrix4.identity().data,
]);




/**
 * @type {Planet[]}
 */
let planets = [];

/**
 * @type {PlanetViewer}
 */
let planet_viewer;





/**
 * @type {RenderShader}  
 */
let shader;

/**
 * @type {Texture2D}
 */
let texture;

/**
 * @type {Buffer}
 */
let uniform_buffer;

/**
 * @type {RenderSystem}
 */
let render_system;

/**
 * @type {Texture2D}
 */
let depth_texture;


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


    const planet_shader = {
        program: shader,
        uniforms: uniform_buffer,
        textures: [
            {
                sampler: texture.sampler,
                texture: texture.texture
            }
        ]
    };

    const target = {
        target: RenderSystem.get_default_render_target(),
        clear_color: [0.0, 0.0, 0.0, 1.0],
        enable_depth_test: true
    };

    planet_viewer.camera.target = planets[2].position;

    uniform_buffer_data.set(planet_viewer.camera.camera.view.data, 16);

    
    RenderSystem.Renderer.clear(target);

    planets.forEach((current_planet) => {

        const tex = current_planet.texture || texture;

        uniform_buffer_data.set(current_planet.transform.data, 32);
        uniform_buffer_data.set(current_planet.transform.calc_normal_matrix().data, 48);

        // upload to gpu
        uniform_buffer.write_data(uniform_buffer_data);

        planet_shader.textures[0].texture = tex.texture;
        planet_shader.textures[0].sampler = tex.sampler;

        const render_step = {
            model: current_planet.model,
            shader: planet_shader
        };

        RenderSystem.Renderer.render_to_target(render_step, target);
    });

    frame_count++;

    requestAnimationFrame(loop);
}


async function start_app() {

    Diagnostics.init();

    document.getElementById('initiate_log_download').addEventListener('click', (event) => {
        const link = document.createElement("a");

        const file = new Blob([Diagnostics.get_log_as_string()], { type: 'text/plain' });

        link.href = URL.createObjectURL(file);

        link.download = "log.txt";

        link.click();
        URL.revokeObjectURL(link.href);

    })

    // preparing test texture
    texture_size = new Extents2D(1000, 500);

    /**
     * @type {{size: Extents2D, data: Uint8Array}}
     */
    let texture_info = {
        size: texture_size,
        data: create_checker_texture(texture_size)
    };
    


    WEBGPU_SUPPORTED = WebGPUUtil.is_webgpu_supported();
    console.log(`Is WebGPU supported: ${WEBGPU_SUPPORTED}`);    

    let planet_shader = {
        vertex_source: '',
        fragment_source: ''
    }

    if(WEBGPU_SUPPORTED) {

        await RenderSystem.init('planet_canvas', RenderSystem.BACKEND_WEBGPU);

        document.getElementById('backend').innerHTML = `Backend: WebGPU`;

        uniform_buffer_data.set(Matrix4.perspective_z01(
            perspective_props.fov,
            perspective_props.ratio,
            perspective_props.z_near,
            perspective_props.z_far
        ).data, 0);

        planet_shader.vertex_source = planet_vertex_wgsl;
        planet_shader.fragment_source = planet_fragment_wgsl;
    }
    else {

        await RenderSystem.init('planet_canvas');

        document.getElementById('backend').innerHTML = `Backend: WebGL 2`;

        uniform_buffer_data.set(Matrix4.perspective(
            perspective_props.fov,
            perspective_props.ratio,
            perspective_props.z_near,
            perspective_props.z_far
        ).data, 0);

        planet_shader.vertex_source = planet_vertex_glsl;
        planet_shader.fragment_source = planet_fragment_glsl;

        shader = new RenderShader_WebGL(
            planet_vertex_glsl,
            planet_fragment_glsl
        );
    }

    Diagnostics.log(`using backend: ${RenderSystem.get_current_backend()}`);

    texture = RenderSystem.create_texture_2D(texture_info.size, texture_info.data);


    planet_viewer = new PlanetViewer('planet_canvas');

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

        new Planet('moon',      2.49503836E-03, new Vector3(0.5520276, 0, 2.14833904E+02)),
        new Planet('sun',       1,              new Vector3(0, 0, 0))
    ]

    planets.forEach((planet) => {
        planet.radius *= 10;
        
    });

    console.log(planets);

    shader = RenderSystem.create_render_shader(
        planet_shader.vertex_source,
        planet_shader.fragment_source
    );


    uniform_buffer = RenderSystem.create_uniform_buffer(uniform_buffer_data.byteLength);
    uniform_buffer.write_data(uniform_buffer_data);

    requestAnimationFrame(loop);
}

window.onload = start_app();