/**
 * Morphism UI Lab - Logic and Generators
 */

// DOM Elements
const root = document.documentElement;
const previewArea = document.getElementById('preview-area');
const blobs = document.getElementById('blobs');
const styleTabs = document.querySelectorAll('.segment-btn');
const copyBtn = document.getElementById('copy-btn');
const toast = document.getElementById('toast');
const toggleEl = document.getElementById('preview-toggle');

// Parameters Input
const inputs = {
  baseColor: document.getElementById('base-color'),
  shadowDist: document.getElementById('shadow-dist'),
  shadowIntensity: document.getElementById('shadow-intensity'),
  blur: document.getElementById('blur'),
  opacity: document.getElementById('opacity'),
  borderRadius: document.getElementById('border-radius'),
};

// Value Displays
const vals = {
  baseColor: document.getElementById('base-color-val'),
  shadowDist: document.getElementById('shadow-dist-val'),
  shadowIntensity: document.getElementById('shadow-intensity-val'),
  blur: document.getElementById('blur-val'),
  opacity: document.getElementById('opacity-val'),
  borderRadius: document.getElementById('border-radius-val'),
};

// Groups
const groups = {
  intensity: document.getElementById('intensity-group'),
  blur: document.getElementById('blur-group'),
  opacity: document.getElementById('opacity-group'),
};

// State
let currentStyle = 'neumorphism';

// --- Initialization ---
function init() {
  bindEvents();
  applyStyleTheme(currentStyle);
  updateAllVariables();
}

// --- Events Binding ---
function bindEvents() {
  // Tabs behavior
  styleTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      styleTabs.forEach(t => t.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      applyStyleTheme(target.dataset.style);
    });
  });

  // Slider and Color Picker events (binding to both input and change for complete real-time safety)
  Object.keys(inputs).forEach(key => {
    const el = inputs[key];
    const updateHandler = (e) => {
      updateSingleVariable(key, e.target.value);
    };
    el.addEventListener('input', updateHandler);
    el.addEventListener('change', updateHandler);
  });

  // Copy CSS Action
  copyBtn.addEventListener('click', generateAndCopyCSS);

  // Toggle Switch Action
  toggleEl.addEventListener('click', () => {
    const isChecked = toggleEl.getAttribute('aria-checked') === 'true';
    toggleEl.setAttribute('aria-checked', !isChecked);
    toggleEl.classList.add('active');
    setTimeout(() => toggleEl.classList.remove('active'), 150);
  });
  
  // Enter key on toggle
  toggleEl.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleEl.click();
    }
  });
}

// --- Parameter Handling ---

function applyStyleTheme(style) {
  currentStyle = style;
  previewArea.setAttribute('data-theme', style);
  
  // Visibility toggles
  if (style === 'glassmorphism') {
    groups.blur.style.display = 'block';
    groups.opacity.style.display = 'block';
    groups.intensity.style.display = 'none'; 
    blobs.style.display = 'block';           
  } else {
    groups.blur.style.display = 'none';
    groups.opacity.style.display = 'none';
    groups.intensity.style.display = 'block';
    blobs.style.display = 'none';
  }
}

// Individually update CSS root elements in real-time
function updateSingleVariable(key, value) {
  let unit = '';
  if (['shadowDist', 'blur', 'borderRadius'].includes(key)) unit = 'px';
  if (['shadowIntensity', 'opacity'].includes(key)) unit = '%';

  vals[key].textContent = value + unit;
  
  // Format CSS Property Name (e.g. shadowDist -> --shadow-dist)
  const cssProp = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
  root.style.setProperty(cssProp, value + unit);
}

// Initialize variables by running through each input
function updateAllVariables() {
  Object.keys(inputs).forEach(key => {
    updateSingleVariable(key, inputs[key].value);
  });
}

// --- Security ---
function sanitizeInput(el) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  const rawValue = el.value;
  el.value = rawValue.replace(reg, (match)=>(map[match]));
}

// --- CSS Code Generation ---
function generateAndCopyCSS() {
  const baseColor = inputs.baseColor.value;
  const dist = inputs.shadowDist.value + 'px';
  const intensity = inputs.shadowIntensity.value + '%';
  const blur = inputs.blur.value + 'px';
  const opacity = inputs.opacity.value + '%';
  const radius = inputs.borderRadius.value + 'px';

  let cssOutput = `/* Morphism UI Lab - Generated Custom CSS */
.morphism-element {
  border-radius: ${radius};
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
`;

  if (currentStyle === 'neumorphism') {
    cssOutput += `  background-color: ${baseColor};
  border: none;
  /* Soft Box Shadow Formula */
  box-shadow: 
    ${dist} ${dist} calc(${dist} * 2) color-mix(in srgb, ${baseColor}, black ${intensity}),
    calc(${dist} * -1) calc(${dist} * -1) calc(${dist} * 2) color-mix(in srgb, ${baseColor}, white calc(${intensity} * 4));
}

/* Form inputs & Pressed button state */
.morphism-element:active,
.morphism-element.pressed {
  box-shadow: 
    inset ${dist} ${dist} calc(${dist} * 2) color-mix(in srgb, ${baseColor}, black ${intensity}),
    inset calc(${dist} * -1) calc(${dist} * -1) calc(${dist} * 2) color-mix(in srgb, ${baseColor}, white calc(${intensity} * 4));
}`;
  } 
  else if (currentStyle === 'glassmorphism') {
    cssOutput += `  background: color-mix(in srgb, ${baseColor}, transparent calc(100% - ${opacity}));
  backdrop-filter: blur(${blur});
  -webkit-backdrop-filter: blur(${blur});
  border: 1px solid color-mix(in srgb, white, transparent 50%);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
}`;
  } 
  else if (currentStyle === 'claymorphism') {
    cssOutput += `  background-color: ${baseColor};
  border: none;
  box-shadow: 
    calc(${dist} * 0.8) calc(${dist} * 0.8) calc(${dist} * 1.5) rgba(0,0,0,0.1),
    inset calc(${dist} * -1) calc(${dist} * -1) calc(${dist} * 1.5) color-mix(in srgb, ${baseColor}, black ${intensity}),
    inset ${dist} ${dist} calc(${dist} * 1.2) color-mix(in srgb, ${baseColor}, white 80%);
}`;
  }

  navigator.clipboard.writeText(cssOutput).then(() => {
    showToast();
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    alert('Failed to copy.');
  });
}

function showToast() {
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// Run app
init();
