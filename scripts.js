let canvas, ctx;
let particle;
let fieldConfig;
let history = []; 
let animationId = null;
let lastTime = 0;
let simulationTime = 0; 

// Variables de la Cámara (Arrastre)
let panX = 0;
let panY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

// Parámetros de simulación
const SIM_STEPS_PER_FRAME = 10; 
const DT = 0.005; 
const EPSILON = 0.1; 

// Controles de la UI
const chargeInput = document.getElementById('charge');
const massInput = document.getElementById('mass');
const x0Input = document.getElementById('x0');
const y0Input = document.getElementById('y0');
const vx0Input = document.getElementById('vx0');
const vy0Input = document.getElementById('vy0');

const fieldTypeSelect = document.getElementById('field-type');
const uniformEInputs = document.getElementById('uniform-e-inputs');
const uniformBInputs = document.getElementById('uniform-b-inputs');
const radialEInputs = document.getElementById('radial-e-inputs');

const fieldExInput = document.getElementById('field-ex');
const fieldEyInput = document.getElementById('field-ey');
const fieldBzInput = document.getElementById('field-bz');
const fieldKqInput = document.getElementById('field-kq');

const presetSelect = document.getElementById('preset-examples');

const trailLengthInput = document.getElementById('trail-length');
const zoomInput = document.getElementById('zoom');
const autoPauseInput = document.getElementById('auto-pause-time'); 
const resetCamBtn = document.getElementById('reset-camera');

const startBtn = document.getElementById('start-sim');
const stopBtn = document.getElementById('stop-sim');
const resetBtn = document.getElementById('reset-sim');

// === INICIALIZACIÓN ===

document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('simulationCanvas');
    ctx = canvas.getContext('2d');
    
    // Eventos de botones
    startBtn.addEventListener('click', startSimulation);
    stopBtn.addEventListener('click', stopSimulation);
    resetBtn.addEventListener('click', resetSimulation);
    resetCamBtn.addEventListener('click', resetCamera);
    
    fieldTypeSelect.addEventListener('change', updateFieldOptions);
    presetSelect.addEventListener('change', applyPreset);
    
    // === EVENTOS DE MOUSE (PC) ===
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp); 

    // === EVENTOS TÁCTILES (MÓVIL/TABLET) ===
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onMouseUp);

    window.addEventListener('resize', resizeCanvas);
    
    updateFieldOptions();
    resizeCanvas();
    resetSimulation();
});

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    draw(); 
}

// === LÓGICA DE CÁMARA ===

// Ratón
function onMouseDown(e) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
}

function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    panX += dx;
    panY += dy;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    if (!animationId) draw();
}

// Táctil (Touch)
function onTouchStart(e) {
    if (e.touches.length === 1) {
        e.preventDefault();
        isDragging = true;
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
    }
}

function onTouchMove(e) {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - dragStartX;
    const dy = e.touches[0].clientY - dragStartY;
    panX += dx;
    panY += dy;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    if (!animationId) draw();
}

function onMouseUp() {
    isDragging = false;
}

function resetCamera() {
    panX = 0;
    panY = 0;
    draw();
}

// === LÓGICA DE LA SIMULACIÓN ===

const presets = {
    'uniform-e': [
        { name: 'Seleccionar ejemplo...', values: null },
        { name: 'Tiro Parabólico', values: { charge: 1, mass: 1, x0: -10, y0: 0, vx0: 5, vy0: 10, ex: 0, ey: -2 } },
        { name: 'Aceleración Simple', values: { charge: 1, mass: 1, x0: -10, y0: 0, vx0: 0, vy0: 0, ex: 1, ey: 0 } },
    ],
    'uniform-b': [
        { name: 'Seleccionar ejemplo...', values: null },
        { name: 'Círculo Perfecto (q=1)', values: { charge: 1, mass: 1, x0: 0, y0: -5, vx0: 5, vy0: 0, bz: 1 } },
        { name: 'Círculo Opuesto (q=-1)', values: { charge: -1, mass: 1, x0: 0, y0: -5, vx0: 5, vy0: 0, bz: 1 } },
        { name: 'Círculo Rápido (v=10)', values: { charge: 1, mass: 1, x0: 0, y0: -10, vx0: 10, vy0: 0, bz: 1 } },
    ],
    'radial-e': [
        { name: 'Seleccionar ejemplo...', values: null },
        { name: 'Órbita Circular (Atracción)', values: { charge: 1, mass: 1, x0: 0, y0: 10, vx0: 3.16, vy0: 0, kq: -100 } },
        { name: 'Órbita Elíptica', values: { charge: 1, mass: 1, x0: 0, y0: 10, vx0: 5, vy0: 0, kq: -100 } },
        { name: 'Trayectoria de Repulsión', values: { charge: 1, mass: 1, x0: -10, y0: 0, vx0: 5, vy0: 0, kq: 100 } }
    ]
};

function startSimulation() {
    if (animationId) return; 
    
    if (simulationTime === 0) {
        setupParticleAndField();
    }
    
    lastTime = performance.now();
    animationId = requestAnimationFrame(animate);
}

function stopSimulation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function resetSimulation() {
    stopSimulation();
    simulationTime = 0; 
    setupParticleAndField();
    draw();
}

function setupParticleAndField() {
    particle = {
        q: parseFloat(chargeInput.value),
        m: parseFloat(massInput.value),
        x: parseFloat(x0Input.value),
        y: parseFloat(y0Input.value),
        vx: parseFloat(vx0Input.value),
        vy: parseFloat(vy0Input.value),
        ax: 0,
        ay: 0
    };
    
    const vSq = particle.vx * particle.vx + particle.vy * particle.vy;
    particle.initialKE = 0.5 * particle.m * vSq;

    history = [{ x: particle.x, y: particle.y }];

    fieldConfig = {
        type: fieldTypeSelect.value,
        Ex: parseFloat(fieldExInput.value),
        Ey: parseFloat(fieldEyInput.value),
        Bz: parseFloat(fieldBzInput.value),
        kQ: parseFloat(fieldKqInput.value),
    };
}

function updateFieldOptions() {
    uniformEInputs.classList.toggle('hidden', fieldTypeSelect.value !== 'uniform-e');
    uniformBInputs.classList.toggle('hidden', fieldTypeSelect.value !== 'uniform-b');
    radialEInputs.classList.toggle('hidden', fieldTypeSelect.value !== 'radial-e');
    updatePresetOptions();
    resetSimulation();
}

function updatePresetOptions() {
    const fieldType = fieldTypeSelect.value;
    const currentPresets = presets[fieldType] || [];
    presetSelect.innerHTML = '';
    currentPresets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.name; 
        option.textContent = preset.name;
        presetSelect.appendChild(option);
    });
}

function applyPreset() {
    const fieldType = fieldTypeSelect.value;
    const presetName = presetSelect.value;
    const presetList = presets[fieldType] || [];
    const selectedPreset = presetList.find(p => p.name === presetName);

    if (selectedPreset && selectedPreset.values) {
        const { values } = selectedPreset;
        
        if (values.charge !== undefined) chargeInput.value = values.charge;
        if (values.mass !== undefined) massInput.value = values.mass;
        if (values.x0 !== undefined) x0Input.value = values.x0;
        if (values.y0 !== undefined) y0Input.value = values.y0;
        if (values.vx0 !== undefined) vx0Input.value = values.vx0;
        if (values.vy0 !== undefined) vy0Input.value = values.vy0;

        if (fieldType === 'uniform-e') {
            if (values.ex !== undefined) fieldExInput.value = values.ex;
            if (values.ey !== undefined) fieldEyInput.value = values.ey;
        } else if (fieldType === 'uniform-b') {
            if (values.bz !== undefined) fieldBzInput.value = values.bz;
        } else if (fieldType === 'radial-e') {
            if (values.kq !== undefined) fieldKqInput.value = values.kq;
        }
        
        resetSimulation();
    }
}

// === BUCLE PRINCIPAL Y FÍSICA ===

function animate(timestamp) {
    if (!animationId) return;

    animationId = requestAnimationFrame(animate);

    let elapsedTime = timestamp - lastTime;
    lastTime = timestamp;
    
    if (elapsedTime > 100) elapsedTime = 100;

    for (let i = 0; i < SIM_STEPS_PER_FRAME; i++) {
        if (checkAutoPause()) {
            stopSimulation();
            draw(); 
            return;
        }
        updateParticle(DT);
    }

    draw();
}

function checkAutoPause() {
    const pauseAt = parseFloat(autoPauseInput.value);
    if (!isNaN(pauseAt) && pauseAt > 0 && simulationTime >= pauseAt) {
        return true;
    }
    return false;
}

function updateParticle(dt) {
    simulationTime += dt; 

    const q_m = particle.q / particle.m;
    const { Ex, Ey, Bz } = getFields(particle.x, particle.y, fieldConfig);

    const ax = q_m * (Ex + particle.vy * Bz);
    const ay = q_m * (Ey - particle.vx * Bz);

    particle.ax = ax;
    particle.ay = ay;

    particle.vx += ax * dt;
    particle.vy += ay * dt;

    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    history.push({ x: particle.x, y: particle.y });
    const maxTrail = parseInt(trailLengthInput.value);
    while (history.length > maxTrail) {
        history.shift();
    }
}

function getFields(x, y, config) {
    switch (config.type) {
        case 'uniform-e':
            return { Ex: config.Ex, Ey: config.Ey, Bz: 0 };
        case 'uniform-b':
            return { Ex: 0, Ey: 0, Bz: config.Bz };
        case 'radial-e':
            const r_sq = x*x + y*y + EPSILON;
            const r_cubed = Math.pow(r_sq, 1.5);
            const Ex = config.kQ * x / r_cubed;
            const Ey = config.kQ * y / r_cubed;
            return { Ex, Ey, Bz: 0 };
        default:
            return { Ex: 0, Ey: 0, Bz: 0 };
    }
}

// === FUNCIONES DE DIBUJO ===

function draw() {
    if (!ctx) return;

    const scale = parseFloat(zoomInput.value);
    const originX = canvas.width / 2;
    const originY = canvas.height / 2;
    
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- Dibujo del mundo simulado ---
    ctx.save();
    ctx.translate(originX + panX, originY + panY);
    ctx.scale(scale, -scale); 
    
    const lineWidth = 1 / scale; 

    drawGrid(lineWidth);
    drawField(lineWidth);
    drawTrail(lineWidth);
    drawParticle(lineWidth);

    ctx.restore();
    
    // --- Dibujo de la UI ---
    ctx.font = 'bold 14px monospace';
    const lineHeight = 20;

    // 1. LEYENDA
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    let legendX = 20;
    let legendY = 30;

    // Ajuste responsivo para la leyenda
    if (canvas.width < 400) {
        legendX = 10;
        legendY = 20;
    }

    ctx.fillStyle = '#4ADE80'; ctx.strokeStyle = '#4ADE80'; ctx.lineWidth = 2;
    drawSimpleHorizontalArrow(legendX, legendY);
    ctx.fillText("Velocidad", legendX + 35, legendY + 1);

    legendY += lineHeight * 1.5;
    ctx.fillStyle = '#F472B6'; ctx.strokeStyle = '#F472B6'; ctx.lineWidth = 2;
    drawSimpleHorizontalArrow(legendX, legendY);
    ctx.fillText("Aceleración/Fuerza", legendX + 35, legendY + 1);

    // PANEL DE DATOS
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    let dataY = 20;
    let dataX = canvas.width - 20;
    
    // Ajuste para móvil
    if (canvas.width < 400) {
        dataX = canvas.width - 10;
        dataY = 15;
        ctx.font = 'bold 12px monospace';
    }

    const vSq = particle.vx * particle.vx + particle.vy * particle.vy;
    const vMag = Math.sqrt(vSq);
    const momentum = particle.m * vMag;
    const aMag = Math.sqrt(particle.ax * particle.ax + particle.ay * particle.ay);
    const currentKE = 0.5 * particle.m * vSq;
    const work = currentKE - particle.initialKE;

    ctx.fillStyle = 'white';
    ctx.fillText(`t = ${simulationTime.toFixed(3)} s`, dataX, dataY);
    
    ctx.fillStyle = '#4ADE80'; 
    ctx.fillText(`Momento (p) = ${momentum.toFixed(3)} kg·m/s`, dataX, dataY + lineHeight);

    ctx.fillStyle = '#F472B6'; 
    ctx.fillText(`Aceleración (a) = ${aMag.toFixed(3)} m/s²`, dataX, dataY + lineHeight * 2);

    ctx.fillStyle = '#60A5FA'; 
    ctx.fillText(`Trabajo (W) = ${work.toFixed(3)} J`, dataX, dataY + lineHeight * 3);
}

function drawGrid(lineWidth) {
    const scale = parseFloat(zoomInput.value);
    const viewWidth = canvas.width / scale;
    const viewHeight = canvas.height / scale;
    
    const startX = (-viewWidth / 2) - (panX / scale);
    const endX = (viewWidth / 2) - (panX / scale);
    const startY = (-viewHeight / 2) + (panY / scale);
    const endY = (viewHeight / 2) + (panY / scale);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    
    const exponent = Math.floor(Math.log10(viewWidth / 5)); 
    let step = Math.pow(10, exponent);

    if (viewWidth / step < 4) step /= 2;
    if (viewWidth / step < 4) step /= 2.5;

    ctx.beginPath();

    const xLoopStart = Math.floor(startX / step) * step;
    const xLoopEnd = Math.ceil(endX / step) * step;

    for (let x = xLoopStart; x <= xLoopEnd; x += step) {
        ctx.moveTo(x, startY); 
        ctx.lineTo(x, endY);   
        
        if (Math.abs(x) > 1e-6) { 
            ctx.save();
            ctx.translate(x, 0); 
            ctx.scale(1/scale, -1/scale);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(parseFloat(x.toPrecision(6)).toString(), 0, 8); 
            ctx.restore();
        }
    }

    const yLoopStart = Math.floor(Math.min(startY, endY) / step) * step;
    const yLoopEnd = Math.ceil(Math.max(startY, endY) / step) * step;

    for (let y = yLoopStart; y <= yLoopEnd; y += step) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);

        if (Math.abs(y) > 1e-6) {
            ctx.save();
            ctx.translate(0, y);
            ctx.scale(1/scale, -1/scale);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(parseFloat(y.toPrecision(6)).toString(), -8, 0);
            ctx.restore();
        }
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = lineWidth * 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0); ctx.lineTo(endX, 0); 
    ctx.moveTo(0, startY); ctx.lineTo(0, endY); 
    ctx.stroke();

    ctx.save();
    ctx.translate(0, 0);
    ctx.scale(1/scale, -1/scale);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText("0", -5, 5);
    ctx.restore();
}

function drawField(lineWidth) {
    const scale = parseFloat(zoomInput.value);
    const viewWidth = canvas.width / scale;
    const viewHeight = canvas.height / scale;
    
    const startX = (-viewWidth / 2) - (panX / scale);
    const endX = (viewWidth / 2) - (panX / scale);
    const startY = (-viewHeight / 2) + (panY / scale); 
    const endY = (viewHeight / 2) + (panY / scale);
    
    const density = 2; 

    const xStart = Math.floor(startX/density)*density;
    const xEnd = Math.ceil(endX);
    const yStart = Math.floor(Math.min(startY, endY)/density)*density;
    const yEnd = Math.ceil(Math.max(startY, endY));

    switch (fieldConfig.type) {
        case 'uniform-e':
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            for(let y = yStart; y < yEnd; y += density) {
                for(let x = xStart; x < xEnd; x += density) {
                    drawArrow(x, y, fieldConfig.Ex, fieldConfig.Ey, density * 0.4);
                }
            }
            ctx.stroke();
            break;
        case 'uniform-b':
            ctx.strokeStyle = 'rgba(0, 150, 255, 0.4)';
            ctx.lineWidth = lineWidth;
            const radius = 0.2;
            for(let y = yStart; y < yEnd; y += density) {
                for(let x = xStart; x < xEnd; x += density) {
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                    if (fieldConfig.Bz > 0) {
                        ctx.beginPath();
                        ctx.arc(x, y, radius * 0.2, 0, 2 * Math.PI);
                        ctx.fill();
                    } else if (fieldConfig.Bz < 0) {
                        ctx.beginPath();
                        ctx.moveTo(x - radius*0.7, y - radius*0.7);
                        ctx.lineTo(x + radius*0.7, y + radius*0.7);
                        ctx.moveTo(x - radius*0.7, y + radius*0.7);
                        ctx.lineTo(x + radius*0.7, y - radius*0.7);
                        ctx.stroke();
                    }
                }
            }
            break;
        case 'radial-e':
            ctx.fillStyle = (fieldConfig.kQ > 0) ? 'rgba(255, 100, 100, 0.8)' : 'rgba(100, 100, 255, 0.8)';
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.arc(0, 0, 0.5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            const numLines = 16;
            const maxDist = Math.max(viewWidth, viewHeight) + Math.abs(panX/scale) + Math.abs(panY/scale);
            
            for (let i = 0; i < numLines; i++) {
                const angle = (i / numLines) * 2 * Math.PI;
                const dx = Math.cos(angle);
                const dy = Math.sin(angle);
                const arrowDir = (fieldConfig.kQ > 0) ? 1 : -1;
                ctx.moveTo(dx * 0.7, dy * 0.7);
                ctx.lineTo(dx * maxDist, dy * maxDist);
                drawArrow(dx*5, dy*5, dx*arrowDir, dy*arrowDir, 1);
                drawArrow(dx*10, dy*10, dx*arrowDir, dy*arrowDir, 1);
            }
            ctx.stroke();
            break;
    }
}

function drawArrow(x, y, vx, vy, length) {
    const angle = Math.atan2(vy, vx);
    const len = Math.sqrt(vx*vx + vy*vy);
    if (len < 1e-6) return;
    
    const nx = vx / len;
    const ny = vy / len;

    ctx.moveTo(x, y);
    ctx.lineTo(x + nx * length, y + ny * length);
    
    const arrowSize = length * 0.4;
    ctx.moveTo(x + nx * length, y + ny * length);
    ctx.lineTo(x + nx * length - arrowSize * (Math.cos(angle - Math.PI/6)), y + ny * length - arrowSize * (Math.sin(angle - Math.PI/6)));
    ctx.moveTo(x + nx * length, y + ny * length);
    ctx.lineTo(x + nx * length - arrowSize * (Math.cos(angle + Math.PI/6)), y + ny * length - arrowSize * (Math.sin(angle + Math.PI/6)));
}

function drawTrail(lineWidth) {
    if (history.length < 2) return;

    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = lineWidth * 2;
    ctx.beginPath();
    ctx.moveTo(history[0].x, history[0].y);
    for (let i = 1; i < history.length; i++) {
        ctx.lineTo(history[i].x, history[i].y);
    }
    ctx.stroke();
}

function drawParticle(lineWidth) {
    const particleRadius = 4 * lineWidth; 
    
    // Dibujar el cuerpo de la partícula
    ctx.fillStyle = (particle.q > 0) ? '#FF4136' : '#0074D9';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particleRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Dibujar Vector Velocidad (VERDE)
    ctx.strokeStyle = '#4ADE80'; 
    ctx.fillStyle = '#4ADE80';
    ctx.lineWidth = lineWidth * 1.5;
    drawVectorArrow(particle.x, particle.y, particle.vx, particle.vy, 0.15);

    // Dibujar Vector Aceleración (ROSA)
    ctx.strokeStyle = '#F472B6'; 
    ctx.fillStyle = '#F472B6';
    ctx.lineWidth = lineWidth * 1.5;
    drawVectorArrow(particle.x, particle.y, particle.ax, particle.ay, 0.25);
}

/**
 * Función auxiliar con TOPE MÁXIMO en unidades de simulación (cuadros)
 */
function drawVectorArrow(x, y, vx, vy, scaleFactor) {
    const len = Math.sqrt(vx*vx + vy*vy);
    if (len < 0.1) return; 

    const maxLen = 2.5; 
    let arrowLen = len * scaleFactor;
    
    if (arrowLen > maxLen) {
        arrowLen = maxLen;
    }
    
    const nx = vx / len;
    const ny = vy / len;
    
    const endX = x + nx * arrowLen;
    const endY = y + ny * arrowLen;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    const headSize = 0.5; 
    const angle = Math.atan2(ny, nx);
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headSize * Math.cos(angle - Math.PI/6), endY - headSize * Math.sin(angle - Math.PI/6));
    ctx.lineTo(endX - headSize * Math.cos(angle + Math.PI/6), endY - headSize * Math.sin(angle + Math.PI/6));
    ctx.fill();
}

function drawSimpleHorizontalArrow(x, y) {
    const arrowLen = 25;
    const headSize = 5;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + arrowLen, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + arrowLen, y);
    ctx.lineTo(x + arrowLen - headSize, y - headSize/2);
    ctx.lineTo(x + arrowLen - headSize, y + headSize/2);
    ctx.closePath();
    ctx.fill();
}
