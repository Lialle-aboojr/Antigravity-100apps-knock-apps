/**
 * Type Try: Google Fonts 試着室
 * Script.js
 * 
 * Defines the font list and handles real-time updates.
 */

// 1. Font Definition (50 Fonts)
const fonts = [
    // Japanese Fonts (15)
    { name: "Noto Sans JP", family: "'Noto Sans JP', sans-serif" },
    { name: "Noto Serif JP", family: "'Noto Serif JP', serif" },
    { name: "Zen Maru Gothic", family: "'Zen Maru Gothic', sans-serif" },
    { name: "Zen Kurenaido", family: "'Zen Kurenaido', sans-serif" },
    { name: "Potta One", family: "'Potta One', cursive" },
    { name: "Dela Gothic One", family: "'Dela Gothic One', cursive" },
    { name: "Hachi Maru Pop", family: "'Hachi Maru Pop', cursive" },
    { name: "Reggae One", family: "'Reggae One', cursive" },
    { name: "RocknRoll One", family: "'RocknRoll One', sans-serif" },
    { name: "Stick", family: "'Stick', sans-serif" },
    { name: "DotGothic16", family: "'DotGothic16', sans-serif" },
    { name: "Kaisei Decol", family: "'Kaisei Decol', serif" },
    { name: "Rampart One", family: "'Rampart One', cursive" },
    { name: "Yusei Magic", family: "'Yusei Magic', sans-serif" },
    { name: "Shippori Mincho", family: "'Shippori Mincho', serif" },

    // English/Latin - Display & Decorative
    { name: "Lobster", family: "'Lobster', cursive" },
    { name: "Pacifico", family: "'Pacifico', cursive" },
    { name: "Bangers", family: "'Bangers', cursive" },
    { name: "Creepster", family: "'Creepster', cursive" },
    { name: "Fredericka the Great", family: "'Fredericka the Great', cursive" },
    { name: "Monoton", family: "'Monoton', cursive" },
    { name: "Bungee Shade", family: "'Bungee Shade', cursive" },
    { name: "Press Start 2P", family: "'Press Start 2P', cursive" },
    { name: "Rubik Mono One", family: "'Rubik Mono One', sans-serif" },
    { name: "Righteous", family: "'Righteous', cursive" },
    { name: "Abril Fatface", family: "'Abril Fatface', cursive" },
    { name: "Alfa Slab One", family: "'Alfa Slab One', cursive" },
    { name: "Cinzel", family: "'Cinzel', serif" },
    { name: "UnifrakturMaguntia", family: "'UnifrakturMaguntia', cursive" },
    { name: "Wallpoet", family: "'Wallpoet', cursive" },

    // English/Latin - Handwriting
    { name: "Dancing Script", family: "'Dancing Script', cursive" },
    { name: "Caveat", family: "'Caveat', cursive" },
    { name: "Shadows Into Light", family: "'Shadows Into Light', cursive" },
    { name: "Indie Flower", family: "'Indie Flower', cursive" },
    { name: "Amatic SC", family: "'Amatic SC', cursive" },
    { name: "Permanent Marker", family: "'Permanent Marker', cursive" },
    { name: "Sacramento", family: "'Sacramento', cursive" },
    { name: "Satisfy", family: "'Satisfy', cursive" },
    { name: "Great Vibes", family: "'Great Vibes', cursive" },

    // English/Latin - Modern / Sci-Fi
    { name: "Orbitron", family: "'Orbitron', sans-serif" },
    { name: "Audiowide", family: "'Audiowide', cursive" },
    { name: "Chakra Petch", family: "'Chakra Petch', sans-serif" },
    { name: "Rajdhani", family: "'Rajdhani', sans-serif" },
    { name: "Syncopate", family: "'Syncopate', sans-serif" },

    // English/Latin - Classic / Standard
    { name: "Roboto", family: "'Roboto', sans-serif" },
    { name: "Open Sans", family: "'Open Sans', sans-serif" },
    { name: "Montserrat", family: "'Montserrat', sans-serif" },
    { name: "Lato", family: "'Lato', sans-serif" },
    { name: "Playfair Display", family: "'Playfair Display', serif" },
    { name: "Oswald", family: "'Oswald', sans-serif" },
];

// 2. DOM Elements
const fontGrid = document.getElementById('font-grid');
const textInput = document.getElementById('preview-text');
const sizeInput = document.getElementById('font-size');
const textColorInput = document.getElementById('text-color');
const bgColorInput = document.getElementById('bg-color');
const body = document.body;

// 3. Render Functions
function createFontCard(font) {
    const card = document.createElement('div');
    card.className = 'font-card';
    
    // Header Info
    const info = document.createElement('div');
    info.className = 'font-info';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'font-name';
    nameSpan.textContent = font.name;
    
    info.appendChild(nameSpan);

    // Preview Text
    const preview = document.createElement('div');
    preview.className = 'font-preview';
    // Initial Styles
    preview.style.fontFamily = font.family;
    preview.style.fontSize = `${sizeInput.value}px`;
    preview.style.color = textColorInput.value;
    preview.textContent = textInput.value || "あいうえお ABCDE 12345";

    card.appendChild(info);
    card.appendChild(preview);
    
    return { card, preview };
}

// Store references to update efficiently
const previewElements = [];

function init() {
    fonts.forEach(font => {
        const { card, preview } = createFontCard(font);
        fontGrid.appendChild(card);
        previewElements.push(preview);
    });
}

// 4. Event Listeners
textInput.addEventListener('input', (e) => {
    const text = e.target.value || "あいうえお ABCDE 12345";
    previewElements.forEach(el => el.textContent = text);
});

sizeInput.addEventListener('input', (e) => {
    const size = e.target.value;
    previewElements.forEach(el => el.style.fontSize = `${size}px`);
});

textColorInput.addEventListener('input', (e) => {
    const color = e.target.value;
    previewElements.forEach(el => el.style.color = color);
});

bgColorInput.addEventListener('input', (e) => {
    const color = e.target.value;
    body.style.backgroundColor = color;
    // Optional: Adjust header opacity or color if needed based on bg,
    // but the glassmorphism handles most cases well.
});

// Start
init();
