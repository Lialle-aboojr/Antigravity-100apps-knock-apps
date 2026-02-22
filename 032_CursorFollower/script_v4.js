/*
 * script.js (Final V4)
 * ロジック修正点: 光モードのスピードアップ、クリックエフェクトの信頼性向上
 */

const modeToggle = document.getElementById('mode-toggle');
const cursorContainer = document.getElementById('cursor-container');
const body = document.body;

let isLightMode = false;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

const followers = [];
const TOTAL_CATS = 5;

/*
 * 初期化
 */
function init() {
    for (let i = 0; i < TOTAL_CATS; i++) {
        const div = document.createElement('div');
        div.classList.add('cursor-element', 'cat');
        // SVGはCSS背景画像で表示するためテキストは空
        div.textContent = '';

        followers.push({
            element: div,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: 0,
            vy: 0,
            // 猫モード物理パラメータ
            spring: 0.05,        // バネ係数
            friction: 0.82,      // 摩擦
            direction: 1         // 1: 右(反転), -1: 左(通常) ※SVG画像の向きによる
        });

        cursorContainer.appendChild(div);
    }

    updateLoop();
}

/* マウス追跡 */
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

/* モード切替 */
modeToggle.addEventListener('change', (e) => {
    isLightMode = e.target.checked;

    if (isLightMode) {
        body.classList.remove('cat-mode');
        body.classList.add('light-mode');
    } else {
        body.classList.remove('light-mode');
        body.classList.add('cat-mode');
    }

    updateFollowerAppearance();
});

/* クリック（エフェクト） */
document.addEventListener('click', (e) => {
    // スクロール影響を避けるため pageX/Y を使用
    const x = e.pageX;
    const y = e.pageY;

    if (isLightMode) {
        createRipple(x, y);
    } else {
        createPaw(x, y);
    }
});

/* アニメーションループ */
function updateLoop() {
    followers.forEach((follower, index) => {
        // ターゲット座標：先頭はマウス、それ以外は「1つ前の要素」
        let targetX = (index === 0) ? mouseX : followers[index - 1].x;
        let targetY = (index === 0) ? mouseY : followers[index - 1].y;

        if (isLightMode) {
            /*
             * Light Mode: キビキビとした光の追従
             * 前回の「インクのような遅さ」はNGとのことで、係数を上げて速くする
             */
            // マウスを全てのターゲットにしつつ、わずかな遅延をつける「集合形」にするか、
            // 「行列形」にするか。前回同様「行列形」だが、Lerp係数を大きくする。
            // 係数を 0.15 〜 0.1 くらいに設定（前回は 0.02 だった）
            const ease = 0.15 - (index * 0.015);

            // シンプルな線形補間
            follower.x += (targetX - follower.x) * ease;
            follower.y += (targetY - follower.y) * ease;

        } else {
            /*
             * Cat Mode: バネ物理 + 向き反転
             */
            const dx = targetX - follower.x;
            const dy = targetY - follower.y;

            const ax = dx * follower.spring;
            const ay = dy * follower.spring;

            follower.vx += ax;
            follower.vy += ay;

            follower.vx *= follower.friction;
            follower.vy *= follower.friction;

            follower.x += follower.vx;
            follower.y += follower.vy;

            // 向きの制御
            // SVGが「左向き」の場合:
            // vx > 0 (右移動) -> scaleX(-1) で右を向く
            // vx < 0 (左移動) -> scaleX(1) で左を向く
            if (Math.abs(follower.vx) > 0.5) { // ある程度の速度が出たら向きを変える
                if (follower.vx > 0) {
                    follower.direction = -1; // 右移動（反転必要）
                } else {
                    follower.direction = 1;  // 左移動（通常）
                }
            }
        }

        // 座標とスタイルの適用
        const scaleX = isLightMode ? 1 : follower.direction;
        follower.element.style.transform = `translate(${follower.x}px, ${follower.y}px) translate(-50%, -50%) scaleX(${scaleX})`;
    });

    requestAnimationFrame(updateLoop);
}

/* 見た目更新 */
function updateFollowerAppearance() {
    followers.forEach((follower, index) => {
        if (isLightMode) {
            follower.element.classList.remove('cat');
            follower.element.classList.add('light-spot');
            follower.direction = 1; // 向きリセット
        } else {
            follower.element.classList.remove('light-spot');
            follower.element.classList.add('cat');
        }
    });
}

/* 肉球エフェクト作成 */
function createPaw(x, y) {
    const paw = document.createElement('div');
    paw.classList.add('paw-print');
    paw.style.left = `${x}px`;
    paw.style.top = `${y}px`;

    // ランダム角度
    const deg = Math.random() * 40 - 20;
    paw.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;

    cursorContainer.appendChild(paw);
    setTimeout(() => { if (paw.parentNode) paw.remove(); }, 1000);
}

/* 波紋エフェクト作成 */
function createRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    // 回転不要

    cursorContainer.appendChild(ripple);

    // CSSアニメーション(0.6s)に合わせて削除
    setTimeout(() => { if (ripple.parentNode) ripple.remove(); }, 600);
}

init();
