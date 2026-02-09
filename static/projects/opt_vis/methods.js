export function randomStep(cost_function, currentPosition, stepSize){
    const [x, y] = currentPosition
    const directions = [[0,0],[0, 1], [1, 0], [-1, 0], [0, -1], [-1, 1], [1, -1], [-1, -1], [1, 1]]
    const candidates = directions.map( ([dx, dy]) => {
        const nx = x + dx * stepSize;
        const ny = y + dy * stepSize;
        return {
            pos: [nx, ny],
            cost: cost_function(nx, ny)
        }
    });
    const best = candidates.reduce((min, c) => 
        c.cost < min.cost ? c : min
    ).pos;
    return best;
}

export function gradient(currentPosition, cost_function, delta=0.01){
    const [x, y] = currentPosition;
    const cost = cost_function(x, y);
    const cost_x_plus = cost_function(x + delta, y);
    const cost_x_minus = cost_function(x - delta, y);
    const cost_y_minus = cost_function(x, y - delta);
    const cost_y_plus = cost_function(x, y + delta);
    const grad_x = (cost_x_plus - cost_x_minus) / (2 * delta);
    const grad_y = (cost_y_plus - cost_y_minus) / (2 * delta);
    return [grad_x, grad_y];
}

export function hesse(currentPosition, cost_function, delta=0.01){
    const [x, y] = currentPosition;
    const g0 = gradient(currentPosition, cost_function, delta);
    const gx = gradient([x + delta, y], cost_function, delta);
    const gy = gradient([x, y + delta], cost_function, delta);
    const hessian = [
        (gx[0] - g0[0]) / delta, (gx[1] - g0[1]) / delta,
        (gy[0] - g0[0]) / delta, (gy[1] - g0[1]) / delta
    ];
    return hessian;
}

export function gradient_first_order(currentPosition, cost_function, step_size=0.1){
    let grad = gradient(currentPosition, cost_function);
    currentPosition[0] -= grad[0] * step_size;
    currentPosition[1] -= grad[1] * step_size;
    return [currentPosition, grad];
}

export function newton_method(currentPosition, cost_function, step_size=1){
    const grad = gradient(currentPosition, cost_function);
    
    const [fxx, fyx, fxy, fyy] = hesse(currentPosition, cost_function);
    const det = fxx * fyy - fxy * fyx;
    if (Math.abs(det) < 1e-6) {
        return currentPosition;
    }
    const invH = [
        fyy / det, -fxy / det,
        -fyx / det, fxx / det
    ]
    const step_x = invH[0] * grad[0] + invH[1] * grad[1];
    const step_y = invH[2] * grad[0] + invH[3] * grad[1];
    currentPosition[0] -= step_x;
    currentPosition[1] -= step_y;
    return [currentPosition, grad];
}

let m = [0, 0];
let v = [0, 0];
let t = 1;

export function adam(currentPosition, cost_function, step_size=0.1, RST = false, beta1=0.9, beta2=0.999, epsilon=1e-8){
    const grad = gradient(currentPosition,cost_function, 0.01)
    if (RST) {
        m = [0, 0];
        v = [0, 0];
        t = 1;
    }   
    for(let i = 0; i < 2; i++){    
        m[i] = beta1 * m[i] + (1 - beta1) * grad[i];

        v[i] = beta2 * v[i] + (1 - beta2) * (grad[i] * grad[i])
       
        const mHat = m[i] / (1- Math.pow(beta1, t));
        const vHat = v[i] / (1 - Math.pow(beta2, t));
        currentPosition[i] -= step_size * mHat / (Math.sqrt(vHat) + epsilon);
    }
    t += 1;
    return [currentPosition, grad];
}

export function nadam(currentPosition, cost_function, step_size=0.1, RST = false, beta1=0.9, beta2=0.999, epsilon=1e-8){
    const grad = gradient(currentPosition,cost_function, 0.01)
    if (RST) {
        m = [0, 0];
        v = [0, 0];
        t = 1;
    }
    for(let i = 0; i < 2; i++){    
        m[i] = beta1 * m[i] + (1 - beta1) * grad[i];

        v[i] = beta2 * v[i] + (1 - beta2) * (grad[i] * grad[i])
       
        let mHat = m[i] / (1- Math.pow(beta1, t));
        const vHat = v[i] / (1 - Math.pow(beta2, t));
        mHat = beta1 * mHat + ( (1 - beta1) / (1 - Math.pow(beta1, t)) * grad[i] );
        currentPosition[i] -= step_size * mHat / (Math.sqrt(vHat) + epsilon);
    }
    t += 1;
    return [currentPosition, grad];
}