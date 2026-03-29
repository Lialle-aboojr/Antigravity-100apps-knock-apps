// =======================================================
// Dot Eater Maze - メインスクリプト
// =======================================================

// --- 基本設定とDOM要素の取得 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameClearScreen = document.getElementById('gameClearScreen');

// UIボタン
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const nextRetryBtn = document.getElementById('nextRetryBtn');

// 仮想十字キー（スマホ用）
const btnUp = document.getElementById('btnUp');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const btnDown = document.getElementById('btnDown');

// --- ゲーム定数・変数 ---
const TILE_SIZE = 20; // 1マスのサイズ（px）
const ROWS = 21;      // 縦のマス数 (21 * 20 = 420px)
const COLS = 21;      // 横のマス数

// ゲームの状態管理
let gameState = 'START'; // 'START', 'PLAYING', 'GAMEOVER', 'CLEAR'
let score = 0;
let totalDots = 0;
let animationId;

// プレイヤー設定
let player = {
  x: 0,
  y: 0,
  dirX: 0,
  dirY: 0,
  nextDirX: 0,
  nextDirY: 0,
  speed: 2, // TILE_SIZE(20)を割り切れる数にすること
  radius: 8
};

// エネミー設定
let enemy = {
  x: 0,
  y: 0,
  startX: 0,
  startY: 0,
  dirX: 0,
  dirY: 0,
  speed: 1, // プレイヤーより少し遅い
  powerModeMode: false, // プレイヤーがパワーアップアイテムを取ったか
  powerTimer: 0,        // パワーアップの残り時間
};

// --- キャラクターのドット絵（8-Bit風スプライトデータ / 10x10ドット） ---
// 1 = 描画する, 0 = 透明
const playerSprite = [
  "0000000000",
  "0001111000",
  "0011111110",
  "0111111111",
  "0111100111", // 目
  "1111111111",
  "1111101010", // ギザギザの口
  "1111111111",
  "0111111100", 
  "0011001100"  // 足
];

const enemySprite = [
  "1000000001",
  "0100110010",
  "0111111110",
  "1110011001", // 怒ったツリ目 \ /
  "1101111101", 
  "1111111111",
  "0110110110", // 縦格子の金属ロボット口
  "0111111110",
  "0111001110",
  "1100000011"
];


// --- マップデータ作成 ---
// # : 壁 (Wall)
// . : エサ (Dot)
// O : パワーアップ (Power Pellet)
//   : 何もない道 (Empty)
// P : プレイヤー初期位置
// E : エネミー初期位置
const levelString = [
  "#####################",
  "#.........#.........#",
  "#.###.###.#.###.###.#",
  "#O# #.# #.#.# #.# #O#",
  "#.###.###.#.###.###.#",
  "#...................#",
  "#.###.#.#####.#.###.#",
  "#.....#...#...#.....#",
  "#####.### # ###.#####",
  "    #.#   E   #.#    ",
  "#####.# ##### #.#####",
  "      . #   # .      ",
  "#####.# ##### #.#####",
  "    #.#       #.#    ",
  "#####.#.#####.#.#####",
  "#.........#.........#",
  "#.###.###.#.###.###.#",
  "#O..#.....P.....#..O#",
  "###.#.#.#####.#.#.###",
  "#.....#...#...#.....#",
  "#####################"
];

// 数値配列のマップを保持する変数
let map = [];

// --- ゲームの初期化処理 ---
function initGame() {
  score = 0;
  totalDots = 0;
  scoreDisplay.textContent = score;
  map = [];
  
  enemy.powerModeMode = false;
  enemy.powerTimer = 0;

  // 文字列のマップを数値配列に変換＆初期位置の設定
  for (let r = 0; r < ROWS; r++) {
    let rowArray = [];
    for (let c = 0; c < COLS; c++) {
      let char = levelString[r][c];
      
      if (char === '#') rowArray.push(1); // 壁
      else if (char === '.') {
        rowArray.push(0); // エサ
        totalDots++;
      }
      else if (char === 'O') {
        rowArray.push(2); // パワーアップ
        totalDots++;
      }
      else if (char === 'P') {
        // プレイヤー初期位置
        player.x = c * TILE_SIZE;
        player.y = r * TILE_SIZE;
        player.dirX = 0;
        player.dirY = 0;
        player.nextDirX = 0;
        player.nextDirY = 0;
        rowArray.push(0); // 足元にはエサを置いておく
        totalDots++;
      }
      else if (char === 'E') {
        // エネミー初期位置
        enemy.x = c * TILE_SIZE;
        enemy.y = r * TILE_SIZE;
        enemy.startX = c * TILE_SIZE;
        enemy.startY = r * TILE_SIZE;
        enemy.dirX = 0;
        enemy.dirY = 0;
        rowArray.push(3); // 3 は空の道
      }
      else {
        rowArray.push(3); // 空（スペース等）
      }
    }
    map.push(rowArray);
  }

  // 画面の切り替え
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  gameClearScreen.classList.add('hidden');
  
  gameState = 'PLAYING';
  
  // もし前のアニメーションが残っていればキャンセルして再スタート
  if (animationId) cancelAnimationFrame(animationId);
  gameLoop();
}

// --- コントローラー入力処理 ---
// 進行方向の予約（マス目にピッタリ合った時に方向転換する）
function setNextDirection(dx, dy) {
  if (gameState !== 'PLAYING') return;
  player.nextDirX = dx;
  player.nextDirY = dy;
}

// キーボード操作
document.addEventListener('keydown', (e) => {
  // スクロールを防止する
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
    e.preventDefault();
  }
  if (e.key === 'ArrowUp')    setNextDirection(0, -1);
  if (e.key === 'ArrowDown')  setNextDirection(0, 1);
  if (e.key === 'ArrowLeft')  setNextDirection(-1, 0);
  if (e.key === 'ArrowRight') setNextDirection(1, 0);
});

// スマホ用ボタン操作
function addBtnListener(btn, dx, dy) {
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setNextDirection(dx, dy);
  }, {passive: false});
  btn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    setNextDirection(dx, dy);
  });
}
addBtnListener(btnUp, 0, -1);
addBtnListener(btnDown, 0, 1);
addBtnListener(btnLeft, -1, 0);
addBtnListener(btnRight, 1, 0);

// UIボタンのイベント登録
[startBtn, retryBtn, nextRetryBtn].forEach(btn => {
  btn.addEventListener('click', () => {
    initGame();
  });
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    initGame();
  }, {passive: false});
});


// --- ゲーム内ロジック ---

// 指定座標(col, row)が壁(1)かどうか判定
function isWall(col, row) {
  // 画面外も壁扱いにする
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
  return map[row][col] === 1;
}

// プレイヤーの移動と当たり判定処理
function updatePlayer() {
  // プレイヤーがマス目にピッタリ合っているか確認
  let isAligned = (player.x % TILE_SIZE === 0) && (player.y % TILE_SIZE === 0);

  if (isAligned) {
    let col = player.x / TILE_SIZE;
    let row = player.y / TILE_SIZE;

    // 先行入力された方向（nextDir）へ進めるか確認
    if (!isWall(col + player.nextDirX, row + player.nextDirY)) {
      player.dirX = player.nextDirX;
      player.dirY = player.nextDirY;
    }
    
    // 現在の方向へ進めない場合（壁にぶつかる場合）は停止する
    if (isWall(col + player.dirX, row + player.dirY)) {
      player.dirX = 0;
      player.dirY = 0;
    }
  }

  // 進行方向に合わせて座標を更新
  player.x += player.dirX * player.speed;
  player.y += player.dirY * player.speed;

  // 画面外にハミ出たときのワープ処理（左右のトンネル用）
  if (player.x < 0) player.x = (COLS - 1) * TILE_SIZE;
  if (player.x >= COLS * TILE_SIZE) player.x = 0;

  // エサの取得判定
  let currentCol = Math.floor((player.x + TILE_SIZE / 2) / TILE_SIZE);
  let currentRow = Math.floor((player.y + TILE_SIZE / 2) / TILE_SIZE);
  
  if (currentRow >= 0 && currentRow < ROWS && currentCol >= 0 && currentCol < COLS) {
    let tile = map[currentRow][currentCol];
    
    // 通常エサ(0)
    if (tile === 0) {
      map[currentRow][currentCol] = 3; // 空にする
      score += 10;
      totalDots--;
      scoreDisplay.textContent = score;
    }
    // パワーアップアイテム(2)
    else if (tile === 2) {
      map[currentRow][currentCol] = 3; // 空にする
      score += 50;
      totalDots--;
      scoreDisplay.textContent = score;
      
      // パワーアップモード発動（約500フレーム）
      enemy.powerModeMode = true;
      enemy.powerTimer = 500;
    }
  }

  // 完全クリア判定
  if (totalDots <= 0) {
    gameState = 'CLEAR';
    gameClearScreen.classList.remove('hidden');
  }
}

// エネミーの移動ロジック（簡易AI）
function updateEnemy() {
  // パワーアップの残り時間管理
  if (enemy.powerModeMode) {
    enemy.powerTimer--;
    if (enemy.powerTimer <= 0) {
      enemy.powerModeMode = false;
    }
  }

  // マス目にピッタリ合っている時だけ方向を変える
  let isAligned = (enemy.x % TILE_SIZE === 0) && (enemy.y % TILE_SIZE === 0);

  if (isAligned) {
    let col = enemy.x / TILE_SIZE;
    let row = enemy.y / TILE_SIZE;
    
    // 移動可能な方向のリストを作成
    let validMoves = [];
    let directions = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, 
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
    ];

    directions.forEach(dir => {
      // 逆戻り（Uターン）の禁止措置。
      let isUturn = (dir.dx === -enemy.dirX && dir.dy === -enemy.dirY) && (enemy.dirX !== 0 || enemy.dirY !== 0);
      
      if (!isWall(col + dir.dx, row + dir.dy) && !isUturn) {
        validMoves.push(dir);
      }
    });

    // Uターン以外の道がない場合（行き止まり）は、仕方なくUターンを許可する
    if (validMoves.length === 0) {
      validMoves.push({ dx: -enemy.dirX, dy: -enemy.dirY });
    }

    // プレイヤーへの距離に基づいて選択（簡易追跡アルゴリズム）
    if (validMoves.length > 0) {
      let bestMove = validMoves[0];
      let shortestDistance = Infinity;
      let longestDistance = -Infinity;

      validMoves.forEach(move => {
        // 移動先からプレイヤーまでの距離の二乗を計算
        let targetCol = col + move.dx;
        let targetRow = row + move.dy;
        let playerCol = Math.floor(player.x / TILE_SIZE);
        let playerRow = Math.floor(player.y / TILE_SIZE);
        
        let dist = Math.pow(targetCol - playerCol, 2) + Math.pow(targetRow - playerRow, 2);

        if (enemy.powerModeMode) {
          // パワーモード中は逃げる
          if (dist > longestDistance) {
            longestDistance = dist;
            bestMove = move;
          }
        } else {
          // 通常時は追いかける
          if (dist < shortestDistance) {
            shortestDistance = dist;
            bestMove = move;
          }
        }
      });

      // 単調にならないよう20%の確率で別の道を選ぶ
      if (Math.random() < 0.2 && validMoves.length > 1) {
        bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      }

      enemy.dirX = bestMove.dx;
      enemy.dirY = bestMove.dy;
    }
  }

  // 座標の更新
  enemy.x += enemy.dirX * enemy.speed;
  enemy.y += enemy.dirY * enemy.speed;
}

// キャラクター同士の衝突判定
function checkCollision() {
  // 中心点同士の距離で判定
  let dx = (player.x + TILE_SIZE / 2) - (enemy.x + TILE_SIZE / 2);
  let dy = (player.y + TILE_SIZE / 2) - (enemy.y + TILE_SIZE / 2);
  let distance = Math.sqrt(dx * dx + dy * dy);

  // マスサイズ未満まで近づいていたら接触とみなす
  if (distance < TILE_SIZE / 1.5) {
    if (enemy.powerModeMode) {
      // プレイヤーがエネミーを食べる
      score += 200;
      scoreDisplay.textContent = score;
      // エネミーを初期位置に戻す
      enemy.x = enemy.startX;
      enemy.y = enemy.startY;
      enemy.dirX = 0;
      enemy.dirY = 0;
      enemy.powerModeMode = false;
    } else {
      // ゲームオーバー処理
      gameState = 'GAMEOVER';
      gameOverScreen.classList.remove('hidden');
    }
  }
}

// --- 描画処理 ---

function drawMap() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let tile = map[r][c];
      let px = c * TILE_SIZE;
      let py = r * TILE_SIZE;

      if (tile === 1) {
        // 壁（ネオンブルー）
        ctx.fillStyle = '#1f2833';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        // 壁の境界線を光らせる
        ctx.strokeStyle = '#45a29e';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      } 
      else if (tile === 0) {
        // エサ（小さな四角）
        ctx.fillStyle = '#c5c6c7';
        ctx.fillRect(px + TILE_SIZE/2 - 2, py + TILE_SIZE/2 - 2, 4, 4);
      }
      else if (tile === 2) {
        // パワーアップアイテム（光る円）
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffde59';
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffde59';
        ctx.fill();
        ctx.shadowBlur = 0; 
      }
    }
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x + TILE_SIZE / 2, player.y + TILE_SIZE / 2);

  // 向いている方向に合わせてキャンバスを回転（右向きを基準に設計されたドット絵）
  if (player.dirX === 1) ctx.rotate(0);
  else if (player.dirX === -1) ctx.rotate(Math.PI);
  else if (player.dirY === 1) ctx.rotate(Math.PI / 2);
  else if (player.dirY === -1) ctx.rotate(-Math.PI / 2);

  // 光るネオンブルーのドット絵（エイリアン）
  ctx.fillStyle = '#00ffff';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#00ffff';
  
  // 10x10のドット絵を描画 (TILE_SIZE=20 なので 1ドットは2px)
  let pSize = TILE_SIZE / 10;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (playerSprite[r][c] === '1') {
        // 中心部分(-TILE_SIZE/2)を起点にして描画
        ctx.fillRect(-TILE_SIZE / 2 + c * pSize, -TILE_SIZE / 2 + r * pSize, pSize, pSize);
      }
    }
  }

  ctx.restore(); 
}

function drawEnemy() {
  ctx.save();
  ctx.translate(enemy.x + TILE_SIZE / 2, enemy.y + TILE_SIZE / 2);
  
  // パワーアップ時は青色（点滅）、通常時は赤色（怒ったロボット色）
  let enemyColor = '#ff0000'; // ネオンレッド
  if (enemy.powerModeMode) {
    if (enemy.powerTimer < 100 && Math.floor(enemy.powerTimer / 10) % 2 === 0) {
      enemyColor = '#ffffff';
    } else {
      enemyColor = '#1f51ff'; // ネオンブルー
    }
  }

  ctx.fillStyle = enemyColor;
  ctx.shadowBlur = 10;
  ctx.shadowColor = enemyColor;

  // 10x10のドット絵を描画 (正面向きのロボット)
  let pSize = TILE_SIZE / 10;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (enemySprite[r][c] === '1') {
        ctx.fillRect(-TILE_SIZE / 2 + c * pSize, -TILE_SIZE / 2 + r * pSize, pSize, pSize);
      }
    }
  }

  ctx.restore();
}

// --- メインループ ---
function gameLoop() {
  if (gameState !== 'PLAYING') return;

  // 全体をクリア（残像防止）
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // データ更新
  updatePlayer();
  updateEnemy();
  checkCollision(); // キャラクターの衝突判定

  // 再描画
  drawMap();
  drawPlayer();
  drawEnemy();

  // 次のフレームを要求
  animationId = requestAnimationFrame(gameLoop);
}

// 最初の描画だけ行っておく（背景表示）
map = [];
for (let r = 0; r < ROWS; r++) {
  let rowArray = [];
  for (let c = 0; c < COLS; c++) {
    rowArray.push(levelString[r][c] === '#' ? 1 : 3);
  }
  map.push(rowArray);
}
drawMap();
