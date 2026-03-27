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

// Interactive Preview Slider elements
const previewRange = document.getElementById('preview-interactive-range');
const previewFill = document.getElementById('preview-fill-elem');
const previewVal = document.getElementById('preview-interactive-val');

// State
let currentStyle = 'neumorphism';

// --- Initialization ---
function init() {
  bindEvents();
  applyStyleTheme(currentStyle);
  updateAllVariables(); // Evaluate everything explicitly on boot
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

  // Main UI Sliders - both input and change for drag and drop reliable tracking
  Object.keys(inputs).forEach(key => {
    const el = inputs[key];
    const triggerUpdate = () => {
      updateSingleVariable(key, el.value);
      updateDependentColors(); // Instantly calculate required colors safely in JS
    };
    el.addEventListener('input', triggerUpdate);
    el.addEventListener('change', triggerUpdate);
  });

  // Interactive UI Preview Slider binding
  previewRange.addEventListener('input', (e) => {
    const val = e.target.value;
    previewVal.textContent = val + '%';
    previewFill.style.width = val + '%';
  });

  // Copy CSS Action
  copyBtn.addEventListener('click', generateAndCopyCSS);

  // Toggle Switch Action
  toggleEl.addEventListener('click', () => {
    const isChecked = toggleEl.getAttribute('aria-checked') === 'true';
    toggleEl.setAttribute('aria-checked', !isChecked);
  });
  
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
  
  if (style === 'glassmorphism') {
    groups.blur.style.display = 'flex';
    groups.opacity.style.display = 'flex';
    groups.intensity.style.display = 'none'; 
    blobs.style.display = 'block';           
  } else if (style === 'flat') {
    groups.blur.style.display = 'none';
    groups.opacity.style.display = 'none';
    groups.intensity.style.display = 'none'; 
    blobs.style.display = 'none';
  } else {
    // Neumorphism & Claymorphism
    groups.blur.style.display = 'none';
    groups.opacity.style.display = 'none';
    groups.intensity.style.display = 'flex'; 
    blobs.style.display = 'none';
  }
}

function updateSingleVariable(key, value) {
  let unit = '';
  if (['shadowDist', 'blur', 'borderRadius'].includes(key)) unit = 'px';
  if (['shadowIntensity', 'opacity'].includes(key)) unit = '%';

  vals[key].textContent = value + unit;
  const cssProp = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
  root.style.setProperty(cssProp, value + unit);
}

// Critical fix: We generate the light/dark/glass mix outputs in Vanilla JS and attach them to root
// This prevents older Safari / broken CSS nested calc bugs on `color-mix` with `var()` percentages.
function updateDependentColors() {
  const baseHEX = inputs.baseColor.value; // e.g. #e0e5ec
  const intensity = inputs.shadowIntensity.value; // 0-100
  const opacityInner = inputs.opacity.value; // 0-100

  // Neumorphism/Claymorphism Dynamic Shadows using browser native color-mix support explicitly injected
  const darkShadow = `color-mix(in srgb, ${baseHEX}, black ${intensity}%)`;
  const lightShadow = `color-mix(in srgb, ${baseHEX}, white calc(${intensity}% * 4))`;
  const clayHighlight = `color-mix(in srgb, ${baseHEX}, white 80%)`;
  
  // Glassmorphism overlays
  const glassBg = `color-mix(in srgb, ${baseHEX}, transparent calc(100% - ${opacityInner}%))`;
  const glassBorder = `color-mix(in srgb, white, transparent 50%)`;

  root.style.setProperty('--dark-shadow', darkShadow);
  root.style.setProperty('--light-shadow', lightShadow);
  root.style.setProperty('--clay-highlight', clayHighlight);
  root.style.setProperty('--glass-bg', glassBg);
  root.style.setProperty('--glass-border', glassBorder);
}

function updateAllVariables() {
  Object.keys(inputs).forEach(key => {
    updateSingleVariable(key, inputs[key].value);
  });
  updateDependentColors();
}

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
  /* Box Shadow Formula */
  box-shadow: 
    ${dist} ${dist} calc(${dist} * 2) color-mix(in srgb, ${baseColor}, black ${intensity}),
    calc(${dist} * -1) calc(${dist} * -1) calc(${dist} * 2) color-mix(in srgb, ${baseColor}, white calc(${intensity} * 4));
}

.morphism-element:active {
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
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.05);
}`;
  } 
  else if (currentStyle === 'claymorphism') {
    cssOutput += `  background-color: ${baseColor};
  border: none;
  box-shadow: 
    calc(${dist} * 0.8) calc(${dist} * 0.8) calc(${dist} * 1.2) rgba(0,0,0,0.08),
    inset calc(${dist} * -1) calc(${dist} * -1) calc(${dist} * 1.5) color-mix(in srgb, ${baseColor}, black ${intensity}),
    inset ${dist} ${dist} calc(${dist} * 1.2) color-mix(in srgb, ${baseColor}, white 80%);
}`;
  }
  else if (currentStyle === 'flat') {
    cssOutput += `  background-color: ${baseColor};
  border: 1px solid color-mix(in srgb, ${baseColor}, black 10%);
  box-shadow: none;
}`;
  }

  // Support for copying CSS
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

init();
