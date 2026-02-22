/**
 * SHADOW CRAFT V3 Application Logic
 * 
 * 機能:
 * 1. スライダー入力の監視と状態更新
 * 2. 3層個別のカラー設定（Picker + Hex Textの双方向同期）
 * 3. リアルタイムShadow生成
 * 4. ダークモード時の視認性自動調整
 */

document.addEventListener('DOMContentLoaded', () => {
    // === 状態管理 ===
    // 3つのレイヤーの初期設定（個別の色を持てるように拡張）
    const layers = [
        { x: 0, y: 10, blur: 20, spread: -5, alpha: 0.4, color: '#000000' }, // Layer 1
        { x: 0, y: 20, blur: 40, spread: -10, alpha: 0.2, color: '#000000' }, // Layer 2
        { x: 0, y: 40, blur: 80, spread: -15, alpha: 0.1, color: '#000000' }  // Layer 3
    ];

    // === DOM要素の取得 ===
    const previewElement = document.getElementById('target-element');
    const codeOutput = document.getElementById('css-code');
    const copyBtn = document.getElementById('copy-btn');
    const toast = document.getElementById('toast');
    const previewArea = document.getElementById('preview-area');
    const bgButtons = document.querySelectorAll('.bg-btn');

    // === ヘルパー関数 ===

    /**
     * HEXカラー文字列("#RRGGBB")をRGBオブジェクト {r, g, b} に変換
     */
    function hexToRgb(hex) {
        // 短縮形 (#FFF) の対応などは今回はinput type="color"がフル桁返すので省略可能だが、
        // テキスト入力の堅牢性のため簡易正規表現を使用
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 }; // フォールバック
    }

    /**
     * RGB値とAlpha値から CSS rgba文字列を生成
     */
    function getRgbaString(hex, alpha) {
        const { r, g, b } = hexToRgb(hex);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // === メインロジック ===

    /**
     * UI更新関数
     * 現在のレイヤー状態からbox-shadow文字列を生成し、プレビューとコードブロックに適用
     */
    function updateShadow() {
        const shadowParts = layers.map(layer => {
            const colorRgba = getRgbaString(layer.color, layer.alpha);
            return `${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px ${colorRgba}`;
        });

        // プレビュー適用
        const shadowStyle = shadowParts.join(', ');
        previewElement.style.boxShadow = shadowStyle;

        // コード出力適用（見やすく整形）
        codeOutput.textContent = `box-shadow: ${shadowParts.join(',\n            ')};`;
    }

    /**
     * イベントリスナー設定
     * 各レイヤーのスライダー、カラーピッカー、テキスト入力の同期処理を行う
     */
    function setupListeners() {
        layers.forEach((layerData, index) => {
            const layerNum = index + 1;

            // 1. スライダー (x, y, blur, spread, alpha)
            const sliderParams = ['x', 'y', 'blur', 'spread', 'alpha'];
            sliderParams.forEach(param => {
                const inputId = `layer${layerNum}-${param}`;
                const displayId = `val-${param}-${layerNum}`;
                const el = document.getElementById(inputId);
                const displayEl = document.getElementById(displayId);

                if (el) {
                    // 初期値セット
                    el.value = layerData[param];

                    // イベントリスナー
                    el.addEventListener('input', (e) => {
                        const val = parseFloat(e.target.value);
                        layerData[param] = val;

                        // 表示更新
                        if (displayEl) {
                            if (param === 'alpha') {
                                displayEl.textContent = val.toFixed(2);
                            } else {
                                displayEl.textContent = val + 'px';
                            }
                        }
                        updateShadow();
                    });
                }
            });

            // 2. カラー入力 (Picker & Text)
            const pickerId = `layer${layerNum}-color-picker`;
            const textId = `layer${layerNum}-color-text`;
            const pickerEl = document.getElementById(pickerId);
            const textEl = document.getElementById(textId);

            if (pickerEl && textEl) {
                // 初期値同期
                pickerEl.value = layerData.color;
                textEl.value = layerData.color;

                // Picker -> Text & State
                pickerEl.addEventListener('input', (e) => {
                    const hex = e.target.value;
                    layerData.color = hex;
                    textEl.value = hex.toUpperCase(); // Text側も更新
                    updateShadow();
                });

                // Text -> Picker & State
                textEl.addEventListener('input', (e) => {
                    let hex = e.target.value;

                    // #が付いてなければ付けるなどの簡易補正は可だが、
                    // input type="color"が受け付けるのは完全な7文字HEXのみ
                    if (!hex.startsWith('#')) {
                        hex = '#' + hex;
                    }

                    // 正しいHEXコードの形式かチェック (3桁 or 6桁)
                    const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(hex);

                    if (isValidHex) {
                        // 3桁なら6桁に変換 (#ABC -> #AABBCC) はブラウザが補完してくれる場合もあるが、
                        // color inputに渡すときはフル桁が安全
                        if (hex.length === 4) {
                            hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
                        }

                        layerData.color = hex;
                        pickerEl.value = hex; // Picker側も更新
                        updateShadow();
                    }
                    // 無効な入力のときは状態更新しない（UXとしてエラーは出さず、有効な値のみ拾う）
                });

                // Text入力完了時フォーマット整形
                textEl.addEventListener('change', (e) => {
                    // 最終的にStateに入っている正しい値を書き戻す（無効な値をクリア）
                    textEl.value = layerData.color.toUpperCase();
                });
            }
        });
    }

    /**
     * 背景切り替え機能
     * 黒背景(#000000)のときのみ、カードの色をダークグレーに変更して視認性を確保
     */
    function switchBackground(e) {
        // ボタン状態更新
        bgButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // 背景色取得
        const bgHex = e.target.getAttribute('data-bg');

        // 背景変数更新
        previewArea.style.setProperty('--preview-bg', bgHex);

        // 黒背景(#000000)特異点処理
        if (bgHex === '#000000') {
            // カードをダークグレー、文字を白に
            previewArea.style.setProperty('--card-bg', '#2d3436');
            previewArea.style.setProperty('--card-text', '#dfe6e9');
        } else {
            // 通常（白・グレー）はカードを明るく、文字を暗く
            previewArea.style.setProperty('--card-bg', '#f5f5f5');
            previewArea.style.setProperty('--card-text', '#2d3436');
        }
    }

    /**
     * コピー機能
     */
    function copyCode() {
        const code = codeOutput.textContent;
        navigator.clipboard.writeText(code).then(() => {
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        }).catch(console.error);
    }

    // === 初期化 ===
    setupListeners();
    updateShadow();

    // グローバルリスナー
    copyBtn.addEventListener('click', copyCode);
    bgButtons.forEach(btn => btn.addEventListener('click', switchBackground));
});
