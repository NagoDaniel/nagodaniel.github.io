import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gradient_first_order, randomStep, newton_method, adam, nadam} from './methods.js';

/* ---------- Cost Functions ---------- */
const costFunctions = {
  ackley: (x, z) => 0.04 * x * x + 0.04 * z * z - 0.7 * (Math.cos(0.56 * Math.PI * x) + Math.cos(0.6 * Math.PI * z)),
  sphere: (x, z) => (x * x) * 0.06 + (z * z) * 0.04,
  booth: (x, z) =>
  0.02 * (x + 2 * z - 7) ** 2 +
  0.02 * (2 * x + z - 5) ** 2,
  saddle: (x, z) =>
  0.1 * (x * x - z * z),
  beale: (x, z) => {
  x *= 0.9;
  z *= 0.9;

  const f =
    (1.5 - x + x*z)**2 +
    (2.25 - x + x*z*z)**2 +
    (2.625 - x + x*z*z*z)**2;

  return 0.9 * Math.log(1 + f);
},
  mexicanHat: (x, z) => {
  const r2 = x * x + z * z;
  return 1.5 * r2 * (Math.exp(-0.32 * r2) + 0.02);
} ,
styblinskiTang: (x, z) => {
  x *= 0.5;
  z *= 0.5;

  const f =
    (x**4 - 16*x*x + 5*x) +
    (z**4 - 16*z*z + 5*z);

  return 0.01 * f;
}

};

/* ---------- Algorithm Configurations ---------- */
const algorithmConfigs = {
  gradient: {
    name: 'Gradient Descent',
    func: gradient_first_order,
    params: {
      step_size: { value: 0.1, min: 0.01, max: 10, step: 0.01, label: 'Step Size' },
      update_interval: { value: 0.4, min: 0.01, max: 2, step: 0.05, label: 'Update Interval (s)' }
    }
  },
  random: {
    name: 'Random Step',
    func: randomStep,
    params: {
      step_size: { value: 0.2, min: 0.01, max: 10, step: 0.01, label: 'Step Size' },
      update_interval: { value: 0.4, min: 0.01, max: 2, step: 0.05, label: 'Update Interval (s)' }
    }
  },
  newton: {
    name: 'Newton\'s Method',
    func: newton_method,
    params: {
      update_interval: { value: 0.4, min: 0.01, max: 2, step: 0.05, label: 'Update Interval (s)' }
    }
  },
  adam: {
  name: 'Adam',
  func: adam,
  params: {
    step_size: { value: 0.1, min: 0.01, max: 10.0, step: 0.01, label: 'Learning Rate' },
    beta1: { value: 0.99, min: 0.5, max: 0.999, step: 0.01, label: 'Beta 1 (Momentum)' },
    beta2: { value: 0.999, min: 0.5, max: 0.999, step: 0.001, label: 'Beta 2 (RMS)' },
    update_interval: { value: 0.1, min: 0.01, max: 1, step: 0.01, label: 'Interval (s)' }
    }
  },
  nadam:{
    name: 'Nadam',
    func: nadam,
    params: {
      step_size: { value: 0.1, min: 0.01, max: 10.0, step: 0.01, label: 'Learning Rate' },
      beta1: { value: 0.99, min: 0.5, max: 0.999, step: 0.01, label: 'Beta 1 (Momentum)' },
      beta2: { value: 0.999, min: 0.5, max: 0.999, step: 0.001, label: 'Beta 2 (RMS)' },
      update_interval: { value: 0.1, min: 0.01, max: 1, step: 0.01, label: 'Interval (s)' }
    }
  }

};

/* ---------- Current Configuration ---------- */
let config = {
  startX: 11,
  startY: 11,
  costFunction: 'ackley',
  algorithm: 'gradient',
  params: algorithmConfigs.gradient.params
};

const scene = new THREE.Scene();

const frustumSize = 5; 
const aspect = window.innerWidth / window.innerHeight;

// 2. Set the bounds based on the aspect ratio
// const camera = new THREE.OrthographicCamera(
//   frustumSize * aspect / -2, // left
//   frustumSize * aspect / 2,  // right
//   frustumSize / 2,           // top
//   frustumSize / -2,          // bottom
//   0.1,                       // near
//   1000                       // far
// );
const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 5000);
// window.addEventListener('resize', () => {
//   const aspect = window.innerWidth / window.innerHeight;

//   camera.left = frustumSize * aspect / -2;
//   camera.right = frustumSize * aspect / 2;
//   camera.top = frustumSize / 2;
//   camera.bottom = frustumSize / -2;

//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// });
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
});
// 3. Move it back so it can actually see the origin (0,0,0)

function cost_function(x, z) {
  return costFunctions[config.costFunction](x, z);
}

let start_position = { x: config.startX, y: cost_function(config.startX, config.startY), z: config.startY };

camera.position.set(10, start_position.y + 5, 20); 
camera.lookAt(start_position.x, start_position.y, start_position.z);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

/* ---------- Lights ---------- */

scene.add(new THREE.AmbientLight(0xfCfCfC, 0.5));

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);





const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;



const uniforms = {
  uTime: { value: 0.0 }
};
const geometry = new THREE.PlaneGeometry(30,30,128,128);
geometry.rotateX(- Math.PI / 2);    
const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: `
    uniform float uTime;
    varying float vZ; // Pass height to fragment shader for coloring

    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      
      float x = modelPosition.x;
      float z = modelPosition.z;
      float pi = 3.1415926;
      //float elevation = sin(x * 1.0 ) * cos(z * 1.0) * 0.016 * (z * x + x * z) ;
      //float elevation = (x*x + z - 11.0)*(x*x + z - 11.0) + (x + z*z - 1.0)*(x + x*z - 1.0);
      float elevation =  0.04* x*x + 0.04 *z*z - 0.7 * (cos(0.56 * pi * x) + cos(0.6 * pi * z) ); 
     // elevation = elevation / x  - 10.0;
      modelPosition.y += elevation;
      vZ = elevation; // Send to fragment shader

      gl_Position = projectionMatrix * viewMatrix * modelPosition;
    }
  `,
  fragmentShader: `
    varying float vZ;
    void main() {
        float strength = -0.2*vZ + 0.05;
        gl_FragColor = vec4(-strength, strength * 0.6, 1.0, 1.0);
      }
  `,
  wireframe: true // Helpful to see the mesh structure
});
material.side = THREE.DoubleSide;
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const ball = new THREE.Mesh(sphereGeometry, sphereMaterial);
ball.position.set(start_position.x, start_position.y, start_position.z);
scene.add(ball);
camera.lookAt(ball.position);

const arrow = new THREE.ArrowHelper(
  new THREE.Vector3(1, 0, 0), // initial direction
  new THREE.Vector3(0, 0, 0), // local origin (ball center)
  1,                          // length
  0xffff00
);

ball.add(arrow);

/* ---------- Raycaster for Placement Mode ---------- */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isPlacementMode = false;

const ghostBallGeometry = new THREE.SphereGeometry(0.2, 16, 16);
const ghostBallMaterial = new THREE.MeshStandardMaterial({ 
  color: 0xff0000,
  transparent: true,
  opacity: 0.8,
  emissive: 0xff0000,
  emissiveIntensity: 0.8
});
const ghostBall = new THREE.Mesh(ghostBallGeometry, ghostBallMaterial);
ghostBall.visible = false;
scene.add(ghostBall);

/* ---------- UI Event Handlers ---------- */

// Mobile toggle
const settingsToggle = document.getElementById('settings-toggle');
const controlsPanel = document.getElementById('controls-panel');

settingsToggle.addEventListener('click', () => {
  controlsPanel.classList.toggle('open');
});

// Close panel when clicking outside on mobile
document.addEventListener('click', (e) => {
  if (window.innerWidth <= 768 && 
      !controlsPanel.contains(e.target) && 
      e.target !== settingsToggle && 
      !settingsToggle.contains(e.target)) {
    controlsPanel.classList.remove('open');
  }
});

// Update dynamic parameters based on algorithm
function updateDynamicParams() {
  const algorithmKey = document.getElementById('algorithm').value;
  const dynamicParamsDiv = document.getElementById('dynamic-params');
  const algorithmConfig = algorithmConfigs[algorithmKey];
  
  dynamicParamsDiv.innerHTML = '';
  
  Object.entries(algorithmConfig.params).forEach(([key, paramConfig]) => {
    const controlGroup = document.createElement('div');
    controlGroup.className = 'control-group';
    
    const label = document.createElement('label');
    label.textContent = paramConfig.label;
    
    const input = document.createElement('input');
    input.type = 'number';
    input.id = `param-${key}`;
    input.min = paramConfig.min;
    input.max = paramConfig.max;
    input.step = paramConfig.step;
    // Use current config value if algorithm matches, otherwise use default
    input.value = (config.algorithm === algorithmKey && config.params[key]) 
      ? config.params[key].value 
      : paramConfig.value;
    
    const description = document.createElement('div');
    description.className = 'param-description';
    description.textContent = `${paramConfig.min} to ${paramConfig.max}`;
    
    controlGroup.appendChild(label);
    controlGroup.appendChild(input);
    controlGroup.appendChild(description);
    dynamicParamsDiv.appendChild(controlGroup);
  });
}

// Initialize dynamic params
updateDynamicParams();

// Update params when algorithm changes
document.getElementById('algorithm').addEventListener('change', updateDynamicParams);

// Apply button
document.getElementById('apply-btn').addEventListener('click', () => {
  // Update config
  config.startX = parseFloat(document.getElementById('start-x').value);
  config.startY = parseFloat(document.getElementById('start-y').value);
  config.costFunction = document.getElementById('cost-function').value;
  config.algorithm = document.getElementById('algorithm').value;
  
  // Update algorithm params
  const algorithmConfig = algorithmConfigs[config.algorithm];
  Object.keys(algorithmConfig.params).forEach(key => {
    const input = document.getElementById(`param-${key}`);
    if (input) {
      config.params[key] = { ...algorithmConfig.params[key], value: parseFloat(input.value) };
    }
  });
  
  // Reset simulation
  resetSimulation();
  
  // Close mobile panel
  if (window.innerWidth <= 768) {
    controlsPanel.classList.remove('open');
  }
});

/* ---------- Placement Mode (Pick Start Position) ---------- */

function setPlacementMode(active) {
  isPlacementMode = active;
  controls.enabled = !active; // Disable rotation so we can click accurately
  renderer.domElement.style.cursor = active ? 'crosshair' : 'default';
  const dropBtn = document.getElementById('drop-mode-btn');
  dropBtn.style.background = active ? '#b81c1c' : '#2e164d';
  dropBtn.textContent = active ? 'Click on Surface...' : 'Pick Start Point';
  ghostBall.visible = active;
  
  if (!active) {
    ghostBall.visible = false;
  }
}

function handlePick(event) {
  if (!isPlacementMode) return;

  // Don't trigger if clicking on UI
  if (event.target.closest('#controls-panel') || event.target.closest('#settings-toggle')) {
    return;
  }

  // 1. Normalize coordinates
  const rect = renderer.domElement.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;

  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  // 2. Intersect the flat plane
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(plane);

  if (intersects.length > 0) {
    const pt = intersects[0].point;

    // 3. Update global state (Z in 3D is Y in your 2D function math)
    config.startX = pt.x;
    config.startY = pt.z; 
    
    // 4. Sync UI Inputs
    document.getElementById('start-x').value = pt.x.toFixed(2);
    document.getElementById('start-y').value = pt.z.toFixed(2);

    // 5. Reset simulation (this will call cost_function(pt.x, pt.z) for height)
    resetSimulation();
    setPlacementMode(false);
  }
}

function handleMouseMove(event) {
  if (!isPlacementMode) return;

  // Don't show preview if over UI
  if (event.target.closest('#controls-panel') || event.target.closest('#settings-toggle')) {
    ghostBall.visible = false;
    return;
  }

  ghostBall.visible = true;

  // Normalize coordinates
  const rect = renderer.domElement.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;

  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  // Intersect the flat plane
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(plane);

  if (intersects.length > 0) {
    const pt = intersects[0].point;
    
    // Position ghost ball at the correct height using cost function
    const height = cost_function(pt.x, pt.z);
    ghostBall.position.set(pt.x, height, pt.z);
  }
}

// Toggle button
const dropBtn = document.getElementById('drop-mode-btn');
dropBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  setPlacementMode(!isPlacementMode);
  if (window.innerWidth <= 768) {
    controlsPanel.classList.remove('open');
  }
});

// Capture clicks/taps for placement
window.addEventListener('mousedown', handlePick);
window.addEventListener('touchstart', handlePick, { passive: false });

// Show preview while moving
window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('touchmove', handleMouseMove, { passive: false });

toggle_sim.addEventListener('click', () => {
  is_sim_active = !is_sim_active;
  toggle_sim.textContent = is_sim_active ? 'Pause Simulation' : 'Resume Simulation';
});

// Function to update shader based on cost function
function getShaderElevationCode(functionKey) {
  switch(functionKey) {
    case 'ackley':
      return 'float elevation = 0.04* x*x + 0.04 *z*z - 0.7 * (cos(0.56 * pi * x) + cos(0.6 * pi * z) );';
    case 'sphere':
      return 'float elevation = (x*x) * 0.06 + (z*z) * 0.04;';
    case 'booth':
      return 'float elevation = 0.02 * (x + 2.0 * z - 7.0) * (x + 2.0 * z - 7.0) + 0.02 * (2.0 * x + z - 5.0) * (2.0 * x + z - 5.0);';
    case 'saddle':
      return 'float elevation = 0.1 * (x * x - z * z);';
    case 'beale':
      return 'float x_scaled = x * 0.9; float z_scaled = z * 0.9; float f = (1.5 - x_scaled + x_scaled*z_scaled)*(1.5 - x_scaled + x_scaled*z_scaled) + (2.25 - x_scaled + x_scaled*z_scaled*z_scaled)*(2.25 - x_scaled + x_scaled*z_scaled*z_scaled) + (2.625 - x_scaled + x_scaled*z_scaled*z_scaled*z_scaled)*(2.625 - x_scaled + x_scaled*z_scaled*z_scaled*z_scaled); float elevation = 0.9 * log(1.0 + f);';
    case 'mexicanHat':
      return 'float r2 = x * x + z * z; float elevation = 1.5 * r2 * (exp(-0.32 * r2) + 0.02);';
    case 'styblinskiTang':
      return 'float x_scaled = x * 0.5; float z_scaled = z * 0.5; float elevation = 0.01 * ((x_scaled*x_scaled*x_scaled*x_scaled - 16.0*x_scaled*x_scaled + 5.0*x_scaled) + (z_scaled*z_scaled*z_scaled*z_scaled - 16.0*z_scaled*z_scaled + 5.0*z_scaled));';
      default:
      return 'float elevation = 0.03* x*x + 0.03 *z*z - 0.7 * (cos(0.56 * pi * x) + cos(0.6 * pi * z) );';
  }
}

// Function to recreate plane with new cost function
function updatePlaneMaterial() {
  const elevationCode = getShaderElevationCode(config.costFunction);
  
  plane.material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
      uniform float uTime;
      varying float vZ;

      void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        
        float x = modelPosition.x;
        float z = modelPosition.z;
        float pi = 3.1415926;
        ${elevationCode}
        modelPosition.y += elevation;
        vZ = elevation;

        gl_Position = projectionMatrix * viewMatrix * modelPosition;
      }
    `,
    fragmentShader: `
      varying float vZ;
      void main() {
        float strength = -0.2*vZ + 0.05;
        gl_FragColor = vec4(-strength, strength * 0.6, 1.0, 1.0);
      }
    `,
    wireframe: true,
    side: THREE.DoubleSide
  });
}

// Function to reset simulation
let RST = false;
function resetSimulation() {
  updatePlaneMaterial();
  RST = true;
  start_position.x = config.startX;
  start_position.z = config.startY;
  start_position.y = cost_function(config.startX, config.startY);
  
  x = config.startX;
  y = config.startY;
  z = cost_function(x, y);
  
  ball.position.set(x, z, y);
  const to_remove = ball.children.filter(child => child.type === 'Mesh') 
  ball.remove(...to_remove);
  acc_time = 0;
  arrow.setLength(0);
  // Hide ghost ball if visible
  if (!isPlacementMode) {
    ghostBall.visible = false;
  }
}

//current_min_algorithm = randomStep;

const clock = new THREE.Clock();
let x = start_position.x;
let y = start_position.z;
let z = cost_function(x, y);
let acc_time = 0;
const current_position_span = document.getElementById('current_position');
const current_gradient_span = document.getElementById('current_gradient');
const current_cost_span = document.getElementById('current_cost');
let is_sim_active = true;
let balls = true;
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  const delta = clock.getDelta();
  if (!is_sim_active) return;
  acc_time += delta;
  const updateInterval = config.params.update_interval?.value || 0.1;
  const stepSize = config.params.step_size?.value || 0.1;
  let t = delta / updateInterval;

  if (acc_time > updateInterval) {
    let pos, grad;
    const algorithmConfig = algorithmConfigs[config.algorithm];
    if (config.algorithm === 'random') {
      t = 1;
      if(balls){
        const directions = [[0,0],[0, 1], [1, 0], [-1, 0], [0, -1], [-1, 1], [1, -1], [-1, -1], [1, 1]];
        pos = [x, y];
        for (const [dx, dz] of directions) {
          const c = cost_function(x + dx * stepSize, y + dz * stepSize);
          const new_ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: c < z ? 0x00ff00 : 0xfa0000 }));
          new_ball.position.set(dx * stepSize, c - z, dz * stepSize);
          ball.add(new_ball);
          
        }
        balls = false;
      } else{
        pos = randomStep(cost_function, [x, y], stepSize);
        const to_remove = ball.children.filter(child => child.type === 'Mesh') 
        ball.remove(...to_remove);
        balls = true;
      }
    } else if (config.algorithm === 'adam' || config.algorithm === 'nadam') {
      [pos, grad] = algorithmConfig.func([x, y], cost_function, stepSize, RST, config.params.beta1.value, config.params.beta2.value);
      RST = false;
      grad = grad.map(g => -g);
      const gradVec = new THREE.Vector3(grad[0], 0, grad[1]);

      const length = gradVec.length();
      if (length > 0) {
        arrow.setDirection(gradVec.clone().normalize());
        arrow.setLength(length * 1.2);
      }

    }
    else {
   
      [pos, grad] = algorithmConfig.func([x, y], cost_function, stepSize);
      grad = grad.map(g => -g);
      const gradVec = new THREE.Vector3(grad[0], 0, grad[1]);

      const length = gradVec.length();

      if (length > 0) {
        arrow.setDirection(gradVec.clone().normalize());
        arrow.setLength(length * 1.2);
      }
    }
    
    x = pos[0];
    y = pos[1];
    z = cost_function(x, y);
    
    acc_time = 0;
    current_position_span.textContent = `X: ${x.toFixed(2)}  Y: ${y.toFixed(2)}`;
    if (grad != undefined){
      if (grad[0] < 0.0001 && grad[0] > -0.0001) grad[0] = 0;
      if (grad[1] < 0.0001 && grad[1] > -0.0001) grad[1] = 0;
      current_gradient_span.textContent = `X: ${grad[0].toFixed(2)}  Y: ${grad[1].toFixed(2)}`;
    }
    else{
      current_gradient_span.textContent = ``;
    }
    current_cost_span.textContent = z.toFixed(4);
  }

  
  
  ball.position.y = THREE.MathUtils.lerp(ball.position.y, z, t );
  ball.position.x = THREE.MathUtils.lerp(ball.position.x, x, t );
  ball.position.z = THREE.MathUtils.lerp(ball.position.z, y, t );

  
}
config.startX = parseFloat(document.getElementById('start-x').value);
  config.startY = parseFloat(document.getElementById('start-y').value);
  config.costFunction = document.getElementById('cost-function').value;
  config.algorithm = document.getElementById('algorithm').value;
  
  // Update algorithm params
  const algorithmConfig = algorithmConfigs[config.algorithm];
  Object.keys(algorithmConfig.params).forEach(key => {
    const input = document.getElementById(`param-${key}`);
    if (input) {
      config.params[key] = { ...algorithmConfig.params[key], value: parseFloat(input.value) };
    }
  });
resetSimulation();

animate();
