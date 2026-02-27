
let grid_size = [12,12];
to_be_visited = [];


let end = [grid_size[0] - 1, grid_size[1] - 1];
grid = new Map();
function generate_grid(cols, rows) {
    grid_div.innerHTML = "";
    grid_div.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.clear();
    to_be_visited = [];
    end = [rows - Math.floor(Math.random() * 3) - 1, cols - Math.floor(Math.random() * 3) - 1];
    start = {
        is_wall: false,
        element: null,
        position: [0,0],
        g_cost: 0,
        h_cost: heuristic([0,0], end),
        f_cost: heuristic([0,0], end),
        parent: null,
        weight: 1,
        start: true
    };
    to_be_visited.push(start);
    for(let i = 0; i < cols * rows; i++) {
        
        let is_wall = Math.random() < 0.3;
        const cell = document.createElement("div")
        cell.className = "cell";
        if (end[0] === Math.floor(i / cols) && end[1] === i % cols) {
            cell.style.backgroundColor = "red";
            is_wall = false;
        }
        
        weight = Math.floor(Math.random() * 3) + 1;
        cell.textContent = `${weight}`;
        if (start.position[0] === Math.floor(i / cols) && start.position[1] === i % cols) {
            cell.style.setProperty("background-color", "green", "important");
            is_wall = false;
            start.element = cell;
            cell.textContent = "";
        }
        if(is_wall) {
            cell.classList.add("wall");
            cell.textContent = "";
        }
        
        grid_div.appendChild(cell);
        grid.set(`${Math.floor(i / cols)},${i % cols}`, {
            is_wall: is_wall,
            element: cell,
            position: [Math.floor(i / cols), i % cols],
            g_cost: Infinity,
            h_cost: heuristic([Math.floor(i / cols), i % cols], end),
            f_cost: Infinity,
            parent: null,
            weight: weight
        });   
    }
    grid.set(`${start.position[0]},${start.position[1]}`, start);
}
const grid_div = document.getElementById("grid_div");

function heuristic(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}
directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0]
]
function one_step() {
    if(to_be_visited.length === 0) {
        alert("No path found!");
        return;
    }
    to_be_visited.sort((a, b) => a.f_cost - b.f_cost);
    let current = to_be_visited.shift();
    if (current.position[0] === end[0] && current.position[1] === end[1]) {
        while(current.parent) {
            current.element.style.backgroundColor = "yellow";
            current = current.parent;
        }
        alert("Path found!");
        return;
    }
    directions.forEach(dir => {
        
        neighbor = grid.get(`${current.position[0] + dir[0]},${current.position[1] + dir[1]}`);
        if (!neighbor || neighbor.is_wall ) return;
        const start_to_neighbor = current.g_cost + neighbor.weight;
        if (start_to_neighbor < neighbor.g_cost) {
            neighbor.g_cost = start_to_neighbor;
            neighbor.f_cost = neighbor.g_cost + neighbor.h_cost;
            neighbor.parent = current;
            neighbor.element.textContent = `${neighbor.f_cost}`;
            if (!to_be_visited.includes(neighbor)) {
                to_be_visited.push(neighbor);
                if (!neighbor.start){
                    neighbor.element.style.backgroundColor = "lightblue";
                }
            }
        }
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        one_step();
    }
});

reset_btn.addEventListener("click", () => {
    grid_size[0] = parseInt(grid_x_input.value) || 12;
    grid_size[1] = parseInt(grid_y_input.value) || 12;
    generate_grid(grid_size[0], grid_size[1]);
});

generate_grid(grid_size[0], grid_size[1]);