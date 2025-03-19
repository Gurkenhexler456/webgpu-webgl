const perspective_props = {
    fov: to_radians(75),
    ratio: 1,
    z_near: 0.01,
    z_far: 10000.0
};


const uniform_buffer_data = new Float32Array([
    ...Matrix4.identity().data,

    ...Matrix4.look_at(new Vector3(0, 0, 214.875), Vector3.zero(), new Vector3(0, 1, 0)).data,

    ...Matrix4.identity().data,
    ...Matrix4.identity().data,
]);

const atmosphere_buffer_data = new Float32Array([
    ...Matrix4.identity().data,
    ...Matrix4.identity().data,
    ...Matrix4.identity().data
]);

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
 * @type {Planet}
 */
let sun;

/**
 * @type {RenderShader}
 */
let sun_shader;


/**
 * @type {Buffer}
 */
let atmosphere_buffer;

/**
 * @type {RenderSystem}
 */
let render_system;

/**
 * @type {RenderTarget}
 */
let g_buffer;

/**
 * @type {RenderShader}
 */
let quad_shader;

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


    const light_shader = {
        program: sun_shader,
        uniforms: uniform_buffer,
        textures: [
            {
                sampler: texture.sampler,
                texture: texture.texture
            }
        ]
    };

    let offscreen_target = {
        target: g_buffer,
        clear_color: [0.0, 0.0, 0.0, 1.0],
        enable_depth_test: true
    };

    let default_target = {
        target: RenderSystem.get_default_render_target(),
        clear_color: [1.0, 0.0, 0.0, 1.0],
        enable_depth_test: false
    };

    uniform_buffer_data.set(planet_viewer.camera.camera.view.data, 16);

    
    RenderSystem.Renderer.switch_render_target({
        ...offscreen_target,
        output_buffers: ['albedo', 'position', 'normal', 'light']
    });
    RenderSystem.Renderer.clear(offscreen_target.clear_color, offscreen_target.enable_depth_test);



    RenderSystem.Renderer.switch_render_target({
        ...offscreen_target,
        output_buffers: ['albedo', 'position', 'normal']
    });

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

        RenderSystem.Renderer.render_to_target(render_step, offscreen_target);
    });


    RenderSystem.Renderer.switch_render_target({
        ...offscreen_target,
        output_buffers: ['albedo', 'position', 'normal', 'light']
    });


    uniform_buffer_data.set(sun.transform.data, 32);
    uniform_buffer_data.set(sun.transform.calc_normal_matrix().data, 48);

    // upload to gpu
    uniform_buffer.write_data(uniform_buffer_data);

    const t = sun.texture || texture;

    light_shader.textures[0].texture = t.texture;
    light_shader.textures[0].sampler = t.sampler;

    RenderSystem.Renderer.render_to_target({
        model: sun.model,
        shader: light_shader
    }, offscreen_target);



    atmosphere_buffer_data.set(Matrix4.inverse(planet_viewer.camera.camera.perspective.data).data, 0);
    atmosphere_buffer_data.set(Matrix4.inverse(planet_viewer.camera.camera.view.data).data, 16);
    atmosphere_buffer_data.set(Matrix4.inverse(new Matrix4(planet_viewer.camera.camera.view.data).multiply(planet_viewer.camera.camera.perspective).data).data, 32);
    atmosphere_buffer.write_data(atmosphere_buffer_data);

    RenderSystem.Renderer.switch_render_target(default_target);
    RenderSystem.Renderer.clear(default_target.clear_color, default_target.enable_depth_test);
    RenderSystem.Renderer.render_vertices({
        shader: quad_shader, 
        textures: [
            {unit: 0, texture: g_buffer.attachments.get('albedo').texture, uniform_name: 'u_Albedo' },
            {unit: 1, texture: g_buffer.attachments.get('position').texture, uniform_name: 'u_Position' },
            {unit: 2, texture: g_buffer.attachments.get('normal').texture, uniform_name: 'u_Normal' },
            {unit: 3, texture: g_buffer.attachments.get('light').texture, uniform_name: 'u_Light' },
            {unit: 4, texture: g_buffer.attachments.get('depth').texture, uniform_name: 'u_Depth' }
        ],
        uniforms: [
            { buffer: atmosphere_buffer, binding: 0, uniform_name: 'Matrices'}
        ]
    }, 6);

    frame_count++;

    requestAnimationFrame(loop);
}


async function start_app() {

    const url = new URL(window.location.href);
    let current_backend = url.searchParams.get('request_backend') || 'webgl2';

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
        url.searchParams.set('request_backend', current_backend !== 'webgpu' ? 'webgpu' : 'webgl2');
        window.location.href = url.href;
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
    

    planet_viewer = new PlanetViewer('planet_canvas');

    let planet_shader = {
        vertex_source: '',
        fragment_source: ''
    }

    let sun_shader_sources = {
        vertex_source: '',
        fragment_source: ''
    }

    let quad_shader_sources = {
        vertex_source: '',
        fragment_source: ''
    }

    let WEBGPU_SUPPORTED = false;

    if(current_backend === 'webgpu') {
        WEBGPU_SUPPORTED = WebGPUUtil.is_webgpu_supported();
        console.log(`Is WebGPU supported: ${WEBGPU_SUPPORTED}`); 
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

        quad_shader_sources.vertex_source = quad_vertex_wgsl;
        quad_shader_sources.fragment_source = quad_fragment_wgsl;

        sun_shader_sources.vertex_source = sun_vertex_wgsl;
        sun_shader_sources.fragment_source = sun_fragment_wgsl;
    }
    else {

        await RenderSystem.init('planet_canvas');

        document.getElementById('backend').innerHTML = `Backend: WebGL 2`;


        planet_viewer.camera.camera.perspective = Matrix4.perspective(
            perspective_props.fov,
            perspective_props.ratio,
            perspective_props.z_near,
            perspective_props.z_far
        );

        planet_shader.vertex_source = planet_vertex_glsl;
        planet_shader.fragment_source = planet_fragment_glsl;

        quad_shader_sources.vertex_source = quad_vertex_glsl;
        quad_shader_sources.fragment_source = quad_fragment_glsl;

        sun_shader_sources.vertex_source = sun_vertex_glsl;
        sun_shader_sources.fragment_source = sun_fragment_glsl;
    }


    Diagnostics.log(`using backend: ${RenderSystem.get_current_backend()}`);



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

    shader = RenderSystem.create_render_shader(
        planet_shader.vertex_source,
        planet_shader.fragment_source
    );

    uniform_buffer_data.set(planet_viewer.camera.camera.perspective.data, 0);

    uniform_buffer = RenderSystem.create_uniform_buffer(uniform_buffer_data.byteLength);
    uniform_buffer.write_data(uniform_buffer_data);


    sun_shader = RenderSystem.create_render_shader(
        sun_shader_sources.vertex_source,
        sun_shader_sources.fragment_source
    );




    g_buffer = RenderSystem.create_render_target(new Extents2D(1000, 1000));
    g_buffer.add_color_attachment('albedo');
    g_buffer.add_color_attachment('position', 'color32f');
    g_buffer.add_color_attachment('normal', 'color32f');
    g_buffer.add_color_attachment('light');
    g_buffer.add_depth_attachment('depth');

    quad_shader = RenderSystem.create_render_shader(
        quad_shader_sources.vertex_source,
        quad_shader_sources.fragment_source
    );

    atmosphere_buffer = RenderSystem.create_uniform_buffer(atmosphere_buffer_data.byteLength);
    atmosphere_buffer.write_data(atmosphere_buffer_data);

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

    if(old_planet) {
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