/**
 * Philosophical Dialogue Formatter - Interactive Builder Scripts
 */

// state
let dialogueData = [];
const settings = {
    userCharName: '青年',
    aiCharName: '哲人',
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
    render();
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
    
    // Real-time Settings Updates
    els.nameUser.addEventListener('input', (e) => {
        settings.userCharName = e.target.value;
        render();
    });
    els.nameAi.addEventListener('input', (e) => {
        settings.aiCharName = e.target.value;
        render();
    });
    els.title.addEventListener('input', (e) => {
        settings.title = e.target.value;
        render();
    });
    els.preface.addEventListener('input', (e) => {
        settings.preface = e.target.value;
        render();
    });
    els.postscript.addEventListener('input', (e) => {
        settings.postscript = e.target.value;
        render();
    });

    // Actions
    els.printBtn.addEventListener('click', () => window.print());
    els.clearBtn.addEventListener('click', handleClear);
}

// --- Core Logic ---

function handleAdd() {
    const userText = els.userInput.value.trim();
    const aiText = els.aiInput.value.trim();

    if (!userText && !aiText) return; // Empty check

    // Add User line if exists
    if (userText) {
        dialogueData.push({
            role: 'user',
            text: userText,
            timestamp: Date.now()
        });
    }

    // Add AI line if exists
    if (aiText) {
        dialogueData.push({
            role: 'ai',
            text: aiText,
            timestamp: Date.now() + 1
        });
    }

    // Clear inputs
    els.userInput.value = '';
    els.aiInput.value = '';
    
    // Focus back on user input for smooth flow
    els.userInput.focus();

    render();
    scrollToLast();
}

function handleUndo() {
    if (dialogueData.length === 0) return;
    dialogueData.pop();
    render();
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
        render();
    }
}

// --- Rendering ---

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
 * 縦中横 (Tate-Chu-Yoko) Processing
 * 2桁〜3桁の半角数字を <span class="tcy"> で囲む
 * 1桁はそのまま、4桁以上もそのまま（あるいは好みで調整）
 */
function applyTcy(text) {
    // 2桁か3桁の数字をキャプチャして置換
    // 例: "100" -> "<span class='tcy'>100</span>"
    return text.replace(/(\d{2,3})/g, '<span class="tcy">$1</span>')
               .replace(/(!{2}|\?{2})/g, '<span class="tcy">$1</span>'); // !!や??も縦中横に
}

function render() {
    let html = '';

    // Title Section
    if (settings.title) {
        // タイトルにもTCY適用したい場合はここでapplyTcy
        html += `<h1 class="book-title">${applyTcy(escapeHtml(settings.title))}</h1>`;
    }

    // Preface
    if (settings.preface) {
        const pf = escapeHtml(settings.preface).replace(/\n/g, '<br>');
        html += `<div class="preface">${applyTcy(pf)}</div>`;
    }

    // Dialogue List
    html += '<div class="dialogues">';
    dialogueData.forEach(item => {
        const name = item.role === 'user' ? settings.userCharName : settings.aiCharName;
        // TCY処理 + 改行コードを<br>に
        const content = applyTcy(escapeHtml(item.text)).replace(/\n/g, '<br>');
        
        html += `
            <div class="dialogue-block ${item.role}">
                <div class="speaker-name">
                    ${escapeHtml(name)}
                </div>
                <div class="speaker-line">
                    ${content}
                </div>
            </div>
        `;
    });
    html += '</div>';

    // Postscript
    if (settings.postscript) {
        const ps = escapeHtml(settings.postscript).replace(/\n/g, '<br>');
        html += `<div class="postscript">${applyTcy(ps)}</div>`;
    }

    els.bookContent.innerHTML = html;
}

function scrollToLast() {
    // 縦書きのスクロール挙動（左へ伸びる）を考慮
    // mode-vertical時は scrollLeft をマイナス方向（または0）にする必要があるが、
    // ブラウザによって挙動が違うため、単純に scrollIntoView を使うのが安全
    
    // 最新の要素を取得
    const blocks = els.bookContent.querySelectorAll('.dialogue-block');
    if (blocks.length > 0) {
        const lastBlock = blocks[blocks.length - 1];
        lastBlock.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}

// --- Utils ---
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
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
