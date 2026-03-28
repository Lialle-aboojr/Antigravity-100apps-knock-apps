/**
 * PixelArtEditor - メインスクリプト
 * Vanilla JSのみで実装。依存ライブラリなし。
 */

// ==========================================
// 1. 各種DOM要素の取得と基本的な状態管理
// ==========================================
const canvas = document.getElementById('pixel-canvas');
const ctx = canvas.getContext('2d');

// ツールバーの各種コントロール
const colorPicker = document.getElementById('color-picker');
const sizeSelector = document.getElementById('size-selector');
const btnDraw = document.getElementById('btn-draw');
const btnEraser = document.getElementById('btn-eraser');
const btnUndo = document.getElementById('btn-undo');
const btnClear = document.getElementById('btn-clear');
const btnGridToggle = document.getElementById('btn-grid-toggle');
const btnDownload = document.getElementById('btn-download');

// 表示サイズ（キャンバス自体のピクセル解像度）
const CANVAS_SIZE = 512; 

// 状態変数（アプリケーション全体のデータ）
let gridSize = parseInt(sizeSelector.value, 10); // 現在のマス目の数（16, 32, 64）
let gridData = [];     // 各マス目の色を保持する二次元配列
let undoHistory = [];  // 一手戻る（Undo）ための履歴保持用配列

let isDrawing = false; // 現在マウスドラッグ中かどうか
let currentColor = colorPicker.value;
let currentMode = 'draw'; // 'draw' または 'erase'
let showGrid = true;   // 枠線を重ねて描画するかどうか

// ==========================================
// 2. 初期化処理
// ==========================================

// サイズ調整処理
function initCanvas() {
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  
  // 透明なチェッカーボードが透けるように、背景はクリア（透明）のままにします
  resetGridData();
  undoHistory = []; // リセット時には履歴も消去
  saveHistory();    // 初期状態を履歴の1番目として登録
  drawCanvas();
}

// データ部分をすべてリセット
function resetGridData() {
  gridData = [];
  for (let y = 0; y < gridSize; y++) {
    const row = [];
    for (let x = 0; x < gridSize; x++) {
      row.push(null); // nullは「塗られていない（透明）」を表す
    }
    gridData.push(row);
  }
}

// 二次元配列を深くコピーして履歴に残す
function cloneGridData() {
  return gridData.map(row => [...row]);
}

// ==========================================
// 3. 描画ロジック（コア部分）
// ==========================================

// キャンバスを再描画（グリッドON/OFFやデータの変更時に呼ばれる）
function drawCanvas(forceHideGrid = false) {
  // まずキャンバス全体をクリア（透明にする）
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cellSize = CANVAS_SIZE / gridSize;

  // データに基づいてマスを塗りつぶす
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const color = gridData[y][x];
      // nullなら塗らない（透過）、色があれば塗る
      if (color !== null) {
        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  // 枠線（グリッド）を描画する設定になっていれば、上から線を描画する
  // ※画像のダウンロード時（forceHideGridがtrueの時）は線を描画しない
  if (showGrid && !forceHideGrid) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // 薄い黒色
    ctx.lineWidth = 1;

    for (let i = 0; i <= gridSize; i++) {
        const pos = i * cellSize;
        
        ctx.beginPath();
        // 縦線
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, CANVAS_SIZE);
        // 横線
        ctx.moveTo(0, pos);
        ctx.lineTo(CANVAS_SIZE, pos);
        ctx.stroke();
    }
  }
}

// 履歴に現在の盤面を保存
function saveHistory() {
  undoHistory.push(cloneGridData());
  // メモリ節約のため履歴の上限を50回までに制限（古いものから消す）
  if (undoHistory.length > 50) {
    undoHistory.shift();
  }
}

// ==========================================
// 4. マウス操作と塗り処理関数
// ==========================================

// 座標をマス目のインデックスに変換して色を塗る
function paintCell(event) {
  // マウスの相対座標を取得（CSSで伸縮された場合も考慮してスケールを計算）
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const mouseX = (event.clientX - rect.left) * scaleX;
  const mouseY = (event.clientY - rect.top) * scaleY;

  const cellSize = CANVAS_SIZE / gridSize;

  // 0 から gridSize-1 までのマス目インデックス（x, y）を計算
  const gridX = Math.floor(mouseX / cellSize);
  const gridY = Math.floor(mouseY / cellSize);

  // キャンバスの範囲外なら何もしない
  if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize) return;

  // 現在のモードによって塗りつぶすか、消去する（透明に戻す）か判定
  if (currentMode === 'draw') {
    gridData[gridY][gridX] = currentColor;
  } else if (currentMode === 'erase') {
    gridData[gridY][gridX] = null; // 透明化
  }

  drawCanvas(); // 画面を更新
}

// マウスイベントの登録
canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  paintCell(e); // クリック時にも1マス塗る
});

canvas.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    paintCell(e); // ドラッグ中連続して塗る
  }
});

// マウスを離したとき（または画面外に出たとき）に描画終了とし、履歴へ保存
const stopDrawing = () => {
  if (isDrawing) {
    isDrawing = false;
    saveHistory(); // 描き終わったタイミングで1手分として保存
  }
};

canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

// ==========================================
// 5. ツールバーの操作イベント
// ==========================================

// カラーピッカー色変更
colorPicker.addEventListener('input', (e) => {
  currentColor = e.target.value;
  // 色を変えたら自動的に描画モードに戻す
  currentMode = 'draw';
  btnDraw.classList.add('active');
  btnEraser.classList.remove('active');
});

// 描画モード（ペン）
btnDraw.addEventListener('click', () => {
  currentMode = 'draw';
  btnDraw.classList.add('active');
  btnEraser.classList.remove('active');
});

// 消しゴムモード
btnEraser.addEventListener('click', () => {
  currentMode = 'erase';
  btnEraser.classList.add('active');
  btnDraw.classList.remove('active');
});

// 全消去
btnClear.addEventListener('click', () => {
  if (confirm("キャンバスをすべて消去します。よろしいですか？ / Clear canvas?")) {
    resetGridData();
    saveHistory();
    drawCanvas();
  }
});

// 戻る（Undo）機能
btnUndo.addEventListener('click', () => {
  // 履歴が2つ以上（初期状態を含め）ある場合のみ戻せる
  if (undoHistory.length > 1) {
    undoHistory.pop(); // 現在の状態（最新の履歴）を捨てる
    const previousState = undoHistory[undoHistory.length - 1];
    
    // 1つ前の状態を復元
    gridData = previousState.map(row => [...row]);
    drawCanvas();
  } else {
    // 最初の状態の場合はアラートを出して知らせる（初心者への配慮）
    alert("これ以上戻れません！ / Cannot undo any further.");
  }
});

// グリッド線表示切り替え
btnGridToggle.addEventListener('click', () => {
  showGrid = !showGrid;
  btnGridToggle.innerHTML = showGrid ? `<span class="icon">🔲</span> 枠線 / Grid: ON` : `<span class="icon">⬛</span> 枠線 / Grid: OFF`;
  // ボタン自体のスタイルを変える（少し透過させるなど）
  if (showGrid) {
    btnGridToggle.classList.add('outline');
    btnGridToggle.style.opacity = '1';
  } else {
    btnGridToggle.classList.remove('outline');
    btnGridToggle.style.opacity = '0.6';
  }
  drawCanvas(); // ON/OFFが変わったら再描画
});

// サイズ変更
sizeSelector.addEventListener('change', (e) => {
  if (confirm("サイズを変更するとキャンバスがリセットされます。 / Changing size will clear the canvas. Continue?")) {
    // サニタイズ: ユーザーに直接入力させる場所ではないが念のため数値解析と制限
    let newSize = parseInt(e.target.value, 10);
    if (!isNaN(newSize) && [16, 32, 64].includes(newSize)) {
      gridSize = newSize;
      initCanvas(); // 再初期化
    }
  } else {
    // キャンセルされた場合は選択を元に戻す
    e.target.value = gridSize;
  }
});

// 画像保存（ダウンロード）機能
btnDownload.addEventListener('click', () => {
  // ダウンロード時は「グリッドなし」で再描画する
  drawCanvas(true); 
  
  // キャンバスの中身をPNG形式のデータURLに変換
  // セキュリティ対策: このURL自体はブラウザ内で生成・完結するため安全です
  const dataURL = canvas.toDataURL("image/png");

  // 仮想的なリンク（<a>要素）を作ってクリックさせるハックでダウンロードを実行
  const link = document.createElement("a");
  link.download = `pixelart_${gridSize}x${gridSize}_${new Date().getTime()}.png`;
  link.href = dataURL;
  
  // DOMに追加しなくてもclickメソッドは呼び出せる
  link.click();

  // ダウンロード用の一時的な「グリッドなし」状態から元に戻す
  drawCanvas();
});

// ==========================================
// アプリ起動
// ==========================================
window.onload = initCanvas;
