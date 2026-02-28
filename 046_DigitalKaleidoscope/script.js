// ===================================================
// Digital Kaleidoscope - メインスクリプト
// HTML5 Canvasを使った万華鏡エフェクト
// ===================================================

// --- DOM要素の取得 ---
const canvas = document.getElementById('kaleidoscope-canvas');
const ctx = canvas.getContext('2d');
const panelToggle = document.getElementById('panel-toggle');
const controlPanel = document.getElementById('control-panel');
const panelBody = document.getElementById('panel-body');
const segmentsSelect = document.getElementById('segments');
const lineWidthRange = document.getElementById('line-width');
const lineWidthValue = document.getElementById('line-width-value');
const colorPaletteSelect = document.getElementById('color-palette');
const autoplayToggle = document.getElementById('autoplay-toggle');
const downloadBtn = document.getElementById('download-btn');
const clearBtn = document.getElementById('clear-btn');
const hintMessage = document.getElementById('hint-message');

// --- 万華鏡の状態管理 ---
let isDrawing = false;           // ドラッグ中かどうか
let lastX = 0;                   // 前回のX座標
let lastY = 0;                   // 前回のY座標
let hue = 0;                     // 現在の色相（HSLのH値）
let isAutoPlaying = false;       // オートプレイ中かどうか
let autoPlayAnimationId = null;  // オートプレイのアニメーションID
let autoPlayTime = 0;            // オートプレイの経過時間
let autoPlayPattern = 0;         // オートプレイの軌跡パターン
let hintTimeout = null;          // ヒントを非表示にするタイマー

// --- カラーパレットの定義 ---
// 各パレットはHSLの色相（H）の範囲や特定の色相値を定義
const colorPalettes = {
    // 虹色：全色相を滑らかに遷移
    rainbow: {
        getColor: (h) => `hsl(${h % 360}, 85%, 60%)`,
        hueSpeed: 1.5
    },
    // ネオン：鮮やかな紫〜ピンク〜シアン系
    neon: {
        getColor: (h) => {
            const neonHues = [280, 300, 320, 180, 200, 260];
            const idx = Math.floor((h / 60) % neonHues.length);
            const neonHue = neonHues[idx];
            return `hsl(${neonHue}, 100%, 65%)`;
        },
        hueSpeed: 2
    },
    // パステル：柔らかい色合い
    pastel: {
        getColor: (h) => `hsl(${h % 360}, 60%, 80%)`,
        hueSpeed: 1
    },
    // 炎：赤〜オレンジ〜黄色系
    fire: {
        getColor: (h) => {
            const fireHue = ((h * 0.3) % 60); // 0〜60の範囲（赤〜黄）
            return `hsl(${fireHue}, 100%, 55%)`;
        },
        hueSpeed: 2.5
    },
    // 海：青〜シアン〜ティール系
    ocean: {
        getColor: (h) => {
            const oceanHue = 180 + ((h * 0.4) % 60); // 180〜240の範囲（シアン〜青）
            return `hsl(${oceanHue}, 80%, 55%)`;
        },
        hueSpeed: 1.2
    }
};

// --- キャンバスの初期化 ---

/**
 * キャンバスのサイズをウィンドウに合わせて設定する
 * デバイスピクセル比を考慮して高解像度描画に対応
 */
function resizeCanvas() {
    // 現在の描画内容を保存
    const imageData = canvas.toDataURL();

    // デバイスピクセル比の取得（Retinaディスプレイ対応）
    const dpr = window.devicePixelRatio || 1;

    // CSSサイズに合わせてキャンバスのピクセルサイズを設定
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    // 描画コンテキストをデバイスピクセル比に合わせてスケーリング
    ctx.scale(dpr, dpr);

    // 保存した描画内容を復元
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0, window.innerWidth, window.innerHeight);
    };
    img.src = imageData;
}

/**
 * キャンバスを黒背景でクリアする
 */
function clearCanvas() {
    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // スケーリングをリセット
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// --- 万華鏡描画エンジン ---

/**
 * 万華鏡の線を描画する
 * @param {number} x1 - 始点X（キャンバス上の座標）
 * @param {number} y1 - 始点Y
 * @param {number} x2 - 終点X
 * @param {number} y2 - 終点Y
 */
function drawKaleidoscope(x1, y1, x2, y2) {
    // キャンバスの中心座標を取得
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // 分割数を取得
    const segments = parseInt(segmentsSelect.value);

    // 線の太さを取得
    const lineWidth = parseInt(lineWidthRange.value);

    // 現在のカラーパレットを取得
    const paletteName = colorPaletteSelect.value;
    const palette = colorPalettes[paletteName];

    // 1セグメントあたりの角度（ラジアン）
    const angleStep = (Math.PI * 2) / segments;

    // 中心からの相対座標に変換
    const relX1 = x1 - centerX;
    const relY1 = y1 - centerY;
    const relX2 = x2 - centerX;
    const relY2 = y2 - centerY;

    // 描画スタイルの設定
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = palette.getColor(hue);

    // 光り輝くグロウエフェクト
    ctx.shadowBlur = lineWidth * 3;
    ctx.shadowColor = palette.getColor(hue);

    // 各セグメントに対して描画（回転コピー + 鏡像反転）
    for (let i = 0; i < segments; i++) {
        const angle = angleStep * i;

        // --- 通常の回転コピー ---
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(relX1, relY1);
        ctx.lineTo(relX2, relY2);
        ctx.stroke();

        ctx.restore();

        // --- 鏡像反転（水平反転してから回転）---
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.scale(-1, 1); // X軸で反転

        ctx.beginPath();
        ctx.moveTo(relX1, relY1);
        ctx.lineTo(relX2, relY2);
        ctx.stroke();

        ctx.restore();
    }

    // シャドウをリセット（パフォーマンスのため）
    ctx.shadowBlur = 0;

    // 色相を進める
    hue += palette.hueSpeed;
}

// --- マウスイベント ---

/**
 * マウスボタンが押されたとき（描画開始）
 */
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    lastX = e.clientX;
    lastY = e.clientY;
    hideHint(); // ヒントを非表示にする
});

/**
 * マウスが動いたとき（描画中）
 */
canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    drawKaleidoscope(lastX, lastY, e.clientX, e.clientY);
    lastX = e.clientX;
    lastY = e.clientY;
});

/**
 * マウスボタンが離されたとき（描画終了）
 */
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

/**
 * マウスがキャンバス外に出たとき（描画終了）
 */
canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
});

// --- タッチイベント（モバイル対応）---

/**
 * タッチ開始
 */
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // スクロールを防止
    const touch = e.touches[0];
    isDrawing = true;
    lastX = touch.clientX;
    lastY = touch.clientY;
    hideHint();
}, { passive: false });

/**
 * タッチ移動（描画中）
 */
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    drawKaleidoscope(lastX, lastY, touch.clientX, touch.clientY);
    lastX = touch.clientX;
    lastY = touch.clientY;
}, { passive: false });

/**
 * タッチ終了
 */
canvas.addEventListener('touchend', () => {
    isDrawing = false;
});

// --- UIコントロールのイベント ---

/**
 * パネルの開閉トグル
 */
panelToggle.addEventListener('click', () => {
    controlPanel.classList.toggle('open');
});

/**
 * 線の太さスライダーの値表示を更新
 */
lineWidthRange.addEventListener('input', () => {
    lineWidthValue.textContent = lineWidthRange.value;
});

/**
 * オートプレイのON/OFF切り替え
 */
autoplayToggle.addEventListener('change', () => {
    if (autoplayToggle.checked) {
        startAutoPlay();
    } else {
        stopAutoPlay();
    }
});

/**
 * ダウンロードボタン: 現在のキャンバスをPNG画像として保存
 */
downloadBtn.addEventListener('click', () => {
    // ダウンロード用の一時リンクを作成
    const link = document.createElement('a');

    // ファイル名にタイムスタンプを付与
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    link.download = `kaleidoscope-${timestamp}.png`;

    // キャンバスのデータをPNG形式でエンコード
    link.href = canvas.toDataURL('image/png');

    // リンクをクリックしてダウンロードを実行
    link.click();
});

/**
 * クリアボタン: キャンバスをリセット（黒背景に戻す）
 */
clearBtn.addEventListener('click', () => {
    clearCanvas();
    // 色相もリセット
    hue = 0;
});

// --- オートプレイモード ---

/**
 * オートプレイを開始する
 * リサージュ曲線やスパイラルなどの軌跡パターンで自動描画
 */
function startAutoPlay() {
    isAutoPlaying = true;
    autoPlayTime = 0;
    // ランダムにパターンを選択
    autoPlayPattern = Math.floor(Math.random() * 4);
    autoPlayLoop();
}

/**
 * オートプレイを停止する
 */
function stopAutoPlay() {
    isAutoPlaying = false;
    if (autoPlayAnimationId) {
        cancelAnimationFrame(autoPlayAnimationId);
        autoPlayAnimationId = null;
    }
}

/**
 * オートプレイのアニメーションループ
 * 複数のパターンを使い分けて自然な万華鏡模様を描画
 */
function autoPlayLoop() {
    if (!isAutoPlaying) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // キャンバスの短い方の辺の半分を基準半径とする
    const baseRadius = Math.min(centerX, centerY) * 0.7;

    // 時間を更新（ゆっくり進める）
    autoPlayTime += 0.008;

    // 一定時間ごとにパターンを切り替え
    if (autoPlayTime % 12 < 0.01 && autoPlayTime > 1) {
        autoPlayPattern = Math.floor(Math.random() * 4);
    }

    // 現在のポイントと次のポイントを計算
    const t = autoPlayTime;
    let x1, y1, x2, y2;

    switch (autoPlayPattern) {
        case 0:
            // パターン0: リサージュ曲線（滑らかな8の字）
            x1 = centerX + Math.sin(t * 2.1) * baseRadius * 0.6;
            y1 = centerY + Math.cos(t * 3.2) * baseRadius * 0.5;
            x2 = centerX + Math.sin((t + 0.008) * 2.1) * baseRadius * 0.6;
            y2 = centerY + Math.cos((t + 0.008) * 3.2) * baseRadius * 0.5;
            break;

        case 1:
            // パターン1: スパイラル（渦巻き）
            const spiralRadius = (Math.sin(t * 0.5) * 0.4 + 0.5) * baseRadius;
            x1 = centerX + Math.cos(t * 3) * spiralRadius;
            y1 = centerY + Math.sin(t * 3) * spiralRadius;
            x2 = centerX + Math.cos((t + 0.008) * 3) * spiralRadius;
            y2 = centerY + Math.sin((t + 0.008) * 3) * spiralRadius;
            break;

        case 2:
            // パターン2: ローズ曲線（花びら模様）
            const k = 3; // 花びら数のパラメータ
            const roseR1 = baseRadius * 0.65 * Math.cos(k * t * 1.5);
            const roseR2 = baseRadius * 0.65 * Math.cos(k * (t + 0.008) * 1.5);
            x1 = centerX + roseR1 * Math.cos(t * 1.5);
            y1 = centerY + roseR1 * Math.sin(t * 1.5);
            x2 = centerX + roseR2 * Math.cos((t + 0.008) * 1.5);
            y2 = centerY + roseR2 * Math.sin((t + 0.008) * 1.5);
            break;

        case 3:
            // パターン3: エピトロコイド（歯車が転がるような軌跡）
            const R = baseRadius * 0.4;
            const r = baseRadius * 0.15;
            const d = baseRadius * 0.25;
            x1 = centerX + (R - r) * Math.cos(t * 2) + d * Math.cos(((R - r) / r) * t * 2);
            y1 = centerY + (R - r) * Math.sin(t * 2) - d * Math.sin(((R - r) / r) * t * 2);
            const t2 = t + 0.008;
            x2 = centerX + (R - r) * Math.cos(t2 * 2) + d * Math.cos(((R - r) / r) * t2 * 2);
            y2 = centerY + (R - r) * Math.sin(t2 * 2) - d * Math.sin(((R - r) / r) * t2 * 2);
            break;
    }

    // 計算した軌跡ポイントで万華鏡を描画
    drawKaleidoscope(x1, y1, x2, y2);

    // 次のフレームをリクエスト
    autoPlayAnimationId = requestAnimationFrame(autoPlayLoop);
}

// --- ヒントメッセージ ---

/**
 * ヒントメッセージをフェードアウトして非表示にする
 */
function hideHint() {
    if (hintMessage) {
        hintMessage.classList.add('hidden');
    }
    if (hintTimeout) {
        clearTimeout(hintTimeout);
    }
}

// 5秒後に自動的にヒントを非表示にする
hintTimeout = setTimeout(() => {
    hideHint();
}, 5000);

// --- ウィンドウリサイズ対応 ---
window.addEventListener('resize', () => {
    resizeCanvas();
});

// --- 初期化 ---

/**
 * アプリケーションの初期設定
 */
function init() {
    // キャンバスサイズを設定
    resizeCanvas();

    // 黒背景でクリア
    clearCanvas();

    // パネルはデフォルトで開いた状態にする
    controlPanel.classList.add('open');
}

// DOMの読み込み完了後に初期化を実行
init();
