/**
 * Philosophical Dialogue Formatter - Script
 * Handles text parsing, noise cleaning, and DOM rendering.
 * 哲学的対話メーカー - スクリプト
 */

document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements / DOM要素 ===
    const rawInput = document.getElementById('rawInput');
    const paper = document.getElementById('paper');

    const btnFormat = document.getElementById('btnFormat');
    const btnPrint = document.getElementById('btnPrint');

    // Settings inputs
    const nameUser = document.getElementById('nameUser');
    const nameAI = document.getElementById('nameAI');
    const checkMeta = document.getElementById('checkMeta');
    const metaInfoArea = document.getElementById('metaInfoArea');
    const metaTitle = document.getElementById('metaTitle');
    const metaForeword = document.getElementById('metaForeword');
    const metaAfterword = document.getElementById('metaAfterword');

    // Mode Toggle Buttons
    const btnVertical = document.getElementById('btnVertical');
    const btnHorizontal = document.getElementById('btnHorizontal');

    // State
    let currentMode = 'vertical'; // 'vertical' or 'horizontal'

    // === Event Listeners / イベントリスナー ===

    // Input changes (optional: auto-update or manual) - Let's stick to manual button for clarity
    btnFormat.addEventListener('click', renderContent);

    // Print
    btnPrint.addEventListener('click', () => {
        window.print();
    });

    // Toggle Mode
    btnVertical.addEventListener('click', () => setMode('vertical'));
    btnHorizontal.addEventListener('click', () => setMode('horizontal'));

    // Meta toggle
    checkMeta.addEventListener('change', (e) => {
        metaInfoArea.style.display = e.target.checked ? 'flex' : 'none';
        renderContent(); // Re-render if changed
    });

    /**
     * Set Writing Mode
     * 表示モードの設定（縦書き/横書き）
     */
    function setMode(mode) {
        currentMode = mode;

        // Update Buttons
        if (mode === 'vertical') {
            btnVertical.classList.add('active');
            btnHorizontal.classList.remove('active');
            paper.classList.remove('horizontal');
            paper.classList.add('vertical');
        } else {
            btnHorizontal.classList.add('active');
            btnVertical.classList.remove('active');
            paper.classList.remove('vertical');
            paper.classList.add('horizontal');
        }
    }

    /**
     * Main Render Function
     * メインの描画関数
     */
    function renderContent() {
        // 1. Get Settings
        const userLabel = nameUser.value || "青年";
        const aiLabel = nameAI.value || "哲人";
        const includeMeta = checkMeta.checked;
        const text = rawInput.value;

        // 2. Clear Paper
        paper.innerHTML = '';

        if (!text.trim()) {
            paper.innerHTML = `<div class="placeholder-text">テキストがありません。<br>Please paste dialogue text.</div>`;
            return;
        }

        // 3. Render Meta Info (Title, etc)
        if (includeMeta) {
            const metaBlock = document.createElement('div');
            metaBlock.className = 'meta-block';

            // Title
            if (metaTitle.value) {
                const titleEl = document.createElement('h1');
                titleEl.className = 'meta-title';
                titleEl.innerHTML = formatText(metaTitle.value);
                metaBlock.appendChild(titleEl);
            }

            // Foreword
            if (metaForeword.value.trim()) {
                const foreEl = document.createElement('div');
                foreEl.className = 'meta-foreword';
                foreEl.innerHTML = formatText(metaForeword.value, true);
                metaBlock.appendChild(foreEl);
            }

            paper.appendChild(metaBlock);
        }

        // 4. Parse & Render Dialogue
        const lines = parseDialogue(text);

        // Speaker tracking for alternating fallback
        // true = User (User starts by default if unknown), false = AI
        let isUserTurn = true;

        // Container for dialogue
        const dialogueContainer = document.createDocumentFragment();

        lines.forEach(lineData => {
            // Determine Speaker
            let speakerName = '';
            let content = lineData.content;
            let type = lineData.type; // 'speech', 'separator', 'noise'

            if (type === 'separator') return; // Skip empty lines logic handle internally
            if (type === 'noise') return;

            // Resolve Speaker Name
            if (lineData.speakerRaw) {
                // Heuristics for raw speaker name
                const rawLower = lineData.speakerRaw.toLowerCase();
                if (rawLower.includes('user') || rawLower.includes('you') || rawLower.includes('human')) {
                    speakerName = userLabel;
                    isUserTurn = false; // Next is AI
                } else if (rawLower.includes('model') || rawLower.includes('ai') || rawLower.includes('gemini') || rawLower.includes('gpt')) {
                    speakerName = aiLabel;
                    isUserTurn = true; // Next is User
                } else {
                    // Custom name found in text
                    speakerName = lineData.speakerRaw;
                }
            } else {
                // No speaker found -> Use turn based
                if (isUserTurn) {
                    speakerName = userLabel;
                } else {
                    speakerName = aiLabel;
                }
                // Toggle for next line
                isUserTurn = !isUserTurn;
            }

            // Create DOM
            const lineEl = document.createElement('div');
            lineEl.className = 'dialogue-line';

            const labelEl = document.createElement('span');
            labelEl.className = 'speaker-label';
            labelEl.textContent = speakerName;

            const contentEl = document.createElement('span');
            contentEl.className = 'speech-content';
            contentEl.innerHTML = formatText(content); // Process regex formatting

            lineEl.appendChild(labelEl);
            lineEl.appendChild(contentEl);
            dialogueContainer.appendChild(lineEl);
        });

        paper.appendChild(dialogueContainer);

        // 5. Afterword
        if (includeMeta && metaAfterword.value.trim()) {
            const sep = document.createElement('div');
            sep.className = 'meta-separator';
            sep.textContent = '* * *';
            paper.appendChild(sep);

            const afterEl = document.createElement('div');
            afterEl.className = 'meta-afterword';
            afterEl.innerHTML = formatText(metaAfterword.value, true);
            paper.appendChild(afterEl);
        }
    }

    /**
     * Parse Dialogue Text
     * テキスト解析エンジン
     * Returns array of { type: 'speech'|'noise', speakerRaw: string|null, content: string }
     */
    function parseDialogue(rawText) {
        // Clean globally known noise first
        // Example: Sidebar menus "New Chat", "History" if pasted usually appear as single lines
        // We handle line-by-line.

        const sourceLines = rawText.split(/\n/);
        const parsed = [];
        let buffer = []; // Accumulate multi-paragraph speech
        let pendingSpeaker = null;

        // Regex patterns
        // Matches "Name: message", "**Name**: message", "Name says: message"
        const speakerRegex = /^(\*{0,2})(.+?)(?:\s*(?:says|:|\-)\s*|\*{0,2}:\s*)(.*)/;

        // Noise filters (Gemini sidebar artifacts)
        const noisePatterns = [
            /^New Chat$/i,
            /^Close sidebar$/i,
            /^Clear conversation$/i,
            /^Upgrade to/i,
            /^Expand$/i,
            /^Settings$/i,
            /^Show drafts$/i,
            /^Regenerate draft$/i
        ];

        for (let i = 0; i < sourceLines.length; i++) {
            let line = sourceLines[i].trim();

            if (!line) {
                // Empty line -> End of current speech block?
                if (buffer.length > 0) {
                    parsed.push({
                        type: 'speech',
                        speakerRaw: pendingSpeaker,
                        content: buffer.join('<br>')
                    });
                    buffer = [];
                    pendingSpeaker = null;
                }
                continue;
            }

            // Check Noise
            if (noisePatterns.some(p => p.test(line))) {
                continue; // Skip noise line
            }

            // Check Speaker Pattern
            // Only convert to new speaker if we are not deep in a code block or similar.
            // Simple logic: If line starts with "Name:" treat as new speech.
            const match = line.match(speakerRegex);

            // CAUTION: "However, ..." shouldn't match. 
            // We restrict speaker names length to avoid false positives in normal sentences.
            // e.g. "Note: This is important" might be false positive.
            // Valid Names: "User", "Model", "Gemini", "Socrates", short names.
            let isSpeakerLine = false;
            let possibleName = "";
            let remainingText = "";

            if (match) {
                possibleName = match[2].trim();
                remainingText = match[3].trim();

                // Heuristic: Name shouldn't be too long (arbitrary < 20 chars)
                if (possibleName.length < 20 && possibleName.length > 1) {
                    isSpeakerLine = true;
                }
            }

            if (isSpeakerLine) {
                // Flush previous
                if (buffer.length > 0) {
                    parsed.push({
                        type: 'speech',
                        speakerRaw: pendingSpeaker,
                        content: buffer.join('<br>')
                    });
                }

                // Start new
                pendingSpeaker = possibleName;
                if (remainingText) {
                    buffer.push(remainingText);
                }
            } else {
                // Continuation of previous speech or start of unnamed speech
                buffer.push(line);
            }
        }

        // Flush last
        if (buffer.length > 0) {
            parsed.push({
                type: 'speech',
                speakerRaw: pendingSpeaker,
                content: buffer.join('<br>')
            });
        }

        return parsed;
    }

    /**
     * Text Formatter
     * HTML整形、縦書き用の数字変換(Tate-chu-yoko)など
     */
    function formatText(text, isLongText = false) {
        if (!text) return '';

        // 1. Escape HTML (Basic security)
        let safe = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // 2. Bold (**text**) -> <strong>text</strong>
        safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 3. Italic (*text*) -> <em>text</em>
        safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // 4. Vertical Writing: Tate-chu-yoko (Vertical composition for Numbers)
        // Only apply if current mode is vertical
        if (currentMode === 'vertical') {
            // Find 1-3 digit numbers and wrap in span.tcy
            // Note: Don't break dates like 2023 entirely, maybe just 2 digits?
            // Standard rule: 2-3 digits -> TCY. 4+ -> Rotate (default mixed) or keep vertical.
            // Let's TCY 2-3 digits. 1 digit flows naturally.
            safe = safe.replace(/(\d{2,3})/g, '<span class="tcy">$1</span>');

            // Optional: Exclamation/Question marks "!?" "?!"
            safe = safe.replace(/(!\?|\?!)/g, '<span class="tcy">$1</span>');
        }

        // 5. Punctuation tweaks (Japanese)
        // Ensure proper spacing? Browsers handle this reasonably well with font-feature-settings.

        return safe;
    }

    // Initialize
    setMode('vertical');
    // Hide meta info initially?
    metaInfoArea.style.display = checkMeta.checked ? 'flex' : 'none';
});
