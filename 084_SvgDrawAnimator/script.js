// ====== 設定・定数 ======
// 初期のSVGデータ（3種類のプリセット）
const presets = {
    check: `<svg viewBox="0 0 100 100"><path d="M 25 50 L 45 70 L 75 30" /></svg>`,
    heart: `<svg viewBox="0 0 100 100"><path d="M 50 80 C -15 40, 20 -10, 50 20 C 80 -10, 115 40, 50 80" /></svg>`,
    curve: `<svg viewBox="0 0 200 100"><path d="M 20 70 Q 20 20 40 20 Q 60 20 60 70 Q 60 40 80 40 Q 100 40 100 80 Q 100 50 120 50 Q 140 50 140 80 Q 140 30 160 30 Q 180 30 180 70" /></svg>`
};

// 対象となるSVG要素のセレクタ（パスや各種図形の線を含む）
const targetElementsSelector = 'path, polyline, polygon, line, rect, circle, ellipse';

// ====== 要素の取得 ======
const customSvgTextarea = document.getElementById('custom-svg');
const presetButtons = document.querySelectorAll('.preset-btn');
const durationInput = document.getElementById('duration');
const durationVal = document.getElementById('duration-val');
const strokeWidthInput = document.getElementById('stroke-width');
const widthVal = document.getElementById('width-val');
const strokeColorInput = document.getElementById('stroke-color');
const previewContainer = document.getElementById('preview-container');
const outputCodeTextarea = document.getElementById('output-code');
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const btnCopy = document.getElementById('btn-copy');

// アニメーションの状態を管理するフラグ
let isPaused = false;

// ====== 関数 ======

// 1. セキュリティ対策 (XSSサニタイズ)
function sanitizeSVG(svgString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    
    if (doc.getElementsByTagName('parsererror').length > 0) return null;
    
    const svgElement = doc.querySelector('svg');
    if (!svgElement) return null;

    const forbiddenTags = ['script', 'iframe', 'object', 'embed', 'link', 'style'];
    forbiddenTags.forEach(tag => {
        const elements = svgElement.getElementsByTagName(tag);
        for (let i = elements.length - 1; i >= 0; i--) {
            elements[i].parentNode.removeChild(elements[i]);
        }
    });

    const allElements = svgElement.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];
        const attributes = el.attributes;
        for (let j = attributes.length - 1; j >= 0; j--) {
            const attrName = attributes[j].name;
            if (attrName.toLowerCase().startsWith('on')) {
                el.removeAttribute(attrName);
            }
        }
    }
    
    return svgElement.outerHTML;
}

// 2. プレビューの更新とコード生成
function updatePreview() {
    const rawSvg = customSvgTextarea.value;
    
    if (!rawSvg.trim()) {
        previewContainer.innerHTML = '<span style="color:#64748b;">SVGを入力してください</span>';
        outputCodeTextarea.value = '';
        return;
    }

    const safeSvg = sanitizeSVG(rawSvg);
    if (!safeSvg) {
        previewContainer.innerHTML = '<span style="color:#ef4444;">無効なSVG形式です</span>';
        outputCodeTextarea.value = '';
        return;
    }

    previewContainer.innerHTML = safeSvg;
    const svgEl = previewContainer.querySelector('svg');
    
    const duration = parseFloat(durationInput.value);
    const width = parseInt(strokeWidthInput.value);
    const color = strokeColorInput.value;

    // パス以外の図形（circleやrectなど）も取得対象に拡張
    const paths = svgEl.querySelectorAll(targetElementsSelector);
    
    paths.forEach(path => {
        try {
            const length = path.getTotalLength();
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
        } catch(e) {
            console.warn('パスの長さを計算できませんでした', e);
        }
    });

    const cloneSvgForOutput = svgEl.cloneNode(true);
    cloneSvgForOutput.classList.add('animated-svg');

    // CSSの生成（各種図形にも対応し、鉛筆風テクスチャと端の丸みを適用）
    const cssCode = `
<style>
/* カスタムSVGアニメーション用のスタイル */
.animated-svg path,
.animated-svg polyline,
.animated-svg polygon,
.animated-svg line,
.animated-svg rect,
.animated-svg circle,
.animated-svg ellipse {
    /* 線のスタイル設定 */
    fill: none !important;
    stroke: ${color} !important;
    stroke-width: ${width}px !important;
    
    /* 線の端と角を丸くする設定を追加 */
    stroke-linecap: round !important;
    stroke-linejoin: round !important;
    
    /* アニメーション設定 */
    animation: drawAnimation ${duration}s ease forwards !important;
}

@keyframes drawAnimation {
    to {
        stroke-dashoffset: 0;
    }
}
</style>
`;
    
    const htmlCode = cloneSvgForOutput.outerHTML;

    // コピー用のコードとして統合して表示
    outputCodeTextarea.value = cssCode.trim() + '\n\n' + htmlCode;
    
    // プレビュー用に動的なCSSを挿入
    const styleEl = document.createElement('style');
    styleEl.id = 'preview-style';
    styleEl.innerHTML = `
        #preview-container svg path,
        #preview-container svg polyline,
        #preview-container svg polygon,
        #preview-container svg line,
        #preview-container svg rect,
        #preview-container svg circle,
        #preview-container svg ellipse {
            fill: none !important;
            stroke: ${color} !important;
            stroke-width: ${width}px !important;
            stroke-linecap: round !important;
            stroke-linejoin: round !important;
            animation: drawAnimationPreview ${duration}s ease forwards !important;
        }
        @keyframes drawAnimationPreview {
            to { stroke-dashoffset: 0; }
        }
    `;
    
    const oldStyle = document.getElementById('preview-style');
    if (oldStyle) {
        oldStyle.remove();
    }
    document.head.appendChild(styleEl);

    isPaused = false;
    updatePauseButtonState();
}

// 3. イベントリスナー
presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const presetKey = btn.getAttribute('data-preset');
        customSvgTextarea.value = presets[presetKey];
        updatePreview();
    });
});

customSvgTextarea.addEventListener('input', () => {
    presetButtons.forEach(b => b.classList.remove('active'));
    updatePreview();
});

durationInput.addEventListener('input', (e) => {
    durationVal.textContent = parseFloat(e.target.value).toFixed(1);
    updatePreview();
});

strokeWidthInput.addEventListener('input', (e) => {
    widthVal.textContent = e.target.value;
    updatePreview();
});

strokeColorInput.addEventListener('input', updatePreview);

// 4. コントロールボタン
btnPlay.addEventListener('click', () => {
    if (isPaused) {
        const paths = previewContainer.querySelectorAll(targetElementsSelector);
        paths.forEach(p => p.style.animationPlayState = 'running');
        isPaused = false;
        updatePauseButtonState();
    } else {
        updatePreview();
    }
});

function updatePauseButtonState() {
    if (isPaused) {
        btnPause.textContent = '▶ 再開 / Resume';
        btnPause.style.backgroundColor = '#10b981';
    } else {
        btnPause.textContent = '⏸ 停止 / Pause';
        btnPause.style.backgroundColor = '#f59e0b';
    }
}

btnPause.addEventListener('click', () => {
    const paths = previewContainer.querySelectorAll(targetElementsSelector);
    if (!isPaused) {
        paths.forEach(p => p.style.animationPlayState = 'paused');
        isPaused = true;
    } else {
        paths.forEach(p => p.style.animationPlayState = 'running');
        isPaused = false;
    }
    updatePauseButtonState();
});

btnReset.addEventListener('click', () => {
    updatePreview();
    const paths = previewContainer.querySelectorAll(targetElementsSelector);
    paths.forEach(p => {
        p.style.animation = 'none';
    });
    isPaused = false;
    updatePauseButtonState();
});

// 5. コピー機能
btnCopy.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(outputCodeTextarea.value);
        const originalText = btnCopy.textContent;
        btnCopy.textContent = '✓ コピーしました / Copied!';
        btnCopy.style.backgroundColor = '#059669';
        setTimeout(() => {
            btnCopy.textContent = originalText;
            btnCopy.style.backgroundColor = '';
        }, 2000);
    } catch (err) {
        alert('クリップボードへのコピーに失敗しました。');
    }
});

// 初期化
window.onload = () => {
    presetButtons[0].click();
};
