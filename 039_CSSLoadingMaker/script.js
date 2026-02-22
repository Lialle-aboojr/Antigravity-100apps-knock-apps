/* ============================================
   CSS Loading Maker - メインスクリプト（複数色対応版）
   機能: アニメーション切替、複数カラー選択、
         カスタマイズ、コード生成、クリップボードコピー
   ============================================ */

// --- DOM要素の取得 ---
const animationGrid = document.getElementById('animationGrid');
const previewContainer = document.getElementById('previewContainer');
const sizeRange = document.getElementById('sizeRange');
const sizeValue = document.getElementById('sizeValue');
const colorCountGroup = document.getElementById('colorCountGroup');
const colorPickersContainer = document.getElementById('colorPickersContainer');
const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');
const htmlCode = document.getElementById('htmlCode');
const cssCode = document.getElementById('cssCode');
const copyHtmlBtn = document.getElementById('copyHtmlBtn');
const copyCssBtn = document.getElementById('copyCssBtn');

// --- デフォルトカラーパレット（美しい5色） ---
const DEFAULT_COLORS = [
    '#89b4fa',  // ブルー
    '#a6e3a1',  // グリーン
    '#f38ba8',  // ピンク
    '#fab387',  // オレンジ
    '#cba6f7'   // パープル
];

// --- 現在の設定を管理するオブジェクト ---
let currentSettings = {
    type: 'spinner',            // 選択中のアニメーションタイプ
    size: 60,                   // サイズ（px）
    colorCount: 1,              // 色数（1, 3, 5）
    colors: [DEFAULT_COLORS[0]], // 選択中の色の配列
    speed: 1.0                  // アニメーション速度（秒）
};

/* ============================================
   アニメーション選択の処理
   ============================================ */

// 各アニメーションボタンにクリックイベントを登録
animationGrid.addEventListener('click', (e) => {
    // クリックされたボタン要素を取得（子要素クリック時は親ボタンを探す）
    const btn = e.target.closest('.anim-btn');
    if (!btn) return;

    // 全ボタンのactive状態を解除し、クリックされたボタンをactiveにする
    document.querySelectorAll('.anim-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 設定を更新して再描画
    currentSettings.type = btn.dataset.type;
    updatePreview();
    updateCode();
});

/* ============================================
   カスタマイズコントロールの処理
   ============================================ */

// サイズスライダーの変更イベント
sizeRange.addEventListener('input', () => {
    currentSettings.size = parseInt(sizeRange.value);
    sizeValue.textContent = `${currentSettings.size}px`;
    updatePreview();
    updateCode();
});

// 速度スライダーの変更イベント
// （内部値3〜30を0.3s〜3.0sに変換）
speedRange.addEventListener('input', () => {
    currentSettings.speed = parseInt(speedRange.value) / 10;
    speedValue.textContent = `${currentSettings.speed.toFixed(1)}s`;
    updatePreview();
    updateCode();
});

/* ============================================
   色数選択の処理
   ============================================ */

// 色数ボタンにクリックイベントを登録
colorCountGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.color-count-btn');
    if (!btn) return;

    // 全ボタンのactive状態を解除し、クリックされたボタンをactiveにする
    document.querySelectorAll('.color-count-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 色数を更新
    const newCount = parseInt(btn.dataset.count);
    currentSettings.colorCount = newCount;

    // 色の配列を新しい色数に合わせて調整
    // 既存の色はできるだけ保持し、足りない分はデフォルトから補充
    const newColors = [];
    for (let i = 0; i < newCount; i++) {
        if (i < currentSettings.colors.length) {
            // 既存の色を保持
            newColors.push(currentSettings.colors[i]);
        } else {
            // デフォルトカラーから補充
            newColors.push(DEFAULT_COLORS[i % DEFAULT_COLORS.length]);
        }
    }
    currentSettings.colors = newColors;

    // カラーピッカーを再構築
    buildColorPickers();
    updatePreview();
    updateCode();
});

/* ============================================
   カラーピッカーの動的生成
   色数に応じてカラーピッカーを増減する
   ============================================ */
function buildColorPickers() {
    // コンテナをクリア
    colorPickersContainer.innerHTML = '';

    // 色の数に応じてカラーピッカー行を生成
    currentSettings.colors.forEach((color, index) => {
        const row = document.createElement('div');
        row.className = 'color-picker-row';

        // インデックス番号（1始まり表示）
        const indexLabel = document.createElement('span');
        indexLabel.className = 'color-picker-index';
        indexLabel.textContent = `${index + 1}:`;

        // カラーピッカー入力
        const input = document.createElement('input');
        input.type = 'color';
        input.className = 'color-picker-input';
        input.value = color;
        input.id = `colorPicker${index}`;

        // カラープレビュースウォッチ
        const swatch = document.createElement('span');
        swatch.className = 'color-picker-swatch';
        swatch.style.background = color;

        // HEXコード表示
        const hex = document.createElement('span');
        hex.className = 'color-picker-hex';
        hex.textContent = color;

        // カラーピッカー変更イベント
        input.addEventListener('input', () => {
            currentSettings.colors[index] = input.value;
            swatch.style.background = input.value;
            hex.textContent = input.value;
            updatePreview();
            updateCode();
        });

        // 行に要素を追加
        row.appendChild(indexLabel);
        row.appendChild(input);
        row.appendChild(swatch);
        row.appendChild(hex);

        // コンテナに行を追加
        colorPickersContainer.appendChild(row);
    });
}

/* ============================================
   ヘルパー関数: 色の配列を必要な数に拡張する
   色数がアニメーション要素数より少ない場合、
   循環（ラップアラウンド）させて対応する
   ============================================ */
function getColor(index) {
    return currentSettings.colors[index % currentSettings.colors.length];
}

/* ============================================
   プレビュー更新処理
   各アニメーションタイプに対応するDOM要素を生成して
   プレビューコンテナに挿入する
   ============================================ */
function updatePreview() {
    const { type, size, colors, speed } = currentSettings;

    // CSS変数: サイズと速度＋各色をセット
    let cssVars = `--loader-size:${size}px; --loader-speed:${speed}s;`;
    for (let i = 0; i < 5; i++) {
        cssVars += ` --c${i + 1}:${getColor(i)};`;
    }

    let html = '';

    // アニメーションタイプに応じたHTML構造を生成
    switch (type) {
        case 'spinner':
            html = `<div class="loader-spinner" style="${cssVars}"></div>`;
            break;

        case 'bouncing-dots':
            html = `<div class="loader-bouncing-dots" style="${cssVars}">
  <span class="dot"></span>
  <span class="dot"></span>
  <span class="dot"></span>
</div>`;
            break;

        case 'pulse':
            html = `<div class="loader-pulse" style="${cssVars}"></div>`;
            break;

        case 'wave':
            html = `<div class="loader-wave" style="${cssVars}">
  <span class="bar"></span>
  <span class="bar"></span>
  <span class="bar"></span>
  <span class="bar"></span>
  <span class="bar"></span>
</div>`;
            break;

        case 'flipping-square':
            html = `<div class="loader-flipping-square" style="${cssVars}"></div>`;
            break;

        case 'double-ring':
            html = `<div class="loader-double-ring" style="${cssVars}">
  <span class="ring"></span>
  <span class="ring"></span>
</div>`;
            break;
    }

    // プレビューコンテナに描画
    previewContainer.innerHTML = html;
}

/* ============================================
   コード生成処理
   現在の設定からコピー可能なHTML/CSSコードを生成する
   複数色に完全対応したコードを出力する
   ============================================ */
function updateCode() {
    const { type, size, colors, speed, colorCount } = currentSettings;
    const borderW = Math.max(3, Math.round(size / 15));
    const ringBorderW = Math.max(2, Math.round(size / 20));

    // --- HTMLコード生成 ---
    let generatedHtml = '';
    switch (type) {
        case 'spinner':
            generatedHtml = `<div class="loader-spinner"></div>`;
            break;
        case 'bouncing-dots':
            generatedHtml = `<div class="loader-bouncing-dots">\n  <span class="dot"></span>\n  <span class="dot"></span>\n  <span class="dot"></span>\n</div>`;
            break;
        case 'pulse':
            generatedHtml = `<div class="loader-pulse"></div>`;
            break;
        case 'wave':
            generatedHtml = `<div class="loader-wave">\n  <span class="bar"></span>\n  <span class="bar"></span>\n  <span class="bar"></span>\n  <span class="bar"></span>\n  <span class="bar"></span>\n</div>`;
            break;
        case 'flipping-square':
            generatedHtml = `<div class="loader-flipping-square"></div>`;
            break;
        case 'double-ring':
            generatedHtml = `<div class="loader-double-ring">\n  <span class="ring"></span>\n  <span class="ring"></span>\n</div>`;
            break;
    }

    // --- CSSコード生成（複数色対応） ---
    let generatedCss = '';

    switch (type) {
        case 'spinner': {
            // 1色: 上のみ色付き / 3色: 上・右・下 / 5色: 上・右・下・左 + アニメーション色変化
            const topColor = getColor(0);
            const rightColor = colorCount >= 3 ? getColor(1) : 'rgba(0,0,0,0.1)';
            const bottomColor = colorCount >= 3 ? getColor(2) : 'rgba(0,0,0,0.1)';
            const leftColor = colorCount >= 5 ? getColor(3) : 'rgba(0,0,0,0.1)';

            generatedCss = `.loader-spinner {
  width: ${size}px;
  height: ${size}px;
  border: ${borderW}px solid rgba(0, 0, 0, 0.1);
  border-top-color: ${topColor};
  border-right-color: ${rightColor};
  border-bottom-color: ${bottomColor};
  border-left-color: ${leftColor};
  border-radius: 50%;
  animation: spin ${speed}s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}`;
            break;
        }

        case 'bouncing-dots': {
            // 各ドットに異なる色を適用
            let dotRules = '';
            for (let i = 0; i < 3; i++) {
                const c = getColor(i);
                const delay = (speed * 0.16 * i).toFixed(2);
                if (i === 0) {
                    dotRules += `
.loader-bouncing-dots .dot:nth-child(1) {
  background: ${c};
}
`;
                } else {
                    dotRules += `
.loader-bouncing-dots .dot:nth-child(${i + 1}) {
  background: ${c};
  animation-delay: ${delay}s;
}
`;
                }
            }

            generatedCss = `.loader-bouncing-dots {
  display: flex;
  gap: ${Math.round(size * 0.2)}px;
  align-items: center;
}

.loader-bouncing-dots .dot {
  width: ${Math.round(size * 0.25)}px;
  height: ${Math.round(size * 0.25)}px;
  border-radius: 50%;
  animation: bounce ${speed}s ease-in-out infinite;
}
${dotRules}
@keyframes bounce {
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-${Math.round(size * 0.5)}px);
  }
}`;
            break;
        }

        case 'pulse': {
            // 1色: 単色パルス / 3色+: 色が変化するキーフレーム
            if (colorCount === 1) {
                generatedCss = `.loader-pulse {
  width: ${size}px;
  height: ${size}px;
  background: ${getColor(0)};
  border-radius: 50%;
  animation: pulse ${speed}s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
}`;
            } else {
                // 複数色: キーフレーム内で色を切り替える
                let kfSteps = '';
                const steps = colorCount;
                for (let i = 0; i < steps; i++) {
                    const pct = Math.round((i / steps) * 100);
                    const scale = i % 2 === 0 ? '0.8' : '1';
                    const opacity = i % 2 === 0 ? '0.5' : '1';
                    kfSteps += `  ${pct}% {\n    transform: scale(${scale});\n    opacity: ${opacity};\n    background: ${getColor(i)};\n  }\n`;
                }
                kfSteps += `  100% {\n    transform: scale(0.8);\n    opacity: 0.5;\n    background: ${getColor(0)};\n  }`;

                generatedCss = `.loader-pulse {
  width: ${size}px;
  height: ${size}px;
  background: ${getColor(0)};
  border-radius: 50%;
  animation: pulse ${speed}s ease-in-out infinite;
}

@keyframes pulse {
${kfSteps}
}`;
            }
            break;
        }

        case 'wave': {
            // 各バーに異なる色を適用
            let barRules = '';
            for (let i = 0; i < 5; i++) {
                const c = getColor(i);
                const delay = (-speed * (0.4 - i * 0.1)).toFixed(2);
                barRules += `
.loader-wave .bar:nth-child(${i + 1}) {
  background: ${c};${i > 0 ? `\n  animation-delay: ${delay}s;` : ''}
}
`;
            }

            generatedCss = `.loader-wave {
  display: flex;
  align-items: center;
  gap: ${Math.round(size * 0.07)}px;
  height: ${size}px;
}

.loader-wave .bar {
  width: ${Math.round(size * 0.1)}px;
  height: 100%;
  border-radius: 4px;
  animation: wave ${speed}s ease-in-out infinite;
}
${barRules}
@keyframes wave {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}`;
            break;
        }

        case 'flipping-square': {
            // 1色: 単色反転 / 複数色: 反転中に色が変化
            if (colorCount === 1) {
                generatedCss = `.loader-flipping-square {
  width: ${size}px;
  height: ${size}px;
  background: ${getColor(0)};
  border-radius: 6px;
  animation: flip ${speed}s ease-in-out infinite;
}

@keyframes flip {
  0% {
    transform: perspective(400px) rotateY(0);
  }
  50% {
    transform: perspective(400px) rotateY(180deg);
  }
  100% {
    transform: perspective(400px) rotateY(360deg);
  }
}`;
            } else {
                // 複数色: キーフレーム内で色をスムーズに遷移
                let kfSteps = '';
                const steps = colorCount;
                for (let i = 0; i <= steps; i++) {
                    const pct = Math.round((i / steps) * 100);
                    const deg = Math.round((i / steps) * 360);
                    const c = getColor(i % steps);
                    kfSteps += `  ${pct}% {\n    transform: perspective(400px) rotateY(${deg}deg);\n    background: ${c};\n  }\n`;
                }

                generatedCss = `.loader-flipping-square {
  width: ${size}px;
  height: ${size}px;
  background: ${getColor(0)};
  border-radius: 6px;
  animation: flip ${speed}s ease-in-out infinite;
}

@keyframes flip {
${kfSteps}}`;
            }
            break;
        }

        case 'double-ring': {
            // リング1: 上下の色 / リング2: 左右の色
            const ring1Top = getColor(0);
            const ring1Bottom = colorCount >= 3 ? getColor(2) : getColor(0);
            const ring2Left = colorCount >= 3 ? getColor(1) : getColor(0);
            const ring2Right = colorCount >= 5 ? getColor(3) : ring2Left;

            generatedCss = `.loader-double-ring {
  width: ${size}px;
  height: ${size}px;
  position: relative;
}

.loader-double-ring .ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: ${ringBorderW}px solid transparent;
}

.loader-double-ring .ring:nth-child(1) {
  border-top-color: ${ring1Top};
  border-bottom-color: ${ring1Bottom};
  animation: ring-spin ${speed}s linear infinite;
}

.loader-double-ring .ring:nth-child(2) {
  border-left-color: ${ring2Left};
  border-right-color: ${ring2Right};
  animation: ring-spin ${speed}s linear infinite reverse;
}

@keyframes ring-spin {
  to {
    transform: rotate(360deg);
  }
}`;
            break;
        }
    }

    // コード表示エリアに反映
    htmlCode.textContent = generatedHtml;
    cssCode.textContent = generatedCss;
}

/* ============================================
   クリップボードコピー機能
   ボタンクリックでコードをコピーし、
   成功時にフィードバックを表示する
   ============================================ */

// HTMLコピーボタン
copyHtmlBtn.addEventListener('click', () => {
    copyToClipboard(htmlCode.textContent, copyHtmlBtn);
});

// CSSコピーボタン
copyCssBtn.addEventListener('click', () => {
    copyToClipboard(cssCode.textContent, copyCssBtn);
});

/**
 * テキストをクリップボードにコピーし、ボタンにフィードバックを表示する関数
 * @param {string} text - コピーするテキスト
 * @param {HTMLElement} button - フィードバック対象のボタン要素
 */
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        // コピー成功: ボタンテキストを一時的に変更
        const originalText = button.textContent;
        button.textContent = '✅ コピー完了! / Copied!';
        button.classList.add('copied');

        // 2秒後に元のテキストに戻す
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(() => {
        // コピー失敗時のフォールバック（古いブラウザ対応）
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            const originalText = button.textContent;
            button.textContent = '✅ コピー完了! / Copied!';
            button.classList.add('copied');
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        } catch (err) {
            // コピーに完全に失敗した場合
            button.textContent = '❌ 失敗 / Failed';
            setTimeout(() => {
                button.textContent = '📋 コピー / Copy';
                button.classList.remove('copied');
            }, 2000);
        }
        document.body.removeChild(textarea);
    });
}

/* ============================================
   初期化処理
   ページ読み込み時にカラーピッカー・プレビュー・コードを生成する
   ============================================ */
buildColorPickers();
updatePreview();
updateCode();
