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

// --- オフスクリーンCanvas ---
const offCanvas = document.createElement('canvas');
const offCtx = offCanvas.getContext('2d');

// --- 定数 ---
const SIZE = 600;
const CENTER = SIZE / 2;
const RADIUS = 280;

// ビーズの描画領域（三角形セクターにマッピングされる長方形）
const BEAD_W = 340;
const BEAD_H = 220;

// --- 状態変数 ---
let divisions = 6;
let globalRotation = 0;
let isAutoRotating = true;
let rotateSpeed = 3;
let beads = [];
let isDragging = false;
let lastDragX = 0;
let lastDragY = 0;
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];

// --- 断続回転＋ビーズ物理連動の変数 ---
let stepPhase = 'pause';
let stepProgress = 0;
let stepAngle = 0;
let stepDuration = 0;
let stepStartAngle = 0;
let stepTimer = 0;
let tubeIsRotating = false;
let prevGlobalRotation = 0;

// --- カラーテーマの定義（4テーマ） ---
const themes = {
    // 琥珀レトロ / Amber Retro
    amber: [
        '#d4a843', '#c08030', '#a06828', '#8b5a1e', '#e8a020',
        '#f0c048', '#b87333', '#cd853f', '#daa520', '#cc7722',
        '#9b4d2b', '#c0392b', '#a0522d', '#d2691e', '#e8c570',
        '#f5deb3', '#ffd700', '#b8860b', '#8b6914', '#e0a050',
        '#c49648', '#d4a060', '#a87830', '#f0d080', '#c88c40'
    ],
    // 深海サファイア / Deep Sapphire
    sapphire: [
        '#0a3d62', '#1a5276', '#2471a3', '#2e86c1', '#3498db',
        '#5dade2', '#85c1e9', '#aed6f1', '#00bcd4', '#00acc1',
        '#0097a7', '#006064', '#00838f', '#4dd0e1', '#80deea',
        '#e0f7fa', '#b3e5fc', '#81d4fa', '#4fc3f7', '#29b6f6',
        '#0288d1', '#01579b', '#4dd0e1', '#ffffff', '#e1f5fe'
    ],
    // 太陽トパーズ / Solar Topaz
    topaz: [
        '#ffd700', '#ffcc02', '#ffb300', '#ff9800', '#ff8f00',
        '#ff6f00', '#f57c00', '#ef6c00', '#e65100', '#ff5722',
        '#ff7043', '#ffab40', '#ffe082', '#fff176', '#fff9c4',
        '#ffffff', '#ffecb3', '#ffcc80', '#ffab91', '#ffccbc',
        '#ffd54f', '#ffb74d', '#ffa726', '#ff9100', '#ffe0b2'
    ],
    // 紅蓮ルビー / Crimson Ruby
    ruby: [
        '#8b0000', '#b71c1c', '#c62828', '#d32f2f', '#e53935',
        '#ef5350', '#ff1744', '#f44336', '#e91e63', '#c2185b',
        '#ad1457', '#880e4f', '#8e24aa', '#9c27b0', '#ab47bc',
        '#ce93d8', '#ff80ab', '#ff4081', '#f50057', '#d4a843',
        '#ffd700', '#b8860b', '#e8a020', '#ff6b6b', '#ff8a80'
    ]
};

let currentTheme = 'amber';

// ===================================================
// ビーズクラス
// ===================================================
class Bead {
    constructor(type, color) {
        this.type = type;
        this.color = color;
        this._parseColor();
        // 全域に均等に配置
        this.x = 5 + Math.random() * (BEAD_W - 10);
        this.y = 5 + Math.random() * (BEAD_H - 10);
        this.vx = 0;
        this.vy = 0;
        // サイズ
        if (type === 'line') {
            this.size = 10 + Math.random() * 18;
        } else if (type === 'petal') {
            this.size = 8 + Math.random() * 15;
        } else if (type === 'jewel') {
            this.size = 6 + Math.random() * 13;
        } else {
            this.size = 5 + Math.random() * 14;
        }
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.015;
        this.sides = 3 + Math.floor(Math.random() * 6);
        this.opacity = 0.25 + Math.random() * 0.35;
        this.petalCount = 4 + Math.floor(Math.random() * 4);
    }

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

    /**
     * 物理更新：筒の回転と完全連動
     * @param {boolean} rotating - 筒が回転中か
     * @param {number} angVel - 筒の角速度（ラジアン/フレーム）
     */
    update(rotating, angVel) {
        const cxCenter = BEAD_W / 2;
        const cyCenter = BEAD_H / 2;

        if (rotating) {
            // === 筒が回っている最中 ===
            // 控えめなランダム衝撃（万華鏡を振るイメージ）
            const intensity = Math.abs(angVel) * 6;
            this.vx += (Math.random() - 0.5) * intensity * 1.5;
            this.vy += (Math.random() - 0.5) * intensity * 1.5;
            // 回転中は適度な摩擦
            this.vx *= 0.90;
            this.vy *= 0.90;
            // 自転も加速
            this.rotation += this.rotSpeed * 3;
        } else {
            // === 筒が止まっている ===
            // 強い摩擦でビーズを素早く停止
            this.vx *= 0.75;
            this.vy *= 0.75;
            // 速度が極小なら完全停止
            if (Math.abs(this.vx) < 0.02) this.vx = 0;
            if (Math.abs(this.vy) < 0.02) this.vy = 0;
            // 自転もゆっくり停止
            this.rotation += this.rotSpeed * 0.15;
        }

        // 壁際のビーズを中心方向に引き戻す復元力
        const edgeMargin = 30;
        const restoreForce = 0.08;
        if (this.x < edgeMargin) this.vx += restoreForce;
        if (this.x > BEAD_W - edgeMargin) this.vx -= restoreForce;
        if (this.y < edgeMargin) this.vy += restoreForce;
        if (this.y > BEAD_H - edgeMargin) this.vy -= restoreForce;

        // 速度上限
        const maxV = 2.5;
        this.vx = Math.max(-maxV, Math.min(maxV, this.vx));
        this.vy = Math.max(-maxV, Math.min(maxV, this.vy));

        // 位置更新
        this.x += this.vx;
        this.y += this.vy;

        // 壁で反射（跳ね返り + ランダムに位置を戻す）
        const m = 3;
        if (this.x < m) { this.x = m + Math.random() * 10; this.vx *= -0.3; }
        if (this.x > BEAD_W - m) { this.x = BEAD_W - m - Math.random() * 10; this.vx *= -0.3; }
        if (this.y < m) { this.y = m + Math.random() * 10; this.vy *= -0.3; }
        if (this.y > BEAD_H - m) { this.y = BEAD_H - m - Math.random() * 10; this.vy *= -0.3; }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;

        switch (this.type) {
            case 'circle': this._drawGlassOrb(ctx); break;
            case 'jewel': this._drawJewel(ctx); break;
            case 'petal': this._drawPetal(ctx); break;
            case 'polygon': this._drawPolygon(ctx); break;
            case 'line': this._drawStick(ctx); break;
        }
        ctx.restore();
    }

    _drawGlassOrb(ctx) {
        const s = this.size;
        const grad = ctx.createRadialGradient(-s * 0.2, -s * 0.2, 0, 0, 0, s);
        grad.addColorStop(0, `rgba(${Math.min(this.r + 100, 255)},${Math.min(this.g + 100, 255)},${Math.min(this.b + 100, 255)},0.9)`);
        grad.addColorStop(0.4, `rgba(${this.r},${this.g},${this.b},0.7)`);
        grad.addColorStop(0.8, `rgba(${this.r},${this.g},${this.b},0.4)`);
        grad.addColorStop(1, `rgba(${this.r >> 1},${this.g >> 1},${this.b >> 1},0.15)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-s * 0.28, -s * 0.28, s * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawJewel(ctx) {
        const s = this.size;
        const sides = 6;
        ctx.beginPath();
        for (let j = 0; j < sides; j++) {
            const a = (j / sides) * Math.PI * 2;
            j === 0 ? ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s)
                : ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
        }
        ctx.closePath();
        const grad = ctx.createLinearGradient(-s, -s, s, s);
        grad.addColorStop(0, `rgba(${Math.min(this.r + 80, 255)},${Math.min(this.g + 80, 255)},${Math.min(this.b + 80, 255)},0.85)`);
        grad.addColorStop(0.5, `rgba(${this.r},${this.g},${this.b},0.6)`);
        grad.addColorStop(1, `rgba(${this.r >> 1},${this.g >> 1},${this.b >> 1},0.35)`);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 0.7;
        for (let j = 0; j < sides; j++) {
            const a = (j / sides) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * s * 0.9, Math.sin(a) * s * 0.9);
            ctx.stroke();
        }
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-s * 0.2, -s * 0.22, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawPetal(ctx) {
        const s = this.size;
        const n = this.petalCount;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
        grad.addColorStop(0, `rgba(${Math.min(this.r + 60, 255)},${Math.min(this.g + 60, 255)},${Math.min(this.b + 60, 255)},0.85)`);
        grad.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0.25)`);
        ctx.fillStyle = grad;
        for (let j = 0; j < n; j++) {
            ctx.save();
            ctx.rotate((j / n) * Math.PI * 2);
            ctx.beginPath();
            ctx.ellipse(s * 0.38, 0, s * 0.5, s * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawPolygon(ctx) {
        const s = this.size;
        ctx.beginPath();
        for (let j = 0; j < this.sides; j++) {
            const a = (j / this.sides) * Math.PI * 2;
            j === 0 ? ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s)
                : ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
        }
        ctx.closePath();
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s);
        grad.addColorStop(0, `rgba(${Math.min(this.r + 50, 255)},${Math.min(this.g + 50, 255)},${Math.min(this.b + 50, 255)},0.75)`);
        grad.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0.25)`);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.globalAlpha = this.opacity * 0.4;
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.stroke();
    }

    _drawStick(ctx) {
        const s = this.size;
        const grad = ctx.createLinearGradient(-s, 0, s, 0);
        grad.addColorStop(0, `rgba(${this.r},${this.g},${this.b},0.25)`);
        grad.addColorStop(0.5, `rgba(${Math.min(this.r + 60, 255)},${Math.min(this.g + 60, 255)},${Math.min(this.b + 60, 255)},0.7)`);
        grad.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0.25)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-s, 0);
        ctx.lineTo(s, 0);
        ctx.stroke();
    }
}

// ===================================================
// ビーズの生成（劇的に多く）
// ===================================================
function generateBeads() {
    const palette = themes[currentTheme];
    beads = [];
    const count = 500 + Math.floor(Math.random() * 100); // 500〜600個

    for (let i = 0; i < count; i++) {
        const rand = Math.random();
        let type;
        if (rand < 0.25) type = 'circle';
        else if (rand < 0.45) type = 'jewel';
        else if (rand < 0.65) type = 'petal';
        else if (rand < 0.90) type = 'polygon';
        else type = 'line';
        const color = palette[Math.floor(Math.random() * palette.length)];
        beads.push(new Bead(type, color));
    }
}

// ===================================================
// 断続回転アニメーション
// ===================================================
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function updateStepRotation() {
    if (!isAutoRotating) {
        tubeIsRotating = false;
        return 0;
    }

    let angularVelocity = 0;

    if (stepPhase === 'pause') {
        tubeIsRotating = false;
        stepTimer--;
        if (stepTimer <= 0) {
            stepPhase = 'rotating';
            stepProgress = 0;
            tubeIsRotating = true;
            const sectorAngle = (Math.PI * 2) / divisions;
            const steps = 1 + Math.floor(Math.random() * 2);
            stepAngle = sectorAngle * steps * (Math.random() < 0.5 ? 1 : -1);
            stepDuration = Math.max(20, 70 - rotateSpeed * 5);
            stepStartAngle = globalRotation;
            prevGlobalRotation = globalRotation;
        }
    } else {
        tubeIsRotating = true;
        prevGlobalRotation = globalRotation;
        stepProgress += 1 / stepDuration;

        if (stepProgress >= 1) {
            stepProgress = 1;
            stepPhase = 'pause';
            tubeIsRotating = false;
            const basePause = Math.max(50, 250 - rotateSpeed * 22);
            stepTimer = basePause + Math.floor(Math.random() * 60);
        }

        const eased = easeInOutCubic(stepProgress);
        globalRotation = stepStartAngle + stepAngle * eased;
        angularVelocity = globalRotation - prevGlobalRotation;
    }

    return angularVelocity;
}

function resetStepTimer() {
    stepPhase = 'pause';
    stepTimer = 30 + Math.floor(Math.random() * 30);
    tubeIsRotating = false;
}

// ===================================================
// 万華鏡レンダリングエンジン
// ===================================================
function render() {
    // 1. 断続回転を更新し、角速度を取得
    const angularVelocity = updateStepRotation();

    // 2. ビーズの物理更新（筒の回転と連動）
    beads.forEach(b => b.update(tubeIsRotating, angularVelocity));

    // 3. オフスクリーンCanvasにビーズを描画
    offCanvas.width = BEAD_W;
    offCanvas.height = BEAD_H;
    offCtx.fillStyle = '#060510';
    offCtx.fillRect(0, 0, BEAD_W, BEAD_H);
    // lighter合成でガラスの重なりを表現
    offCtx.globalCompositeOperation = 'lighter';
    beads.forEach(b => b.draw(offCtx));
    offCtx.globalCompositeOperation = 'source-over';

    // 4. メインCanvasに万華鏡パターンを描画
    mainCtx.fillStyle = '#050508';
    mainCtx.fillRect(0, 0, SIZE, SIZE);

    const sectorAngle = (Math.PI * 2) / divisions;
    const bleed = 0.015; // のり代（隙間防止用、約0.9度の重なり）

    mainCtx.save();
    mainCtx.translate(CENTER, CENTER);

    // 円形にクリッピング
    mainCtx.beginPath();
    mainCtx.arc(0, 0, RADIUS, 0, Math.PI * 2);
    mainCtx.clip();

    mainCtx.rotate(globalRotation);

    // 各セクターを描画
    const far = RADIUS + 10;
    for (let i = 0; i < divisions; i++) {
        mainCtx.save();

        mainCtx.rotate(i * sectorAngle);

        // 奇数セクターは鏡面反転
        if (i % 2 === 1) {
            mainCtx.rotate(sectorAngle);
            mainCtx.scale(1, -1);
        }

        // 扇形クリッピング（bleed分だけ広げて隙間を防ぐ）
        mainCtx.beginPath();
        mainCtx.moveTo(0, 0);
        mainCtx.arc(0, 0, far, -bleed, sectorAngle + bleed, false);
        mainCtx.closePath();
        mainCtx.clip();

        // オフスクリーンCanvasの内容をセクターに描画
        // X方向: 0→RADIUS（中心→外縁）, Y方向: セクター幅にフィット
        const sectorMaxH = RADIUS * Math.sin(sectorAngle) + 20;
        mainCtx.drawImage(
            offCanvas,
            0, 0, BEAD_W, BEAD_H,
            0, -sectorMaxH * 0.1, RADIUS + 5, sectorMaxH * 1.2
        );

        mainCtx.restore();
    }

    mainCtx.restore();

    // 5. ビネット効果
    mainCtx.save();
    mainCtx.translate(CENTER, CENTER);
    const vignette = mainCtx.createRadialGradient(0, 0, RADIUS * 0.82, 0, 0, RADIUS);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
    mainCtx.fillStyle = vignette;
    mainCtx.beginPath();
    mainCtx.arc(0, 0, RADIUS, 0, Math.PI * 2);
    mainCtx.fill();
    mainCtx.restore();

    requestAnimationFrame(render);
}

// ===================================================
// マウス・タッチインタラクション
// ===================================================
function getCanvasPos(clientX, clientY) {
    const rect = mainCanvas.getBoundingClientRect();
    return {
        x: (clientX - rect.left) / rect.width * SIZE,
        y: (clientY - rect.top) / rect.height * SIZE
    };
}

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
    applyForceToBeads(dx, dy);
    lastDragX = pos.x;
    lastDragY = pos.y;
});

mainCanvas.addEventListener('mouseup', () => { isDragging = false; });
mainCanvas.addEventListener('mouseleave', () => { isDragging = false; });

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

function applyForceToBeads(dx, dy) {
    const force = 0.12;
    beads.forEach(bead => {
        bead.vx += dx * force;
        bead.vy += dy * force;
        const maxV = 6;
        bead.vx = Math.max(-maxV, Math.min(maxV, bead.vx));
        bead.vy = Math.max(-maxV, Math.min(maxV, bead.vy));
    });
}

// ===================================================
// UIコントロール
// ===================================================
divisionsSelect.addEventListener('change', () => {
    divisions = parseInt(divisionsSelect.value);
});

themeSelect.addEventListener('change', () => {
    currentTheme = themeSelect.value;
    generateBeads();
});

frameSelect.addEventListener('change', () => {
    const style = frameSelect.value;
    frameContainer.className = 'frame-container frame-' + style;
    if (isRecording) frameContainer.classList.add('recording');
});

autoRotateToggle.addEventListener('change', () => {
    isAutoRotating = autoRotateToggle.checked;
    if (isAutoRotating) resetStepTimer();
});

rotateSpeedRange.addEventListener('input', () => {
    rotateSpeed = parseInt(rotateSpeedRange.value);
    speedValue.textContent = rotateSpeed;
});

shuffleBtn.addEventListener('click', () => {
    generateBeads();
});

// ===================================================
// 録画機能
// ===================================================
recordBtn.addEventListener('click', () => {
    if (!isRecording) startRecording();
    else stopRecording();
});

function startRecording() {
    recordedChunks = [];
    const stream = mainCanvas.captureStream(30);
    try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    } catch (e) {
        try {
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        } catch (e2) {
            mediaRecorder = new MediaRecorder(stream);
        }
    }
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        a.href = url;
        a.download = 'kaleidoscope-' + ts + '.webm';
        a.click();
        URL.revokeObjectURL(url);
    };
    mediaRecorder.start();
    isRecording = true;
    recordBtn.textContent = '⏹️ 停止 / Stop';
    recordBtn.classList.add('recording');
    recIndicator.classList.remove('hidden');
    frameContainer.classList.add('recording');
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
    isRecording = false;
    recordBtn.textContent = '⏺️ 録画 / Record';
    recordBtn.classList.remove('recording');
    recIndicator.classList.add('hidden');
    frameContainer.classList.remove('recording');
}

// ===================================================
// ヒント＆初期化
// ===================================================
function hideHint() {
    if (hintMessage) hintMessage.classList.add('hidden');
}
setTimeout(hideHint, 5000);

function init() {
    generateBeads();
    resetStepTimer();
    render();
}

init();
