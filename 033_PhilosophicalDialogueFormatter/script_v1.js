// ==========================================================================
// 1. 言語データ / Language Resources
// ==========================================================================
const I18N = {
    ja: {
        app_title: "哲学的対話メーカー",
        app_subtitle: "AIとの対話を、美しい書籍フォーマットへ。",
        settings_lang: "言語 / Language",
        settings_mode: "表示モード / Layout Mode",
        mode_vertical: "縦書き (日本語書籍風)",
        mode_horizontal: "横書き (Paperback Style)",
        settings_names: "登場人物名 / Names",
        role_user: "User役",
        role_model: "AI役",
        settings_meta: "メタ情報 / Meta Info",
        meta_title: "タイトル",
        meta_pre: "まえがき",
        meta_post: "あとがき",
        input_label: "チャットログ入力 / Chat Log",
        print_hint: "💡 ヒント: Ctrl + P でPDFとして保存できます。",
        default_user: "私",
        default_model: "AI"
    },
    en: {
        app_title: "Philosophical Dialogue Formatter",
        app_subtitle: "Turn AI chats into beautiful book formats.",
        settings_lang: "Language",
        settings_mode: "Layout Mode",
        mode_vertical: "Vertical (Japanese Book Style)",
        mode_horizontal: "Horizontal (Paperback Style)",
        settings_names: "Character Names",
        role_user: "User Role",
        role_model: "AI Role",
        settings_meta: "Meta Info",
        meta_title: "Title",
        meta_pre: "Preface",
        meta_post: "Postscript",
        input_label: "Paste Chat Log",
        print_hint: "💡 Hint: Press Ctrl + P to save as PDF.",
        default_user: "Me",
        default_model: "AI"
    }
};

// ==========================================================================
// 2. DOM要素の取得 / DOM Elements
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
    radiosLang: document.getElementsByName('ui-lang'),
    radiosMode: document.getElementsByName('layout-mode'),

    // Text elements for i18n
    i18nParams: document.querySelectorAll('[data-i18n]')
};

// ==========================================================================
// 3. メインロジック / Main Logic
// ==========================================================================

// 初期化 / Initialization
function init() {
    addEventListeners();
    updateLanguage('ja'); // Default to JA
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

    // Radio: Language
    els.radiosLang.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateLanguage(e.target.value);
            // Also update default names if they haven't been touched? 
            // For simplicity, we just keep current input values.
        });
    });

    // Radio: Mode
    els.radiosMode.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateLayoutMode(e.target.value);
        });
    });
}

// UI言語更新
function updateLanguage(lang) {
    const dict = I18N[lang];
    els.i18nParams.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });

    // Update placeholders if empty
    if (els.nameUser.value === I18N['ja'].default_user || els.nameUser.value === I18N['en'].default_user) {
        els.nameUser.value = dict.default_user;
    }
    if (els.nameModel.value === I18N['ja'].default_model || els.nameModel.value === I18N['en'].default_model) {
        els.nameModel.value = dict.default_model;
    }
    render();
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

    // Regex to detect speaker patterns
    // Matches: "User:", "Model:", "Gemini:", "あなた:", "Human:", etc.
    const regexSpeaker = /^(User|Model|Gemini|Assistant|AI|Human|あなた|ユーザー|モデル)[:：]\s*(.*)/i;

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        const match = line.match(regexSpeaker);
        if (match) {
            // Push previous
            if (currentSpeaker) {
                parsed.push({ speaker: currentSpeaker, text: buffer.join('\n') });
            }

            // New speaker
            const roleStr = match[1].toLowerCase();
            const content = match[2];

            // Normalize role
            if (['user', 'human', 'あなた', 'ユーザー'].includes(roleStr)) {
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
                // Determine first line speaker if undefined
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

// レンダリング / Rendering
function render() {
    // 1. Meta Info
    els.elTitle.style.display = els.checkTitle.checked ? 'block' : 'none';
    els.elTitle.textContent = els.inputTitle.value;

    els.elPre.style.display = els.checkPre.checked ? 'block' : 'none';
    els.divPre.style.display = els.checkPre.checked ? 'block' : 'none';
    els.elPre.innerHTML = `<p>${els.inputPre.value.replace(/\n/g, '<br>')}</p>`;

    els.elPost.style.display = els.checkPost.checked ? 'block' : 'none';
    els.divPost.style.display = els.checkPost.checked ? 'block' : 'none';
    els.elPost.innerHTML = `<p>${els.inputPost.value.replace(/\n/g, '<br>')}</p>`;

    // 2. Parse Chat
    const rawText = els.chatInput.value;
    const dialogues = parseLog(rawText);

    // Auto-set title if empty and first message exists
    // (Only if user hasn't typed a title manually yet - simplified check)
    // For now, let's just do it if title input is completely empty
    if (els.inputTitle.value.trim() === "" && dialogues.length > 0 && dialogues[0].speaker === 'user') {
        const candidate = dialogues[0].text.substring(0, 20).replace(/\n/g, ' ') + "...";
        // els.inputTitle.value = candidate; 
        // -> User might find it annoying if it keeps overwriting. Let's not auto-fill input, just preview?
        // Requirement said: "Auto-set initial value". 
        // We'll update the placeholder logic or one-time set.
        // Let's settle for: if input is empty, show candidate in preview? No, let's update input once.
        if (!els.inputTitle.dataset.autoset) {
            els.inputTitle.value = candidate;
            els.inputTitle.dataset.autoset = "true"; // Flag to prevent repeated overwrite
            els.elTitle.textContent = candidate;
        }
    }

    // 3. Build HTML
    let html = '';
    dialogues.forEach(d => {
        const name = d.speaker === 'user' ? els.nameUser.value : els.nameModel.value;
        const text = d.text.replace(/\n/g, '<br>');

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
