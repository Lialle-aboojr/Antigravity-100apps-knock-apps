// ===================================================
// Classic Kaleidoscope - メインスクリプト
// 本物の万華鏡ロジック: ビーズを三角形で切り取り、
// 反転・回転を繰り返して円形シンメトリーを生成
// ===================================================

// --- DOM要素の取得 ---
const mainCanvas = document.getElementById('main-canvas');
const mainCtx = mainCanvas.getContext('2d');
const offCanvas = document.getElementById('off-canvas');
const offCtx = offCanvas.getContext('2d');
const divisionsSelect = document.getElementById('divisions');
const themeSelect = document.getElementById('theme');
const frameSelect = document.getElementById('frame-style');
const autoRotateToggle = document.getElementById('auto-rotate');
const rotateSpeedRange = document.getElementById('rotate-speed');
const speedValue = document.getElementById('speed-value');
const shuffleBtn = document.getElementById('shuffle-btn');
const recordBtn = document.getElementById('record-btn');
const recIndicator = document.getElementById('rec-indicator');
const frameContainer = document.getElementById('frame-container');
const hintMessage = document.getElementById('hint-message');

// --- 定数 ---
const SIZE = 600;          // キャンバスのピクセルサイズ
const CENTER = SIZE / 2;   // キャンバス中心
const RADIUS = 280;        // 万華鏡の半径

// ビーズ描画用オフスクリーンCanvasのサイズ
// セクターの広い領域をカバーするため、十分大きなサイズにする
const BEAD_W = 600;        // ビーズ領域の幅
const BEAD_H = 400;        // ビーズ領域の高さ

// --- 状態変数 ---
let divisions = 6;         // 分割数
let globalRotation = 0;    // 全体の回転角度
let isAutoRotating = true; // 自動回転中かどうか
let rotateSpeed = 3;       // 回転スピード（1〜10）
let beads = [];            // ビーズの配列
let isDragging = false;    // ドラッグ中かどうか
let lastDragX = 0;         // 前回のドラッグ位置
let lastDragY = 0;
let isRecording = false;   // 録画中かどうか
let mediaRecorder = null;  // MediaRecorderインスタンス
let recordedChunks = [];   // 録画データのチャンク

// --- カラーテーマの定義 ---
const themes = {
    // レトロ: 暖かみのあるアンティーク調カラー
    retro: [
        '#c0392b', '#e74c3c', '#d35400', '#e67e22', '#f39c12',
        '#f1c40f', '#27ae60', '#2980b9', '#8e44ad', '#c0392b',
        '#e8a87c', '#d4a843', '#85603f', '#b5651d'
    ],
    // ネオン: 鮮やかな蛍光色
    neon: [
        '#ff00ff', '#00ffff', '#ff0066', '#66ff00', '#ffff00',
        '#ff6600', '#0066ff', '#ff00cc', '#00ff99', '#cc00ff',
        '#00ccff', '#ff3399', '#33ff00', '#9900ff'
    ],
    // パステル: 柔らかく優しい色合い
    pastel: [
        '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff',
        '#e8baff', '#ffbaf0', '#baffee', '#ffd4e8', '#d4baff',
        '#c9ffba', '#baffff', '#ffe0ba', '#ffbacc'
    ]
};

let currentTheme = 'retro'; // 現在のテーマ

// ===================================================
// ビーズクラス: 万華鏡内部のビーズ（円、多角形、線）
// ===================================================
class Bead {
    /**
     * コンストラクタ
     * @param {string} type - ビーズの種類 ('circle', 'polygon', 'line')
     * @param {string} color - 色
     */
    constructor(type, color) {
        this.type = type;
        this.color = color;
        // ランダムな初期位置（ビーズ領域内）
        this.x = 20 + Math.random() * (BEAD_W - 40);
        this.y = 20 + Math.random() * (BEAD_H - 40);
        // ランダムな初速度
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        // ビーズのサイズ（種類に応じて変える）
        this.size = type === 'line' ? 10 + Math.random() * 22 : 6 + Math.random() * 18;
        // 回転角度と回転速度
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.03;
        // 多角形の辺の数（3〜6）
        this.sides = 3 + Math.floor(Math.random() * 4);
        // 半透明度
        this.opacity = 0.6 + Math.random() * 0.35;
    }

    /** ビーズの物理更新（位置・速度・反射） */
    update() {
        // ほぼ無重力に近い状態（ビーズが底に溜まるのを防ぐ）
        this.vy += 0.002;
        // ランダムな微振動（ビーズが常にゆらゆら動くように）
        this.vx += (Math.random() - 0.5) * 0.15;
        this.vy += (Math.random() - 0.5) * 0.12;
        // 摩擦で徐々に減速
        this.vx *= 0.993;
        this.vy *= 0.993;
        // 位置更新
        this.x += this.vx;
        this.y += this.vy;
        // 壁で反射（ビーズが領域外に出ないよう）
        const margin = this.size;
        if (this.x < margin) { this.x = margin; this.vx *= -0.7; }
        if (this.x > BEAD_W - margin) { this.x = BEAD_W - margin; this.vx *= -0.7; }
        if (this.y < margin) { this.y = margin; this.vy *= -0.7; }
        if (this.y > BEAD_H - margin) { this.y = BEAD_H - margin; this.vy *= -0.7; }
        // 自転
        this.rotation += this.rotSpeed;
    }

    /** ビーズをオフスクリーンCanvasに描画 */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;

        switch (this.type) {
            case 'circle':
                // 円形ビーズ（グラデーション付きでガラスっぽく）
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
                grad.addColorStop(0, this.color);
                grad.addColorStop(0.7, this.color);
                grad.addColorStop(1, 'rgba(0,0,0,0.3)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                // ハイライト（光の反射）
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(-this.size * 0.3, -this.size * 0.3, this.size * 0.25, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'polygon':
                // 多角形ビーズ
                ctx.beginPath();
                for (let j = 0; j < this.sides; j++) {
                    const angle = (j / this.sides) * Math.PI * 2;
                    const px = Math.cos(angle) * this.size;
                    const py = Math.sin(angle) * this.size;
                    j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                // 縁取り
                ctx.globalAlpha = 0.4;
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = '#fff';
                ctx.stroke();
                break;

            case 'line':
                // 線状ビーズ（スティック型）
                ctx.lineWidth = 2 + Math.random() * 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-this.size, 0);
                ctx.lineTo(this.size, 0);
                ctx.stroke();
                break;
        }
        ctx.restore();
    }
}

// ===================================================
// ビーズの生成
// ===================================================

/** 現在のテーマでビーズをランダムに生成 */
function generateBeads() {
    const palette = themes[currentTheme];
    beads = [];
    const count = 60 + Math.floor(Math.random() * 15); // 60〜75個

    for (let i = 0; i < count; i++) {
        // ビーズの種類をランダムに決定（円40%, 多角形40%, 線20%）
        const rand = Math.random();
        const type = rand < 0.4 ? 'circle' : rand < 0.8 ? 'polygon' : 'line';
        // パレットからランダムに色を選択
        const color = palette[Math.floor(Math.random() * palette.length)];
        beads.push(new Bead(type, color));
    }
}

// ===================================================
// 万華鏡レンダリングエンジン
// ===================================================

/** メインの描画ループ */
function render() {
    // --- 1. ビーズの物理更新 ---
    beads.forEach(b => b.update());

    // --- 2. オフスクリーンCanvasにビーズを描画 ---
    // オフスクリーンCanvasのサイズをビーズ領域に合わせる
    offCanvas.width = BEAD_W;
    offCanvas.height = BEAD_H;
    offCtx.fillStyle = '#050508';
    offCtx.fillRect(0, 0, BEAD_W, BEAD_H);
    beads.forEach(b => b.draw(offCtx));

    // --- 3. メインCanvasに万華鏡パターンを描画 ---
    mainCtx.fillStyle = '#050508';
    mainCtx.fillRect(0, 0, SIZE, SIZE);

    const sectorAngle = (Math.PI * 2) / divisions;

    mainCtx.save();
    mainCtx.translate(CENTER, CENTER);

    // 円形にクリッピング（万華鏡の覗き穴）
    mainCtx.beginPath();
    mainCtx.arc(0, 0, RADIUS, 0, Math.PI * 2);
    mainCtx.clip();

    // 自動回転の角度を更新
    if (isAutoRotating) {
        globalRotation += rotateSpeed * 0.0008;
    }
    mainCtx.rotate(globalRotation);

    // 各セクター（分割区画）を描画
    const far = RADIUS + 20; // クリップ用の遠方距離
    for (let i = 0; i < divisions; i++) {
        mainCtx.save();
        mainCtx.rotate(i * sectorAngle);

        // 奇数セクターは鏡像反転（万華鏡の反射を再現）
        if (i % 2 === 1) {
            mainCtx.scale(1, -1);
        }

        // セクター三角形でクリッピング
        mainCtx.beginPath();
        mainCtx.moveTo(0, 0);
        mainCtx.lineTo(far, 0);
        mainCtx.lineTo(far * Math.cos(sectorAngle), far * Math.sin(sectorAngle));
        mainCtx.closePath();
        mainCtx.clip();

        // オフスクリーンCanvasの内容をセクターに描画
        // ビーズ領域(BEAD_W x BEAD_H)を万華鏡の半径×直径サイズにスケーリングして
        // セクター三角形の可視域全体をカバーするよう配置
        const drawW = RADIUS * 1.1; // X方向: 中心から外縁をやや超えるまで
        const drawH = RADIUS * 2;   // Y方向: セクターの幅方向に広く
        mainCtx.drawImage(offCanvas,
            0, 0, BEAD_W, BEAD_H,
            -drawW * 0.05, -drawH * 0.5, drawW, drawH);

        mainCtx.restore();
    }

    mainCtx.restore();

    // --- 4. 万華鏡の覗き穴の縁に暗いビネット効果を追加 ---
    mainCtx.save();
    mainCtx.translate(CENTER, CENTER);
    const vignette = mainCtx.createRadialGradient(0, 0, RADIUS * 0.75, 0, 0, RADIUS);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
    mainCtx.fillStyle = vignette;
    mainCtx.beginPath();
    mainCtx.arc(0, 0, RADIUS, 0, Math.PI * 2);
    mainCtx.fill();
    mainCtx.restore();

    // 次のフレーム
    requestAnimationFrame(render);
}

// ===================================================
// マウス・タッチインタラクション
// ドラッグでビーズに力を与えて「シャラシャラ」動かす
// ===================================================

/** キャンバス上の座標をクライアント座標から変換 */
function getCanvasPos(clientX, clientY) {
    const rect = mainCanvas.getBoundingClientRect();
    return {
        x: (clientX - rect.left) / rect.width * SIZE,
        y: (clientY - rect.top) / rect.height * SIZE
    };
}

// マウスイベント
mainCanvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    const pos = getCanvasPos(e.clientX, e.clientY);
    lastDragX = pos.x;
    lastDragY = pos.y;
    hideHint();
});

mainCanvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    const dx = pos.x - lastDragX;
    const dy = pos.y - lastDragY;
    // ドラッグの力をすべてのビーズに伝える（万華鏡を振るイメージ）
    applyForceToBeads(dx, dy);
    lastDragX = pos.x;
    lastDragY = pos.y;
});

mainCanvas.addEventListener('mouseup', () => { isDragging = false; });
mainCanvas.addEventListener('mouseleave', () => { isDragging = false; });

// タッチイベント（スマホ対応）
mainCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDragging = true;
    const t = e.touches[0];
    const pos = getCanvasPos(t.clientX, t.clientY);
    lastDragX = pos.x;
    lastDragY = pos.y;
    hideHint();
}, { passive: false });

mainCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDragging) return;
    const t = e.touches[0];
    const pos = getCanvasPos(t.clientX, t.clientY);
    const dx = pos.x - lastDragX;
    const dy = pos.y - lastDragY;
    applyForceToBeads(dx, dy);
    lastDragX = pos.x;
    lastDragY = pos.y;
}, { passive: false });

mainCanvas.addEventListener('touchend', () => { isDragging = false; });

/** 全ビーズにドラッグの力を加える */
function applyForceToBeads(dx, dy) {
    const force = 0.15;
    beads.forEach(bead => {
        bead.vx += dx * force;
        bead.vy += dy * force;
        // 最大速度を制限
        const maxV = 8;
        bead.vx = Math.max(-maxV, Math.min(maxV, bead.vx));
        bead.vy = Math.max(-maxV, Math.min(maxV, bead.vy));
    });
}

// ===================================================
// UIコントロールのイベントハンドラ
// ===================================================

// 分割数の変更
divisionsSelect.addEventListener('change', () => {
    divisions = parseInt(divisionsSelect.value);
});

// テーマの変更
themeSelect.addEventListener('change', () => {
    currentTheme = themeSelect.value;
    // テーマ変更時はビーズを再生成（新しいカラーで全て再配置）
    generateBeads();
});

// フレームデザインの変更
frameSelect.addEventListener('change', () => {
    const style = frameSelect.value;
    frameContainer.className = 'frame-container frame-' + style;
    // 録画中ならrecordingクラスも追加
    if (isRecording) {
        frameContainer.classList.add('recording');
    }
});

// 自動回転のON/OFF
autoRotateToggle.addEventListener('change', () => {
    isAutoRotating = autoRotateToggle.checked;
});

// 回転スピード
rotateSpeedRange.addEventListener('input', () => {
    rotateSpeed = parseInt(rotateSpeedRange.value);
    speedValue.textContent = rotateSpeed;
});

// シャッフルボタン: ビーズの配置をランダムにリセット
shuffleBtn.addEventListener('click', () => {
    generateBeads();
});

// ===================================================
// 録画機能 (MediaRecorder API)
// ===================================================

recordBtn.addEventListener('click', () => {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
});

/** 録画を開始する */
function startRecording() {
    recordedChunks = [];

    // キャンバスのストリームを取得（30fps）
    const stream = mainCanvas.captureStream(30);

    // MediaRecorderの初期化
    try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    } catch (e) {
        // VP9が使えない場合はデフォルトで試行
        try {
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        } catch (e2) {
            mediaRecorder = new MediaRecorder(stream);
        }
    }

    // データが利用可能になったらチャンクに保存
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    // 録画停止時にファイルをダウンロード
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        a.href = url;
        a.download = 'kaleidoscope-' + timestamp + '.webm';
        a.click();
        URL.revokeObjectURL(url);
    };

    // 録画開始
    mediaRecorder.start();
    isRecording = true;

    // UI更新
    recordBtn.textContent = '⏹️ 停止 / Stop';
    recordBtn.classList.add('recording');
    recIndicator.classList.remove('hidden');
    frameContainer.classList.add('recording');
}

/** 録画を停止する */
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    isRecording = false;

    // UI更新
    recordBtn.textContent = '⏺️ 録画 / Record';
    recordBtn.classList.remove('recording');
    recIndicator.classList.add('hidden');
    frameContainer.classList.remove('recording');
}

// ===================================================
// ヒントメッセージ
// ===================================================

function hideHint() {
    if (hintMessage) hintMessage.classList.add('hidden');
}
setTimeout(hideHint, 5000);

// ===================================================
// 初期化
// ===================================================

function init() {
    // ビーズを生成
    generateBeads();
    // 描画ループを開始
    render();
}

init();
