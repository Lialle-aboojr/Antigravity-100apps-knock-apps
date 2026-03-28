/**
 * PixelArtEditor - 追加機能（塗りつぶし、画像インポート、背景色）対応版
 * Vanilla JSのみで実装。依存ライブラリなし。
 */

// ==========================================
// 1. 各種DOM要素の取得と基本的な状態管理
// ==========================================
const canvas = document.getElementById('pixel-canvas');
const ctx = canvas.getContext('2d');

// ツールバーのコントロール群
const colorPicker = document.getElementById('color-picker');
const sizeSelector = document.getElementById('size-selector');
const btnDraw = document.getElementById('btn-draw');
const btnFill = document.getElementById('btn-fill'); // 追加: 塗りつぶしボタン
const btnEraser = document.getElementById('btn-eraser');
const btnUndo = document.getElementById('btn-undo');
const btnClear = document.getElementById('btn-clear');
const btnGridToggle = document.getElementById('btn-grid-toggle');
const btnDownload = document.getElementById('btn-download');

// 背景設定用コントロール
const chkTransparent = document.getElementById('chk-transparent');
const customBgGroup = document.getElementById('custom-bg-group');
const bgColorPicker = document.getElementById('bg-color-picker');

// インポート用コントロール
const fileImport = document.getElementById('file-import');

// 表示サイズ（キャンバス自体のピクセル解像度）
const CANVAS_SIZE = 512; 

// 状態変数
let gridSize = parseInt(sizeSelector.value, 10);
let gridData = [];
let undoHistory = [];
let isDrawing = false;
let currentColor = colorPicker.value;
let currentMode = 'draw'; // 'draw', 'erase', or 'fill'
let showGrid = true;

// ==========================================
// 2. 初期化処理
// ==========================================
function initCanvas() {
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  
  resetGridData();
  undoHistory = [];
  saveHistory();
  drawCanvas();
}

function resetGridData() {
  gridData = [];
  for (let y = 0; y < gridSize; y++) {
    const row = [];
    for (let x = 0; x < gridSize; x++) {
      row.push(null); // nullは塗られていない（透明）
    }
    gridData.push(row);
  }
}

function cloneGridData() {
  return gridData.map(row => [...row]);
}

// ==========================================
// 3. 描画ロジック（コア部分）
// ==========================================
function drawCanvas(forceHideGrid = false) {
  // ① まず全体をクリア（透過）
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ② もし背景色が「単色塗り」なら、設定色で背景全体を塗りつぶす
  if (!chkTransparent.checked) {
    ctx.fillStyle = bgColorPicker.value;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const cellSize = CANVAS_SIZE / gridSize;

  // ③ ユーザーが描いたドット絵のピクセルを描画
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const color = gridData[y][x];
      if (color !== null) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x * cellSize), Math.floor(y * cellSize), Math.ceil(cellSize), Math.ceil(cellSize));
        // マスの境界線のアンチエイリアスによる隙間を防ぐために floor と ceil を利用
      }
    }
  }

  // ④ グリッド線の描画（設定時、かつ保存時でない場合）
  if (showGrid && !forceHideGrid) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'; // 邪魔にならない半透明グレー
    ctx.lineWidth = 1;

    for (let i = 0; i <= gridSize; i++) {
        const pos = Math.floor(i * cellSize) + 0.5; // +0.5で線をシャープにするハック
        
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, CANVAS_SIZE);
        ctx.moveTo(0, pos);
        ctx.lineTo(CANVAS_SIZE, pos);
        ctx.stroke();
    }
  }
}

function saveHistory() {
  undoHistory.push(cloneGridData());
  if (undoHistory.length > 50) {
    undoHistory.shift();
  }
}

// ==========================================
// 4. マウス操作・塗りつぶし・塗り処理関数
// ==========================================
function paintCell(event) {
  // CSSのスケールを考慮して座標計算
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const mouseX = (event.clientX - rect.left) * scaleX;
  const mouseY = (event.clientY - rect.top) * scaleY;

  const cellSize = CANVAS_SIZE / gridSize;
  const gridX = Math.floor(mouseX / cellSize);
  const gridY = Math.floor(mouseY / cellSize);

  if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize) return;

  if (currentMode === 'draw') {
    gridData[gridY][gridX] = currentColor;
    drawCanvas();
  } else if (currentMode === 'erase') {
    gridData[gridY][gridX] = null;
    drawCanvas();
  } else if (currentMode === 'fill') {
    // 塗りつぶしの場合は、クリックした一度だけ発動させるため isDrawing フラグを無視する
    const targetColor = gridData[gridY][gridX];
    if (targetColor !== currentColor) {
      floodFill(gridX, gridY, targetColor, currentColor);
      drawCanvas();
    }
  }
}

// Flood Fill アルゴリズムの実装
function floodFill(startX, startY, targetColor, replacementColor) {
  const stack = [[startX, startY]];
  
  while (stack.length > 0) {
    const [x, y] = stack.pop();

    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;
    if (gridData[y][x] === targetColor) {
      gridData[y][x] = replacementColor;
      
      stack.push([x + 1, y]); // 右
      stack.push([x - 1, y]); // 左
      stack.push([x, y + 1]); // 下
      stack.push([x, y - 1]); // 上
    }
  }
}

// イベントリスナー
canvas.addEventListener('mousedown', (e) => {
  if (currentMode === 'fill') {
    // 塗りつぶしモードの場合は、最初のクリック時のみ動作し、ドラッグは無効化する
    paintCell(e);
    saveHistory(); // 塗りつぶし完了時に即保存
  } else {
    isDrawing = true;
    paintCell(e);
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isDrawing && currentMode !== 'fill') {
    paintCell(e);
  }
});

const stopDrawing = () => {
  if (isDrawing && currentMode !== 'fill') {
    isDrawing = false;
    saveHistory();
  }
};

canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

// ==========================================
// 5. ツールバーの操作イベント
// ==========================================

// --- モード切替UIの制御用ヘルパー ---
function setActiveModeButton(activeBtnId) {
  [btnDraw, btnFill, btnEraser].forEach(btn => btn.classList.remove('active'));
  document.getElementById(activeBtnId).classList.add('active');
}

// ペン色
colorPicker.addEventListener('input', (e) => {
  currentColor = e.target.value;
  // ペンモードに戻す
  currentMode = 'draw';
  setActiveModeButton('btn-draw');
});

// モード切替イベント
btnDraw.addEventListener('click', () => {
  currentMode = 'draw';
  setActiveModeButton('btn-draw');
});
btnFill.addEventListener('click', () => {
  currentMode = 'fill';
  setActiveModeButton('btn-fill');
});
btnEraser.addEventListener('click', () => {
  currentMode = 'erase';
  setActiveModeButton('btn-eraser');
});

// 全消去
btnClear.addEventListener('click', () => {
  if (confirm("キャンバスをすべて消去します。よろしいですか？ / Clear canvas?")) {
    resetGridData();
    saveHistory();
    drawCanvas();
  }
});

// 戻る（Undo）
btnUndo.addEventListener('click', () => {
  if (undoHistory.length > 1) {
    undoHistory.pop();
    const previousState = undoHistory[undoHistory.length - 1];
    gridData = previousState.map(row => [...row]);
    drawCanvas();
  } else {
    alert("これ以上戻れません！ / Cannot undo any further.");
  }
});

// グリッドトグル
btnGridToggle.addEventListener('click', () => {
  showGrid = !showGrid;
  const textSpan = btnGridToggle.querySelector('.grid-btn-text');
  if (textSpan) {
    btnGridToggle.innerHTML = showGrid ? `<span class="icon">🔲</span> <span class="btn-text grid-btn-text">枠線 / Grid: ON</span>` : `<span class="icon">⬛</span> <span class="btn-text grid-btn-text">枠線 / Grid: OFF</span>`;
  }
  
  if (showGrid) {
    btnGridToggle.classList.add('outline');
    btnGridToggle.style.opacity = '1';
  } else {
    btnGridToggle.classList.remove('outline');
    btnGridToggle.style.opacity = '0.6';
  }
  drawCanvas();
});

// サイズ変更
sizeSelector.addEventListener('change', (e) => {
  if (confirm("サイズを変更するとキャンバスがリセットされます。 / Canvas will be reset. Continue?")) {
    let newSize = parseInt(e.target.value, 10);
    if (!isNaN(newSize) && [16, 32, 64].includes(newSize)) {
      gridSize = newSize;
      initCanvas();
    }
  } else {
    e.target.value = gridSize;
  }
});

// 背景色の設定切り替え
chkTransparent.addEventListener('change', (e) => {
  if (e.target.checked) {
    customBgGroup.style.display = 'none';
  } else {
    customBgGroup.style.display = 'flex';
  }
  drawCanvas();
});
bgColorPicker.addEventListener('input', () => {
  drawCanvas();
});

// 画像保存 (ダウンロード)
btnDownload.addEventListener('click', () => {
  drawCanvas(true); // グリッドなしで描画
  const dataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = `pixelart_${gridSize}x${gridSize}_${new Date().getTime()}.png`;
  link.href = dataURL;
  link.click();
  drawCanvas(); // 状態を元に戻す
});

// ==========================================
// 6. 画像インポート（モザイク化）機能
// ==========================================
function rgbToHex(r, g, b) {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

fileImport.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      // 内部メモリ上にオフスクリーンキャンバスを用意
      const offCanvas = document.createElement('canvas');
      offCanvas.width = gridSize;
      offCanvas.height = gridSize;
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

      // 画像を縮小して書き込む（ブラウザのモザイク化）
      offCtx.drawImage(img, 0, 0, gridSize, gridSize);

      // ピクセルデータ（RGBA情報）を抽出
      const imageData = offCtx.getImageData(0, 0, gridSize, gridSize).data;

      // gridData配列に色コードを上書き
      let i = 0;
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          if (a < 128) {
            gridData[y][x] = null;
          } else {
            gridData[y][x] = rgbToHex(r, g, b);
          }
          i += 4;
        }
      }

      saveHistory();
      drawCanvas();
      fileImport.value = '';
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});


// ==========================================
// アプリ起動
// ==========================================
window.onload = initCanvas;
