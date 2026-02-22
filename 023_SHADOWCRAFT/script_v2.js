/**
 * SHADOW CRAFT Application Logic
 * 
 * 機能:
 * 1. スライダー入力の監視と状態更新
 * 2. box-shadow CSSプロパティの動的生成（カラーピッカー対応）
 * 3. プレビュー要素へのスタイル適用（背景色に応じたカード色変更）
 * 4. クリップボードへのコピー機能
 * 5. 背景色切り替え機能
 */

document.addEventListener('DOMContentLoaded', () => {
    // === 状態管理 ===
    // 3つのレイヤーの初期値を設定
    const layers = [
        { x: 0, y: 10, blur: 20, spread: -5, alpha: 0.4 }, // Layer 1 (Medium)
        { x: 0, y: 20, blur: 40, spread: -10, alpha: 0.2 }, // Layer 2 (Large)
        { x: 0, y: 40, blur: 80, spread: -15, alpha: 0.1 }  // Layer 3 (Ambient)
    ];

    // 影のグローバルカラー (初期値: 黒)
    let globalShadowColor = { r: 0, g: 0, b: 0 };

    // === DOM要素の取得 ===
    const previewElement = document.getElementById('target-element');
    const codeOutput = document.getElementById('css-code');
    const copyBtn = document.getElementById('copy-btn');
    const toast = document.getElementById('toast');
    const previewArea = document.getElementById('preview-area');
    const bgButtons = document.querySelectorAll('.bg-btn');
    const colorPicker = document.getElementById('shadow-color');
    const colorDisplay = document.getElementById('val-color');

    // === メインロジック ===

    /**
     * HEXカラーコードをRGBオブジェクトに変換する関数
     * @param {string} hex - "#RRGGBB" 形式のカラーコード
     * @returns {object} {r, g, b}
     */
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    /**
     * 現在の状態からbox-shadow文字列を生成し、UIを更新する関数
     */
    function updateShadow() {
        // 各レイヤーのパラメータをCSS形式に変換
        // フォーマット: offset-x offset-y blur-radius spread-radius rgba(r,g,b,alpha)
        const shadows = layers.map(layer => {
            const { r, g, b } = globalShadowColor;
            return `${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px rgba(${r}, ${g}, ${b}, ${layer.alpha})`;
        });

        // カンマ区切りで結合
        const shadowString = shadows.join(',\n            '); // 改行とインデントを入れて見やすく
        const cssString = `box-shadow: ${shadowString};`;

        // プレビュー要素に適用 (インラインスタイル)
        previewElement.style.boxShadow = shadows.join(', ');

        // コード表示エリアの更新
        codeOutput.textContent = cssString;
    }

    /**
     * イベントリスナーを設定する関数
     */
    function setupListeners() {
        // 1. 各レイヤー(1〜3)のスライダー制御
        for (let i = 0; i < 3; i++) {
            const layerIndex = i + 1;
            const layerData = layers[i];

            // パラメータの種類
            const params = ['x', 'y', 'blur', 'spread', 'alpha'];

            params.forEach(param => {
                const inputId = `layer${layerIndex}-${param}`;
                const displayId = `val-${param}-${layerIndex}`;

                const inputElement = document.getElementById(inputId);
                const displayElement = document.getElementById(displayId);

                if (inputElement && displayElement) {
                    // 初期値をinputに反映
                    inputElement.value = layerData[param];

                    // イベントリスナー追加
                    inputElement.addEventListener('input', (e) => {
                        const newValue = parseFloat(e.target.value);

                        // 状態を更新
                        layerData[param] = newValue;

                        // 表示用の数値を更新
                        let displayValue = newValue;
                        if (param === 'alpha') {
                            displayValue = newValue.toFixed(2);
                        } else {
                            displayValue = newValue + 'px';
                        }
                        displayElement.textContent = displayValue;

                        updateShadow();
                    });
                }
            });
        }

        // 2. カラーピッカーの制御
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                const hexColor = e.target.value;
                globalShadowColor = hexToRgb(hexColor);
                colorDisplay.textContent = hexColor.toUpperCase();
                updateShadow();
            });
        }
    }

    /**
     * クリップボードコピー機能
     */
    function copyToClipboard() {
        const textToCopy = codeOutput.textContent;

        navigator.clipboard.writeText(textToCopy).then(() => {
            // トースト通知を表示
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
            alert('コピーに失敗しました。');
        });
    }

    /**
     * 背景切り替え機能
     * 背景色が変わると同時に、プレビューカードの視認性を保つためにカードの色も調整する
     */
    function switchBackground(e) {
        // すべてのボタンからactiveクラスを削除
        bgButtons.forEach(btn => btn.classList.remove('active'));

        // クリックされたボタンをアクティブに
        const targetBtn = e.target;
        targetBtn.classList.add('active');

        // 背景色を取得
        const userBg = targetBtn.getAttribute('data-bg');

        // CSS変数で背景色を変更
        previewArea.style.setProperty('--preview-bg', userBg);

        // クラスによるカード色の制御（黒背景の時だけカード色を暗くするなどの調整）
        // data-bgの値で判断（簡易実装）
        // #1a1a1a は黒背景
        if (userBg === '#1a1a1a') {
            previewArea.classList.add('dark-mode');
            // 黒背景の時はカードを目立たせるために #333 などのダークグレーにする
            previewArea.style.setProperty('--card-bg', '#333333');

            // 黒背景なら影の色を白っぽくすると見えやすいというヒントを与えるため
            // 自動で色は変えない（ユーザーの自由）が、視認性は確保される。
        } else {
            previewArea.classList.remove('dark-mode');
            // 白やグレー背景の時はカードは白またはオフホワイト
            previewArea.style.setProperty('--card-bg', '#f5f5f5');
        }
    }

    // === 初期化実行 ===
    setupListeners();
    updateShadow(); // 初回描画

    // コピーボタンのイベント設定
    copyBtn.addEventListener('click', copyToClipboard);

    // 背景切り替えボタンのイベント設定
    bgButtons.forEach(btn => {
        btn.addEventListener('click', switchBackground);
    });
});
