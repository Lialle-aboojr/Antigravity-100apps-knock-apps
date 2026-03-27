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
  updateAllVariables(); // Ensure initial values pass properly to CSS root
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

  // Slider and Color Picker events
  // Attaching to both 'input' and 'change' handles drag in real-time reliably
  Object.keys(inputs).forEach(key => {
    const el = inputs[key];
    el.addEventListener('input', (e) => {
      updateSingleVariable(key, e.target.value);
    });
    el.addEventListener('change', (e) => {
      updateSingleVariable(key, e.target.value);
    });
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
  
  // Visibility toggles
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
    groups.intensity.style.display = 'flex'; // Changed to flex to preserve layout
    blobs.style.display = 'none';
  }
}

// Update single CSS custom property on the Document Root
function updateSingleVariable(key, value) {
  let unit = '';
  if (['shadowDist', 'blur', 'borderRadius'].includes(key)) unit = 'px';
  if (['shadowIntensity', 'opacity'].includes(key)) unit = '%';

  vals[key].textContent = value + unit;
  
  // Transform camelCase keys to kebab-case CSS vars (e.g. shadowDist -> --shadow-dist)
  const cssProp = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
  
  // Write the variable reliably to root
  root.style.setProperty(cssProp, value + unit);
}

// Run through all inputs entirely once
function updateAllVariables() {
  Object.keys(inputs).forEach(key => {
    updateSingleVariable(key, inputs[key].value);
  });
}

// Make sure users input doesn't inject scripts when reflecting inside a tool area.
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

  // Fallback support for copying CSS securely
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

// Kick off immediately. 
init();
