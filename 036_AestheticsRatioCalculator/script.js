/**
 * 美の黄金比・白銀比計算機 - Script
 * 機能:
 * 1. 黄金比/白銀比のモード切り替え
 * 2. 入力値に基づくリアルタイム双方向計算
 * 3. プレビュー図形の動的リサイズ
 * 4. クリップボードへのコピー機能
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 定数定義 ---
    const GOLDEN_RATIO = 1.61803398875; // 黄金比
    const SILVER_RATIO = 1.41421356237; // 白銀比

    // --- DOM要素の取得 ---
    const shortInput = document.getElementById('short-side');
    const longInput = document.getElementById('long-side');
    const tabGolden = document.getElementById('tab-golden');
    const tabSilver = document.getElementById('tab-silver');
    const currentRatioValueDisplay = document.getElementById('current-ratio-value');
    const shapePreview = document.getElementById('shape-preview');
    const copyButtons = document.querySelectorAll('.copy-btn');

    // --- 状態管理 ---
    // 現在の比率モード (初期値: golden)
    let currentMode = 'golden';
    let currentRatio = GOLDEN_RATIO;

    // --- 初期化処理 ---
    function init() {
        // デフォルト値を設定
        shortInput.value = 100;
        calculateLongFromShort();
        updatePreview();
    }

    // --- 計算ロジック ---
    
    /**
     * 短辺から長辺を計算して表示する
     */
    function calculateLongFromShort() {
        const shortVal = parseFloat(shortInput.value);
        
        if (isNaN(shortVal) || shortVal === 0) {
            longInput.value = '';
            return;
        }

        // 長辺 = 短辺 * 比率
        // 小数点以下3桁まで計算し、表示は見やすく丸めるなどの処理も可能だが、
        // 今回は正確さを重視しつつ、あまりに長すぎないようにtoFixed(3)程度で整形、またはinputのstepに任せる
        // デザイン用途なので、ある程度の精度（小数点2-3桁）が実用的
        const longVal = shortVal * currentRatio;
        
        // 値をセット (小数点第4位を四捨五入して第3位まで表示)
        longInput.value = Math.round(longVal * 1000) / 1000;
        
        updatePreview();
    }

    /**
     * 長辺から短辺を計算して表示する
     */
    function calculateShortFromLong() {
        const longVal = parseFloat(longInput.value);

        if (isNaN(longVal) || longVal === 0) {
            shortInput.value = '';
            return;
        }

        // 短辺 = 長辺 / 比率
        const shortVal = longVal / currentRatio;

        shortInput.value = Math.round(shortVal * 1000) / 1000;

        updatePreview();
    }

    // --- ビジュアル更新 ---

    /**
     * プレビュー図形のサイズと比率を更新する
     * 実際のpx値ではなく、CSSのwidth/heightを操作して比率を表現する
     * 表示領域（max 200pxぐらい）に収まるようにスケールダウンして表示
     */
    function updatePreview() {
        // 短辺を基準値(100px)とした場合、長辺のアスペクト比を適用
        // 実際の入力値に関わらず、プレビューは「比率の形」を示すだけにするのがUI的に安定する
        // ただし、「入力した比率」を視覚化したいので、常に Short : Long = 1 : Ratio の形を保つ
        
        const baseSize = 100; // 短辺の基準ピクセル数
        
        // CSS変形
        // 常に短辺を横幅(width)、長辺を高さ(height)とするか、あるいは逆か？
        // 一般的に黄金比長方形は横長で描かれることが多いが、
        // ここでは「短辺」「長辺」という言葉通り、widthをShort、heightをLongに一度設定してみる
        // 本アプリでは分かりやすく、width = Short, height = Long と仮定して表示するが、
        // 画面に収まりが良いように、長い方が最大200px程度になるよう正規化する。

        let w = 1; 
        let h = currentRatio; 

        // 画面表示用のスケーリング係数 (最大サイズ200px)
        const maxDisplaySize = 180; 
        const scale = maxDisplaySize / h; // 長辺がmaxDisplaySizeになるように合わせる

        const displayWidth = w * scale;
        const displayHeight = h * scale;

        // 図形スタイル適用 (横長に見せたい場合は入れ替えるが、今回は短辺・長辺の関係を素直に縦横へ)
        // ※ ユーザー心理的に「横長長方形」が美しいとされることが多いので、
        // 短辺＝縦、長辺＝横 として表示を変更する（その方が安定感があるため）
        
        shapePreview.style.height = `${displayWidth}px`; // 短辺（縦）
        shapePreview.style.width = `${displayHeight}px`; // 長辺（横）
    }


    // --- イベントリスナー設定 ---

    // 1. 入力欄の変更監視
    shortInput.addEventListener('input', calculateLongFromShort);
    longInput.addEventListener('input', calculateShortFromLong);

    // 2. モード切り替え
    tabGolden.addEventListener('click', () => {
        switchMode('golden');
    });

    tabSilver.addEventListener('click', () => {
        switchMode('silver');
    });

    /**
     * モードを切り替える関数
     * @param {string} mode - 'golden' or 'silver'
     */
    function switchMode(mode) {
        if (currentMode === mode) return;

        currentMode = mode;

        if (mode === 'golden') {
            currentRatio = GOLDEN_RATIO;
            tabGolden.classList.add('active');
            tabSilver.classList.remove('active');
            currentRatioValueDisplay.textContent = '1.618';
        } else {
            currentRatio = SILVER_RATIO;
            tabSilver.classList.add('active');
            tabGolden.classList.remove('active');
            currentRatioValueDisplay.textContent = '1.414';
        }

        // 現在入力されている '短辺' を基準に再計算する
        // (値が空の場合は何もしない)
        if (shortInput.value) {
            calculateLongFromShort();
        } else if (longInput.value) {
            calculateShortFromLong();
        } else {
            updatePreview();
        }
    }

    // 3. コピー機能
    copyButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // ボタンの親の親要素(input-group)からinputを探す、あるいは兄弟要素から探す
            // ここではHTML構造上、btnの直前の兄弟要素がinputではない（wrapper内）
            const wrapper = btn.closest('.input-wrapper');
            const input = wrapper.querySelector('input');
            const value = input.value;

            if (!value) return;

            // クリップボードへコピー
            navigator.clipboard.writeText(value).then(() => {
                // コピー成功時のフィードバックアニメーション
                wrapper.classList.add('copy-active');
                setTimeout(() => {
                    wrapper.classList.remove('copy-active');
                }, 1000);
            }).catch(err => {
                console.error('Copy failed', err);
            });
        });
    });

    // 初期実行
    init();
});
