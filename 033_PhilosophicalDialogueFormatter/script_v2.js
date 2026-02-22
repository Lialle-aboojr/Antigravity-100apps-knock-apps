// ==========================================================================
// 1. DOM要素の取得 / DOM Elements
// ==========================================================================
const els = {
    chatInput: document.getElementById('chat-input'),
    previewArea: document.getElementById('preview-area'),
    dialogueContent: document.getElementById('dialogue-content'),

    // Inputs
    nameUser: document.getElementById('name-user'),
    nameModel: document.getElementById('name-model'),

    // Meta Inputs & Toggles
    checkTitle: document.getElementById('show-title'),
    inputTitle: document.getElementById('meta-title-input'),
    elTitle: document.getElementById('book-title'),

    checkPre: document.getElementById('show-pre'),
    inputPre: document.getElementById('meta-pre-input'),
    elPre: document.getElementById('book-preface'),
    divPre: document.getElementById('preface-divider'),

    checkPost: document.getElementById('show-post'),
    inputPost: document.getElementById('meta-post-input'),
    elPost: document.getElementById('book-postscript'),
    divPost: document.getElementById('postscript-divider'),

    // Radios
    radiosMode: document.getElementsByName('layout-mode'),
};

// ==========================================================================
// 2. メインロジック / Main Logic
// ==========================================================================

// 初期化 / Initialization
function init() {
    addEventListeners();
    render();
}

// イベントリスナー登録
function addEventListeners() {
    // Text Inputs: Update on any change
    [els.chatInput, els.nameUser, els.nameModel, els.inputTitle, els.inputPre, els.inputPost].forEach(el => {
        el.addEventListener('input', render);
    });

    // Toggles
    [els.checkTitle, els.checkPre, els.checkPost].forEach(el => {
        el.addEventListener('change', render);
    });

    // Radio: Mode
    els.radiosMode.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateLayoutMode(e.target.value);
            render(); // Re-render to apply TCY logic if needed
        });
    });
}

// レイアウトモード更新
function updateLayoutMode(mode) {
    if (mode === 'vertical') {
        els.previewArea.classList.remove('horizontal-mode');
        els.previewArea.classList.add('vertical-mode');
    } else {
        els.previewArea.classList.remove('vertical-mode');
        els.previewArea.classList.add('horizontal-mode');
    }
}

// パース処理 / Parsing
function parseLog(text) {
    if (!text) return [];

    const lines = text.split('\n');
    const parsed = [];
    let currentSpeaker = null;
    let buffer = [];

    // 強化された正規表現 / Enhanced Regex
    // Matches: User:, **User**:, Model:, Gemini:, ChatGPT:, etc.
    // Group 1: Decorator check (markdown style like **User**)
    // Group 2: Name
    const regexSpeaker = /^(?:\*\*|\[)?\s*(User|Model|Gemini|Assistant|AI|Human|Me|You|あなた|ユーザー|モデル|回答者|質問者|ChatGPT|Claude)\s*(?:\*\*|\])?\s*[:：]\s*(.*)/i;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        const match = line.match(regexSpeaker);
        if (match) {
            // Push previous
            if (currentSpeaker) {
                parsed.push({ speaker: currentSpeaker, text: buffer.join('\n') });
            }

            // New speaker logic
            const roleStr = match[1].toLowerCase();
            const content = match[2];

            // Normalize role
            if (['user', 'human', 'me', 'you', 'あなた', 'ユーザー', '質問者'].includes(roleStr)) {
                currentSpeaker = 'user';
            } else {
                currentSpeaker = 'model';
            }
            buffer = [content];
        } else {
            // Continuation
            if (currentSpeaker) {
                buffer.push(line);
            } else {
                // If text starts without speaker, default to User for first block
                currentSpeaker = 'user';
                buffer.push(line);
            }
        }
    }

    // Push last
    if (currentSpeaker) {
        parsed.push({ speaker: currentSpeaker, text: buffer.join('\n') });
    }

    return parsed;
}

// 縦中横の適用 (数字や感嘆符を寝かせない)
// Wrap short numbers and ?! in <span class="tcy">
function applyTateChuYoko(text, isVertical) {
    if (!isVertical) return text;

    // 1-3桁の数字 (半角)
    // 1-3 digits
    text = text.replace(/(\d{1,3})/g, '<span class="tcy">$1</span>');

    // 感嘆符・疑問符の組み合わせ (!, ?, !!, !?, ?!)
    // Exclamation/Question marks
    text = text.replace(/([!?]{1,2})/g, '<span class="tcy">$1</span>');

    return text;
}

// レンダリング / Rendering
function render() {
    const isVertical = els.previewArea.classList.contains('vertical-mode');

    // 1. Meta Info
    const titleVal = els.inputTitle.value;
    els.elTitle.style.display = els.checkTitle.checked ? 'block' : 'none';
    els.elTitle.innerHTML = applyTateChuYoko(titleVal, isVertical);

    // Preface
    els.elPre.style.display = els.checkPre.checked ? 'block' : 'none';
    els.divPre.style.display = els.checkPre.checked ? 'block' : 'none';
    const preHtml = els.inputPre.value.replace(/\n/g, '<br>');
    els.elPre.innerHTML = `<p>${applyTateChuYoko(preHtml, isVertical)}</p>`;

    // Postscript
    els.elPost.style.display = els.checkPost.checked ? 'block' : 'none';
    els.divPost.style.display = els.checkPost.checked ? 'block' : 'none';
    const postHtml = els.inputPost.value.replace(/\n/g, '<br>');
    els.elPost.innerHTML = `<p>${applyTateChuYoko(postHtml, isVertical)}</p>`;

    // 2. Parse Chat
    const rawText = els.chatInput.value;
    const dialogues = parseLog(rawText);

    // Auto-set title (Simple approach: only if empty and user hasn't typed yet)
    if (els.inputTitle.value.trim() === "" && dialogues.length > 0 && dialogues[0].speaker === 'user') {
        if (!els.inputTitle.dataset.autoset) {
            const candidate = dialogues[0].text.substring(0, 20).replace(/\n/g, ' ') + "...";
            els.inputTitle.value = candidate;
            els.inputTitle.dataset.autoset = "true";
            // Re-render title immediately
            els.elTitle.innerHTML = applyTateChuYoko(candidate, isVertical);
        }
    }

    // 3. Build HTML
    let html = '';
    dialogues.forEach(d => {
        const name = d.speaker === 'user' ? els.nameUser.value : els.nameModel.value;
        let text = d.text;

        // Escape HTML logic could go here for safety, but we trust paste for now.
        // We do TCY first on raw text then replace newlines
        // Note: applyTateChuYoko inserts span tags, so replacing \n with <br> after is safer

        text = applyTateChuYoko(text, isVertical);
        text = text.replace(/\n/g, '<br>');

        html += `
        <div class="dialogue-block">
            <span class="speaker-name">${name}</span>
            <span class="dialogue-text">${text}</span>
        </div>
        `;
    });

    els.dialogueContent.innerHTML = html;
}

// Start
init();
