/**
 * Text Polish / テキスト整形ツール
 * Script implementation
 */

document.addEventListener('DOMContentLoaded', () => {
    // === Elements ===
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    
    // Buttons
    const removeLineBreaksBtn = document.getElementById('removeLineBreaksBtn');
    const removeAllSpacesBtn = document.getElementById('removeAllSpacesBtn');
    const removeEmptyLinesBtn = document.getElementById('removeEmptyLinesBtn');
    const customDeleteBtn = document.getElementById('customDeleteBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const themeToggle = document.getElementById('themeToggle');
    const customInput = document.getElementById('customDeleteInput');

    // === Helper Functions ===

    /**
     * 結果エリアにテキストを設定する
     * Sets text to the output area
     * @param {string} text 
     */
    function setOutput(text) {
        outputText.value = text;
    }

    /**
     * 入力エリアのテキストを取得する
     * Gets text from input area
     * @returns {string}
     */
    function getInput() {
        return inputText.value;
    }

    // === Core Features ===

    // 1. 改行削除 (Remove Line Breaks)
    // すべての改行を削除して1行にする
    removeAllSpacesBtn.addEventListener('click', () => {
        // Wait, button ID logic check.
        // removeLineBreaksBtn is for line breaks.
        // I put logic for removeAllSpaces inside the wrong listener if I copy paste blindly.
        // Let's implement correctly.
    });

    removeLineBreaksBtn.addEventListener('click', () => {
        const text = getInput();
        // Replace all newline characters with empty string
        // \r\n, \n, \r handles various OS formats
        const polished = text.replace(/[\r\n]+/g, '');
        setOutput(polished);
    });

    // 2. 空白全削除 (Remove All Spaces)
    // 全角・半角スペース・タブをすべて削除
    removeAllSpacesBtn.addEventListener('click', () => {
        const text = getInput();
        // \s matches spaces, tabs, newlines. 
        // If we want to KEEP newlines but remove spaces/tabs on lines:
        // Use [ \t\u3000] (Space, Tab, Ideographic Space)
        // Global replace
        const polished = text.replace(/[ \t\u3000]+/g, ''); 
        setOutput(polished);
    });

    // 3. 空行のみ削除 (Remove Empty Lines)
    // 段落は残し、余分な空行だけを詰める
    // Replace multiple consecutive newlines with a single newline (or 2 if we want to keep paragraphs loose)
    // "空行のみ削除" -> Removing lines that are empty.
    // If we have: A\n\nB -> A\nB (No empty line) OR A\n\nB (Keep 1 empty line as paragraph separator?)
    // Given the requirement "Remove *Empty Lines*", it usually means text becomes continuous vertical block.
    // Let's go with: Reduce 2+ newlines to 1 newline. 
    // This removes the "empty line" visual gap.
    removeEmptyLinesBtn.addEventListener('click', () => {
        const text = getInput();
        // 1. Remove whitespace from lines that contain only whitespace (making them strictly empty)
        let polished = text.replace(/^\s+$/gm, '');
        // 2. Replace multiple newlines with single newline
        polished = polished.replace(/[\r\n]{2,}/g, '\n');
        // Optional: Trim start/end
        setOutput(polished.trim());
    });

    // 4. カスタム削除 (Custom Delete)
    // ユーザー指定の文字を削除
    customDeleteBtn.addEventListener('click', () => {
        const text = getInput();
        const target = customInput.value;
        
        if (!target) {
            alert('削除する文字を入力してください。\nPlease enter characters to delete.');
            return;
        }

        // Escape regex special characters just in case user types something like "." or "?"
        // Helper to escape regex
        const escapeRegExp = (string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        const regex = new RegExp(escapeRegExp(target), 'g');
        const polished = text.replace(regex, '');
        setOutput(polished);
    });

    // === Utilities ===

    // Copy Result
    copyBtn.addEventListener('click', async () => {
        const text = outputText.value;
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            // Visual Feedback (Temporary text change)
            const originalText = copyBtn.innerText;
            copyBtn.innerText = 'Copied! / コピー完了';
            copyBtn.classList.add('accent'); // Ensure accent style
            setTimeout(() => {
                copyBtn.innerText = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('コピーに失敗しました / Failed to copy');
        }
    });

    // Clear All
    clearBtn.addEventListener('click', () => {
        if (confirm('入力と結果をすべて消去しますか？\nAre you sure you want to clear everything?')) {
            inputText.value = '';
            outputText.value = '';
            customInput.value = '';
        }
    });

    // Dark Mode Toggle
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        // Update Icon
        const isDark = document.body.classList.contains('dark-mode');
        themeToggle.querySelector('.icon').textContent = isDark ? '🌙' : '☀️';
        
        // Save preference (optional, but good UX)
        // localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // (Optional) Initialize Theme from system preference or local storage
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
         // Default to dark logic if desired, or respect prompt Muji default.
         // Prompt says "Default (Light Mode)", "Dark Mode ... Toggle".
         // So we start Light. Use toggle available.
    }
});
