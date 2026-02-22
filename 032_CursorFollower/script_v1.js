/*
 * script.js
 * アプリケーションのロジック（動き）を担当します。
 */

// HTMLの要素を取得
const modeToggle = document.getElementById('mode-toggle');
const cursorContainer = document.getElementById('cursor-container');
const toggleContainer = document.querySelector('.toggle-container'); // マウスイベント用

// 状態管理のための変数
let isLuminousMode = false; // false = Black Cat, true = Luminous
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

// 猫（または光）の要素を管理する配列
const followers = [];
const TOTAL_CATS = 5; // 猫の数

/*
 * 初期化処理
 * ページが読み込まれたときに一度だけ実行されます。
 */
function init() {
    // 猫要素を作成して配置
    for (let i = 0; i < TOTAL_CATS; i++) {
        const div = document.createElement('div');
        div.classList.add('cursor-element', 'cat');
        div.textContent = '🐈⬛'; // 黒猫の絵文字

        // 配列に保存（要素本体と、現在の座標を持たせる）
        followers.push({
            element: div,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            // 遅延係数: 後ろの猫ほど動きを遅くする（0.1 〜 0.05くらい）
            // i=0（先頭）は速く、i=4（最後尾）はゆっくり
            delay: 0.15 - (i * 0.02)
        });

        cursorContainer.appendChild(div);
    }

    // アニメーションループを開始
    updateLoop();
}

/*
 * マウスの動きを監視するイベント
 */
document.addEventListener('mousemove', (e) => {
    // マウスの座標を更新
    mouseX = e.clientX;
    mouseY = e.clientY;
});

/*
 * モード切替のイベント
 */
modeToggle.addEventListener('change', (e) => {
    isLuminousMode = e.target.checked;
    updateModeAppearance();
});

// トグルスイッチの上にマウスが来たときは、システムカーソルを表示させたいので
// bodyのcursor: none を一時的に解除するのはCSSで header:hover { cursor: default } 済み

/*
 * 画面クリック時のイベント
 */
document.addEventListener('click', (e) => {
    // クリックした座標
    const x = e.clientX;
    const y = e.clientY;

    if (isLuminousMode) {
        createRippleEffect(x, y);
    } else {
        createPawPrint(x, y);
    }
});

/*
 * メインのアニメーションループ
 * ブラウザの描画タイミングに合わせて繰り返し実行されます。
 */
function updateLoop() {
    // 各フォロワー（猫/光）の位置を更新
    followers.forEach((follower, index) => {
        // 目標とする座標（先頭はマウス、2匹目以降は前の要素の座標）
        let targetX, targetY;

        if (index === 0) {
            // 先頭はマウスを追いかける
            targetX = mouseX;
            targetY = mouseY;
        } else {
            // 2匹目以降は「前の要素」を追いかけることで行列を作る
            targetX = followers[index - 1].x;
            targetY = followers[index - 1].y;

            // LuminousModeの場合は、すべてマウスを追いかける（集まる感じにする）
            if (isLuminousMode) {
                targetX = mouseX;
                targetY = mouseY;
            }
        }

        // 慣性のある移動（線形補間: Linear Interpolation）
        // 現在地 += (目的地 - 現在地) * 遅延係数
        // これによって「ヌルッ」とした動きになります。
        follower.x += (targetX - follower.x) * follower.delay;
        follower.y += (targetY - follower.y) * follower.delay;

        // 画面上の位置に反映
        follower.element.style.transform = `translate(${follower.x}px, ${follower.y}px) translate(-50%, -50%)`;
    });

    // 次のフレームでも実行
    requestAnimationFrame(updateLoop);
}

/*
 * モードに応じた見た目の切り替え
 */
function updateModeAppearance() {
    // 全フォロワーに対してクラスを付け替え
    followers.forEach((follower, index) => {
        if (isLuminousMode) {
            // Luminous Mode
            follower.element.textContent = ''; // 文字を消す
            follower.element.classList.remove('cat');
            follower.element.classList.add('light-spot');

            // 光モードでは、後ろの要素ほど少し透明にして残像っぽくする
            follower.element.style.opacity = 1 - (index * 0.15);
            // 光モードは動きを少し滑らか（遅延少なめ）にする再設定
            follower.delay = 0.2 - (index * 0.03);

        } else {
            // Black Cat Mode
            follower.element.textContent = '🐈⬛'; // 猫に戻す
            follower.element.classList.remove('light-spot');
            follower.element.classList.add('cat');

            follower.element.style.opacity = 1; // 透明度リセット
            // 猫モードの動き（行列）用の遅延設定
            follower.delay = 0.15 - (index * 0.02);
        }
    });

    // 背景色やテキスト色の微調整が必要ならここに追加
}

/*
 * エフェクト作成: 肉球（Cat Mode）
 */
function createPawPrint(x, y) {
    const paw = document.createElement('div');
    paw.classList.add('paw-print');
    paw.textContent = '🐾';
    paw.style.left = `${x}px`;
    paw.style.top = `${y}px`;

    // 少し角度をランダムにつけると自然
    const randomRotation = Math.random() * 60 - 30; // -30度〜30度
    paw.style.transform = `translate(-50%, -50%) rotate(${randomRotation}deg)`;

    cursorContainer.appendChild(paw);

    // アニメーションが終わったら要素を削除（1秒後）
    setTimeout(() => {
        paw.remove();
    }, 1000);
}

/*
 * エフェクト作成: 光の波紋（Luminous Mode）
 */
function createRippleEffect(x, y) {
    const ripple = document.createElement('div');
    ripple.classList.add('ripple');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    cursorContainer.appendChild(ripple);

    // アニメーションが終わったら要素を削除（0.8秒後）
    setTimeout(() => {
        ripple.remove();
    }, 800);
}

// 初期化実行
init();
