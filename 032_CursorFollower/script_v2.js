/*
 * script.js (V2)
 * アプリケーションのロジック
 * 猫モード（バネ物理演算）と光モード（滑らかな追従）で異なる動きを実装しています。
 */

// HTML要素の取得
const modeToggle = document.getElementById('mode-toggle');
const cursorContainer = document.getElementById('cursor-container');
const body = document.body;

// 状態管理
let isLightMode = false;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

// カーソル要素（フォロワー）の管理配列
const followers = [];
const TOTAL_CATS = 5;

/*
 * 初期化処理
 */
function init() {
    // 5つの要素を生成
    for (let i = 0; i < TOTAL_CATS; i++) {
        const div = document.createElement('div');
        div.classList.add('cursor-element', 'cat');
        div.textContent = '🐈⬛';

        // 配列に追加（位置 + 物理演算用のパラメータ）
        followers.push({
            element: div,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: 0, // X軸の速度（Cat Mode用）
            vy: 0, // Y軸の速度（Cat Mode用）
            // 個体差をつけるパラメータ
            spring: 0.05 + (i * 0.01), // バネの強さ（後ろの子ほど少し強く/弱く調整可）
            friction: 0.75 - (i * 0.02) // 摩擦（減衰率）
        });

        cursorContainer.appendChild(div);
    }

    // アニメーション開始
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
 * クリックイベント（エフェクト発生）
 */
document.addEventListener('click', (e) => {
    const x = e.clientX;
    const y = e.clientY;

    if (isLightMode) {
        createRipple(x, y);
    } else {
        createPaw(x, y);
    }
});

/*
 * メインループ（requestAnimationFrame）
 */
function updateLoop() {
    followers.forEach((follower, index) => {
        // 目標地点の計算
        // 先頭はマウス座標、それ以降は「前の要素」の座標をターゲットにする
        let targetX = (index === 0) ? mouseX : followers[index - 1].x;
        let targetY = (index === 0) ? mouseY : followers[index - 1].y;

        if (isLightMode) {
            /*
             * 光モードの動き：シンプルな線形補間（Lerp）
             * 重たく、ゆっくりと吸い付くような余韻を演出
             */
            // 光モードの場合は、全員がマウスの近くに集まるように調整しても良いし、
            // 今回は「余韻」が重要なので、少し列になるようにする
            // 係数を極端に小さくして、ぬる〜っと動かす
            const ease = 0.08 - (index * 0.01);

            // Luminous Modeでは全員マウスを直接ターゲットにした方が「集合する光」っぽくなる場合もあるが、
            // 「余韻」重視なら前の光を追うほうが軌跡が綺麗に残る。
            // ここではマウスを直接ターゲットにしつつ、遅延を大きく変えるアプローチをとる。
            targetX = mouseX;
            targetY = mouseY;

            follower.x += (targetX - follower.x) * ease;
            follower.y += (targetY - follower.y) * ease;

        } else {
            /*
             * 猫モードの動き：バネ物理（Spring Physics）
             * 「行き過ぎて戻る」動き（じゃれつく感じ）を実現
             */

            // 距離（変位）を計算
            const dx = targetX - follower.x;
            const dy = targetY - follower.y;

            // 加速度 = 距離 * バネ係数
            const ax = dx * 0.08; // バネ係数（固定または個体差）
            const ay = dy * 0.08;

            // 速度に加速度を足す
            follower.vx += ax;
            follower.vy += ay;

            // 摩擦をかけて減速させる（これがないと永遠に振動する）
            // 後ろの猫ほど摩擦を少なくして、ぶんぶん振り回される感じにしても面白い
            const friction = 0.85;
            follower.vx *= friction;
            follower.vy *= friction;

            // 位置を更新
            follower.x += follower.vx;
            follower.y += follower.vy;
        }

        // 座標を適用
        follower.element.style.transform = `translate(${follower.x}px, ${follower.y}px) translate(-50%, -50%)`;
    });

    requestAnimationFrame(updateLoop);
}

/*
 * 見た目の更新
 */
function updateFollowerAppearance() {
    followers.forEach((follower, index) => {
        if (isLightMode) {
            // Light Mode設定
            follower.element.textContent = '';
            follower.element.classList.remove('cat');
            follower.element.classList.add('light-spot');

            // 重なり順や不透明度調整
            follower.element.style.opacity = 0.8 - (index * 0.1);
        } else {
            // Cat Mode設定
            follower.element.textContent = '🐈⬛';
            follower.element.classList.remove('light-spot');
            follower.element.classList.add('cat');
            follower.element.style.opacity = 1;
        }
    });
}

/*
 * エフェクト関数：肉球
 */
function createPaw(x, y) {
    const paw = document.createElement('div');
    paw.classList.add('paw-print');
    paw.textContent = '🐾';
    paw.style.left = `${x}px`;
    paw.style.top = `${y}px`;

    // ランダムな角度
    const deg = Math.random() * 40 - 20;
    paw.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;

    cursorContainer.appendChild(paw);

    setTimeout(() => {
        if (paw.parentNode) paw.remove();
    }, 1000); // CSSアニメーションの時間に合わせる
}

/*
 * エフェクト関数：光の波紋
 */
function createRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    cursorContainer.appendChild(ripple);

    setTimeout(() => {
        if (ripple.parentNode) ripple.remove();
    }, 1500); // CSSアニメーションの時間に合わせる
}

// アプリ開始
init();
