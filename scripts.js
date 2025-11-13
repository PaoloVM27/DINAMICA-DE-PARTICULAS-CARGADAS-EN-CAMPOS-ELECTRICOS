// === VARIABLES GLOBALES ===
let canvas, ctx;
let particle;
let fieldConfig;
let history = []; // Historial de posiciones para la estela
let animationId = null;
let lastTime = 0;

// Parámetros de simulación
const SIM_STEPS_PER_FRAME = 10; // Pasos de física por frame de animación
const DT = 0.005; // Paso de tiempo fijo para el integrador (dt)
const EPSILON = 0.1; // Para evitar división por cero en campo radial (PDF p.10)

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

const presetSelect = document.getElementById('preset-examples'); // <-- NUEVO

const trailLengthInput = document.getElementById('trail-length');
const zoomInput = document.getElementById('zoom');

const startBtn = document.getElementById('start-sim');
const stopBtn = document.getElementById('stop-sim');
const resetBtn = document.getElementById('reset-sim');

// === INICIALIZACIÓN ===

document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('simulationCanvas');
    ctx = canvas.getContext('2d');
    
    // Asignar eventos
    startBtn.addEventListener('click', startSimulation);
    stopBtn.addEventListener('click', stopSimulation);
    resetBtn.addEventListener('click', resetSimulation);
    fieldTypeSelect.addEventListener('change', updateFieldOptions);
    presetSelect.addEventListener('change', applyPreset); // <-- NUEVO
    
    // Ajustar canvas al tamaño del contenedor
    window.addEventListener('resize', resizeCanvas);
    
    // Configuración inicial
    updateFieldOptions();
    resizeCanvas();
    resetSimulation();
});

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    // Al redimensionar, dibujar el estado actual
    draw(); 
}

// === LÓGICA DE LA SIMULACIÓN ===

// Objeto con las configuraciones predeterminadas
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
    if (animationId) {
        stopSimulation(); // Pausar si ya está corriendo
    }
    
    // Leer todos los valores de los inputs
    setupParticleAndField();
    
    // Iniciar el bucle de animación
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
    setupParticleAndField();
    draw();
}

function setupParticleAndField() {
    // Crear partícula
    particle = {
        q: parseFloat(chargeInput.value),
        m: parseFloat(massInput.value),
        x: parseFloat(x0Input.value),
        y: parseFloat(y0Input.value),
        vx: parseFloat(vx0Input.value),
        vy: parseFloat(vy0Input.value),
    };
    
    // Limpiar historial
    history = [{ x: particle.x, y: particle.y }];

    // Configurar el campo
    fieldConfig = {
        type: fieldTypeSelect.value,
        Ex: parseFloat(fieldExInput.value),
        Ey: parseFloat(fieldEyInput.value),
        Bz: parseFloat(fieldBzInput.value),
        kQ: parseFloat(fieldKqInput.value),
    };
}

/**
 * Actualiza la UI para mostrar solo los inputs del campo seleccionado
 */
function updateFieldOptions() {
    uniformEInputs.classList.toggle('hidden', fieldTypeSelect.value !== 'uniform-e');
    uniformBInputs.classList.toggle('hidden', fieldTypeSelect.value !== 'uniform-b');
    radialEInputs.classList.toggle('hidden', fieldTypeSelect.value !== 'radial-e');
    
    updatePresetOptions(); // <-- NUEVO: Actualizar ejemplos
    
    // Al cambiar de tipo, reiniciar la simulación para evitar confusión
    resetSimulation();
}

/**
 * NUEVO: Rellena el dropdown de ejemplos según el tipo de campo
 */
function updatePresetOptions() {
    const fieldType = fieldTypeSelect.value;
    const currentPresets = presets[fieldType] || [];
    
    presetSelect.innerHTML = ''; // Limpiar opciones anteriores
    
    currentPresets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.name; // Usar nombre como valor
        option.textContent = preset.name;
        presetSelect.appendChild(option);
    });
}

/**
 * NUEVO: Aplica los valores de un ejemplo predeterminado
 */
function applyPreset() {
    const fieldType = fieldTypeSelect.value;
    const presetName = presetSelect.value;
    
    const presetList = presets[fieldType] || [];
    const selectedPreset = presetList.find(p => p.name === presetName);

    if (selectedPreset && selectedPreset.values) {
        const { values } = selectedPreset;
        
        // Poblar campos de partícula
        if (values.charge !== undefined) chargeInput.value = values.charge;
        if (values.mass !== undefined) massInput.value = values.mass;
        if (values.x0 !== undefined) x0Input.value = values.x0;
        if (values.y0 !== undefined) y0Input.value = values.y0;
        if (values.vx0 !== undefined) vx0Input.value = values.vx0;
        if (values.vy0 !== undefined) vy0Input.value = values.vy0;

        // Poblar campos específicos del campo
        if (fieldType === 'uniform-e') {
            if (values.ex !== undefined) fieldExInput.value = values.ex;
            if (values.ey !== undefined) fieldEyInput.value = values.ey;
        } else if (fieldType === 'uniform-b') {
            if (values.bz !== undefined) fieldBzInput.value = values.bz;
        } else if (fieldType === 'radial-e') {
            if (values.kq !== undefined) fieldKqInput.value = values.kq;
        }
        
        // Reiniciar la simulación para mostrar los cambios
        resetSimulation();
    }
}

// === BUCLE PRINCIPAL Y FÍSICA ===

/**
 * Bucle principal de animación
 */
function animate(timestamp) {
    animationId = requestAnimationFrame(animate);

    // Control de tiempo para pasos de física fijos
    // Esto evita que la simulación se acelere o ralentice
    let elapsedTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Realizar múltiples pasos de física por frame para mayor precisión
    // sin depender de la tasa de frames
    for (let i = 0; i < SIM_STEPS_PER_FRAME; i++) {
        updateParticle(DT); // Usar el paso de tiempo fijo DT
    }

    draw();
}

/**
 * Actualiza el estado de la partícula usando el integrador Euler-Cromer
 * Basado en F = q(E + v x B) => a = (q/m) * (E + v x B)
 */
function updateParticle(dt) {
    const q_m = particle.q / particle.m;

    // 1. Obtener campos en la posición actual
    const { Ex, Ey, Bz } = getFields(particle.x, particle.y, fieldConfig);

    // 2. Calcular aceleración (Fuerza de Lorentz en 2D)
    // F_x = q*E_x + q*(v_y * B_z)
    // F_y = q*E_y - q*(v_x * B_z)
    const ax = q_m * (Ex + particle.vy * Bz);
    const ay = q_m * (Ey - particle.vx * Bz);

    // 3. Actualizar velocidad (Integración Euler-Cromer)
    particle.vx += ax * dt;
    particle.vy += ay * dt;

    // 4. Actualizar posición (Integración Euler-Cromer)
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    // 5. Guardar historial para la estela
    history.push({ x: particle.x, y: particle.y });
    const maxTrail = parseInt(trailLengthInput.value);
    while (history.length > maxTrail) {
        history.shift();
    }
}

/**
 * Devuelve los componentes del campo en una posición (x, y)
 */
function getFields(x, y, config) {
    switch (config.type) {
        case 'uniform-e':
            // Campo E constante
            return { Ex: config.Ex, Ey: config.Ey, Bz: 0 };
        
        case 'uniform-b':
            // Campo B constante
            return { Ex: 0, Ey: 0, Bz: config.Bz };
        
        case 'radial-e':
            // Campo E de una carga puntual en el origen (ley de Coulomb)
            // E = (k*Q / r^2) * r_unitario = (k*Q / r^3) * r_vector
            const r_sq = x*x + y*y + EPSILON; // r^2, con épsilon para evitar singularidad
            const r_cubed = Math.pow(r_sq, 1.5); // r^3
            const Ex = config.kQ * x / r_cubed;
            const Ey = config.kQ * y / r_cubed;
            return { Ex, Ey, Bz: 0 };
        
        default:
            return { Ex: 0, Ey: 0, Bz: 0 };
    }
}

// === FUNCIONES DE DIBUJO ===

/**
 * Dibuja todo en el canvas
 */
function draw() {
    if (!ctx) return;

    const scale = parseFloat(zoomInput.value);
    const originX = canvas.width / 2;
    const originY = canvas.height / 2;
    
    // Limpiar canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Guardar estado del contexto y aplicar transformación
    // (Mover origen al centro e invertir eje Y)
    ctx.save();
    ctx.translate(originX, originY);
    ctx.scale(scale, -scale); // Escala y Y-flip
    
    const lineWidth = 1 / scale; // Ancho de línea constante

    drawGrid(lineWidth);
    drawField(lineWidth);
    drawTrail(lineWidth);
    drawParticle(lineWidth);

    // Restaurar estado del contexto
    ctx.restore();
}

/**
 * Dibuja la cuadrícula de fondo
 */
function drawGrid(lineWidth) {
    const scale = parseFloat(zoomInput.value);
    const viewWidth = canvas.width / scale;
    const viewHeight = canvas.height / scale;
    
    const xMin = -viewWidth / 2;
    const xMax = viewWidth / 2;
    const yMin = -viewHeight / 2;
    const yMax = viewHeight / 2;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = lineWidth;

    const step = Math.pow(10, Math.floor(Math.log10(viewWidth / 5))); // 1, 5, 10, etc.

    ctx.beginPath();
    // Líneas verticales
    for (let x = Math.floor(xMin / step) * step; x <= xMax; x += step) {
        ctx.moveTo(x, yMin);
        ctx.lineTo(x, yMax);
    }
    // Líneas horizontales
    for (let y = Math.floor(yMin / step) * step; y <= yMax; y += step) {
        ctx.moveTo(xMin, y);
        ctx.lineTo(xMax, y);
    }
    ctx.stroke();

    // Ejes principales
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = lineWidth * 2;
    ctx.beginPath();
    ctx.moveTo(xMin, 0); ctx.lineTo(xMax, 0); // Eje X
    ctx.moveTo(0, yMin); ctx.lineTo(0, yMax); // Eje Y
    ctx.stroke();
}

/**
 * Dibuja una representación visual del campo
 */
function drawField(lineWidth) {
    const scale = parseFloat(zoomInput.value);
    const viewWidth = canvas.width / scale;
    const viewHeight = canvas.height / scale;
    const xMin = -viewWidth / 2;
    const xMax = viewWidth / 2;
    const yMin = -viewHeight / 2;
    const yMax = viewHeight / 2;
    const density = 2; // Unidades de simulación entre líneas/símbolos

    switch (fieldConfig.type) {
        case 'uniform-e':
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)'; // Amarillo para E
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            for(let y = Math.floor(yMin/density)*density; y < yMax; y += density) {
                for(let x = Math.floor(xMin/density)*density; x < xMax; x += density) {
                    drawArrow(x, y, fieldConfig.Ex, fieldConfig.Ey, density * 0.4);
                }
            }
            ctx.stroke();
            break;
        case 'uniform-b':
            ctx.strokeStyle = 'rgba(0, 150, 255, 0.4)'; // Azul para B
            ctx.lineWidth = lineWidth;
            const radius = 0.2;
            for(let y = Math.floor(yMin/density)*density; y < yMax; y += density) {
                for(let x = Math.floor(xMin/density)*density; x < xMax; x += density) {
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                    if (fieldConfig.Bz > 0) { // Saliendo (punto)
                        ctx.beginPath();
                        ctx.arc(x, y, radius * 0.2, 0, 2 * Math.PI);
                        ctx.fill();
                    } else if (fieldConfig.Bz < 0) { // Entrando (cruz)
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
            // Dibujar carga central
            ctx.beginPath();
            ctx.arc(0, 0, 0.5, 0, 2 * Math.PI);
            ctx.fill();
            // Dibujar líneas de campo
            ctx.beginPath();
            const numLines = 16;
            for (let i = 0; i < numLines; i++) {
                const angle = (i / numLines) * 2 * Math.PI;
                const dx = Math.cos(angle);
                const dy = Math.sin(angle);
                const arrowDir = (fieldConfig.kQ > 0) ? 1 : -1;
                ctx.moveTo(dx * 0.7, dy * 0.7);
                ctx.lineTo(dx * xMax, dy * yMax);
                drawArrow(dx*5, dy*5, dx*arrowDir, dy*arrowDir, 1);
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

/**
 * Dibuja la estela de la partícula
 */
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

/**
 * Dibuja la partícula
 */
function drawParticle(lineWidth) {
    const particleRadius = 4 * lineWidth; // 4 píxeles de radio
    
    // Color según la carga
    ctx.fillStyle = (particle.q > 0) ? '#FF4136' : '#0074D9'; // Rojo o Azul
    ctx.strokeStyle = 'white';
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particleRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
}