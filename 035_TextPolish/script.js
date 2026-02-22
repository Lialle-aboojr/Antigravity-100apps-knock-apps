document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const runBtn = document.getElementById('run-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const customCharsInput = document.getElementById('custom-chars');
    
    // Checkboxes
    const checkCustom = document.getElementById('check-custom');
    const checkLineBreaks = document.getElementById('check-linebreaks');
    const checkEmptyLines = document.getElementById('check-emptylines');
    const checkSpaces = document.getElementById('check-spaces');

    // --- Pipeline Processing Logic ---
    runBtn.addEventListener('click', () => {
        let text = inputText.value;

        // 1. Custom Character Removal (if checked)
        // 指定文字があれば消す
        if (checkCustom.checked && customCharsInput.value) {
            // Escape special regex characters to avoid errors
            const charsToRemove = customCharsInput.value.split('').map(char => {
                return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }).join('|');
            
            if (charsToRemove) {
                const regex = new RegExp(charsToRemove, 'g');
                text = text.replace(regex, '');
            }
        }

        // 2. Empty Line Removal (if checked)
        // 空行のみ削除 (Prioritize this before removing all line breaks to make it distinct)
        if (checkEmptyLines.checked) {
            // Regex explanation:
            // ^\s*[\r\n] matches lines that contain only whitespace followed by a newline
            // gm flag: global string, multi-line
            text = text.replace(/^\s*[\r\n]/gm, '');
        }

        // 3. Line Break Removal (if checked)
        // 改行を削除 (Replaces all line breaks with nothing, joining lines)
        if (checkLineBreaks.checked) {
            text = text.replace(/[\r\n]+/g, '');
        }

        // 4. All Spaces Removal (if checked)
        // 空白を全削除
        if (checkSpaces.checked) {
            // Removes all whitespace characters (spaces, tabs, no-break spaces)
            // If line breaks were already removed, this cleans up remaining inline spaces.
            // If line breaks were NOT removed, this will also remove invisible line breaks if \s is used,
            // but usually users expect spaces/tabs. \s matches \n too.
            // Be careful: if user did NOT check "Remove Line Breaks", they probably want to keep structure but remove visible spaces.
            // However, typical "Remove All Spaces" removes EVERYTHING including newlines if \s is used.
            // To be safe and "pipeline" friendly:
            // Let's remove only horizontal whitespace if Line Breaks are NOT checked, or just use \s if simplistic.
            // Given the requirement "Remove All Spaces" usually implies compacting.
            // Let's use a regex that targets horizontal spaces if we want to preserve lines, 
            // OR just use standard \s if we treat it as "nuke all layout".
            // Based on context of "Text Processing", often "Remove Spaces" means "Full compaction".
            // But let's stick to removing literal spaces/tabs/wide-spaces.
            text = text.replace(/[ \t\u3000]+/g, '');
        }

        outputText.value = text;
        
        // Visual Feedback (Flash output)
        outputText.style.transition = 'background-color 0.2s';
        outputText.style.backgroundColor = 'rgba(127, 0, 25, 0.1)';
        setTimeout(() => {
            outputText.style.backgroundColor = '';
        }, 200);
    });

    // --- Utility Functions ---

    // Clear Input
    clearBtn.addEventListener('click', () => {
        inputText.value = '';
        inputText.focus();
    });

    // Copy to Clipboard
    copyBtn.addEventListener('click', async () => {
        if (!outputText.value) return;
        
        try {
            await navigator.clipboard.writeText(outputText.value);
            
            // Button Feedback
            const originalText = copyBtn.innerText;
            copyBtn.innerText = 'Copied!';
            copyBtn.style.backgroundColor = 'var(--primary-color)';
            copyBtn.style.color = 'white';
            
            setTimeout(() => {
                copyBtn.innerText = originalText;
                copyBtn.style.backgroundColor = '';
                copyBtn.style.color = '';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('コピーに失敗しました');
        }
    });

    // Dark Mode Toggle
    // Check saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon(true);
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme === 'dark');
    });

    function updateThemeIcon(isDark) {
        const iconSpan = themeToggle.querySelector('.icon');
        iconSpan.textContent = isDark ? '☀️' : '🌙';
    }

    // Auto-check custom checkbox when typing in custom input
    customCharsInput.addEventListener('input', () => {
        if (customCharsInput.value.length > 0) {
            checkCustom.checked = true;
        }
    });
});
