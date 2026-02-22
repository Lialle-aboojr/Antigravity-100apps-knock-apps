/**
 * SHADOW CRAFT Application Logic
 * 
 * 機能:
 * 1. スライダー入力の監視と状態更新
 * 2. box-shadow CSSプロパティの動的生成
 * 3. プレビュー要素へのスタイル適用
 * 4. クリップボードへのコピー機能
 * 5. 背景色切り替え機能
 */

document.addEventListener('DOMContentLoaded', () => {
    // === 状態管理 ===
    // 3つのレイヤーの初期値を設定 (Modern Industrialな美しい影のプリセット)
    const layers = [
        { x: 0, y: 10, blur: 20, spread: -5, alpha: 0.4 }, // Layer 1 (Medium)
        { x: 0, y: 20, blur: 40, spread: -10, alpha: 0.2 }, // Layer 2 (Large)
        { x: 0, y: 40, blur: 80, spread: -15, alpha: 0.1 }  // Layer 3 (Ambient)
    ];

    // === DOM要素の取得 ===
    const previewElement = document.getElementById('target-element');
    const codeOutput = document.getElementById('css-code');
    const copyBtn = document.getElementById('copy-btn');
    const toast = document.getElementById('toast');
    const previewArea = document.getElementById('preview-area');
    const bgButtons = document.querySelectorAll('.bg-btn');

    // === メインロジック ===

    /**
     * 現在の状態からbox-shadow文字列を生成し、UIを更新する関数
     */
    function updateShadow() {
        // 各レイヤーのパラメータをCSS形式に変換
        // フォーマット: offset-x offset-y blur-radius spread-radius color
        const shadows = layers.map(layer => {
            return `${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px rgba(0, 0, 0, ${layer.alpha})`;
        });

        // カンマ区切りで結合
        const shadowString = shadows.join(',\n            '); // 改行とインデントを入れて見やすく
        const cssString = `box-shadow: ${shadowString};`;

        // プレビュー要素に適用 (インラインスタイル)
        // 改行コードはCSSとして有効だが、style属性にはスペース区切りで渡すほうが無難なので、
        // 実際の適用時は改行をスペースに置換するかすそのまま使う。
        // ここでは結合時の改行を除去して適用
        previewElement.style.boxShadow = shadows.join(', ');

        // コード表示エリアの更新
        codeOutput.textContent = cssString;
    }

    /**
     * スライダーのイベントリスナーを設定する関数
     */
    function setupListeners() {
        // 各レイヤー(1〜3)に対してループ処理
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
                        // 1. 値を取得
                        const newValue = parseFloat(e.target.value);
                        
                        // 2. 状態を更新
                        layerData[param] = newValue;

                        // 3. 表示用の数値を更新 (単位の付与)
                        let displayValue = newValue;
                        if (param === 'alpha') {
                            displayValue = newValue.toFixed(2); // 不透明度は小数
                        } else {
                            displayValue = newValue + 'px'; // 他はピクセル
                        }
                        displayElement.textContent = displayValue;

                        // 4. 影を再描画
                        updateShadow();
                    });
                }
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
     */
    function switchBackground(e) {
        // すべてのボタンからactiveクラスを削除
        bgButtons.forEach(btn => btn.classList.remove('active'));
        
        // クリックされたボタンをアクティブに
        const targetBtn = e.target;
        targetBtn.classList.add('active');

        // 背景色を取得して適用
        const userBg = targetBtn.getAttribute('data-bg');
        
        // CSS変数を更新して背景色を変更
        // style.cssの .preview-area が var(--preview-bg) を使用しているため
        previewArea.style.setProperty('--preview-bg', userBg);
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
