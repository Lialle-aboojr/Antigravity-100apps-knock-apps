/*
 * script.js (Final V5)
 * ロジック修正点: 光モードの追従スピードをさらに高速化 (0.25)
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
        // SVGはCSS背景画像で表示
        div.textContent = '';

        followers.push({
            element: div,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: 0,
            vy: 0,
            spring: 0.05,        // バネ係数
            friction: 0.82,      // 摩擦
            direction: 1         // 1: 右(反転), -1: 左(通常) 
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
        let targetX = (index === 0) ? mouseX : followers[index - 1].x;
        let targetY = (index === 0) ? mouseY : followers[index - 1].y;

        if (isLightMode) {
            /*
             * Light Mode: 高速化された追従 (V5)
             * マウスとの一体感を高めるため、係数をアップ
             */
            const ease = 0.25 - (index * 0.02);

            follower.x += (targetX - follower.x) * ease;
            follower.y += (targetY - follower.y) * ease;

        } else {
            /*
             * Cat Mode: バネ物理
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
            if (Math.abs(follower.vx) > 0.5) {
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
            follower.direction = 1;
        } else {
            follower.element.classList.remove('light-spot');
            follower.element.classList.add('cat');
        }
    });
}

function createPaw(x, y) {
    const paw = document.createElement('div');
    paw.classList.add('paw-print');
    paw.style.left = `${x}px`;
    paw.style.top = `${y}px`;
    const deg = Math.random() * 40 - 20;
    paw.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
    cursorContainer.appendChild(paw);
    setTimeout(() => { if (paw.parentNode) paw.remove(); }, 1000);
}

function createRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    // style.cssで scale(0) を削除したので、これで正しく表示される

    cursorContainer.appendChild(ripple);
    setTimeout(() => { if (ripple.parentNode) ripple.remove(); }, 600);
}

init();
