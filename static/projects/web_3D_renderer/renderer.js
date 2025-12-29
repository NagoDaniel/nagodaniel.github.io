var canvas = view_canvas;
var ctx = canvas.getContext("2d");
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var background_color = "#121212ff"
var foreground_color = "#07c123ff"
canvas.width = WIDTH;
canvas.height = HEIGHT;
var FPS = 60;


fps_slider.addEventListener('input', (e) => {
    FPS = parseInt(e.target.value);
    fps_value.textContent = FPS;
});


dz_slider.addEventListener('input', (e) => {
    dz = parseInt(e.target.value);
    dz_value.textContent = dz;
});

// Model selection dropdown handler
model_select.addEventListener('change', (e) => {
    const modelPath = e.target.value;
    console.log('Loading model:', modelPath);
    switch(modelPath){
        case "objects/al.obj":
            dz = 7;
            dz_value.textContent = dz;
            break;
        case "objects/teapot.obj":
            dz = 143;
            dz_value.textContent = dz;
            break;
        case "objects/slot_machine.obj":
            dz = 27;
            dz_value.textContent = dz;
            break;
        default:
            dz = 7;
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

// Transform coordinates from 3D -1,1 to screen 
function screen(p) {
    // Use uniform scale based on smaller dimension to preserve aspect ratio
    const scale = Math.min(WIDTH, HEIGHT);
    return {
        x: WIDTH/2 + p.x * scale/2,
        y: HEIGHT/2 - p.y * scale/2,
    }
}
// perspective projection
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
            faces.push(face);
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
function frame() {

    clear();
    ctx.fillStyle = foreground_color;
    const dt = 1 / FPS;
    angle += dt * Math.PI * 0.5;
    //dz += dt * 0.1;
    // for(const v of vs) {
    //     point(screen(project(translate_z(rotate_y_axis(v, angle), dz))));
    // }
    for(const f of fs){
        for(let j = 0; j < f.length; j++) {
            const v1 = vs[f[j]];
            const v2 = vs[f[(j+1) % f.length]];
            line(
                screen(project(translate_z(rotate_y_axis(v1, angle), dz))),
                screen(project(translate_z(rotate_y_axis(v2, angle), dz)))
            );
        }
    }
   
    setTimeout(frame, 1000 / FPS);
}

loadOBJ('objects/al.obj').then(({ vertices, faces }) => {
    vs = vertices;
    fs = faces;
    console.log('Model loaded:', vertices.length, 'vertices,', faces.length, 'faces');
});

setTimeout(frame, 1000 / FPS);

