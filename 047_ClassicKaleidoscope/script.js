// ===================================================
// Classic Kaleidoscope - メインスクリプト
// 本物の万華鏡ロジック: ビーズを三角形で切り取り、
// 反転・回転を繰り返して円形シンメトリーを生成
// ===================================================

// --- DOM要素の取得 ---
const mainCanvas = document.getElementById('main-canvas');
const mainCtx = mainCanvas.getContext('2d');
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

// --- オフスクリーンCanvas（ビーズ描画用）を動的に作成 ---
const offCanvas = document.createElement('canvas');
const offCtx = offCanvas.getContext('2d');

// --- 定数 ---
const SIZE = 600;          // キャンバスのピクセルサイズ
const CENTER = SIZE / 2;   // キャンバス中心
const RADIUS = 280;        // 万華鏡の半径

// ビーズの描画領域サイズ
// セクター三角形の底辺を十分にカバーする幅と高さ
const BEAD_W = 320;        // ビーズ領域の幅（中心→外縁方向）
const BEAD_H = 200;        // ビーズ領域の高さ（セクター幅方向）

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

// --- 断続回転アニメーション用の変数 ---
let stepRotTarget = 0;     // 次の目標回転角度
let stepRotCurrent = 0;    // 現在の回転角度（スムーズ補間後）
let stepTimer = 0;         // 次のステップ回転までのカウントダウン（フレーム数）
let stepPause = 120;       // 静止フレーム数（スピードで変化）

// --- カラーテーマの定義 ---
const themes = {
    // レトロ: 暖かみのあるアンティーク調カラー
    retro: [
        '#c0392b', '#e74c3c', '#d35400', '#e67e22', '#f39c12',
        '#f1c40f', '#27ae60', '#2980b9', '#8e44ad', '#c0392b',
        '#e8a87c', '#d4a843', '#85603f', '#b5651d',
        '#ff6b6b', '#ffa07a', '#98d8c8', '#7ec8e3'
    ],
    // ネオン: 鮮やかな蛍光色
    neon: [
        '#ff00ff', '#00ffff', '#ff0066', '#66ff00', '#ffff00',
        '#ff6600', '#0066ff', '#ff00cc', '#00ff99', '#cc00ff',
        '#00ccff', '#ff3399', '#33ff00', '#9900ff',
        '#ff1493', '#00ff7f', '#7b68ee', '#ffd700'
    ],
    // パステル: 柔らかく優しい色合い
    pastel: [
        '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff',
        '#e8baff', '#ffbaf0', '#baffee', '#ffd4e8', '#d4baff',
        '#c9ffba', '#baffff', '#ffe0ba', '#ffbacc',
        '#f0c9cf', '#c9e4de', '#c5cae9', '#ffe0b2'
    ]
};

let currentTheme = 'retro'; // 現在のテーマ

// ===================================================
// ビーズクラス: 万華鏡内部のビーズ
// 種類: circle(ガラス玉), jewel(宝石), petal(花びら),
//       polygon(多角形), line(棒状)
// ===================================================
class Bead {
    /**
     * コンストラクタ
     * @param {string} type - ビーズの種類
     * @param {string} color - 色
     */
    constructor(type, color) {
        this.type = type;
        this.color = color;
        // 色のRGB分解を保存（半透明描画用）
        this._parseColor();
        // ランダムな初期位置（ビーズ領域内）
        this.x = 10 + Math.random() * (BEAD_W - 20);
        this.y = 10 + Math.random() * (BEAD_H - 20);
        // ランダムな初速度
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
        // ビーズのサイズ（種類に応じて変える）
        if (type === 'line') {
            this.size = 12 + Math.random() * 25;
        } else if (type === 'petal') {
            this.size = 10 + Math.random() * 22;
        } else if (type === 'jewel') {
            this.size = 8 + Math.random() * 18;
        } else {
            this.size = 8 + Math.random() * 20;
        }
        // 回転角度と回転速度
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.02;
        // 多角形の辺の数（3〜8）
        this.sides = 3 + Math.floor(Math.random() * 6);
        // 半透明度（高めにして透明感を出す）
        this.opacity = 0.35 + Math.random() * 0.45;
        // 花びらの枚数
        this.petalCount = 4 + Math.floor(Math.random() * 4);
    }

    /** 色をr,g,bに分解 */
    _parseColor() {
        const c = this.color;
        if (c.startsWith('#') && c.length === 7) {
            this.r = parseInt(c.slice(1, 3), 16);
            this.g = parseInt(c.slice(3, 5), 16);
            this.b = parseInt(c.slice(5, 7), 16);
        } else {
            this.r = 200; this.g = 200; this.b = 255;
        }
    }

    /** ビーズの物理更新（位置・速度・反射） */
    update() {
        // ごくわずかな重力
        this.vy += 0.001;
        // ランダムな微振動（ビーズが常にゆらゆら動くように）
        this.vx += (Math.random() - 0.5) * 0.08;
        this.vy += (Math.random() - 0.5) * 0.06;
        // 摩擦で徐々に減速
        this.vx *= 0.992;
        this.vy *= 0.992;
        // 位置更新
        this.x += this.vx;
        this.y += this.vy;
        // 壁で反射（ビーズが領域外に出ないよう）
        const m = Math.max(this.size * 0.5, 2);
        if (this.x < m) { this.x = m; this.vx *= -0.6; }
        if (this.x > BEAD_W - m) { this.x = BEAD_W - m; this.vx *= -0.6; }
        if (this.y < m) { this.y = m; this.vy *= -0.6; }
        if (this.y > BEAD_H - m) { this.y = BEAD_H - m; this.vy *= -0.6; }
        // 自転
        this.rotation += this.rotSpeed;
    }

    /** ビーズをオフスクリーンCanvasに描画 */
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;

        switch (this.type) {
            case 'circle':
                this._drawGlassOrb(ctx);
                break;
            case 'jewel':
                this._drawJewel(ctx);
                break;
            case 'petal':
                this._drawPetal(ctx);
                break;
            case 'polygon':
                this._drawPolygon(ctx);
                break;
            case 'line':
                this._drawStick(ctx);
                break;
        }
        ctx.restore();
    }

    /** ガラス玉ビーズ（放射グラデーション、ハイライト付き） */
    _drawGlassOrb(ctx) {
        const s = this.size;
        // 放射グラデーション（中心が明るく、縁が暗い→ガラスの質感）
        const grad = ctx.createRadialGradient(-s * 0.2, -s * 0.2, 0, 0, 0, s);
        grad.addColorStop(0, `rgba(${Math.min(this.r + 100, 255)},${Math.min(this.g + 100, 255)},${Math.min(this.b + 100, 255)},0.9)`);
        grad.addColorStop(0.4, `rgba(${this.r},${this.g},${this.b},0.7)`);
        grad.addColorStop(0.8, `rgba(${this.r},${this.g},${this.b},0.4)`);
        grad.addColorStop(1, `rgba(${Math.floor(this.r * 0.3)},${Math.floor(this.g * 0.3)},${Math.floor(this.b * 0.3)},0.2)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();
        // 白いハイライト（光の映り込み）
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-s * 0.3, -s * 0.3, s * 0.22, 0, Math.PI * 2);
        ctx.fill();
        // 2次ハイライト
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(s * 0.15, s * 0.2, s * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

    /** 宝石ビーズ（カット面を持つ多角形、2色グラデーション） */
    _drawJewel(ctx) {
        const s = this.size;
        const sides = 6 + Math.floor(Math.random() * 0.01); // 常に6面体
        // 外周
        ctx.beginPath();
        for (let j = 0; j < sides; j++) {
            const a = (j / sides) * Math.PI * 2;
            const px = Math.cos(a) * s;
            const py = Math.sin(a) * s;
            j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        // グラデーション塗り
        const grad = ctx.createLinearGradient(-s, -s, s, s);
        grad.addColorStop(0, `rgba(${Math.min(this.r + 80, 255)},${Math.min(this.g + 80, 255)},${Math.min(this.b + 80, 255)},0.8)`);
        grad.addColorStop(0.5, `rgba(${this.r},${this.g},${this.b},0.6)`);
        grad.addColorStop(1, `rgba(${Math.floor(this.r * 0.5)},${Math.floor(this.g * 0.5)},${Math.floor(this.b * 0.5)},0.4)`);
        ctx.fillStyle = grad;
        ctx.fill();
        // カット面の内側線
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = `rgba(255,255,255,0.5)`;
        ctx.lineWidth = 0.8;
        for (let j = 0; j < sides; j++) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const a = (j / sides) * Math.PI * 2;
            ctx.lineTo(Math.cos(a) * s * 0.95, Math.sin(a) * s * 0.95);
            ctx.stroke();
        }
        // ハイライト
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-s * 0.2, -s * 0.25, s * 0.18, 0, Math.PI * 2);
        ctx.fill();
    }

    /** 花びらビーズ（複数の楕円を放射状に配置） */
    _drawPetal(ctx) {
        const s = this.size;
        const n = this.petalCount;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
        grad.addColorStop(0, `rgba(${Math.min(this.r + 60, 255)},${Math.min(this.g + 60, 255)},${Math.min(this.b + 60, 255)},0.8)`);
        grad.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0.3)`);
        ctx.fillStyle = grad;
        for (let j = 0; j < n; j++) {
            ctx.save();
            ctx.rotate((j / n) * Math.PI * 2);
            ctx.beginPath();
            ctx.ellipse(s * 0.4, 0, s * 0.55, s * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        // 中心のハイライト
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    /** 多角形ビーズ（半透明＋白縁取り） */
    _drawPolygon(ctx) {
        const s = this.size;
        ctx.beginPath();
        for (let j = 0; j < this.sides; j++) {
            const angle = (j / this.sides) * Math.PI * 2;
            const px = Math.cos(angle) * s;
            const py = Math.sin(angle) * s;
            j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        // 半透明グラデーション塗り
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
        grad.addColorStop(0, `rgba(${Math.min(this.r + 50, 255)},${Math.min(this.g + 50, 255)},${Math.min(this.b + 50, 255)},0.7)`);
        grad.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0.3)`);
        ctx.fillStyle = grad;
        ctx.fill();
        // 白い縁取り
        ctx.globalAlpha = this.opacity * 0.5;
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.stroke();
    }

    /** 棒状ビーズ（太い線） */
    _drawStick(ctx) {
        const s = this.size;
        const lw = 2.5 + Math.random() * 0.01; // 安定した幅
        // グラデーション線
        const grad = ctx.createLinearGradient(-s, 0, s, 0);
        grad.addColorStop(0, `rgba(${this.r},${this.g},${this.b},0.3)`);
        grad.addColorStop(0.5, `rgba(${Math.min(this.r + 60, 255)},${Math.min(this.g + 60, 255)},${Math.min(this.b + 60, 255)},0.7)`);
        grad.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0.3)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-s, 0);
        ctx.lineTo(s, 0);
        ctx.stroke();
    }
}

// ===================================================
// ビーズの生成
// ===================================================

/** 現在のテーマでビーズをランダムに生成 */
function generateBeads() {
    const palette = themes[currentTheme];
    beads = [];
    // 大量のビーズを生成して密度を上げる
    const count = 120 + Math.floor(Math.random() * 30); // 120〜150個

    for (let i = 0; i < count; i++) {
        // ビーズの種類をランダムに決定
        // circle 25%, jewel 20%, petal 20%, polygon 25%, line 10%
        const rand = Math.random();
        let type;
        if (rand < 0.25) type = 'circle';
        else if (rand < 0.45) type = 'jewel';
        else if (rand < 0.65) type = 'petal';
        else if (rand < 0.90) type = 'polygon';
        else type = 'line';
        // パレットからランダムに色を選択
        const color = palette[Math.floor(Math.random() * palette.length)];
        beads.push(new Bead(type, color));
    }
}

// ===================================================
// 断続回転アニメーション（ステップ回転）
// 「しばらく止まる → クルッと回る → また止まる」
// ===================================================

/** easeInOutCubic カーブ（滑らかな加減速） */
function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ステップ回転のフェーズ管理
let stepPhase = 'pause';   // 'pause' or 'rotating'
let stepProgress = 0;      // 回転中の進行度（0〜1）
let stepAngle = 0;         // 今回のステップで回る角度
let stepDuration = 0;      // 回転にかけるフレーム数
let stepStartAngle = 0;    // ステップ開始時の角度

/** 断続回転を1フレーム分更新 */
function updateStepRotation() {
    if (!isAutoRotating) return;

    if (stepPhase === 'pause') {
        stepTimer--;
        if (stepTimer <= 0) {
            // 新しいステップ回転を開始
            stepPhase = 'rotating';
            stepProgress = 0;
            // セクター1つ分の角度（分割数に応じた角度をランダムで1〜2セクター分回る）
            const sectorAngle = (Math.PI * 2) / divisions;
            const steps = 1 + Math.floor(Math.random() * 2); // 1〜2セクター
            stepAngle = sectorAngle * steps * (Math.random() < 0.5 ? 1 : -1); // ランダムに正逆
            // 回転の速さ（スピード設定に基づく）
            stepDuration = Math.max(15, 60 - rotateSpeed * 4); // スピードが速いほど短い
            stepStartAngle = globalRotation;
        }
    } else {
        // 'rotating' フェーズ
        stepProgress += 1 / stepDuration;
        if (stepProgress >= 1) {
            stepProgress = 1;
            stepPhase = 'pause';
            // 次の静止時間を設定（スピードが速いほど短い）
            stepPause = Math.max(30, 200 - rotateSpeed * 18);
            stepTimer = stepPause + Math.floor(Math.random() * 60);
        }
        // イージングを適用した滑らかな回転
        const eased = easeInOutCubic(stepProgress);
        globalRotation = stepStartAngle + stepAngle * eased;
    }
}

// 初期タイマーをセット
function resetStepTimer() {
    stepPhase = 'pause';
    stepTimer = 60 + Math.floor(Math.random() * 60);
}

// ===================================================
// 万華鏡レンダリングエンジン
// ===================================================

/** メインの描画ループ */
function render() {
    // --- 1. ビーズの物理更新 ---
    beads.forEach(b => b.update());

    // --- 2. オフスクリーンCanvasにビーズを描画 ---
    offCanvas.width = BEAD_W;
    offCanvas.height = BEAD_H;
    // 背景を暗い色で塗り（黒一色ではなくわずかに紫がかった暗色）
    offCtx.fillStyle = '#0a0812';
    offCtx.fillRect(0, 0, BEAD_W, BEAD_H);
    // lighterモードでビーズを重ねて描画（ガラスの重なり＝加算合成で光が強くなる）
    offCtx.globalCompositeOperation = 'lighter';
    beads.forEach(b => b.draw(offCtx));
    offCtx.globalCompositeOperation = 'source-over';

    // --- 3. メインCanvasに万華鏡パターンを描画 ---
    mainCtx.fillStyle = '#050508';
    mainCtx.fillRect(0, 0, SIZE, SIZE);

    // 分割角度の計算
    const sectorAngle = (Math.PI * 2) / divisions;
    // 半分の角度（セクターの中央線からの角度）
    const halfAngle = sectorAngle / 2;

    mainCtx.save();
    mainCtx.translate(CENTER, CENTER);

    // 円形にクリッピング（万華鏡の覗き穴）
    mainCtx.beginPath();
    mainCtx.arc(0, 0, RADIUS, 0, Math.PI * 2);
    mainCtx.clip();

    // --- 断続回転のアニメーション更新 ---
    updateStepRotation();
    mainCtx.rotate(globalRotation);

    // 各セクター（分割区画）を描画
    // 隙間を完全に無くすため、セクターの扇形を厳密にクリップ
    const far = RADIUS + 10; // クリップ境界（RADIUSよりわずかに大きく）
    for (let i = 0; i < divisions; i++) {
        mainCtx.save();

        // 各セクターの開始角度
        const startA = i * sectorAngle;
        mainCtx.rotate(startA);

        // 奇数セクターは鏡面反転（Y軸に対して反転）
        if (i % 2 === 1) {
            // セクター角度の中心線を基準に反転
            mainCtx.rotate(sectorAngle);
            mainCtx.scale(1, -1);
        }

        // セクターの扇形を厳密にクリッピング（隙間が出ないよう多めに頂点を取る）
        mainCtx.beginPath();
        mainCtx.moveTo(0, 0);
        // 扇形を細かい直線で近似（arcを使用して完全な扇形を描く）
        mainCtx.arc(0, 0, far, 0, sectorAngle, false);
        mainCtx.closePath();
        mainCtx.clip();

        // オフスクリーンCanvasの内容をセクターに描画
        // ビーズ領域(BEAD_W x BEAD_H)をセクター三角形にフィットさせる
        // X方向: 0からRADIUS（中心→外縁）
        // Y方向: セクター角度分の幅をカバー（中心でゼロ、外縁で最大幅）
        // セクターの最大幅 = RADIUS * sin(sectorAngle)
        const sectorMaxH = RADIUS * Math.sin(sectorAngle) + 20;
        mainCtx.drawImage(
            offCanvas,
            0, 0, BEAD_W, BEAD_H,
            0, -sectorMaxH * 0.1, RADIUS + 5, sectorMaxH * 1.2
        );

        mainCtx.restore();
    }

    mainCtx.restore();

    // --- 4. 万華鏡の覗き穴の縁に暗いビネット効果を追加 ---
    mainCtx.save();
    mainCtx.translate(CENTER, CENTER);
    const vignette = mainCtx.createRadialGradient(0, 0, RADIUS * 0.80, 0, 0, RADIUS);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
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
    const force = 0.12;
    beads.forEach(bead => {
        bead.vx += dx * force;
        bead.vy += dy * force;
        // 最大速度を制限
        const maxV = 6;
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
    if (isAutoRotating) {
        resetStepTimer();
    }
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
    // 断続回転のタイマーを初期化
    resetStepTimer();
    // 描画ループを開始
    render();
}

init();
