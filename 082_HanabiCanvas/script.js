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

// 背景変更時の処理（bodyのクラスを変更する）
backgroundSelect.addEventListener('change', (e) => {
    // 古い背景クラスを削除し、新しいものを付与
    document.body.className = '';
    document.body.classList.add('bg-' + e.target.value);
});


// ==========================================
// 花火物理演算エンジン
// ==========================================
// 打上げ中・破裂後のオブジェクトを管理する配列
const fireworks = []; // 上昇していく光の球
const particles = []; // 破裂した後の小さな光たち

// 花火の色味（ネオン調の鮮やかなカラーパレット）
const colors = ['#FF1461', '#18FF92', '#5A87FF', '#FBF38C', '#FF8359', '#D900FF'];

// ユーティリティ：最小値と最大値からランダムな数値を生成
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// ユーティリティ：ランダムな色を取得
function randomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

// ユーティリティ：16進数のカラーコード(例: #FF0000) をRGB(例: 255, 0, 0) に変換
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}

// ------------------------------------------
// クラス：打ち上げ用花火（Firework）
// 下からクリックした場所へ向かって飛んでいくオブジェクト
// ------------------------------------------
class Firework {
    constructor(startX, startY, targetX, targetY, type) {
        this.x = startX;
        this.y = startY;
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.type = type;           // 種類（菊、牡丹、など）
        this.color = randomColor(); // はじけるときの色をあらかじめ決定
        
        // ターゲットまでの距離
        this.distanceToTarget = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2));
        this.distanceTraveled = 0; // すでに移動した距離
        
        // 角度を計算して、XとYの速度に分解する
        const angle = Math.atan2(targetY - startY, targetX - startX);
        // 上昇スピードを少し遅く調整（0.7〜0.8倍程度）
        const speed = random(8.4, 13.5); 
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // 軌跡を描画するため、過去の座標を保持する配列
        this.trail = [];
    }
    
    // 状態の更新
    update(index) {
        // 現在の座標を履歴に保存（少しだけ保存して尾を引くように見せる）
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 3) {
            this.trail.shift(); // 古い履歴を削除
        }
        
        // 座標を移動
        this.x += this.vx;
        this.y += this.vy;
        
        // スタート地点からどれくらい移動したかを計算
        this.distanceTraveled = Math.sqrt(Math.pow(this.x - this.startX, 2) + Math.pow(this.y - this.startY, 2));
        
        // ターゲット位置に到達したか判定
        if (this.distanceTraveled >= this.distanceToTarget) {
            // 対象位置についたらパーティクル（破裂）を生成して自身を配列から削除（ガベージコレクション）
            createParticles(this.targetX, this.targetY, this.color, this.type);
            fireworks.splice(index, 1);
        }
    }
    
    // 描画
    draw(ctx) {
        ctx.beginPath();
        // 過去の座標から現在の座標へ線を引くことでブレを表現
        const startPos = this.trail.length > 0 ? this.trail[0] : {x: this.x, y: this.y};
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(this.x, this.y);
        // 上昇時の色は薄い白色系のほうが本物らしい
        ctx.strokeStyle = `rgba(255, 255, 255, 0.7)`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// ------------------------------------------
// クラス：破裂後のパーティクル（Particle）
// 破裂して四方八方に広がり、消えていく光の粒
// ------------------------------------------
class Particle {
    constructor(x, y, color, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
        this.trail = [];
        this.alpha = 1; // 透明度 (1 = 不透明, 0 = 完全に透明)
        
        // 散らばる方向をランダムな角度（0〜360度）で決定
        const angle = random(0, Math.PI * 2);
        
        // 初期スピードを従来より遅く（0.7〜0.8倍程度）設定
        let speed = random(1.5, 7.5);
        
        // 牡丹（Peony）の場合は丸く等速で広がるように速度を調整
        if (type === 'peony') {
            speed = random(3.5, 6);
        }
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // 物理演算のパラメータ（ゆっくり広がり、ゆっくり落ちるよう調整）
        this.friction = 0.96; // 摩擦（減速具合。1に近いほどゆっくり減速）
        this.gravity = 0.08;  // 重力（落下速度を弱めに）
        this.decay = random(0.008, 0.018); // 消える早さを遅く（余韻が残るように）
        this.trailLength = 4; // 残像の長さ
        
        // 各花火の種類に応じた特殊設定
        if (type === 'willow') {
            // しだれ柳: 重力を少し強めて下に垂らす、色を金色に、非常に長く残るように設定
            this.gravity = 0.15;
            this.decay = random(0.003, 0.01);
            this.color = '#FFD700'; // 金色
            this.trailLength = 6;
        } else if (type === 'peony') {
            // 牡丹: 尾を引かない（点で表現する）
            this.friction = 0.94;
            this.trailLength = 1;
        }
    }
    
    update(index) {
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.trailLength) {
            this.trail.shift();
        }
        
        // 摩擦と重力の適用
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        
        // 座標更新
        this.x += this.vx;
        this.y += this.vy;
        
        // 透明度を減らす
        this.alpha -= this.decay;
        
        // 完全に透明になったら表示不要なため削除する（ガベージコレクション）
        if (this.alpha <= 0) {
            particles.splice(index, 1);
        }
    }
    
    draw(ctx) {
        ctx.beginPath();
        const startPos = this.trail.length > 0 ? this.trail[0] : {x: this.x, y: this.y};
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(this.x, this.y);
        
        // 透過度付きの色付け
        ctx.strokeStyle = `rgba(${hexToRgb(this.color)}, ${this.alpha})`;
        ctx.lineWidth = this.type === 'peony' ? 3 : 2; // 牡丹は少し太くする
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

// ------------------------------------------
// パーティクル生成ロジック
// (様々な種類の花火ごとの破裂パターンを制御)
// ------------------------------------------
function createParticles(x, y, color, type) {
    // ランダムが選ばれている場合は、4種からランダムに1波決める
    if (type === 'random') {
        const types = ['chrysanthemum', 'peony', 'willow', 'senrin'];
        type = types[Math.floor(Math.random() * types.length)];
    }

    if (type === 'senrin') {
        // 千輪（Senrin）: 一度小さく破裂し、時間差で多数のランダムな小さな花火が開く
        
        // 最初の小さな破裂（音だけのイメージ）
        for (let i = 0; i < 20; i++) {
            const p = new Particle(x, y, '#ffffff', 'peony');
            p.decay = 0.03; // 少しゆっくりに
            particles.push(p);
        }
        
        // 少し遅れて小さな花火を多数発生させる
        const subShellCount = Math.floor(random(5, 12));
        for (let i = 0; i < subShellCount; i++) {
            setTimeout(() => {
                const subX = x + random(-150, 150);
                const subY = y + random(-150, 150);
                const subColor = randomColor();
                
                // 小さな菊として破裂させる
                for (let j = 0; j < 40; j++) {
                    const p = new Particle(subX, subY, subColor, 'chrysanthemum');
                    // 飛び散る威力を抑えて小さくする
                    p.vx *= 0.6;
                    p.vy *= 0.6;
                    particles.push(p);
                }
            }, random(300, 1200)); // 0.3秒から1.2秒の間にパラパラと破裂
        }
        return; // 千輪は特殊処理なのでここで終了
    }
    
    // 通常パターンの破裂（菊、牡丹、しだれ柳）
    const particleCount = type === 'willow' ? 80 : 120;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(x, y, color, type));
    }
}


// ==========================================
// インタラクション (クリック、タップ)
// ==========================================
// PCのクリック操作
canvas.addEventListener('mousedown', (e) => {
    // 画面下部中央から、クリックした場所に向けて発射
    const startX = w / 2;
    const startY = h;
    const type = fireworkTypeSelect.value;
    fireworks.push(new Firework(startX, startY, e.clientX, e.clientY, type));
});

// スマホのタップ操作（デフォルトのスクロールなどを防ぐ）
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
let autoInterval = 1000; // 次の自動打上までの時間

function loop(timestamp) {
    // requestAnimationFrameで滑らかなアニメーションを持続
    requestAnimationFrame(loop);
    
    // ------------------------------------------
    // キャンバスの描画クリア（軌跡を残しつつ背景を透過させる）
    // ご指定の通り destination-out を用いてキャンバス自体を徐々に透明にし、
    // 背景画像が見える状態で軌跡を長く残します。
    // ------------------------------------------
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'; // 余韻を長くするため0.1より小さく設定
    ctx.fillRect(0, 0, w, h);
    
    // ご指定の通り合成モードを元（source-over）に戻す
    ctx.globalCompositeOperation = 'source-over';
    
    // ------------------------------------------
    // オートモード処理
    // ------------------------------------------
    if (autoModeCheckbox.checked) {
        if (timestamp - lastAutoTime > autoInterval) {
            // ランダムな位置から発射
            const startX = random(w * 0.2, w * 0.8);
            const startY = h;
            // 上空のランダムな高さを目標にする
            const targetX = startX + random(-150, 150);
            const targetY = random(h * 0.1, h * 0.4);
            const type = fireworkTypeSelect.value;
            
            fireworks.push(new Firework(startX, startY, targetX, targetY, type));
            
            lastAutoTime = timestamp;
            autoInterval = random(600, 2000); // 間隔をランダムに
        }
    }
    
    // ------------------------------------------
    // 各オブジェクトの更新と描画
    // splice()で配列から削除する際、インデックスがずれないよう後ろからループする
    // ------------------------------------------
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].draw(ctx);
        fireworks[i].update(i);
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].draw(ctx);
        particles[i].update(i);
    }
    
    // ------------------------------------------
    // 水面反射（海、川辺の背景でのみ実行）
    // ------------------------------------------
    const bg = backgroundSelect.value;
    if (bg === 'ocean' || bg === 'river') {
        renderWaterReflection();
    }
}

// ==========================================
// 水面に花火が映るエフェクトの描画
// 既存のオブジェクト座標をCanvasAPIの機能で上下反転して再描画します
// ==========================================
function renderWaterReflection() {
    const waterY = h * 0.7; // 画面下30%からを水面とする
    
    ctx.save();
    
    // 1. 水面より下の領域だけを描画対象にする（クリッピング）
    ctx.beginPath();
    ctx.rect(0, waterY, w, h - waterY);
    ctx.clip();
    
    // 2. 座標を反転させる (Y軸方向を下へ向け、水面Y座標を基準に逆転させる)
    // 数学的に Y' = 2 * waterY - Y の計算と同様のトランスフォーム
    ctx.translate(0, 2 * waterY);
    ctx.scale(1, -1);
    
    // 3. 水に映っているように見せるため全体の透明度を下げる
    ctx.globalAlpha = 0.25;
    
    // 4. ベースと同様に通常の描画モードを維持
    ctx.globalCompositeOperation = 'source-over';
    
    // 5. 反転した空間に花火とパーティクルを等しく再描画
    fireworks.forEach(f => f.draw(ctx));
    particles.forEach(p => p.draw(ctx));
    
    ctx.restore();
}

// 初回のアニメーションループを開始！
requestAnimationFrame(loop);
