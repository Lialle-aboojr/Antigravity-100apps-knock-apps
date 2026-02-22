/**
 * Philosophical Dialogue Formatter - Hybrid Edition
 * Logic: Mode switching, Manual Entry, JSON parsing, TCY rendering
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const state = {
        title: '',
        preface: '',
        postscript: '',
        dialogues: [], // Array of { role: string, text: string }
        isVertical: true
    };

    // --- DOM Elements ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const modeContents = document.querySelectorAll('.mode-content');
    
    // Manual Input
    const inputSpeakerRadios = document.querySelectorAll('input[name="speaker"]');
    const inputManualText = document.getElementById('manual-text');
    const btnWrite = document.getElementById('btn-write');
    const btnUndo = document.getElementById('btn-undo');

    // Import Input
    const jsonInput = document.getElementById('json-input');
    const btnImport = document.getElementById('btn-import');
    const btnCopyPrompt = document.getElementById('btn-copy-prompt');

    // Settings
    const toggleWritingMode = document.getElementById('writing-mode-toggle');
    const inputTitle = document.getElementById('input-title');
    const inputPreface = document.getElementById('input-preface');
    const inputPostscript = document.getElementById('input-postscript');

    // View
    const paper = document.getElementById('paper');
    const viewTitle = document.getElementById('view-title');
    const viewPreface = document.getElementById('view-preface');
    const viewPostscript = document.getElementById('view-postscript');
    const dialogueList = document.getElementById('dialogue-list');

    // --- Initialization ---
    init();

    function init() {
        // Tab Switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                
                // Active class update
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Content visibility
                modeContents.forEach(c => c.classList.remove('active'));
                document.getElementById(`mode-${mode}`).classList.add('active');
            });
        });

        // Writing Mode Toggle
        toggleWritingMode.addEventListener('change', (e) => {
            state.isVertical = e.target.checked;
            updatePaperLayout();
        });

        // Live Text Updates (Title, etc.)
        inputTitle.addEventListener('input', (e) => {
            state.title = e.target.value;
            renderMeta();
        });
        inputPreface.addEventListener('input', (e) => {
            state.preface = e.target.value;
            renderMeta();
        });
        inputPostscript.addEventListener('input', (e) => {
            state.postscript = e.target.value;
            renderMeta();
        });

        // Manual Write
        btnWrite.addEventListener('click', handleManualWrite);
        
        // Manual Undo
        btnUndo.addEventListener('click', () => {
            if (state.dialogues.length > 0) {
                state.dialogues.pop();
                renderDialogues();
            }
        });

        // Copy Prompt
        btnCopyPrompt.addEventListener('click', () => {
            const text = document.getElementById('prompt-text').innerText;
            navigator.clipboard.writeText(text).then(() => {
                const originalText = btnCopyPrompt.innerHTML;
                btnCopyPrompt.innerHTML = 'コピーしました！ <span class="en">Copied!</span>';
                setTimeout(() => {
                    btnCopyPrompt.innerHTML = originalText;
                }, 2000);
            });
        });

        // JSON Import
        btnImport.addEventListener('click', handleImport);

        // Responsive Keyboard Shortcut (Cmd/Ctrl + Enter to write)
        inputManualText.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                handleManualWrite();
            }
        });
    }

    // --- Core Logic ---

    function handleManualWrite() {
        const text = inputManualText.value.trim();
        if (!text) return;

        let role = 'User';
        inputSpeakerRadios.forEach(radio => {
            if (radio.checked) role = radio.value;
        });

        addDialogue(role, text);
        
        // Clear input
        inputManualText.value = '';
        inputManualText.focus();
    }

    function addDialogue(role, text) {
        state.dialogues.push({ role, text });
        renderDialogues();
        // Scroll to end of list (scrolling behavior depends on writing mode)
        // Simple trick: wait for DOM update
        setTimeout(() => {
            if(state.isVertical) {
                // In vertical-rl, scrollLeft is usually 0 (rightmost) or negative depending on browser
                // For simplified vertical scrolling, the container might just grow leftwards
                paper.scrollLeft = -paper.scrollWidth; 
            } else {
                paper.scrollTop = paper.scrollHeight;
            }
        }, 100);
    }

    function handleImport() {
        const jsonStr = jsonInput.value.trim();
        if (!jsonStr) return;

        try {
            const data = JSON.parse(jsonStr);
            if (!Array.isArray(data)) throw new Error('Root must be an array');
            
            // Validate structure
            const validData = data.filter(item => item.role && item.text);
            
            if (validData.length === 0) {
                alert('有効な会話データが見つかりませんでした。\n[{"role":"User","text":"..."}] の形式か確認してください。');
                return;
            }

            if (confirm(`現在の会話リストを消去して、${validData.length}件のデータを読み込みますか？`)) {
                state.dialogues = validData;
                renderDialogues();
                alert('インポート完了');
            }

        } catch (e) {
            alert('JSONの解析に失敗しました。\n構文を確認してください。\n' + e.message);
        }
    }

    // --- Rendering ---

    function updatePaperLayout() {
        if (state.isVertical) {
            paper.classList.add('vertical');
            paper.classList.remove('horizontal');
            document.querySelector('.toggle-label .right').style.fontWeight = 'bold';
            document.querySelector('.toggle-label .left').style.fontWeight = 'normal';
        } else {
            paper.classList.add('horizontal');
            paper.classList.remove('vertical');
            document.querySelector('.toggle-label .right').style.fontWeight = 'normal';
            document.querySelector('.toggle-label .left').style.fontWeight = 'bold';
        }
    }

    function renderMeta() {
        viewTitle.innerText = processTCY(state.title);
        viewTitle.innerHTML = processTCY(state.title); // Use innerHTML to render spans
        viewPreface.innerHTML = processTCY(state.preface);
        viewPostscript.innerHTML = processTCY(state.postscript);
    }

    function renderDialogues() {
        dialogueList.innerHTML = '';

        if (state.dialogues.length === 0) {
            dialogueList.innerHTML = '<div class="empty-state">ここに対話が表示されます</div>';
            return;
        }

        state.dialogues.forEach((d, index) => {
            const item = document.createElement('div');
            item.className = 'dialogue-item';
            
            // Speaker
            const speaker = document.createElement('div');
            speaker.className = 'speaker-name';
            speaker.innerText = d.role; // No partial TCY needed for standard "User"/"AI" usually, but can apply if needed
            
            // Text
            const content = document.createElement('div');
            content.className = 'dialogue-text';
            content.innerHTML = processTCY(d.text); // Apply TCY processing

            item.appendChild(speaker);
            item.appendChild(content);
            dialogueList.appendChild(item);
        });
    }

    // --- Utilities ---

    /**
     * Convert 2-3 digit numbers to TCY (Text Combine Upright) spans
     * Also handles simple replacements if necessary
     */
    function processTCY(text) {
        if (!text) return '';
        // Safe HTML escaping (basic)
        let safeText = text.replace(/&/g, "&amp;")
                           .replace(/</g, "&lt;")
                           .replace(/>/g, "&gt;")
                           .replace(/"/g, "&quot;")
                           .replace(/'/g, "&#039;");

        // Regex for 2-4 digits (Standard rule usually 2-3 for tcy, 4 often left or half-width)
        // Here we target 2-3 digits.
        // Capturing group for replacement
        return safeText.replace(/(\d{2,3})/g, '<span class="tcy">$1</span>');
    }
});
