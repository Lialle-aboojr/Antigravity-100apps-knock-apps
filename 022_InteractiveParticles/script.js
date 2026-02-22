// キャンバスのセットアップ
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

// キャンバスサイズをウィンドウサイズに合わせる
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// パーティクルを格納する配列
let particlesArray = [];

// 色相（Hue）のベース値
let hue = 0;

// 状態フラグ
let isRainbowMode = false; // 虹色モードかどうか
let isLightMode = false;   // ライトモード（白背景）かどうか

// テーマ切り替えボタンの要素取得とイベントリスナー設定
const themeBtn = document.getElementById('theme-btn');
themeBtn.addEventListener('click', function (e) {
    // 親要素へのイベント伝播を止める（背景クリック判定を防止するため）
    e.stopPropagation();

    // ライトモードの切り替え
    isLightMode = !isLightMode;
    document.body.classList.toggle('light-mode');
});

// マウスの位置情報を管理するオブジェクト
const mouse = {
    x: undefined,
    y: undefined,
}

// ウィンドウのリサイズイベント
window.addEventListener('resize', function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // リサイズ時もパーティクル数は維持される
});

// マウス移動イベント
canvas.addEventListener('mousemove', function (event) {
    mouse.x = event.x;
    mouse.y = event.y;
});

// タッチデバイス対応
canvas.addEventListener('touchmove', function (event) {
    mouse.x = event.touches[0].clientX;
    mouse.y = event.touches[0].clientY;
}, { passive: true });

// クリック/タップイベント（色変更ロジック）
// 画面のどこかをクリックすると色が変わる
window.addEventListener('click', function () {
    // 20%の確率で「虹色モード」になる
    // 80%の確率で「ランダムな単色」になる
    if (Math.random() < 0.2) {
        isRainbowMode = true;
    } else {
        isRainbowMode = false;
        hue = Math.random() * 360;
    }
});


// パーティクル（光の粒）クラスの定義
class Particle {
    constructor() {
        // 初期位置をランダムに設定
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;

        // サイズ（半径）をランダムに (0.5px 〜 3px)
        // ※以前より小さくして繊細さを出す
        this.size = Math.random() * 2.5 + 0.5;

        // 速度（移動量）の初期値
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;

        // 個々のパーティクル独自の色相オフセット（虹色モード用）
        this.colorOffset = Math.random() * 360;
    }

    // 状態を更新するメソッド
    update() {
        // マウス位置との距離を計算
        let dx = 0;
        let dy = 0;

        if (mouse.x !== undefined && mouse.y !== undefined) {
            dx = mouse.x - this.x;
            dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // 重力計算
            const maxDistance = 300; // 重力が効く範囲半径

            if (distance < maxDistance) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (maxDistance - distance) / maxDistance;
                const gravityStrength = 2; // 引力

                this.speedX += forceDirectionX * force * gravityStrength;
                this.speedY += forceDirectionY * force * gravityStrength;
            }
        }

        // 摩擦（慣性）
        this.speedX *= 0.95;
        this.speedY *= 0.95;

        // 座標の更新
        this.x += this.speedX;
        this.y += this.speedY;
    }

    // 描画メソッド
    draw() {
        // 描画色の決定ロジック
        let finalColor;

        if (isRainbowMode) {
            // 虹色モード：個々のオフセット＋時間経過や位置で変化させる
            // ここではシンプルに個別のオフセットを使う
            // ライトモードなら濃い色（輝度50%）、ダークモードなら明るい色（輝度60-70%）
            let lightness = isLightMode ? '40%' : '60%';
            finalColor = 'hsl(' + this.colorOffset + ', 100%, ' + lightness + ')';
            // フレーム毎に少し色を回すときれい
            this.colorOffset += 1;
        } else {
            // 単色モード：ベースのhueに少しばらつきを持たせる
            // ライトモードなら視認性を上げて濃くする
            let lightness = isLightMode ? '40%' : '60%';
            finalColor = 'hsl(' + (hue + Math.random() * 20) + ', 100%, ' + lightness + ')';
        }

        ctx.fillStyle = finalColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// パーティクル生成関数
function init() {
    particlesArray = [];
    // パーティクルの数。
    // ※密度を上げるために増やす（300 -> 800）
    let numberOfParticles = 800;

    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}

// アニメーションループ関数
function animate() {
    // 前のフレームを消去（残像効果）
    // ライトモード（白背景）のときは、白の半透明で塗りつぶす
    // ダークモード（黒背景）のときは、黒の半透明で塗りつぶす
    if (isLightMode) {
        // 白背景：残像を綺麗に残すために薄い白を重ねる
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    } else {
        // 黒背景：薄い黒を重ねる
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    }

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 全パーティクルの更新と描画
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }

    requestAnimationFrame(animate);
}

// 初期化と実行
init();
animate();

// マウスが画面外に出たら重力を解除する
window.addEventListener('mouseout', function () {
    mouse.x = undefined;
    mouse.y = undefined;
});
