// script.js - Matrix Rain Effect App

// ==========================================
// 1. 変数の初期化とDOM要素の取得
// ==========================================
const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');

const speedSlider = document.getElementById('speedSlider');
const colorToggleBtn = document.getElementById('colorToggleBtn');
const modeText = colorToggleBtn.querySelector('.mode-text');

// 描画する文字の集合（半角カタカナ、英数字）
// XSS対策としてDOMに直接追加せずCanvasに描画するため安全です
const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// フォントサイズと列の設定
const fontSize = 16;
let columns = 0;
// 各列の現在の文字のY座標（行のインデックス）を保持する配列
let drops = [];

// プログラムの状態
let isRandomColor = false; // 初期状態は基本のネオングリーン
let speedValue = parseInt(speedSlider.value, 10);
let lastTime = 0; // requestAnimationFrameのタイムスタンプ管理用

// ==========================================
// 2. キャンバスの初期設定とリサイズ対応
// ==========================================
function initCanvas() {
    // 画面の幅・高さをキャンバスに設定
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // キャンバスの幅に基づいて列数を計算
    columns = Math.floor(canvas.width / fontSize);

    // drops配列の初期化（全列の開始位置を0=一番上に設定）
    drops = [];
    for (let i = 0; i < columns; i++) {
        // 落下開始位置にバラツキを持たせるためランダムな負の値を設定（整数値で綺麗に描画）
        drops[i] = Math.floor(Math.random() * -100);
    }
}

// ウィンドウがリサイズされた時にキャンバスのサイズを再調整
window.addEventListener('resize', () => {
    // リサイズ時に描画内容がクリアされるため、初期設定を再度呼び出す
    initCanvas();
});

// 最初の一回を実行
initCanvas();

// ==========================================
// 3. 描画ループ処理（マトリックス風アニメーション）
// ==========================================
function draw() {
    // 背景を半透明の黒で塗りつぶすことで、前の文字が徐々に消える「尾を引く」効果を作る
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // フォントの設定
    ctx.font = `${fontSize}px monospace`;

    // 全ての列に対してループ処理
    for (let i = 0; i < drops.length; i++) {
        // 表示する文字をランダムに選ぶ
        const text = chars[Math.floor(Math.random() * chars.length)];

        // 色の決定（ランダムモードかネオングリーンか）
        if (isRandomColor) {
            // ランダムな色（RGB）を生成
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        } else {
            // 基本のネオングリーン
            ctx.fillStyle = '#0F0';
        }

        // 文字をキャンバスに描画
        // x座標: i(列番号) * フォントサイズ
        // y座標: drops[i](行番号) * フォントサイズ
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // 文字が画面の一番下まで到達し、さらにランダムな確率を満たした場合、一番上に戻す
        // (キャンバスの高さ以上 && 97.5%の確率でそのまま落下、2.5%で先頭に戻る)
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }

        // 行のインデックスを1進め、次の描画位置を下げる
        drops[i]++;
    }
}

// requestAnimationFrameを使用したアニメーションループ
function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    
    // スライダーの値(10〜150)を使って、描画の間隔（ミリ秒）を計算する
    // 例: 最大速度(150) -> 200 - 150 = 50ms（速い）
    // 例: 最小速度(10)  -> 200 - 10 = 190ms（遅い）
    const interval = 200 - speedValue;

    // 前回の描画からinterval以上の時間が経過していれば描画を実行
    if (deltaTime > interval) {
        draw();
        lastTime = timestamp;
    }

    // 次のフレーム描画をリクエスト
    requestAnimationFrame(animate);
}

// アニメーションを開始
requestAnimationFrame(animate);

// ==========================================
// 4. UIのイベントリスナー（ユーザー操作）
// ==========================================

// スピードスライダーの値が変更された時の処理
speedSlider.addEventListener('input', (e) => {
    // スライダーの値を整数で取得し保持する
    speedValue = parseInt(e.target.value, 10);
});

// 色切り替えボタンがクリックされた時の処理
colorToggleBtn.addEventListener('click', () => {
    // フラグを反転させる (true <-> false)
    isRandomColor = !isRandomColor;

    // ボタンのテキストと見た目(クラス)を切り替える
    if (isRandomColor) {
        modeText.textContent = 'ランダム / Random Color';
        colorToggleBtn.classList.add('random-mode');
    } else {
        modeText.textContent = 'ネオングリーン / Basic Green';
        colorToggleBtn.classList.remove('random-mode');
    }
});
