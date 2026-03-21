// --- 要素（HTMLの部品）の取得 ---
// idを使ってHTML内の要素を探し、JavaScriptで操作できるようにします
const cube = document.getElementById('cube');
const scene = document.getElementById('scene');
const autoRotateToggle = document.getElementById('autoRotateToggle');
const changeColorBtn = document.getElementById('changeColorBtn');
const faces = document.querySelectorAll('.face');

// --- 状態を管理する変数 ---
let isDragging = false; // ドラッグ中かどうか（マウスや指が押されているか）
let previousMousePosition = { x: 0, y: 0 }; // 前回のマウス位置を記憶する
// キューブの現在の回転角度（X軸とY軸）。初期状態の傾きに合わせています。
let rotation = { x: -20, y: -30 }; 

// --- 初期設定 ---
// ページを開いたときに、自動回転がオンの状態になるように設定します
cube.classList.add('auto-rotate');

// --- 1. 自動回転のトグル（ON/OFF）機能 ---
autoRotateToggle.addEventListener('change', (e) => {
  // e.target.checked で、チェックボックスがON(true)かOFF(false)かを取得できます
  if (e.target.checked) {
    // ONなら 'auto-rotate' というクラス名を追加して、CSSのアニメーションを動かします
    cube.classList.add('auto-rotate');
    // ドラッグ等で手動でつけられた角度を一旦リセットします
    cube.style.transform = ''; 
  } else {
    // OFFならクラス名を取り除いて、自動回転を止めます
    cube.classList.remove('auto-rotate');
    // 止めた瞬間に、手動回転用の角度に戻してその場で止まるように見せます
    updateCubeRotation();
  }
});

// --- 2. カラー変更機能（セキュリティ考慮） ---
changeColorBtn.addEventListener('click', () => {
  // 【セキュリティ（XSS対策）のポイント】
  // ユーザーが入力した文字列をそのまま innerHTML 等で入れると危険です。
  // 今回はあらかじめ安全に用意されたカラーコード（文字列）だけを使い、
  // style を通じて変更するため、悪意あるスクリプトが実行される余地がありません。

  // 落ち着いた無印風のカラーパレット（くすんだパステルカラーやグレー系）
  const colorPalette = [
    'rgba(235, 226, 213, 0.9)', // ベージュ
    'rgba(215, 222, 220, 0.9)', // ライトブルーグレー
    'rgba(224, 215, 218, 0.9)', // ペールピンクグレー
    'rgba(206, 212, 203, 0.9)', // セージグリーン
    'rgba(230, 226, 226, 0.9)', // ライトグレー
    'rgba(200, 200, 205, 0.9)'  // ラベンダーグレー
  ];

  // 6つの面すべて（1〜6）に対して、ランダムで色を割り当てます
  faces.forEach(face => {
    // 0 から パレットの数-1 までのランダムな数字を作ります
    const randomIndex = Math.floor(Math.random() * colorPalette.length);
    // その数字の場所にある色を取り出します
    const newColor = colorPalette[randomIndex];
    
    // 安全に背景色（スタイル）を変更します
    face.style.backgroundColor = newColor;
  });
});

// --- 3. マウス・タッチ操作によるドラッグ回転機能 ---

// キューブの角度を画面（CSS）に反映する関数
function updateCubeRotation() {
  // 自動回転中は手動の角度更新を行わない（衝突を防ぐ）
  if (autoRotateToggle.checked) return;
  
  // 100px奥に配置しつつ（translateZ）、X軸とY軸を回転させます
  // ` （バッククォート）を使ったテンプレートリテラルで、変数${...}を文字の中に埋め込んでいます
  cube.style.transform = `translateZ(-100px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;
}

// ---------------------------
// マウス用のイベント（PC用）
// ---------------------------

// マウスのボタンが押されたとき (mousedown)
scene.addEventListener('mousedown', (e) => {
  if (autoRotateToggle.checked) return; // 自動回転中はドラッグ無効
  isDragging = true;
  // クリックした瞬間の座標を保存します
  previousMousePosition = { x: e.offsetX, y: e.offsetY };
});

// マウスが動いたとき (mousemove)
// documentにつけることで、キューブの外にカーソルが出てもドラッグを続けられます
document.addEventListener('mousemove', (e) => {
  if (!isDragging) return; // ドラッグ中でなければ何もしない

  // 現在のマウスと、直前のマウスとの差（どれくらい動かしたか）を計算します
  const deltaMove = {
    x: e.movementX || 0,
    y: e.movementY || 0
  };

  // 縦の動き(y)は、キューブのX軸回転。横の動き(x)は、キューブのY軸回転として扱います
  // 0.5 を掛けて、回転のスピードを少しマイルドに調整しています
  rotation.x -= deltaMove.y * 0.5;
  rotation.y += deltaMove.x * 0.5;

  // 角度を実際の画面に反映します
  updateCubeRotation();
});

// マウスのボタンが離されたとき (mouseup)
document.addEventListener('mouseup', () => {
  isDragging = false; // ドラッグ終了
});


// ---------------------------
// スマホ（タッチ）用のイベント
// ---------------------------

// 画面に指が触れたとき (touchstart)
scene.addEventListener('touchstart', (e) => {
  if (autoRotateToggle.checked) return; // 自動回転中はスワイプ無効
  isDragging = true;
  // 最初の指（touches[0]）の座標を保存します
  const touch = e.touches[0];
  previousMousePosition = { x: touch.clientX, y: touch.clientY };
}, { passive: false }); // スクロールなどブラウザ標準の動きを止めるために設定します

// 画面上で指が動いたとき (touchmove)
document.addEventListener('touchmove', (e) => {
  if (!isDragging) return;

  const touch = e.touches[0];
  // touchmoveにはマウスのmovementXにあたるものがないので、自分で差を計算します
  const deltaMove = {
    x: touch.clientX - previousMousePosition.x,
    y: touch.clientY - previousMousePosition.y
  };

  rotation.x -= deltaMove.y * 0.5;
  rotation.y += deltaMove.x * 0.5;

  updateCubeRotation();

  // 現在の座標を「前回の座標」として新しく更新します
  previousMousePosition = { x: touch.clientX, y: touch.clientY };

  // 画面が一緒にスクロールしないようにブロックします
  e.preventDefault();
}, { passive: false });

// 画面から指が離れたとき (touchend)
document.addEventListener('touchend', () => {
  isDragging = false; // ドラッグ終了
});
