/*
 * script.js (V3)
 * アプリケーションのロジック
 * 修正点: 猫の反転ロジック、物理演算の再調整（遅く、重く）、エフェクトの確実な実行
 */

const modeToggle = document.getElementById('mode-toggle');
const cursorContainer = document.getElementById('cursor-container');
const body = document.body;

let isLightMode = false;
// 初期位置は画面中央
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

const followers = [];
const TOTAL_CATS = 5;

/*
 * 初期化処理
 */
function init() {
    for (let i = 0; i < TOTAL_CATS; i++) {
        const div = document.createElement('div');
        div.classList.add('cursor-element', 'cat');
        // V3修正: 絵文字テキストは使わず、CSSの背景画像(SVG)で表示するためテキストは空にする
        div.textContent = '';

        followers.push({
            element: div,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: 0,
            vy: 0,
            // 物理パラメータ調整 (V3: 全体的に動きを遅くする)
            // バネ係数を小さくし、摩擦を大きくする
            spring: 0.03 + (i * 0.005),
            friction: 0.85 - (i * 0.01),
            // 前回の向きを保存（反転制御用）: 1 = 右, -1 = 左 (SVGの絵が左向きならデフォルト1でOKだが、今回は調整)
            // 通常、左向きの素材なら scaleX(-1) で右を向く
            direction: 1
        });

        cursorContainer.appendChild(div);
    }

    updateLoop();
}

/*
 * マウス移動イベント
 */
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

/*
 * モード切り替えイベント
 */
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

/*
 * クリックイベント
 */
document.addEventListener('click', (e) => {
    // スクロールされている場合も考慮して pageX/pageY を使用（今回は overflow:hidden だが安全のため）
    const x = e.pageX;
    const y = e.pageY;

    if (isLightMode) {
        createRipple(x, y);
    } else {
        createPaw(x, y);
    }
});

/*
 * メインループ
 */
function updateLoop() {
    followers.forEach((follower, index) => {
        // 目標地点の設定
        let targetX = (index === 0) ? mouseX : followers[index - 1].x;
        let targetY = (index === 0) ? mouseY : followers[index - 1].y;

        if (isLightMode) {
            /* 
             * Light Mode: インクのような重たい追従
             * Lerp係数を極端に小さくして、後からついてくる余韻を強調
             */
            // マウスを直接ターゲットにしつつ、遅延（Ease）を個体ごとに変える
            targetX = mouseX;
            targetY = mouseY;

            // 0.03 くらいの非常に小さい値にする
            const ease = 0.02 + (index * 0.005);

            follower.x += (targetX - follower.x) * ease;
            follower.y += (targetY - follower.y) * ease;

        } else {
            /* 
             * Cat Mode: バネ物理 + 向き制御
             */
            const dx = targetX - follower.x;
            const dy = targetY - follower.y;

            // バネ計算 (V3: パラメータはinitでかなり弱めに設定済み)
            const ax = dx * follower.spring;
            const ay = dy * follower.spring;

            follower.vx += ax;
            follower.vy += ay;

            follower.vx *= follower.friction;
            follower.vy *= follower.friction;

            follower.x += follower.vx;
            follower.y += follower.vy;

            // 向きの制御 (Cat Modeのみ)
            // X方向の移動量（速度 velX ではなく 変位 dx の方が意図判定しやすい場合もあるが、慣性を見るならvx）
            // ここでは「目的地に対してどっちに動いているか」よりも「現在の速度」で判定
            if (Math.abs(follower.vx) > 0.1) {
                // 右(プラス)なら右向き、左(マイナス)なら左向き
                // SVGの猫がおそらく「左向き」か「正面」なので、反転が必要かどうか確認要。
                // 今回使用したSVGパスは左向き（尻尾が右、顔が左）を想定して作成したものとする。
                // 左向き素材の場合: vx > 0 (右移動) -> scaleX(-1), vx < 0 (左移動) -> scaleX(1)

                if (follower.vx > 0) {
                    follower.direction = -1; // 右へ行くために反転
                } else {
                    follower.direction = 1;  // 左へ行く（デフォルト）
                }
            }
        }

        // 座標と変形の適用
        // LightModeの場合は向き変形は不要（scale(1)）
        const scaleX = isLightMode ? 1 : follower.direction;

        follower.element.style.transform = `translate(${follower.x}px, ${follower.y}px) translate(-50%, -50%) scaleX(${scaleX})`;
    });

    requestAnimationFrame(updateLoop);
}

/*
 * モード変更時のスタイル更新
 */
function updateFollowerAppearance() {
    followers.forEach((follower, index) => {
        if (isLightMode) {
            // Light Mode設定
            follower.element.classList.remove('cat');
            follower.element.classList.add('light-spot');
            // リセット
            follower.direction = 1;
        } else {
            // Cat Mode設定
            follower.element.classList.remove('light-spot');
            follower.element.classList.add('cat');
        }
    });
}

function createPaw(x, y) {
    const paw = document.createElement('div');
    paw.classList.add('paw-print');
    paw.textContent = '🐾';
    paw.style.left = `${x}px`;
    paw.style.top = `${y}px`;
    const deg = Math.random() * 40 - 20;
    paw.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
    cursorContainer.appendChild(paw);
    setTimeout(() => paw.remove(), 1200);
}

function createRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    // 波紋は回転不要
    cursorContainer.appendChild(ripple);
    setTimeout(() => ripple.remove(), 1500);
}

// 開始
init();
