/* ============================================
   Particle Mirage - メインスクリプト
   Canvas APIを使用したパーティクルテキストアニメーション
   ============================================ */

// ============================================
// グローバル変数・定数
// ============================================

// パフォーマンス安全装置: パーティクル最大数
const MAX_PARTICLES = 6000;

// メインCanvas要素と2Dコンテキスト
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');

// パーティクル配列
let particles = [];

// アニメーション制御用
let animationId = null;        // requestAnimationFrameのID
let idleAnimationId = null;    // アイドルアニメーションのID
let isPlaying = false;         // 再生中かどうか
let currentPhase = 'idle';     // 'idle' | 'gathering' | 'holding' | 'fading'
let phaseStartTime = 0;        // 現在フェーズの開始時刻
let textQueue = [];            // 表示テキストのキュー
let currentQueueIndex = 0;     // 現在のキューインデックス

// ============================================
// DOM要素の取得
// ============================================
const panelToggle = document.getElementById('panel-toggle');
const panelBody = document.getElementById('panel-body');
const controlPanel = document.getElementById('control-panel');

const textInput = document.getElementById('text-input');
const appearMode = document.getElementById('appear-mode');
const disappearMode = document.getElementById('disappear-mode');
const gatherSpeedSlider = document.getElementById('gather-speed');
const holdTimeSlider = document.getElementById('hold-time');
const fadeSpeedSlider = document.getElementById('fade-speed');
const fontFamily = document.getElementById('font-family');
const particleSizeSlider = document.getElementById('particle-size');
const samplingGapSlider = document.getElementById('sampling-gap');
const singleColorPicker = document.getElementById('single-color');
const playBtn = document.getElementById('play-btn');
const stopBtn = document.getElementById('stop-btn');

// スライダーの値を表示する要素
const gatherSpeedVal = document.getElementById('gather-speed-val');
const holdTimeVal = document.getElementById('hold-time-val');
const fadeSpeedVal = document.getElementById('fade-speed-val');
const particleSizeVal = document.getElementById('particle-size-val');
const samplingGapVal = document.getElementById('sampling-gap-val');

// カラーモード関連
const singleColorRow = document.getElementById('single-color-row');
const presetColorRow = document.getElementById('preset-color-row');

// ============================================
// Canvas初期化（ウィンドウサイズに合わせる）
// ============================================
function resizeCanvas() {
    // デバイスピクセル比を考慮して高解像度対応
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
}

// 初期化時とリサイズ時にCanvasサイズを調整
resizeCanvas();
window.addEventListener('resize', () => {
    resizeCanvas();
    // リサイズ時にアイドルアニメーションを再起動
    if (!isPlaying) {
        startIdleAnimation();
    }
});

// ============================================
// パネル開閉の制御
// ============================================
panelToggle.addEventListener('click', () => {
    controlPanel.classList.toggle('collapsed');
});

// ============================================
// スライダーの値表示を更新
// ============================================
gatherSpeedSlider.addEventListener('input', () => {
    gatherSpeedVal.textContent = parseFloat(gatherSpeedSlider.value).toFixed(1) + 's';
});
holdTimeSlider.addEventListener('input', () => {
    holdTimeVal.textContent = parseFloat(holdTimeSlider.value).toFixed(1) + 's';
});
fadeSpeedSlider.addEventListener('input', () => {
    fadeSpeedVal.textContent = parseFloat(fadeSpeedSlider.value).toFixed(1) + 's';
});
particleSizeSlider.addEventListener('input', () => {
    particleSizeVal.textContent = parseFloat(particleSizeSlider.value).toFixed(1);
});
samplingGapSlider.addEventListener('input', () => {
    samplingGapVal.textContent = samplingGapSlider.value;
});

// ============================================
// カラーモード切替
// ============================================
document.querySelectorAll('input[name="color-mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const mode = e.target.value;
        // 単色カラーピッカーの表示/非表示
        singleColorRow.classList.toggle('hidden', mode !== 'single');
        // プリセットボタンの表示/非表示
        presetColorRow.classList.toggle('hidden', mode !== 'preset');
    });
});

// プリセットボタンのクリック処理
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // 他のアクティブ状態を解除
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// ============================================
// パーティクルクラス
// ============================================
class Particle {
    /**
     * @param {number} targetX - パーティクルの目標X座標
     * @param {number} targetY - パーティクルの目標Y座標
     * @param {string} color - パーティクルの色
     * @param {number} size - パーティクルの半径
     * @param {string} appearType - 出現アニメーションの種類
     */
    constructor(targetX, targetY, color, size, appearType) {
        // 目標座標（テキストの形を構成する位置）
        this.targetX = targetX;
        this.targetY = targetY;
        this.color = color;
        this.size = size;
        this.alpha = 0;

        // 画面の幅と高さ（論理ピクセル）
        const w = window.innerWidth;
        const h = window.innerHeight;

        // 出現タイプに応じて初期位置を設定
        switch (appearType) {
            case 'fall':
                // 上から降ってくる: 目標X付近にランダム幅、Yは画面上部の外
                this.x = targetX + (Math.random() - 0.5) * 100;
                this.y = -Math.random() * h * 0.5 - 50;
                break;
            case 'rise':
                // 下から上昇: 目標X付近にランダム幅、Yは画面下部の外
                this.x = targetX + (Math.random() - 0.5) * 100;
                this.y = h + Math.random() * h * 0.5 + 50;
                break;
            case 'vortex':
                // 渦巻き: 初期角度と初期半径を設定（座標は毎フレーム計算）
                this.vortexInitialAngle = Math.random() * Math.PI * 2;
                this.vortexInitialRadius = Math.max(w, h);
                // 初期位置は初期角度・初期半径から算出
                this.x = targetX + Math.cos(this.vortexInitialAngle) * this.vortexInitialRadius;
                this.y = targetY + Math.sin(this.vortexInitialAngle) * this.vortexInitialRadius;
                break;
            case 'random':
            default:
                // ランダムな位置から集合
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                break;
        }

        // 初期位置を保存（イージング補間で使用）
        this.startX = this.x;
        this.startY = this.y;

        // 消失アニメーション用の速度値（消失時に設定）
        this.vx = 0;
        this.vy = 0;

        // 渦巻き用パラメータ（vortex以外のモードでも安全にプロパティを保持）
        if (appearType !== 'vortex') {
            this.vortexInitialAngle = 0;
            this.vortexInitialRadius = 0;
        }

        // 漂い消滅用のランダムパラメータ
        this.driftAngle = Math.random() * Math.PI * 2;
        this.driftSpeed = 0.3 + Math.random() * 0.7;

        // 個別の遅延（パーティクルが一斉に動かないように少しランダムなオフセット）
        this.delay = Math.random() * 0.15;

        // 落下用: 個別の重力加速度
        this.gravity = 0.15 + Math.random() * 0.25;
    }
}

// ============================================
// テキストからパーティクル目標座標を生成
// （安全装置付き: MAX_PARTICLES制限）
// ============================================
function generateParticles(text) {
    // 設定値を取得
    let gap = parseInt(samplingGapSlider.value);
    const pSize = parseFloat(particleSizeSlider.value);
    const font = fontFamily.value;
    const appear = appearMode.value;

    // 安全装置: サンプリング間隔の最小値を3以上に強制
    gap = Math.max(3, gap);

    // オフスクリーンCanvas作成
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');

    // 画面の論理サイズを取得
    const w = window.innerWidth;
    const h = window.innerHeight;
    offCanvas.width = w;
    offCanvas.height = h;

    // テキストのフォントサイズを動的に計算（画面幅に対して適切な大きさ）
    let fontSize = Math.min(w * 0.15, h * 0.3, 200);

    // テキストが長い場合はフォントサイズを小さくする
    if (text.length > 3) {
        fontSize = Math.min(fontSize, w * 0.8 / text.length * 1.4);
    }
    fontSize = Math.max(fontSize, 32); // 最小サイズを保証

    // オフスクリーンCanvasにテキストを描画
    offCtx.fillStyle = '#ffffff';
    offCtx.font = `bold ${Math.round(fontSize)}px ${font}`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText(text, w / 2, h / 2);

    // ピクセルデータを取得してパーティクル位置を決定
    const imageData = offCtx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // まず候補座標を収集してからパーティクルを生成（上限チェック付き）
    const candidatePositions = [];

    for (let y = 0; y < h; y += gap) {
        for (let x = 0; x < w; x += gap) {
            // ピクセルのアルファ値をチェック（描画されている部分のみ）
            const index = (y * w + x) * 4;
            if (data[index + 3] > 128) {
                candidatePositions.push({ x, y });
            }
        }
    }

    // 安全装置: 候補数がMAX_PARTICLESを超える場合は均等にサンプリング
    let positions = candidatePositions;
    if (candidatePositions.length > MAX_PARTICLES) {
        // ランダムにMAX_PARTICLES個を選び出す
        positions = [];
        const step = candidatePositions.length / MAX_PARTICLES;
        for (let i = 0; i < MAX_PARTICLES; i++) {
            positions.push(candidatePositions[Math.floor(i * step)]);
        }
    }

    // カラーモードの取得
    const colorMode = document.querySelector('input[name="color-mode"]:checked').value;
    let baseColor = singleColorPicker.value;
    let presetColors = null;

    if (colorMode === 'preset') {
        // アクティブなプリセットボタンからカラーを取得
        const activePreset = document.querySelector('.preset-btn.active');
        if (activePreset) {
            presetColors = JSON.parse(activePreset.dataset.colors);
        } else {
            presetColors = ['#ffaa00', '#ff6600', '#ffdd44'];
        }
    }

    // パーティクルを生成
    const newParticles = [];
    for (const pos of positions) {
        // カラーモードに応じた色を決定
        let color;
        switch (colorMode) {
            case 'rainbow':
                // 虹色: HSLで鮮やかなネオンカラー（彩度・明度を高めに）
                const hue = (pos.x / w * 360 + Math.random() * 40) % 360;
                color = `hsl(${hue}, 100%, 60%)`;
                break;
            case 'preset':
                // プリセット: ランダムに選択
                color = presetColors[Math.floor(Math.random() * presetColors.length)];
                break;
            case 'single':
            default:
                color = baseColor;
                break;
        }

        newParticles.push(new Particle(pos.x, pos.y, color, pSize, appear));
    }

    return newParticles;
}

// ============================================
// アニメーションフェーズの管理
// ============================================

/**
 * 集合フェーズ: パーティクルが目標位置に向かって移動
 * @param {number} progress - 0～1のフェーズ進行度
 */
function updateGathering(progress) {
    const appear = appearMode.value;

    particles.forEach(p => {
        // 個別の遅延を適用したプログレス
        const adjustedProgress = Math.max(0, Math.min(1, (progress - p.delay) / (1 - p.delay)));
        // イージング関数（ease-out cubic）
        const eased = 1 - Math.pow(1 - adjustedProgress, 3);

        if (appear === 'vortex') {
            // ===== 決定論的スパイラル（Deterministic Spiral） =====
            // 半径: ease-out cubic で初期半径→0へ滑らかに縮小
            const radiusEased = 1 - Math.pow(1 - adjustedProgress, 3);
            const currentRadius = p.vortexInitialRadius * (1 - radiusEased);
            // 角度: progress に比例して3回転（6π）する
            const currentAngle = p.vortexInitialAngle + adjustedProgress * Math.PI * 6;
            // 目標座標を中心に絶対座標を計算
            p.x = p.targetX + Math.cos(currentAngle) * currentRadius;
            p.y = p.targetY + Math.sin(currentAngle) * currentRadius;
        } else {
            // ランダム・降下・上昇: 初期位置から目標位置へ直接補間
            p.x = p.startX + (p.targetX - p.startX) * eased;
            p.y = p.startY + (p.targetY - p.startY) * eased;
        }

        // 透明度を上げる（早めにフェードイン）
        p.alpha = Math.min(1, eased * 2);
    });
}

/**
 * 静止フェーズ: パーティクルが目標位置にとどまる（微妙な揺れ）
 * @param {number} progress - 0～1のフェーズ進行度
 */
function updateHolding(progress) {
    particles.forEach(p => {
        // 目標位置に強く収束させる + とても微妙な揺れ
        p.x += (p.targetX - p.x) * 0.15 + (Math.random() - 0.5) * 0.2;
        p.y += (p.targetY - p.y) * 0.15 + (Math.random() - 0.5) * 0.2;
        p.alpha = 1;
    });
}

/**
 * 消失フェーズ: パーティクルが消えていく
 * @param {number} progress - 0～1のフェーズ進行度
 */
function updateFading(progress) {
    const disappear = disappearMode.value;
    // イージング: ease-in（最初はゆっくり、最後は速く）
    const eased = Math.pow(progress, 2);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const centerX = w / 2;
    const centerY = h / 2;

    particles.forEach(p => {
        switch (disappear) {
            case 'evaporate':
                // 上に向かって蒸発
                p.y -= (0.5 + Math.random() * 1.5) * (1 + eased * 4);
                p.x += (Math.random() - 0.5) * 2;
                break;
            case 'explode':
                // 外側へ向かって爆発
                if (p.vx === 0 && p.vy === 0) {
                    // 初回のみ速度を計算（中心からの方向）
                    const dx = p.x - centerX;
                    const dy = p.y - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    p.vx = (dx / dist) * (4 + Math.random() * 6);
                    p.vy = (dy / dist) * (4 + Math.random() * 6);
                }
                p.x += p.vx * (1 + eased * 3);
                p.y += p.vy * (1 + eased * 3);
                break;
            case 'float':
                // その場でフワッと漂いながら消滅
                p.x += Math.cos(p.driftAngle + progress * 4) * p.driftSpeed;
                p.y += Math.sin(p.driftAngle + progress * 4) * p.driftSpeed - 0.5;
                break;
            case 'gravity':
                // 下に落下: 重力に従ってパラパラと落ちる
                p.vy += p.gravity * (1 + eased * 2);
                p.vx += (Math.random() - 0.5) * 0.3;
                p.x += p.vx;
                p.y += p.vy;
                break;
        }
        // 透明度を下げる
        p.alpha = Math.max(0, 1 - eased);
    });
}

// ============================================
// 描画処理（軽量グロウ効果 - shadowBlur不使用）
// ============================================
function draw() {
    // Canvas全体をクリア（論理サイズで）
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    // 背景色
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    // グロウ効果: 加算合成モードを有効化（粒子が重なると明るく輝く）
    ctx.globalCompositeOperation = 'lighter';

    // パーティクルを描画（shadowBlur不使用・軽量グロウ）
    particles.forEach(p => {
        if (p.alpha <= 0.01) return;

        // --- 軽量グロウ: 半透明の大きめ円を先に描画 ---
        ctx.globalAlpha = p.alpha * 0.15;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // --- メインの粒子 ---
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // 描画設定をリセット
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}

// ============================================
// メインアニメーションループ
// ============================================
function animate() {
    if (!isPlaying) return;

    const now = performance.now();
    const elapsed = (now - phaseStartTime) / 1000; // 秒単位

    // 現在のフェーズに応じた更新処理
    switch (currentPhase) {
        case 'gathering': {
            const duration = parseFloat(gatherSpeedSlider.value);
            const progress = Math.min(1, elapsed / duration);
            updateGathering(progress);
            if (progress >= 1) {
                // 集合完了 → 静止フェーズへ
                currentPhase = 'holding';
                phaseStartTime = now;
            }
            break;
        }
        case 'holding': {
            const duration = parseFloat(holdTimeSlider.value);
            const progress = Math.min(1, elapsed / duration);
            updateHolding(progress);
            if (progress >= 1) {
                // 静止完了 → 消失フェーズへ
                currentPhase = 'fading';
                phaseStartTime = now;
                // 消失用の速度をリセット
                particles.forEach(p => {
                    p.vx = 0;
                    p.vy = 0;
                });
            }
            break;
        }
        case 'fading': {
            const duration = parseFloat(fadeSpeedSlider.value);
            const progress = Math.min(1, elapsed / duration);
            updateFading(progress);
            if (progress >= 1) {
                // 消失完了 → 次のテキストへ
                currentQueueIndex++;
                if (currentQueueIndex < textQueue.length) {
                    // キューに次のテキストがある
                    startNextText();
                } else {
                    // すべてのテキスト表示完了
                    stopAnimation();
                }
            }
            break;
        }
    }

    draw();
    animationId = requestAnimationFrame(animate);
}

// ============================================
// テキストキューの構築
// ============================================
function buildTextQueue() {
    const rawText = textInput.value.trim();
    if (!rawText) return [];

    const unit = document.querySelector('input[name="display-unit"]:checked').value;
    let queue = [];

    if (unit === 'char') {
        // 1文字ずつ分割（空白・改行は除く）
        for (const char of rawText) {
            if (char.trim() !== '') {
                queue.push(char);
            }
        }
    } else {
        // 行ごとに分割（空行は除く）
        const lines = rawText.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed !== '') {
                queue.push(trimmed);
            }
        }
    }

    return queue;
}

// ============================================
// 次のテキストの再生を開始
// ============================================
function startNextText() {
    const text = textQueue[currentQueueIndex];
    if (!text) return;

    // パーティクルを生成
    particles = generateParticles(text);

    // 集合フェーズを開始
    currentPhase = 'gathering';
    phaseStartTime = performance.now();
}

// ============================================
// 再生開始
// ============================================
function startAnimation() {
    // アイドルアニメーションを停止
    stopIdleAnimation();

    // テキストキューを構築
    textQueue = buildTextQueue();
    if (textQueue.length === 0) return;

    currentQueueIndex = 0;
    isPlaying = true;

    // 【修正①】再生ボタン押下時にコントロールパネルを自動的に閉じる
    if (!controlPanel.classList.contains('collapsed')) {
        controlPanel.classList.add('collapsed');
    }

    // 最初のテキストを開始
    startNextText();

    // アニメーションループを開始
    animationId = requestAnimationFrame(animate);

    // ボタンの状態を更新
    playBtn.style.opacity = '0.5';
    playBtn.style.pointerEvents = 'none';
}

// ============================================
// 再生停止
// ============================================
function stopAnimation() {
    isPlaying = false;
    currentPhase = 'idle';

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // パーティクルをクリア
    particles = [];

    // 画面をクリア
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, w, h);

    // ボタンの状態を復元
    playBtn.style.opacity = '1';
    playBtn.style.pointerEvents = 'auto';

    // アイドルアニメーションを再開
    startIdleAnimation();
}

// ============================================
// イベントリスナー: 再生・停止ボタン
// ============================================
playBtn.addEventListener('click', () => {
    if (isPlaying) return;
    startAnimation();
});

stopBtn.addEventListener('click', () => {
    stopAnimation();
});

// ============================================
// アイドルアニメーション（起動時・停止後の浮遊パーティクル）
// ============================================
let idleParticles = [];
let isIdleRunning = false;

function initIdleParticles() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const count = 50;
    idleParticles = [];

    for (let i = 0; i < count; i++) {
        idleParticles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            size: 1 + Math.random() * 1.5,
            alpha: 0.15 + Math.random() * 0.25,
            vx: (Math.random() - 0.5) * 0.2,
            vy: -0.15 - Math.random() * 0.25,
            color: `hsl(${35 + Math.random() * 20}, 45%, ${60 + Math.random() * 20}%)`
        });
    }
}

function startIdleAnimation() {
    // 既にアイドル中なら何もしない
    if (isIdleRunning) return;

    isIdleRunning = true;
    initIdleParticles();

    const w = window.innerWidth;
    const h = window.innerHeight;

    function idleAnimate() {
        // 再生中またはアイドル停止ならアニメーションを終了
        if (isPlaying || !isIdleRunning) return;

        // 背景を完全に塗り直す
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // 各パーティクルを更新・描画
        idleParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // 画面外に出たらリセット
            if (p.y < -10) {
                p.y = h + 10;
                p.x = Math.random() * w;
            }
            if (p.x < -10) p.x = w + 10;
            if (p.x > w + 10) p.x = -10;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();
        });

        ctx.globalAlpha = 1;
        idleAnimationId = requestAnimationFrame(idleAnimate);
    }

    idleAnimationId = requestAnimationFrame(idleAnimate);
}

function stopIdleAnimation() {
    isIdleRunning = false;
    if (idleAnimationId) {
        cancelAnimationFrame(idleAnimationId);
        idleAnimationId = null;
    }
}

// ============================================
// 初期画面を描画
// ============================================
startIdleAnimation();
