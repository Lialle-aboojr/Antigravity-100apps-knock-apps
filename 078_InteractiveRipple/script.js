/**
 * Interactive Ripple (波紋エフェクト)
 * JavaScriptロジック
 */

// ==========================================
// 1. ファビコンのフォールバック処理
// ==========================================
// favicon.pngが読み込めない場合、動的にSVG(絵文字)に切り替えます。
const favicon = document.getElementById('favicon');
const img = new Image();
img.src = 'favicon.png';
img.onerror = () => {
    // 水滴の絵文字をSVGとしてData URI化
    favicon.href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💧</text></svg>`;
};

// ==========================================
// 2. DOM要素の取得
// ==========================================
const canvas = document.getElementById('rippleCanvas');
const ctx = canvas.getContext('2d');

const autoModeToggle = document.getElementById('autoModeToggle');
const soundToggle = document.getElementById('soundToggle');
const colorSelect = document.getElementById('colorSelect');
const speedSlider = document.getElementById('speedSlider');

// ==========================================
// 3. 状態管理変数
// ==========================================
let ripples = []; // 画面上の波紋を保持する配列
let autoModeInterval = null; // 自動モードのタイマーID

// ==========================================
// 4. Canvasの初期化とリサイズ制御
// ==========================================
function resizeCanvas() {
    // 画面全体を覆うようにサイズ調整
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // 初回実行

// ==========================================
// 5. Web Audio API によるサウンド生成 (水滴音)
// ==========================================
// AudioContextの初期化 (一部のブラウザ対応のためwebkitプレフィックスも指定)
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playWaterDropSound() {
    if (!soundToggle.checked) return; // サウンドOFF時は鳴らさない

    // AudioContextが未作成、または停止(suspend)している場合は再開する
    // ブラウザの仕様でユーザーの操作(クリック等)があるまで音声再生がブロックされるため対策が必要
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // 音の発生源（サイン波）
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine';

    // 音量制御のゲインノード
    const gainNode = audioCtx.createGain();

    // 周波数(ピッチ)のエンベロープ（音程変化）
    // 600Hz付近から急激に300Hzに落とすことで「ポツッ」という高い質感を作る
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.1);

    // 音量のエンベロープ（アタックとディケイ）
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02); // 0.02秒で音量MAX
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1); // その後急激に減衰

    // ノードの接続: Oscillator -> Gain -> Destination (スピーカー)
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // 再生開始・停止スケジューリング
    oscillator.start(now);
    oscillator.stop(now + 0.15); // ちょっと余韻を残して150msで完全停止処理
}

// ==========================================
// 6. Ripple (波紋) クラス
// ==========================================
class Ripple {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0; // 初期サイズは0
        this.alpha = 1;  // 初期透明度は1(不透明)
        
        // UIスライダー(1〜10)の値を実際のピクセル増加量(2〜11px)に変換
        this.speed = parseInt(speedSlider.value) + 1;
        
        // 色の決定
        this.colorStr = this.getColorString(colorSelect.value);
    }

    // テーマに応じたRGB文字列を返す
    getColorString(theme) {
        if (theme === 'cyan') return '14, 165, 233';     // #0ea5e9
        if (theme === 'blue') return '37, 99, 235';      // #2563eb
        if (theme === 'white') return '248, 250, 252';   // #f8fafc
        if (theme === 'random') {
            const r = Math.floor(Math.random() * 200 + 55); // 暗すぎないランダム色
            const g = Math.floor(Math.random() * 200 + 55);
            const b = Math.floor(Math.random() * 200 + 55);
            return `${r}, ${g}, ${b}`;
        }
        return '14, 165, 233'; // デフォルト
    }

    // 毎フレーム呼ばれる状態更新関数
    update() {
        this.radius += this.speed;
        
        // スピードが速いほど、透明度の減少（フェードアウト）も早くする
        this.alpha -= (0.01 + this.speed * 0.001);
        if (this.alpha < 0) this.alpha = 0;
    }

    // 描画関数
    draw(ctx) {
        if (this.alpha <= 0) return; // 完全に透明になったら描画しない

        ctx.beginPath();
        // 円を描く (中心x, 中心y, 半径, 開始角, 終了角)
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${this.colorStr}, ${this.alpha})`;
        
        // 波紋が広がるにつれて線も少し太くする効果
        ctx.lineWidth = 1.5 + (this.radius * 0.01);
        ctx.stroke();
    }
}

// 波紋を生成し、音を鳴らす関数
function createRipple(x, y) {
    ripples.push(new Ripple(x, y));
    playWaterDropSound();
}

// ==========================================
// 7. アニメーションループ (毎フレーム実行)
// ==========================================
function animate() {
    // 画面全体をクリアする（半透明の黒で塗りつぶすことで、残像エフェクトを付けることも可能だが、今回はクリアする）
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 全ての波紋を更新して描画
    // 後ろからループを回すことで、途中で要素を削除（splice）しても安全
    for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.update();
        ripple.draw(ctx);

        // 透明になった（見えなくなった）波紋は配列から削除しメモリを解放する
        if (ripple.alpha <= 0) {
            ripples.splice(i, 1);
        }
    }

    requestAnimationFrame(animate); // 次のフレームを描画
}
animate(); // ループ開始

// ==========================================
// 8. イベントリスナーの設定
// ==========================================

// 画面クリック/タップで波紋生成
canvas.addEventListener('mousedown', (e) => {
    createRipple(e.clientX, e.clientY);
});
// モバイル端末でのタップ時、mousedownとtouchstartの重複発火を防ぐため
// `preventDafault`はあえて入れず、touchstart時はmousedownを防がないように配慮しつつ、処理する（今回はmousedown一本化か、両対応が望ましい）
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // デフォルト行動作防ぐ（スクロールなど）
    // マルチタッチ対応 (全指に対して波紋生成)
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        createRipple(touch.clientX, touch.clientY);
    }
}, { passive: false }); // preventDefaultを呼ぶのでpassive:falseが必須

// 自動モード（Auto Rain Mode）の制御
autoModeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        // ONになったら定期的にランダムな場所へ波紋を生成する
        autoModeInterval = setInterval(() => {
            const randomX = Math.random() * canvas.width;
            const randomY = Math.random() * canvas.height;
            createRipple(randomX, randomY);
        }, 800); // 800ミリ秒(0.8秒)間隔
    } else {
        // OFFになったらタイマーを解除
        clearInterval(autoModeInterval);
        autoModeInterval = null;
    }
});

// セキュリティへの配慮（XSS対策）:
// 今回はユーザー入力をそのままDOMに挿入(innerHTML等)する箇所はありません。
// Selectボックス等の値は、内部の定数('cyan', 'random' 等)との比較にのみ使用し、
// DOM操作には textContent や属性の安全な設定のみを用いているため、セキュアな構造となっています。
