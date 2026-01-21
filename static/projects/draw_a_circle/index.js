const borderSize = 20;
canvas.width = window.innerWidth-borderSize;
canvas.height = window.innerHeight-borderSize;
const ctx = canvas.getContext("2d");
const MIDDLE_CIRCLE_RADIUS = 8;
let pencil_size = 3;
let radius = 100;
let isDrawing = false;
let average_error = 0;
let count = 1;

function draw_circle(x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

function clear_canvas(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw_circle(canvas.width / 2, canvas.height / 2, MIDDLE_CIRCLE_RADIUS, "black");
}

/**
 * Re-maps a number from one range to another.
 * * @param {number} value  - The incoming value to be converted.
 * @param {number} inMin  - Lower bound of the value's current range.
 * @param {number} inMax  - Upper bound of the value's current range.
 * @param {number} outMin - Lower bound of the target range.
 * @param {number} outMax - Upper bound of the target range.
 * @returns {number}      - The re-mapped value.
 */
function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}


const ERROR_TOLERANCE = 2;

/**
 * 
 * @param {{x: number, y: number}} point 
 * @returns Absolute error from the circle radius, with tolerance
 */
function calculate_error(point){
        let dist = Math.sqrt(Math.pow(point.x - canvas.width / 2, 2) + Math.pow(point.y - canvas.height / 2, 2));
        let error = Math.abs(dist - radius);
        error = Math.max(0, error - ERROR_TOLERANCE);
        return error * 1.1;
}

function updateScoreColor(score) { 
    const safeScore = Math.max(0, Math.min(100, score));
    const normalizedScore = safeScore / 100;
    let hue = Math.pow(normalizedScore, 5) * 120 
    percent_display.style.color = `hsl(${hue}, 100%, 20%)`;
    percent_display.innerText = `Accuracy: ${safeScore.toFixed(2)}%`;
}

clear_canvas();

function handleStart(x, y) {
    average_error = 0;
    count = 1;
    clear_canvas();
    let x_center = canvas.width / 2;
    let y_center = canvas.height / 2;
    let dist = Math.sqrt(Math.pow(x - x_center, 2) + Math.pow(y - y_center, 2));
    updateScoreColor(100);
    let disp_top = canvas.height / 2 - dist - percent_display.offsetHeight - 60;
    disp_top = Math.max(disp_top,  percent_display.offsetHeight);
    let disp_left = canvas.width / 2 - percent_display.offsetWidth / 2 + 2;
    percent_display.style.top = `${disp_top}px`;
    percent_display.style.left = `${disp_left}px`;
    ctx.lineWidth = pencil_size;
    isDrawing = true;
    radius = dist;


    ctx.beginPath();
};

function handleMove(x, y) {
    if (isDrawing) {
        ctx.lineTo(x, y);
        ctx.stroke();
        let err = calculate_error({ x: x, y: y });
        let percent = mapRange(err, 0, radius, 100, 0);
        average_error = average_error + (percent - average_error) / count;
        count += 1;
        if (count % 2 === 0){
            updateScoreColor(average_error);
        }
    }
}

function handleEnd() {
    isDrawing = false;
    ctx.closePath();
}


function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}


window.addEventListener("resize", () => {
    canvas.width = window.innerWidth - borderSize;
    canvas.height = window.innerHeight - borderSize;
    clear_canvas();
});

canvas.addEventListener("mousedown", (e) => {
    handleStart(e.offsetX, e.offsetY);
});

canvas.addEventListener("mousemove", (e) => {
    handleMove(e.offsetX, e.offsetY);
});

window.addEventListener("mouseup", handleEnd);

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const pos = getTouchPos(e);
    handleStart(pos.x, pos.y);
}, { passive: false });

canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const pos = getTouchPos(e);
    handleMove(pos.x, pos.y);
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    handleEnd();
});

canvas.addEventListener("touchcancel", handleEnd);