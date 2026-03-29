// ====== 設定・定数 ======
// 初期のSVGデータ（3種類のプリセット）
const presets = {
    check: `<svg viewBox="0 0 100 100"><path d="M 25 50 L 45 70 L 75 30" /></svg>`,
    heart: `<svg viewBox="0 0 100 100"><path d="M 50 80 C -15 40, 20 -10, 50 20 C 80 -10, 115 40, 50 80" /></svg>`,
    curve: `<svg viewBox="0 0 200 100"><path d="M 20 70 Q 20 20 40 20 Q 60 20 60 70 Q 60 40 80 40 Q 100 40 100 80 Q 100 50 120 50 Q 140 50 140 80 Q 140 30 160 30 Q 180 30 180 70" /></svg>`
};

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
// ユーザーが入力したカスタムSVGから危険なタグや属性を取り除きます
function sanitizeSVG(svgString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    
    // パースエラーがあればnullを返す
    if (doc.getElementsByTagName('parsererror').length > 0) {
        return null;
    }
    
    const svgElement = doc.querySelector('svg');
    if (!svgElement) return null;

    // 1-1. 危険なタグを削除
    const forbiddenTags = ['script', 'iframe', 'object', 'embed', 'link', 'style'];
    forbiddenTags.forEach(tag => {
        const elements = svgElement.getElementsByTagName(tag);
        // 後ろから削除していく（インデックスずれを防ぐため）
        for (let i = elements.length - 1; i >= 0; i--) {
            elements[i].parentNode.removeChild(elements[i]);
        }
    });

    // 1-2. イベントハンドラ属性（onload, onclick など "on" で始まるもの）を削除
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
    
    // 入力が空の場合
    if (!rawSvg.trim()) {
        previewContainer.innerHTML = '<span style="color:#64748b;">SVGを入力してください</span>';
        outputCodeTextarea.value = '';
        return;
    }

    // サニタイズ処理
    const safeSvg = sanitizeSVG(rawSvg);
    if (!safeSvg) {
        previewContainer.innerHTML = '<span style="color:#ef4444;">無効なSVG形式です</span>';
        outputCodeTextarea.value = '';
        return;
    }

    // SVGを描画
    previewContainer.innerHTML = safeSvg;
    const svgEl = previewContainer.querySelector('svg');
    
    // 設定値の取得
    const duration = parseFloat(durationInput.value);
    const width = parseInt(strokeWidthInput.value);
    const color = strokeColorInput.value;

    const paths = svgEl.querySelectorAll('path');
    
    // 各パスの長さを計算し、プロパティを設定
    paths.forEach(path => {
        try {
            // パスの全長を取得
            const length = path.getTotalLength();
            // 線のパターンの長さと、開始位置のオフセットを全長に設定する（最初は見えない状態）
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
        } catch(e) {
            console.warn('パスの長さを計算できませんでした', e);
        }
    });

    // 出力用HTMLを作るために、スタイル追加済のsvgを複製しておく
    const cloneSvgForOutput = svgEl.cloneNode(true);
    // クラス名を追加して、後からCSSが当たるようにする
    cloneSvgForOutput.classList.add('animated-svg');

    // 出力用CSSの生成
    const cssCode = `
<style>
/* SVGアニメーション用のスタイル */
.animated-svg path {
    fill: none !important;
    stroke: ${color} !important;
    stroke-width: ${width}px !important;
    stroke-linecap: round !important;
    stroke-linejoin: round !important;
    /* dashoffsetを0に減らしていくアニメーション */
    animation: drawAnimation ${duration}s ease forwards !important;
}

@keyframes drawAnimation {
    to {
        stroke-dashoffset: 0;
    }
}
</style>
`;
    // HTMLの生成（属性の整形など）
    const htmlCode = cloneSvgForOutput.outerHTML;

    // 出力テキストエリアに表示
    outputCodeTextarea.value = cssCode.trim() + '\n\n' + htmlCode;
    
    // プレビュー領域にも <style> を追加してアニメーションを適用する
    // ただしプレビュー自身のスコープだけで効くようにIDセレクタを利用
    const styleEl = document.createElement('style');
    styleEl.id = 'preview-style';
    styleEl.innerHTML = `
        #preview-container svg path {
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
    
    // 既存のstyleタグがあれば削除してから新規追加
    const oldStyle = document.getElementById('preview-style');
    if (oldStyle) {
        oldStyle.remove();
    }
    document.head.appendChild(styleEl);

    // リセット時に再生状態を初期化
    isPaused = false;
    updatePauseButtonState();
}

// 3. 全てのイベントリスナー

// プリセットボタンのクリックイベント
presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // 全ボタンからactiveクラスを外し、クリックされたものだけに付与
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // svgを取得してテキストエリアにセットし、更新
        const presetKey = btn.getAttribute('data-preset');
        customSvgTextarea.value = presets[presetKey];
        updatePreview();
    });
});

// カスタムSVGが直接編集された時
customSvgTextarea.addEventListener('input', () => {
    // プリセットの選択状態を解除
    presetButtons.forEach(b => b.classList.remove('active'));
    updatePreview();
});

// パラメータ変更イベント
durationInput.addEventListener('input', (e) => {
    // 数値を表示用に更新
    durationVal.textContent = parseFloat(e.target.value).toFixed(1);
    updatePreview();
});

strokeWidthInput.addEventListener('input', (e) => {
    widthVal.textContent = e.target.value;
    updatePreview();
});

strokeColorInput.addEventListener('input', updatePreview);

// 4. コントロールボタン (Play / Pause / Reset)

// 再生ボタン
btnPlay.addEventListener('click', () => {
    if (isPaused) {
        // ポーズ中なら再開
        const paths = previewContainer.querySelectorAll('path');
        paths.forEach(p => p.style.animationPlayState = 'running');
        isPaused = false;
        updatePauseButtonState();
    } else {
        // 最初から再生する場合（DOMを再描画することでアニメーションをリスタート）
        updatePreview();
    }
});

// ポーズボタンの見た目とテキストを更新する関数
function updatePauseButtonState() {
    if (isPaused) {
        btnPause.textContent = '▶ 再開 / Resume';
        btnPause.style.backgroundColor = '#10b981'; // グリーン
    } else {
        btnPause.textContent = '⏸ 停止 / Pause';
        btnPause.style.backgroundColor = '#f59e0b'; // アンバー
    }
}

// 停止ボタン
btnPause.addEventListener('click', () => {
    const paths = previewContainer.querySelectorAll('path');
    if (!isPaused) {
        // 一時停止する
        paths.forEach(p => p.style.animationPlayState = 'paused');
        isPaused = true;
    } else {
        // 再開する
        paths.forEach(p => p.style.animationPlayState = 'running');
        isPaused = false;
    }
    updatePauseButtonState();
});

// リセットボタン
btnReset.addEventListener('click', () => {
    // 一度プレビューを更新して設定などを初期化
    updatePreview();
    
    // すぐにアニメーションを none にしてリセット状態（描画前）を維持する
    const paths = previewContainer.querySelectorAll('path');
    paths.forEach(p => {
        p.style.animation = 'none'; // これで進行度0のまま止まる
    });
    
    isPaused = false;
    updatePauseButtonState();
});

// 5. コピー機能
btnCopy.addEventListener('click', async () => {
    try {
        // クリップボードAPIを使用してコピー
        await navigator.clipboard.writeText(outputCodeTextarea.value);
        
        // ボタンの見た目を一時的に変更
        const originalText = btnCopy.textContent;
        btnCopy.textContent = '✓ コピーしました / Copied!';
        btnCopy.style.backgroundColor = '#059669'; // より濃いグリーン
        
        // 2秒後に元の見た目に戻す
        setTimeout(() => {
            btnCopy.textContent = originalText;
            btnCopy.style.backgroundColor = ''; // CSSのデフォルトに戻る
        }, 2000);
    } catch (err) {
        alert('クリップボードへのコピーに失敗しました。');
    }
});

// ====== 初期化処理 ======
window.onload = () => {
    // 最初のプリセット(Checkmark)を選択状態にして描画
    presetButtons[0].click();
};
