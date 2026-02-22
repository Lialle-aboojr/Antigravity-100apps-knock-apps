// DOM Elements
const body = document.body;
const inputs = {
    type: document.getElementsByName('type'),
    mode: document.getElementsByName('mode'),
    color1: document.getElementById('color-1'),
    color2: document.getElementById('color-2'),
    color3: document.getElementById('color-3'),
    angle: document.getElementById('angle-slider')
};
const displays = {
    color3Wrapper: document.getElementById('color-3-wrapper'),
    angleGroup: document.querySelector('.angle-group'),
    angleValue: document.getElementById('angle-value'),
    toast: document.getElementById('toast')
};
const copyBtn = document.getElementById('copy-btn');

// State
let currentState = {
    type: 'linear', // 'linear' or 'radial'
    mode: '2', // '2' or '3'
    colors: [inputs.color1.value, inputs.color2.value, inputs.color3.value],
    angle: 45
};

// --- Initialization ---
function init() {
    addEventListeners();
    updateGradient();
}

// --- Event Listeners ---
function addEventListeners() {
    // Type Switching
    inputs.type.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                currentState.type = e.target.value;
                toggleTypeUI();
                updateGradient();
            }
        });
    });

    // Mode Switching
    inputs.mode.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                currentState.mode = e.target.value;
                toggleModeUI();
                updateGradient();
            }
        });
    });

    // Color Inputs
    inputs.color1.addEventListener('input', (e) => handleColorChange(0, e.target.value));
    inputs.color2.addEventListener('input', (e) => handleColorChange(1, e.target.value));
    inputs.color3.addEventListener('input', (e) => handleColorChange(2, e.target.value));

    // Angle Input
    inputs.angle.addEventListener('input', (e) => {
        currentState.angle = e.target.value;
        displays.angleValue.textContent = `${currentState.angle}deg`;
        updateGradient();
    });

    // Copy Button
    copyBtn.addEventListener('click', copyToClipboard);
}

// --- Logic Helpers ---

// Handle color input changes
function handleColorChange(index, value) {
    currentState.colors[index] = value;
    updateGradient();
}

// Toggle UI elements based on selected type
function toggleTypeUI() {
    if (currentState.type === 'radial') {
        displays.angleGroup.classList.add('hidden');
    } else {
        displays.angleGroup.classList.remove('hidden');
    }
}

// Toggle UI elements based on selected mode
function toggleModeUI() {
    if (currentState.mode === '3') {
        displays.color3Wrapper.classList.remove('hidden');
    } else {
        displays.color3Wrapper.classList.add('hidden');
    }
}

// Generate CSS Gradient String
function getGradientString() {
    const { type, mode, colors, angle } = currentState;
    let colorString = '';

    if (mode === '2') {
        colorString = `${colors[0]}, ${colors[1]}`;
    } else {
        colorString = `${colors[0]}, ${colors[1]}, ${colors[2]}`;
    }

    if (type === 'radial') {
        return `radial-gradient(circle, ${colorString})`;
    } else {
        return `linear-gradient(${angle}deg, ${colorString})`;
    }
}

// Update the background and other UI relying on the gradient
function updateGradient() {
    const gradientCSS = getGradientString();
    body.style.background = gradientCSS;
}

// Copy to Clipboard logic
function copyToClipboard() {
    const gradientCSS = getGradientString() + ';';

    // Modern Clipboard API
    navigator.clipboard.writeText(gradientCSS).then(() => {
        showToast();
    }).catch(err => {
        console.error('Failed to copy: ', err);
        // Fallback or error handling could go here
    });
}

// Show temporary toast notification
function showToast() {
    displays.toast.classList.remove('hidden');

    // Hide after 3 seconds
    setTimeout(() => {
        displays.toast.classList.add('hidden');
    }, 3000);
}

// Start the app
init();
