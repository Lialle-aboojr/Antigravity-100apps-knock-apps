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
  radius: 8,
  mouthOpen: 0, // 口の開閉アニメーション用
  mouthDir: 1,
};

// エネミー（お邪魔キャラ）設定
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

// スマホ用ボタン操作（touchstartで反応を良くし、mousedownもフォールバックとして追加）
function addBtnListener(btn, dx, dy) {
  // タッチ操作時
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // デフォルトのスクロールなどを防ぐ
    setNextDirection(dx, dy);
  }, {passive: false});
  // マウス操作時
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
  // 画面外も壁扱いにする（ワープ用トンネルを作る場合はここで調整）
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
      // 捕食モードになったらおばけのスピードを遅くしてあげると遊びやすい（今回はそのままの速度）
    }
  }

  // 完全クリア判定
  if (totalDots <= 0) {
    gameState = 'CLEAR';
    gameClearScreen.classList.remove('hidden');
  }

  // パックマンの口パクアニメーション値の更新
  if (player.dirX !== 0 || player.dirY !== 0) {
    player.mouthOpen += 0.05 * player.mouthDir;
    if (player.mouthOpen > 0.3 || player.mouthOpen < 0) {
      player.mouthDir *= -1; // 限界まできたら逆に動かす
    }
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
      // 逆戻り（Uターン）の禁止措置。ただし壁に挟まれて動けない場合は許可。
      // 現在動いている方向（enemy.dirX, enemy.dirY）と真逆かを判定
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
        
        // 距離の二乗（三平方の定理のルート無し版）
        let dist = Math.pow(targetCol - playerCol, 2) + Math.pow(targetRow - playerRow, 2);

        if (enemy.powerModeMode) {
          // パワーモード中は逃げる（距離が一番遠くなる道を選ぶ）
          if (dist > longestDistance) {
            longestDistance = dist;
            bestMove = move;
          }
        } else {
          // 通常時は追いかける（距離が一番短くなる道を選ぶ）
          if (dist < shortestDistance) {
            shortestDistance = dist;
            bestMove = move;
          }
        }
      });

      // ランダム性も少し加えて単調になりすぎないようにする（20%の確率で別の道を選ぶ）
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
      enemy.powerModeMode = false; // 食べたら効果終了とするか、時間まで続くかは自由（今回は効果時間継続）
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
        // 光彩効果
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffde59';
        ctx.fill();
        ctx.shadowBlur = 0; // リセット
      }
    }
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x + TILE_SIZE / 2, player.y + TILE_SIZE / 2);

  // 向いている方向に合わせてキャンバスを回転させる
  if (player.dirX === 1) ctx.rotate(0);                 // 右
  else if (player.dirX === -1) ctx.rotate(Math.PI);     // 左
  else if (player.dirY === 1) ctx.rotate(Math.PI / 2);  // 下
  else if (player.dirY === -1) ctx.rotate(-Math.PI / 2);// 上

  // パックマン風キャラの描画（円弧で口の開閉を表現）
  let openMouthAngle = player.mouthOpen * Math.PI; // 0 ～ 0.3π ほど
  ctx.beginPath();
  // 右向きを基準として arc(x, y, radius, startAngle, endAngle)
  ctx.arc(0, 0, player.radius, openMouthAngle, Math.PI * 2 - openMouthAngle);
  ctx.lineTo(0, 0); // 中心に戻って扇形にする
  ctx.closePath();
  
  ctx.fillStyle = '#ffde59';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#ffde59';
  ctx.fill();

  ctx.restore(); // 回転と光彩をリセット
  ctx.shadowBlur = 0;
}

function drawEnemy() {
  let cx = enemy.x + TILE_SIZE / 2;
  let cy = enemy.y + TILE_SIZE / 2;
  let radius = Math.floor(TILE_SIZE / 2) - 2;

  ctx.save();
  // パワーアップ時は青色（点滅）、通常時はピンク色に
  let enemyColor = '#ff4b4b'; // ネオンピンク
  if (enemy.powerModeMode) {
    // 残り時間が少ない時は白と青で点滅してピンチを知らせる
    if (enemy.powerTimer < 100 && Math.floor(enemy.powerTimer / 10) % 2 === 0) {
      enemyColor = '#ffffff';
    } else {
      enemyColor = '#1f51ff'; // ネオンブルー
    }
  }

  ctx.fillStyle = enemyColor;
  ctx.shadowBlur = 15;
  ctx.shadowColor = enemyColor;

  // エネミー（オバケ風）のシルエット描画
  ctx.beginPath();
  // 上半分の半円
  ctx.arc(cx, cy, radius, Math.PI, 0);
  // 下半分のヒラヒラ
  ctx.lineTo(cx + radius, cy + radius);
  ctx.lineTo(cx + radius / 2, cy + radius - 3);
  ctx.lineTo(cx, cy + radius);
  ctx.lineTo(cx - radius / 2, cy + radius - 3);
  ctx.lineTo(cx - radius, cy + radius);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;

  // 目玉の描画
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 2, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 3, cy - 2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  
  // 黒目（向いている方向に応じて少しズラす）
  ctx.fillStyle = '#000';
  let eyeDx = enemy.dirX * 1;
  let eyeDy = enemy.dirY * 1;
  ctx.beginPath();
  ctx.arc(cx - 3 + eyeDx, cy - 2 + eyeDy, 1, 0, Math.PI * 2);
  ctx.arc(cx + 3 + eyeDx, cy - 2 + eyeDy, 1, 0, Math.PI * 2);
  ctx.fill();

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
// 空のダミーを描画するためレベルストリングだけ解析
for (let r = 0; r < ROWS; r++) {
  let rowArray = [];
  for (let c = 0; c < COLS; c++) {
    rowArray.push(levelString[r][c] === '#' ? 1 : 3);
  }
  map.push(rowArray);
}
drawMap();
