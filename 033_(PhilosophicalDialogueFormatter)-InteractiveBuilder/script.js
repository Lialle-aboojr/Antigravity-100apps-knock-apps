/**
 * Philosophical Dialogue Formatter - Interactive Builder Scripts (v2)
 */

// state
let dialogueData = [];
const settings = {
    userCharName: '私', // Default per request
    aiCharName: 'AI',   // Default per request
    mode: 'vertical',
    title: '',
    preface: '',
    postscript: ''
};

// DOM Elements
const els = {
    userInput: document.getElementById('user-input'),
    aiInput: document.getElementById('ai-input'),
    addBtn: document.getElementById('add-btn'),
    undoBtn: document.getElementById('undo-btn'),
    bookContent: document.getElementById('book-content'),
    paperSheet: document.getElementById('paper-sheet'),
    scrollAnchor: document.getElementById('scroll-anchor'),

    // Settings
    modeVertical: document.getElementById('mode-vertical'),
    modeHorizontal: document.getElementById('mode-horizontal'),
    nameUser: document.getElementById('name-user'),
    nameAi: document.getElementById('name-ai'),
    title: document.getElementById('book-title'),
    preface: document.getElementById('preface-text'),
    postscript: document.getElementById('postscript-text'),

    // Actions
    printBtn: document.getElementById('print-btn'),
    clearBtn: document.getElementById('clear-btn')
};

// --- Initialization ---
function init() {
    setupEventListeners();
    updateModeClass();
    renderAll(false); // Initial render without animation
}

function setupEventListeners() {
    // Add Button
    els.addBtn.addEventListener('click', handleAdd);

    // Undo
    els.undoBtn.addEventListener('click', handleUndo);

    // Mode Switch
    els.modeVertical.addEventListener('change', () => {
        settings.mode = 'vertical';
        updateModeClass();
    });
    els.modeHorizontal.addEventListener('change', () => {
        settings.mode = 'horizontal';
        updateModeClass();
    });

    // Real-time Settings Updates (Metadata changes trigger instant re-render)
    els.nameUser.addEventListener('input', (e) => {
        settings.userCharName = e.target.value;
        renderAll(false);
    });
    els.nameAi.addEventListener('input', (e) => {
        settings.aiCharName = e.target.value;
        renderAll(false);
    });
    els.title.addEventListener('input', (e) => {
        settings.title = e.target.value;
        renderAll(false);
    });
    els.preface.addEventListener('input', (e) => {
        settings.preface = e.target.value;
        renderAll(false);
    });
    els.postscript.addEventListener('input', (e) => {
        settings.postscript = e.target.value;
        renderAll(false);
    });

    // Actions
    els.printBtn.addEventListener('click', () => window.print());
    els.clearBtn.addEventListener('click', handleClear);
}

// --- Core Logic ---

async function handleAdd() {
    const userText = els.userInput.value.trim();
    const aiText = els.aiInput.value.trim();

    if (!userText && !aiText) return; // Empty check

    // Add User line if exists
    if (userText) {
        // Add to state
        const item = {
            role: 'user',
            text: userText,
            timestamp: Date.now()
        };
        dialogueData.push(item);

        // Render this specific item (with animation)
        await appendDialogueWithAnimation(item);
    }

    // Add AI line if exists
    if (aiText) {
        // Add to state
        const item = {
            role: 'ai',
            text: aiText,
            timestamp: Date.now() + 1
        };
        dialogueData.push(item);

        // Render this specific item (with animation)
        await appendDialogueWithAnimation(item);
    }

    // Clear inputs
    els.userInput.value = '';
    els.aiInput.value = '';

    // Focus back on user for continuous typing
    els.userInput.focus();
}

function handleUndo() {
    if (dialogueData.length === 0) return;
    dialogueData.pop();
    renderAll(false); // Quick re-render without animation
}

function handleClear() {
    if (confirm('すべて消去しますか？\nAre you sure you want to clear all?')) {
        dialogueData = [];
        els.title.value = '';
        els.preface.value = '';
        els.postscript.value = '';
        settings.title = '';
        settings.preface = '';
        settings.postscript = '';
        renderAll(false);
    }
}

// --- Rendering Logic ---

function updateModeClass() {
    if (settings.mode === 'vertical') {
        els.paperSheet.classList.add('mode-vertical');
        els.paperSheet.classList.remove('mode-horizontal');
    } else {
        els.paperSheet.classList.add('mode-horizontal');
        els.paperSheet.classList.remove('mode-vertical');
    }
}

/**
 * TCY (Tate-Chu-Yoko) & Tag Processing
 * Finds half-width numbers (1-3 digits) and symbols like !? !!
 * Wraps them in <span class="tcy">...</span>
 */
function applyTcy(text) {
    // Escape HTML first to avoid breaking logic later
    let safeText = escapeHtml(text).replace(/\n/g, '<br>');

    // Regex Explanation:
    // \d{1,3} -> 1 to 3 digits
    // (!{2}|\?{2}|!\?|\?!) -> !!, ??, !?, ?!
    return safeText.replace(/(\d{1,3}|!{2}|\?{2}|!\?|\?!)/g, '<span class="tcy">$1</span>');
}

/**
 * Renders everything from scratch (used for undo, init, resize, settings change)
 * No animation here for responsiveness.
 */
function renderAll(animate = false) {
    // Clear content
    els.bookContent.innerHTML = '';

    // Title Section
    if (settings.title) {
        const titleEl = document.createElement('h1');
        titleEl.className = 'book-title';
        titleEl.innerHTML = applyTcy(settings.title);
        els.bookContent.appendChild(titleEl);
    }

    // Preface
    if (settings.preface) {
        const pfDiv = document.createElement('div');
        pfDiv.className = 'preface';
        pfDiv.innerHTML = applyTcy(settings.preface);
        els.bookContent.appendChild(pfDiv);
    }

    // Header wrapper for dialogues if needed (not strict, but keeps structure)
    const container = document.createElement('div');
    container.className = 'dialogues';
    els.bookContent.appendChild(container);

    dialogueData.forEach(item => {
        const block = createBlockElement(item);
        container.appendChild(block);
    });

    // Postscript
    if (settings.postscript) {
        const psDiv = document.createElement('div');
        psDiv.className = 'postscript';
        psDiv.innerHTML = applyTcy(settings.postscript);
        els.bookContent.appendChild(psDiv);
    }

    scrollToLast();
}

/**
 * Creates the DOM element for a dialogue block
 */
function createBlockElement(item) {
    const name = item.role === 'user' ? settings.userCharName : settings.aiCharName;
    const processedText = applyTcy(item.text);

    const block = document.createElement('div');
    block.className = `dialogue-block ${item.role}`;

    const nameEl = document.createElement('div');
    nameEl.className = 'speaker-name';
    nameEl.textContent = name;

    const lineEl = document.createElement('div');
    lineEl.className = 'speaker-line';
    lineEl.innerHTML = processedText; // Directly set content if no animation

    block.appendChild(nameEl);
    block.appendChild(lineEl);

    return block;
}

/**
 * Appends a single dialogue block with Typewriter animation
 */
async function appendDialogueWithAnimation(item) {
    let container = els.bookContent.querySelector('.dialogues');
    if (!container) {
        // If first time or structure missing, rebuild base structure (Title/Preface etc.)
        // But simply, if container missing, let's just append to bookContent or renderAll first.
        // Doing renderAll first ensures Title/Preface are there.
        renderAll(false);
        container = els.bookContent.querySelector('.dialogues');
        // If renderAll included the current item, we need to remove the last one inside it to re-animate?
        // Actually, renderAll(false) creates static content.
        // It's cleaner to handle new additions separately.

        // FIX: Remove the LAST child (which is the one we just added to state but want to animate)
        // because renderAll(false) just rendered it.
        container.lastElementChild.remove();
    }

    // Now recreate just the new block empty
    const name = item.role === 'user' ? settings.userCharName : settings.aiCharName;
    const processedHtml = applyTcy(item.text); // Note: This contains HTML tags like <span class="tcy">..</span> and <br>

    const block = document.createElement('div');
    block.className = `dialogue-block ${item.role}`;

    const nameEl = document.createElement('div');
    nameEl.className = 'speaker-name';
    nameEl.textContent = name;

    const lineEl = document.createElement('div');
    lineEl.className = 'speaker-line';
    // Start empty
    lineEl.innerHTML = '';

    block.appendChild(nameEl);
    block.appendChild(lineEl);

    container.appendChild(block);

    // Run Typewriter Effect on lineEl
    await typeWriter(lineEl, processedHtml);

    scrollToLast();
}

/**
 * Typewriter Effect Logic
 * safely handles HTML tags by treating them as single units
 */
function typeWriter(element, htmlString) {
    return new Promise(resolve => {
        // Tokenize HTML string into: [text, tag, text, tag...]
        // Regex splits via capturing group for tags
        // Tag pattern: <[^>]+> matches any <...>
        const tokens = htmlString.split(/(<[^>]+>)/g).filter(t => t !== "");

        let units = [];

        // Flatten tokens into character units or single tag units
        tokens.forEach(token => {
            if (token.startsWith('<')) {
                // It's a tag (e.g. <span class="tcy"> or </span> or <br>)
                units.push(token);
            } else {
                // It's text, split into chars
                units.push(...token.split(''));
            }
        });

        let i = 0;
        const speed = 15; // ms per unit

        function step() {
            if (i < units.length) {
                element.innerHTML += units[i];
                i++;
                // Scroll to follow typing if needed
                scrollToLast();
                setTimeout(step, speed);
            } else {
                resolve();
            }
        }

        step();
    });
}


function scrollToLast() {
    // For vertical writing, simply scrolling into view on the empty anchor or last block works
    // Use the global last block
    const blocks = els.bookContent.querySelectorAll('.dialogue-block');
    if (blocks.length > 0) {
        const last = blocks[blocks.length - 1];
        last.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else {
        els.scrollAnchor.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}

// --- Utils ---
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}

// Start
init();
