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

// イベントリスナー登録 / Event Listeners
function addEventListeners() {
    [els.chatInput, els.nameUser, els.nameModel, els.inputTitle, els.inputPre, els.inputPost].forEach(el => {
        el.addEventListener('input', render);
    });

    [els.checkTitle, els.checkPre, els.checkPost].forEach(el => {
        el.addEventListener('change', render);
    });

    els.radiosMode.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateLayoutMode(e.target.value);
            render();
        });
    });
}

// レイアウト更新 / Update Layout
function updateLayoutMode(mode) {
    if (mode === 'vertical') {
        els.previewArea.classList.remove('horizontal-mode');
        els.previewArea.classList.add('vertical-mode');
    } else {
        els.previewArea.classList.remove('vertical-mode');
        els.previewArea.classList.add('horizontal-mode');
    }
}

// --------------------------------------------------------------------------
// Parsing Logic (Standard + Fallback)
// --------------------------------------------------------------------------

function parseLog(text) {
    if (!text) return [];

    // 1. まず標準的なラベル付き形式を試す / Try labeled format first
    const standardParsed = parseWithRegex(text);

    // ラベルが一定数見つかればそれを採用 / If labels found, use them
    // (ここでは1つでも見つかれば採用としていますが、必要に応じて閾値を調整)
    if (standardParsed.length > 0) {
        return standardParsed;
    }

    // 2. ラベルが見つからない場合、フォールバック(段落ごとの交互話者)を行う
    // Fallback: Alternating speakers by paragraph
    return parseFallback(text);
}

function parseWithRegex(text) {
    const lines = text.split('\n');
    const parsed = [];
    let currentSpeaker = null;
    let buffer = [];

    // Regex: Matches start of line like "User:", "Gemini:", "**User**:", "ユーザー"
    // Also matches just "Gemini" or "User" if they look like a header (surrounded by newlines or at start)
    const regexSpeaker = /^(?:\*\*|\[)?\s*(User|Model|Gemini|Assistant|AI|Human|Me|You|あなた|ユーザー|モデル|回答者|質問者|ChatGPT|Claude|Bard)\s*(?:\*\*|\])?\s*[:：]?\s*(.*)/i;

    // Trigger detection logic:
    // If we match the regex, AND (it has a colon OR the content part is empty indicating a header line), treat as new speaker.

    for (let line of lines) {
        const _line = line.trim();
        if (!_line) continue;

        const match = _line.match(regexSpeaker);
        let isSpeakerLine = false;
        let roleStr = "";
        let contentStarts = "";

        if (match) {
            roleStr = match[1].toLowerCase();
            contentStarts = match[2];

            // If there is a colon, or if content is empty (header style line), accepting it
            if (_line.includes(':') || _line.includes('：') || contentStarts === "") {
                isSpeakerLine = true;
            }
        }

        if (isSpeakerLine) {
            // Push previous
            if (currentSpeaker) {
                parsed.push({ speaker: currentSpeaker, text: buffer.join('\n') });
            }

            // Determine role
            if (['user', 'human', 'me', 'you', 'あなた', 'ユーザー', '質問者'].includes(roleStr)) {
                currentSpeaker = 'user';
            } else {
                currentSpeaker = 'model';
            }
            buffer = contentStarts ? [contentStarts] : [];
        } else {
            // Continuation
            if (currentSpeaker) {
                buffer.push(line);
            } else {
                // If text starts without explicit speaker, we skip this check and fallback later?
                // Or we can assume first block is user. Let's strictly only use this function if we found explicit labels.
                // If we haven't found a Speaker yet, treating it as buffer for fallback check?
                // Actually, let's just create a 'unknown' block.
                // But to make fallback effective, if we end up with NO detected speakers, we return empty.
                buffer.push(line);
            }
        }
    }

    if (currentSpeaker) {
        parsed.push({ speaker: currentSpeaker, text: buffer.join('\n') });
    } else {
        // If we never switched speakers, maybe it wasn't a labeled chat.
        return [];
    }

    return parsed;
}

function parseFallback(text) {
    // Split by double newlines or single newlines?
    // Let's assume paragraphs separated by blank lines are different turns.
    // If tightly packed, maybe just newlines?
    // Let's try splitting by blank lines to be safe for books.

    const blocks = text.split(/\n\s*\n/);
    const parsed = [];

    if (blocks.length === 1 && blocks[0].trim() === "") return [];

    // Default: Start with User -> Model -> User ...
    let isUserTurn = true;

    blocks.forEach(block => {
        if (!block.trim()) return;

        parsed.push({
            speaker: isUserTurn ? 'user' : 'model',
            text: block.trim()
        });

        // Toggle turn
        isUserTurn = !isUserTurn;
    });

    return parsed;
}

// --------------------------------------------------------------------------
// Formatting (Tate-chu-yoko)
// --------------------------------------------------------------------------

function applyTateChuYoko(text, isVertical) {
    if (!isVertical) return text;
    // 1-3 digits
    text = text.replace(/(\d{1,3})/g, '<span class="tcy">$1</span>');
    // ?! notation
    text = text.replace(/([!?]{1,2})/g, '<span class="tcy">$1</span>');
    return text;
}

// --------------------------------------------------------------------------
// Rendering
// --------------------------------------------------------------------------

function render() {
    const isVertical = els.previewArea.classList.contains('vertical-mode');

    // 1. Parsing
    const rawText = els.chatInput.value;
    const dialogues = parseLog(rawText);

    // Auto-set title (Only if empty)
    if (els.inputTitle.value.trim() === "" && dialogues.length > 0) {
        if (!els.inputTitle.dataset.autoset) {
            const candidate = dialogues[0].text.substring(0, 20).replace(/\n/g, ' ') + "...";
            els.inputTitle.value = candidate;
            els.inputTitle.dataset.autoset = "true";
        }
    }

    // 2. Render Meta
    const titleVal = applyTateChuYoko(els.inputTitle.value, isVertical);
    els.elTitle.style.display = els.checkTitle.checked ? 'block' : 'none';
    els.elTitle.innerHTML = titleVal;

    els.elPre.style.display = els.checkPre.checked ? 'block' : 'none';
    els.divPre.style.display = els.checkPre.checked ? 'block' : 'none';
    els.elPre.innerHTML = `<p>${applyTateChuYoko(els.inputPre.value.replace(/\n/g, '<br>'), isVertical)}</p>`;

    els.elPost.style.display = els.checkPost.checked ? 'block' : 'none';
    els.divPost.style.display = els.checkPost.checked ? 'block' : 'none';
    els.elPost.innerHTML = `<p>${applyTateChuYoko(els.inputPost.value.replace(/\n/g, '<br>'), isVertical)}</p>`;

    // 3. Render Dialogues
    let html = '';
    dialogues.forEach(d => {
        const name = d.speaker === 'user' ? els.nameUser.value : els.nameModel.value;
        let text = d.text;

        // Safety: Basic escaping could be added here if needed
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
