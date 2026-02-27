var canvas = view_canvas;
var ctx = canvas.getContext("2d");
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var background_color = "#121212ff"
var foreground_color = "random";
canvas.width = WIDTH;
canvas.height = HEIGHT;
var FPS = 60;
let invert_culling = false;
let wireframe_mode = false;

const camera = {x: 0, y: 0, z: -1, yaw:0, pitch: 0};
const keys = {};

window.addEventListener('mousedown', (e) => {
    if(e.target !== canvas) return;
    if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
    }
});
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
        const sensitivity = 0.002;
        camera.yaw += e.movementX * sensitivity;
        camera.pitch += e.movementY * sensitivity;
        camera.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.pitch));
    }
});
window.addEventListener('mouseup', () => {
    if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
    }
});

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

fps_slider.addEventListener('input', (e) => {
    FPS = parseInt(e.target.value);
    fps_value.textContent = FPS;
});


dz_slider.addEventListener('input', (e) => {
    dz = parseInt(e.target.value);
    dz_value.textContent = dz;
});

color_mode.addEventListener('change', (e) => {
    const mode = e.target.value;
    if (mode === 'solid') {
        foreground_color = "#07c123ff";
    } else {
        foreground_color = 'random';
    }
});

culling_checkbox.addEventListener('change', (e) => {
invert_culling = e.target.checked;
} );
render_mode.addEventListener('change', (e) => {
    const mode = e.target.value;
    wireframe_mode = mode === 'wireframe';
    if (wireframe_mode) {
        foreground_color = "#07c123ff";
    } else {
        foreground_color = 'random';
    }
});

let shading_enabled = true;
shading_checkbox.addEventListener('change', (e) => {
    shading_enabled = e.target.checked;
});

// Model selection dropdown handler
model_select.addEventListener('change', (e) => {
    const modelPath = e.target.value;
    console.log('Loading model:', modelPath);
    switch(modelPath){
        case "objects/al.obj":
            dz = 7;
            dz_value.textContent = dz;
            invert_culling = false;
            break;
        case "objects/teapot.obj":
            dz = 143;
            dz_value.textContent = dz;
            invert_culling = true;
            break;
        case "objects/slot_machine.obj":
            dz = 27;
            dz_value.textContent = dz;
            invert_culling = false;
            break;
        default:
            dz = 7;
            invert_culling = false;
            dz_value.textContent = dz;
    }
    loadOBJ(modelPath).then(({ vertices, faces }) => {
        vs = vertices;
        fs = faces;
        console.log('Model loaded:', vertices.length, 'vertices,', faces.length, 'faces');
    }).catch(err => {
        console.error('Failed to load model:', err);
    });
});

// OBJ file upload handler

obj_loader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const objText = event.target.result;
            const { vertices, faces } = parseOBJ(objText);
            vs = vertices;
            fs = faces;
            console.log('Model loaded:', vertices.length, 'vertices,', faces.length, 'faces');
        };
        reader.readAsText(file);
    }
});

// Window resize listener
window.addEventListener('resize', () => {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
});

function subtract3D(v1, v2) {
    return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z };
}

function crossProduct3D(v1, v2) {
    return {
        x: v1.y * v2.z - v1.z * v2.y,
        y: v1.z * v2.x - v1.x * v2.z,
        z: v1.x * v2.y - v1.y * v2.x
    };
}

function normalize3D(v) {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (length === 0) return { x: 0, y: 0, z: 0 };
    return { x: v.x / length, y: v.y / length, z: v.z / length };
}

function dotProduct3D(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

function clear(){
    ctx.fillStyle = background_color;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function point({x,y}) {
    const s = 10;
    ctx.fillStyle = foreground_color;
    ctx.fillRect(x - s/2, y - s/2, s,s);
}

function line(p1, p2) {

    ctx.lineWidth = 2;
    ctx.strokeStyle = foreground_color;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
}

function triangle({x: x1, y: y1}, {x: x2, y: y2}, {x: x3, y: y3}, color = foreground_color, i = -1) {
    if (color === 'random') {
        color = random_color(i, 1);
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
}

function random_color(i = -1, opacity = 1) {
    if (i >= 0) {
        const hue = (i * 137.508) % 360; 
        return `hsla(${hue}, 90%, 70%, ${opacity})`;
    }
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgba(${r},${g},${b},${opacity})`;   
}

function getShadedColor(intensity) {
    // Base color: rgb(7, 193, 35)
    let r = 7;
    let g = 193;
    let b = 35;
    if (foreground_color === 'random') {
        const hue = (i * 137.508) % 360; 
        return `hsla(${hue}, 90%, ${intensity * 45}%, 1)`;
    }
    
    // Ensure the darkest part is still slightly visible (ambient light)
    const ambient = 0.2;
    const finalIntensity = Math.max(ambient, intensity);
    
    return `rgb(${Math.floor(r * finalIntensity)}, ${Math.floor(g * finalIntensity)}, ${Math.floor(b * finalIntensity)})`;
}

// Transform coordinates from 3D -1,1 to screen 
function screen(p) {
    // Use uniform scale based on smaller dimension to preserve aspect ratio
    const scale = Math.min(WIDTH, HEIGHT);
    return {
        x: WIDTH/2 + p.x * scale/2,
        y: HEIGHT/2 - p.y * scale/2,
    }
}
function project({x, y, z}) {
    return {
        x: x/z,
        y: y/z,
    }
}
function translate_z({x, y, z}, dz) {
    return {x, y, z: z + dz};
}
function rotate_y_axis({x, y, z}, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
        x: x*c-z*s,
        y,
        z: x*s+z*c,
    };
}

function apply_camera_transforms(v) {
    const translated = {
        x: v.x - camera.x,
        y: v.y - camera.y,
        z: v.z - camera.z, 
    };
    const c_yaw = Math.cos(-camera.yaw);
    const s_yaw = Math.sin(-camera.yaw);
    const c_pitch = Math.cos(-camera.pitch);
    const s_pitch = Math.sin(-camera.pitch);
    const rx = translated.x * c_yaw + translated.z * s_yaw;
    const ry = translated.y;
    const rz = -translated.x * s_yaw + translated.z * c_yaw;

    return {
        x: rx,
        y: ry * c_pitch - rz * s_pitch,
        z: ry * s_pitch + rz * c_pitch,
    };
}
function update_camera() {
    const speed = 2.5;

    // Forward direction in world space based on camera yaw
    // When yaw=0, camera faces +Z. Yaw increases when turning right.
    const forward = {
        x: Math.sin(camera.yaw),
        y: 0,
        z: Math.cos(camera.yaw),
    };
    // Right is perpendicular to forward (rotated 90 degrees clockwise around Y)
    const right = {
        x: Math.cos(camera.yaw),
        y: 0,
        z: -Math.sin(camera.yaw),
    };

    if(keys['ArrowLeft']) {
        camera.yaw -= 0.05;
    }
    if(keys['ArrowRight']) {
        camera.yaw += 0.05;
    }
    if (keys['KeyW']) {
        camera.x += forward.x * speed;
        camera.y += forward.y * speed;
        camera.z += forward.z * speed;
    }
    if (keys['KeyS']) {
        camera.x -= forward.x * speed;
        camera.y -= forward.y * speed;
        camera.z -= forward.z * speed;
    }
    if (keys['KeyA']) {
        camera.x -= right.x * speed;
        camera.z -= right.z * speed;
    }
    if (keys['KeyD']) {
        camera.x += right.x * speed;
        camera.z += right.z * speed;
    }
    if(keys['Space']) {
        camera.y += speed;
    }
    if(keys['ShiftLeft'] || keys['ShiftRight']) {
        camera.y -= speed;
    }
}

// OBJ file loader
function parseOBJ(objText) {
    const vertices = [];
    const faces = [];
    
    const lines = objText.split('\n');
    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        
        if (parts[0] === 'v') {
            // Vertex: v x y z
            vertices.push({
                x: parseFloat(parts[1]),
                y: parseFloat(parts[2]),
                z: parseFloat(parts[3])
            });
        } else if (parts[0] === 'f') {
            // Face: f v1 v2 v3 ... (indices are 1-based in OBJ)
            const face = [];

            for (let i = 1; i < parts.length; i++) {
                // Handle format like "v/vt/vn" - we only need vertex index
                const vertexIndex = parseInt(parts[i].split('/')[0]) - 1; // Convert to 0-based
                face.push(vertexIndex);
            }
            for(let i = 1; i < face.length - 1; i++) {
                faces.push([
                    face[0],
                    face[i],
                    face[i+1]
                ])
            }
        }
    }
    
    return { vertices, faces };
}

// Load OBJ from file
async function loadOBJ(url) {
    const response = await fetch(url);
    const objText = await response.text();
    const { vertices, faces } = parseOBJ(objText);
    return { vertices, faces };
}

let vs = [
    {x:  0.25, y:  0.25, z:  0.25},
    {x: -0.25, y:  0.25, z:  0.25},
    {x: -0.25, y: -0.25, z:  0.25},
    {x:  0.25, y: -0.25, z:  0.25},

    {x:  0.25, y:  0.25, z: -0.25},
    {x: -0.25, y:  0.25, z: -0.25},
    {x: -0.25, y: -0.25, z: -0.25},
    {x:  0.25, y: -0.25, z: -0.25},
];

let fs = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
];
let angle = 0;
let dz = 4;

function wireframe() {
        
        for(const f of fs){
            for(let j = 0; j < f.length; j++) {
                let v1 = vs[f[j]];
                let v2 = vs[f[(j+1) % f.length]];
                
                // Apply transformations including camera
                v1 = translate_z(rotate_y_axis(v1, angle), dz);
                v2 = translate_z(rotate_y_axis(v2, angle), dz);
                
                v1 = apply_camera_transforms(v1);
                v2 = apply_camera_transforms(v2);
                
                // Skip lines behind camera
                if (v1.z <= 0 || v2.z <= 0) continue;
                
                line(
                    screen(project(v1)),
                    screen(project(v2))
                );
            }
        }
}

let light_direction = normalize3D({x: 1.2, y: 1, z: -1});
let i = -1;
function solid() {
    i = -1;
    let triangles_to_draw = []
    for ([p1, p2, p3] of fs) {
        let v1 = vs[p1];
        let v2 = vs[p2];
        let v3 = vs[p3];
        if (!v1 || !v2 || !v3) continue; // Skip if any vertex is missing
        i = (i + 1) % 256;
        v1 = translate_z(rotate_y_axis(v1, angle), dz);
        v2 = translate_z(rotate_y_axis(v2, angle), dz);
        v3 = translate_z(rotate_y_axis(v3, angle), dz);

        v1 = apply_camera_transforms(v1);
        v2 = apply_camera_transforms(v2);
        v3 = apply_camera_transforms(v3);

        sp1 = screen(project(v1));
        sp2 = screen(project(v2));
        sp3 = screen(project(v3));

        dx1 = sp2.x - sp1.x;
        dy1 = sp2.y - sp1.y;
        dx2 = sp3.x - sp1.x;
        dy2 = sp3.y - sp1.y;
        cross = dx1 * dy2 - dy1 * dx2;
        const is_front_face = invert_culling ? cross < 0 : cross > 0;
        if (!is_front_face) continue; // Backface culling
        if(v1.z < 0.1 || v2.z < 0.1 || v3.z < 0.1) continue; // Skip triangles too close to camera to avoid distortion
        let color = foreground_color;
        if (shading_enabled) {
            const line1 = subtract3D(v2, v1);
            const line2 = subtract3D(v3, v1);
            const normal = normalize3D(crossProduct3D(line1, line2));
            if(invert_culling) {
                normal.x = -normal.x;
                normal.y = -normal.y;
                normal.z = -normal.z;
            }
            const intensity = dotProduct3D(normal, light_direction);
            color = getShadedColor(intensity);
        }

        const z_avg = (v1.z + v2.z + v3.z) / 3;
        
        triangles_to_draw.push({
            sp1,sp2,sp3,z_avg, i, color
        })   
    }
    triangles_to_draw.sort((a,b) => b.z_avg - a.z_avg);
   
    for (const t of triangles_to_draw){
        
        triangle(t.sp1, t.sp2, t.sp3, t.color, t.i);
    }
}
function frame() {
    clear();
    ctx.fillStyle = foreground_color;
    const dt = 1 / FPS;
    angle += dt * Math.PI * 0.5;
    update_camera();
    if (wireframe_mode) {
        wireframe();
    } else {
    solid();
}

    setTimeout(frame, 1000 / FPS);
}

loadOBJ('objects/teapot.obj').then(({ vertices, faces }) => {
    vs = vertices;
    fs = faces;
    dz = 143;
    invert_culling = true;
    console.log('Model loaded:', vertices.length, 'vertices,', faces.length, 'faces');
});

setTimeout(frame, 1000 / FPS);

