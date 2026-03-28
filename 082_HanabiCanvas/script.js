// ==========================================
// キャンバスと基本設定の初期化
// ==========================================
const canvas = document.getElementById('hanabiCanvas');
const ctx = canvas.getContext('2d');

let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;

// ウィンドウサイズが変更されたらキャンバスサイズも追従する
window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
});

// UI要素の取得
const fireworkTypeSelect = document.getElementById('fireworkType');
const backgroundSelect = document.getElementById('backgroundType');
const autoModeCheckbox = document.getElementById('autoMode');

// ==========================================
// 背景変更処理 (JSからの動的書き換え)
// ==========================================
function updateBackground(value) {
    // 予期せぬ値に対する基本的なバリデーション
    const validBackgrounds = ['starry', 'city', 'ocean', 'snow', 'river', 'country'];
    const bgName = validBackgrounds.includes(value) ? value : 'starry';
    
    // JSから直接 body の backgroundImage プロパティを書き換える
    // .jpgの画像ファイルを指定し、読み込めなかった場合のフォールバックとして深い紺色のグラデーションを背面に敷く
    document.body.style.backgroundImage = `url('bg-${bgName}.jpg'), linear-gradient(to bottom, #011428 0%, #000000 100%)`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
}

backgroundSelect.addEventListener('change', (e) => {
    updateBackground(e.target.value);
});

// 初期読み込み時の背景適用
updateBackground(backgroundSelect.value);


// ==========================================
// 花火物理演算エンジン
// ==========================================
const fireworks = []; // 上昇していく光の球
const particles = []; // 破裂した後の小さな光たち

// 花火の色味
const colors = ['#FF1461', '#18FF92', '#5A87FF', '#FBF38C', '#FF8359', '#D900FF'];

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}

// ------------------------------------------
// クラス：打ち上げ用花火（Firework）
// ------------------------------------------
class Firework {
    constructor(startX, startY, targetX, targetY, type) {
        this.x = startX;
        this.y = startY;
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.type = type;
        this.color = randomColor();
        
        this.distanceToTarget = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2));
        this.distanceTraveled = 0;
        
        const angle = Math.atan2(targetY - startY, targetX - startX);
        // 上昇スピードの調整（少し遅く）
        const speed = random(8.5, 13.5); 
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.trail = [];
    }
    
    update(index) {
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 3) {
            this.trail.shift();
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.distanceTraveled = Math.sqrt(Math.pow(this.x - this.startX, 2) + Math.pow(this.y - this.startY, 2));
        
        if (this.distanceTraveled >= this.distanceToTarget) {
            createParticles(this.targetX, this.targetY, this.color, this.type);
            fireworks.splice(index, 1);
        }
    }
    
    draw(ctx) {
        ctx.beginPath();
        const startPos = this.trail.length > 0 ? this.trail[0] : {x: this.x, y: this.y};
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `rgba(255, 255, 255, 0.7)`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// ------------------------------------------
// クラス：破裂後のパーティクル（Particle）
// ------------------------------------------
class Particle {
    constructor(x, y, color, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
        this.trail = [];
        this.alpha = 1; 
        
        const angle = random(0, Math.PI * 2);
        
        // パーティクルの初期速度の調整（遅めに）
        let speed = random(2, 7.5);
        if (type === 'peony') {
            speed = random(3.5, 6);
        }
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // 空気抵抗と重力の調整（ゆっくりと広がり、ゆっくり落ちる）
        this.friction = 0.95; 
        this.gravity = 0.08;  
        this.decay = random(0.015, 0.025); // 適度な時間でアルファ値が0になるようフェードアウト
        this.trailLength = 4;
        
        if (type === 'willow') {
            this.gravity = 0.15;
            this.decay = random(0.008, 0.015);
            this.color = '#FFD700'; 
            this.trailLength = 6;
        } else if (type === 'peony') {
            this.friction = 0.93;
            this.trailLength = 1;
        }
    }
    
    update(index) {
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.trailLength) {
            this.trail.shift();
        }
        
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.alpha -= this.decay;
        
        // 完全に透明になったら表示不要なため配列から削除（ガベージコレクション）
        if (this.alpha <= 0) {
            particles.splice(index, 1);
        }
    }
    
    draw(ctx) {
        ctx.beginPath();
        const startPos = this.trail.length > 0 ? this.trail[0] : {x: this.x, y: this.y};
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(this.x, this.y);
        
        ctx.strokeStyle = `rgba(${hexToRgb(this.color)}, ${this.alpha})`;
        ctx.lineWidth = this.type === 'peony' ? 3 : 2;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

// ------------------------------------------
// パーティクル生成ロジック
// ------------------------------------------
function createParticles(x, y, color, type) {
    if (type === 'random') {
        const types = ['chrysanthemum', 'peony', 'willow', 'senrin'];
        type = types[Math.floor(Math.random() * types.length)];
    }

    if (type === 'senrin') {
        // 千輪（Senrin）: 一度小さく破裂し、時間差でランダムな広がり
        for (let i = 0; i < 20; i++) {
            const p = new Particle(x, y, '#ffffff', 'peony');
            p.decay = 0.04; 
            particles.push(p);
        }
        
        const subShellCount = Math.floor(random(5, 12));
        for (let i = 0; i < subShellCount; i++) {
            setTimeout(() => {
                const subX = x + random(-150, 150);
                const subY = y + random(-150, 150);
                const subColor = randomColor();
                
                for (let j = 0; j < 40; j++) {
                    const p = new Particle(subX, subY, subColor, 'chrysanthemum');
                    p.vx *= 0.6;
                    p.vy *= 0.6;
                    particles.push(p);
                }
            }, random(300, 1200)); 
        }
        return; 
    }
    
    // 通常パターンの破裂
    const particleCount = type === 'willow' ? 80 : 120;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(x, y, color, type));
    }
}


// ==========================================
// インタラクション (クリック、タップ)
// ==========================================
canvas.addEventListener('mousedown', (e) => {
    const startX = w / 2;
    const startY = h;
    const type = fireworkTypeSelect.value;
    fireworks.push(new Firework(startX, startY, e.clientX, e.clientY, type));
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const startX = w / 2;
    const startY = h;
    const type = fireworkTypeSelect.value;
    fireworks.push(new Firework(startX, startY, touch.clientX, touch.clientY, type));
}, { passive: false });


// ==========================================
// アニメーションループ と 特殊機能（水面反射）
// ==========================================
let lastAutoTime = 0;
let autoInterval = 1000;

function loop(timestamp) {
    requestAnimationFrame(loop);
    
    // ------------------------------------------
    // キャンバスの残像処理（修正ポイント）
    // destination-outを使用し、適度な時間（アルファ値0.18程度）で
    // 光の軌跡が完全にフェードアウトするバランスを追求します。
    // 背景画像自体には影響せず、キャンバスの描画内容のみ削り取られます。
    // ------------------------------------------
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'; 
    ctx.fillRect(0, 0, w, h);
    
    // 合成モードを source-over に戻す
    ctx.globalCompositeOperation = 'source-over';
    
    // オートモード処理
    if (autoModeCheckbox.checked) {
        if (timestamp - lastAutoTime > autoInterval) {
            const startX = random(w * 0.2, w * 0.8);
            const startY = h;
            const targetX = startX + random(-150, 150);
            const targetY = random(h * 0.1, h * 0.4);
            const type = fireworkTypeSelect.value;
            
            fireworks.push(new Firework(startX, startY, targetX, targetY, type));
            
            lastAutoTime = timestamp;
            autoInterval = random(600, 2000); 
        }
    }
    
    // オブジェクトの更新と描画
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].draw(ctx);
        fireworks[i].update(i);
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].draw(ctx);
        particles[i].update(i);
    }
    
    // 水面反射エフェクト（機能維持）
    const bg = backgroundSelect.value;
    if (bg === 'ocean' || bg === 'river') {
        renderWaterReflection();
    }
}

// ------------------------------------------
// 水面反射の描画関数
// ------------------------------------------
function renderWaterReflection() {
    const waterY = h * 0.7; // 画面下30%からを水面とする
    
    ctx.save();
    
    // 水面より下の領域をクリッピング
    ctx.beginPath();
    ctx.rect(0, waterY, w, h - waterY);
    ctx.clip();
    
    // 座標の上下反転
    ctx.translate(0, 2 * waterY);
    ctx.scale(1, -1);
    
    // 水面の映り込みとして全体の透明度を下げる
    ctx.globalAlpha = 0.25;
    
    // 通常の描画モードを維持
    ctx.globalCompositeOperation = 'source-over';
    
    // 反転した空間でオブジェクトを再描画
    fireworks.forEach(f => f.draw(ctx));
    particles.forEach(p => p.draw(ctx));
    
    ctx.restore();
}

requestAnimationFrame(loop);
