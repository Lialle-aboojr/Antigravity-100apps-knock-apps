// キャンバスとコンテキストの取得
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI要素の取得
const overlayText = document.getElementById('overlay-text');
const scoreTableHeaders = document.getElementById('frame-headers');
const scoreTableRolls = document.getElementById('roll-scores');
const scoreTableTotals = document.getElementById('frame-totals');
const totalScoreDisplay = document.getElementById('total-score-display');
const highScoreDisplay = document.getElementById('high-score-display');

// ゲーム状態定数
const STATE_ANGLE = 'ANGLE';       // 角度決定中
const STATE_POWER = 'POWER';       // パワー決定中（長押し）
const STATE_ROLLING = 'ROLLING';     // 投球中（ボールが転がっている）
const STATE_PHYSICS = 'PHYSICS';     // ピンとの衝突・物理演算中
const STATE_EVALUATE = 'EVALUATE';   // 物理演算終了・スコア計算中
const STATE_GAME_OVER = 'GAME_OVER'; // ゲーム終了

// ===== ゲームのグローバル変数 =====
let currentState = STATE_ANGLE;
let frames = [];         // 10フレーム分のスコアデータ
let currentFrame = 0;    // 現在のフレーム (0-9)
let isFirstRollInfoFrame = true; // フレーム内の1投目かどうか

// ターゲット(矢印)パラメータ
let targetAngle = 0;
let angleDirection = 1;

// パワーメータパラメータ
let power = 0;
let powerDirection = 1;
let isHoldingInfo = false;

// ボールパラメータ
const ballRadius = 12;
let ball = { x: 400, y: 550, vx: 0, vy: 0, r: ballRadius, knocked: false };

// カーブ(曲がり)の影響量（ユーザー入力）
let leftDown = false;
let rightDown = false;

// ピンパラメータ
const pinRadius = 10;
let pins = [];

// スコア関連
let cumulativeScores = [];

// ローカルストレージキー（ハイスコア保存用）
const HI_SCORE_KEY = 'retro_bowling_hi_score_100knocks';

// ===== 初期化処理 =====

// ハイスコア読み込み
function loadHighScore() {
  const saved = localStorage.getItem(HI_SCORE_KEY);
  if (saved) {
    highScoreDisplay.textContent = `HI-SCORE: ${saved}`;
    return parseInt(saved, 10);
  }
  return 0;
}

// ハイスコア保存
function saveHighScore(score) {
  const currentHi = loadHighScore();
  if (score > currentHi) {
    localStorage.setItem(HI_SCORE_KEY, score);
    highScoreDisplay.textContent = `HI-SCORE: ${score}`;
  }
}

// フレームデータとスコアボードの初期化
function initScoreboard() {
  frames = [];
  for (let i = 0; i < 10; i++) {
    frames.push({ rolls: [], score: 0 });
  }
  currentFrame = 0;
  isFirstRollInfoFrame = true;
  cumulativeScores = new Array(10).fill(0);
  renderScoreboardUI();
}

// ボウリングピンの配置 (三角形)
function initPins() {
  pins = [];
  const startX = 400;  // 画面中央
  const headY = 220;   // 先頭ピンのY座標 (上の方)
  const ySpace = 30;   // 縦間隔
  const xSpace = 34;   // 横間隔
  
  // y座標が小さいほど画面上部、大きいほど下部 (投球は下から上へ)
  // 1列目 (一番手前＝最下段)
  pins.push(createPin(startX, headY));
  // 2列目
  pins.push(createPin(startX - xSpace/2, headY - ySpace));
  pins.push(createPin(startX + xSpace/2, headY - ySpace));
  // 3列目
  pins.push(createPin(startX - xSpace, headY - ySpace*2));
  pins.push(createPin(startX, headY - ySpace*2));
  pins.push(createPin(startX + xSpace, headY - ySpace*2));
  // 4列目 (一番奥)
  pins.push(createPin(startX - xSpace*1.5, headY - ySpace*3));
  pins.push(createPin(startX - xSpace*0.5, headY - ySpace*3));
  pins.push(createPin(startX + xSpace*0.5, headY - ySpace*3));
  pins.push(createPin(startX + xSpace*1.5, headY - ySpace*3));
}

function createPin(x, y) {
  // vx, vyは衝突後の速度、knockedは倒れたかのフラグ
  return { id: Math.random(), x: x, y: y, originalX: x, originalY: y, vx: 0, vy: 0, r: pinRadius, knocked: false };
}

// 倒れたピンを取り除く (2投目開始時)
function clearKnockedPins() {
  pins = pins.filter(p => !p.knocked);
}

// 次のフレームまたは投球への準備
function resetForNextRoll() {
  ball = { x: 400, y: 550, vx: 0, vy: 0, r: ballRadius, knocked: false };
  targetAngle = 0;
  power = 0;
  currentState = STATE_ANGLE;
}

// ゲームリセット(全体)
function startNewGame() {
  initScoreboard();
  initPins();
  resetForNextRoll();
  loadHighScore();
  hideOverlay();
  currentState = STATE_ANGLE;
}


// ===== 入力処理 (イベントリスナー) =====

// PC/スマホ共通：投球アクションのハンドラー（スペースキーから呼ばれる）
function handleActionDown() {
  if (currentState === STATE_GAME_OVER) {
    startNewGame();
    return;
  }
  
  if (currentState === STATE_ANGLE) {
    // 角度決定 -> パワー設定へ移行
    isHoldingInfo = true;
    currentState = STATE_POWER;
  }
}

function handleActionUp() {
  if (currentState === STATE_POWER && isHoldingInfo) {
    // パワー決定 -> ボール発射
    isHoldingInfo = false;
    launchBall();
  }
}

// PC用キーボード操作
window.addEventListener('keydown', (e) => {
  // 投球アクション: スペースキー
  if (e.code === 'Space') {
    e.preventDefault(); // 画面スクロール防止
    handleActionDown();
  }
  // カーブ操作: 左右矢印キー
  if (e.code === 'ArrowLeft') leftDown = true;
  if (e.code === 'ArrowRight') rightDown = true;
});

window.addEventListener('keyup', (e) => {
  // 投球アクション離す: スペースキー
  if (e.code === 'Space') {
    e.preventDefault();
    handleActionUp();
  }
  // カーブ操作解除
  if (e.code === 'ArrowLeft') leftDown = false;
  if (e.code === 'ArrowRight') rightDown = false;
});

// 変更箇所: スマホ操作時のカーブ制御における画面揺れ（横スワイプ、スクロール等）完全防止
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault(); // タップによるブラウザの標準挙動を完全にブロック
  if (currentState === STATE_ROLLING) {
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const canvasHalfWidth = rect.width / 2;
    if (touchX < canvasHalfWidth) {
      leftDown = true; rightDown = false;
    } else {
      leftDown = false; rightDown = true;
    }
  }
}, { passive: false }); // スクロールブロックのためには必須

canvas.addEventListener('touchmove', (e) => { 
  e.preventDefault(); // スワイプしてもスクロールしないようにする
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  e.preventDefault(); // 予期せぬ挙動をブロック
  if (currentState === STATE_ROLLING) {
    leftDown = false;
    rightDown = false;
  }
}, { passive: false });

function launchBall() {
  // 最大パワー時 vy は約 -12
  const maxVy = -12;
  const speed = (power / 100) * (maxVy + 4) - 4; // パワー0%でも多少飛ぶ(-4)
  
  // 角度に基づくx方向の初速
  // 角度は -45度 〜 45度
  const angleRad = targetAngle * Math.PI / 180;
  ball.vx = Math.sin(angleRad) * Math.abs(speed);
  ball.vy = Math.cos(angleRad) * speed; // speedは負なのでcos掛けても上方向
  
  currentState = STATE_ROLLING;
}


// ===== メインゲームループ =====

function update() {
  // 1. 角度バーのアニメーション
  if (currentState === STATE_ANGLE) {
    targetAngle += angleDirection * 2;
    if (targetAngle > 45) { targetAngle = 45; angleDirection = -1; }
    if (targetAngle < -45) { targetAngle = -45; angleDirection = 1; }
  }
  
  // 2. パワーバーのアニメーション
  if (currentState === STATE_POWER) {
    power += powerDirection * 3;
    if (power > 100) { power = 100; powerDirection = -1; }
    if (power < 0) { power = 0; powerDirection = 1; }
  }
  
  // 3. ボールの移動とカーブ制御
  if (currentState === STATE_ROLLING) {
    // カーブ影響
    if (leftDown) ball.vx -= 0.1;
    if (rightDown) ball.vx += 0.1;
    
    // ボール移動
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    // ガター（壁）の判定。両端からちょっと余裕をもたせる
    if (ball.x < 50) { ball.x = 50; ball.vx *= -0.5; /* ガター落ちとして反射を弱く */ }
    if (ball.x > canvas.width - 50) { ball.x = canvas.width - 50; ball.vx *= -0.5; }
    
    // 奥の壁（ピンより奥）に到達したら判定フェーズへ
    if (ball.y < 50) {
      currentState = STATE_PHYSICS;
      // 何フレームか物理演算を回して結果を待つタイマーをセット
      setTimeout(() => {
        currentState = STATE_EVALUATE;
      }, 1500); // 1.5秒待機
    }
  }
  
  // 4. ボールとピン、ピン同士の物理挙動
  if (currentState === STATE_ROLLING || currentState === STATE_PHYSICS) {
    // 物理演算（ボールがピンより奥に行っても、ピン同士の衝突は継続）
    updatePhysics();
  }
  
  // 5. スコア計算フェーズ
  if (currentState === STATE_EVALUATE) {
    processTurnResult();
  }
}


// ===== 物理演算 (簡易衝突モデル) =====

function updatePhysics() {
  // 摩擦で速度減衰（ピンのみ）
  for (let i = 0; i < pins.length; i++) {
    let p = pins[i];
    if (p.knocked) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      
      // 壁で跳ね返る
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0) p.vy *= -1;
    }
  }

  // ボールとピンの衝突
  if (currentState === STATE_ROLLING) {
    for (let i = 0; i < pins.length; i++) {
      let p = pins[i];
      if (!p.knocked) {
        if (circleIntersect(ball, p)) {
          resolveCollision(ball, p);
          p.knocked = true; // ボールが当たったら倒れる
        }
      }
    }
  }

  // ピン同士の衝突判定
  for (let i = 0; i < pins.length; i++) {
    for (let j = i + 1; j < pins.length; j++) {
      let p1 = pins[i];
      let p2 = pins[j];
      
      if (circleIntersect(p1, p2)) {
        resolveCollision(p1, p2);
        // どちらかが動いていれば（倒れていれば）、もう一方も倒れる
        if (p1.knocked || p2.knocked) {
          p1.knocked = true;
          p2.knocked = true;
        }
      }
    }
  }
}

// 円と円の衝突判定
function circleIntersect(c1, c2) {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (c1.r + c2.r);
}

// シンプルな弾性衝突反発
function resolveCollision(c1, c2) {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance === 0) return;
  
  // 衝突法線ベクトル
  const nx = dx / distance;
  const ny = dy / distance;
  
  // 相対速度
  const dvx = c2.vx - c1.vx;
  const dvy = c2.vy - c1.vy;
  
  // 法線方向の相対速度
  const relativeVelocity = dvx * nx + dvy * ny;
  if (relativeVelocity > 0) return; // 遠ざかりつつある場合は何もしない
  
  // 反発係数 (1なら完全弾性, やや重みのあるボウリングなので0.8程度)
  const restitution = 0.8;
  
  // 簡易的に重さが同じと仮定して、力（Impulse）を分配
  // (ボールとピンの重さの差は厳密に計算すると複雑になるため、初心者向けに簡易的な作用反作用とする)
  const c1Mass = c1.id === undefined ? 3 : 1; // ボールは重く(質量3)、ピンは軽く(質量1)設定
  const c2Mass = c2.id === undefined ? 3 : 1;
  const totalMass = c1Mass + c2Mass;
  
  const impulse = -(1 + restitution) * relativeVelocity / ((1/c1Mass) + (1/c2Mass));
  
  // 速度変更
  c1.vx -= (impulse * nx) / c1Mass;
  c1.vy -= (impulse * ny) / c1Mass;
  
  c2.vx += (impulse * nx) / c2Mass;
  c2.vy += (impulse * ny) / c2Mass;
  
  //めり込み解消(Position Correction)
  const percent = 0.5;
  const slop = 0.01;
  const penetration = (c1.r + c2.r) - distance;
  if(penetration > slop){
      const correctionMag = (penetration / ((1/c1Mass) + (1/c2Mass))) * percent;
      const cx = nx * correctionMag;
      const cy = ny * correctionMag;
      
      c1.x -= cx / c1Mass; c1.y -= cy / c1Mass;
      c2.x += cx / c2Mass; c2.y += cy / c2Mass;
  }
}


// ===== ボウリングスコア計算ロジック =====

function processTurnResult() {
  // 倒れたピンの数を数える
  let knockedCount = pins.filter(p => p.knocked).length;
  // この投球で新しく倒れた数 = 全部のknocked数 - 既に前回倒れていた分
  // 実装上はフレーム内で clearKnockedPins() を呼ぶため、画面上の knockedCount そのものが今回のスコアとなる
  
  const scoreThisRoll = knockedCount;
  const f = frames[currentFrame];
  
  f.rolls.push(scoreThisRoll);
  
  // 演出用
  if (scoreThisRoll === 10 && f.rolls.length === 1) {
    showOverlay("STRIKE!", true);
  } else if (f.rolls.length === 2 && f.rolls[0] + f.rolls[1] === 10) {
    showOverlay("SPARE!", true);
  }
  
  // 1〜9フレーム目の処理
  if (currentFrame < 9) {
    if (f.rolls.length === 1 && scoreThisRoll === 10) {
      // ストライク: 次のフレームへ
      nextFrame();
    } else if (f.rolls.length === 2) {
      // 2投終わったら次のフレームへ
      nextFrame();
    } else {
      // 1投目（非ストライク）: ピンを片付けて2投目へ
      clearKnockedPins();
      resetForNextRoll();
    }
  } 
  // 10フレーム目の特殊な処理 (最大3回投げる)
  else {
    if (f.rolls.length === 1) {
      // 1投目
      if (scoreThisRoll === 10) {
        initPins(); // ストライクならピンをフルリセットして次へ
      } else {
        clearKnockedPins(); // ピンを残して次
      }
      resetForNextRoll();
    } else if (f.rolls.length === 2) {
      // 2投目
      if (f.rolls[0] + f.rolls[1] >= 10) { // ストライクまたはスペアの場合
        if (f.rolls[0] + f.rolls[1] === 10 && f.rolls[0] !== 10) {
          // ちょうどスペアだった場合、ピンフルリセット
          initPins();
        } else if (f.rolls[0] === 10 && f.rolls[1] === 10) {
          // 2連続ストライクの場合、ピンフルセット
          initPins();
        } else if (f.rolls[0] === 10 && f.rolls[1] < 10) {
           // 1投目ストライク、2投目倒しきれず -> 残ったピンで3投目
           clearKnockedPins();
        }
        resetForNextRoll(); // 3投目ができる
      } else {
        // スペシャルボーナスが無ければゲーム終了
        endGame();
      }
    } else if (f.rolls.length === 3) {
      // 3投終了でゲーム終了
      endGame();
    }
  }

  calculateTotalScores();
  renderScoreboardUI();
}

function nextFrame() {
  currentFrame++;
  initPins(); // 新しいフレームはピンをリセット
  resetForNextRoll();
}

function endGame() {
  calculateTotalScores();
  renderScoreboardUI();
  currentState = STATE_GAME_OVER;
  
  const finalScore = cumulativeScores[9] || 0;
  // スペースキーでもリスタートできるよう、表示を変更
  showOverlay(`GAME OVER<br>SCORE: ${finalScore}<br><span style="font-size:24px">Press SPACE to Restart</span>`, false);
  saveHighScore(finalScore);
}

// 過去すべてのフレームのスコアを再計算(ボウリングの特殊ルール)
function calculateTotalScores() {
  let runTotal = 0;
  
  // ロールデータを1次元配列に平坦化して、ストライク/スペアのボーナス計算をしやすくする
  // 同時に、各フレームが参照すべき「次のロール」のインデックスを管理
  for (let i = 0; i < 10; i++) {
    const frame = frames[i];
    if (frame.rolls.length === 0) continue;
    
    let frameScore = 0;
    
    // 10フレーム目以外
    if (i < 9) {
      const roll1 = frame.rolls[0];
      if (roll1 === 10) {
        // ストライク: 10 + 次の2投
        frameScore = 10 + getNextRollsData(i, 2);
      } else if (frame.rolls.length === 2 && roll1 + frame.rolls[1] === 10) {
        // スペア: 10 + 次の1投
        frameScore = 10 + getNextRollsData(i, 1);
      } else {
        // オープン: 自フレームの合計
        frameScore = roll1 + (frame.rolls[1] || 0);
      }
    } 
    // 10フレーム目（ボーナスは加算せず、単に投球スコアを合計するルール）
    else {
      frameScore = (frame.rolls[0] || 0) + (frame.rolls[1] || 0) + (frame.rolls[2] || 0);
    }
    
    runTotal += frameScore;
    cumulativeScores[i] = runTotal;
    frame.score = frameScore;
  }
}

// 特定フレーム以降のN回分の投球スコアを取得（ストライク/スペアボーナス計算用補助関数）
function getNextRollsData(frameIndex, count) {
  let nextRolls = [];
  for (let j = frameIndex + 1; j < 10; j++) {
    if (frames[j].rolls.length > 0) nextRolls.push(frames[j].rolls[0]);
    if (frames[j].rolls.length > 1) nextRolls.push(frames[j].rolls[1]);
    if (frames[j].rolls.length > 2) nextRolls.push(frames[j].rolls[2]); // 10フレーム目用
  }
  // 要求された投球数がまだ達していなければ、現状で取れる分だけ（ゲーム進行中対策）
  let total = 0;
  for (let k = 0; k < count && k < nextRolls.length; k++) {
    total += nextRolls[k];
  }
  return total;
}


// ===== 描画 (Canvas) =====

function draw() {
  // 背景塗りつぶし（黒いレーン）
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // ガターの線（レトロな緑）
  ctx.strokeStyle = '#39FF14';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 0); ctx.lineTo(40, 600); // 左
  ctx.moveTo(canvas.width - 40, 0); ctx.lineTo(canvas.width - 40, 600); // 右
  // スローライン
  ctx.moveTo(0, 560); ctx.lineTo(canvas.width, 560);
  ctx.stroke();

  // ボールの軌道ガイド（ドット線）
  ctx.strokeStyle = '#555';
  ctx.setLineDash([5, 10]);
  ctx.beginPath();
  ctx.moveTo(400, 550);
  ctx.lineTo(400, 0);
  ctx.stroke();
  ctx.setLineDash([]); // 元に戻す

  // ピンの描画
  for (let i = 0; i < pins.length; i++) {
    let p = pins[i];
    
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    
    if (p.knocked) {
      // 倒れたピンは薄い色
      ctx.fillStyle = '#555';
      ctx.fill();
    } else {
      // 立っている真っ白なピン、赤いライン
      ctx.fillStyle = '#FFF';
      ctx.fill();
      // レトロ感ディテール
      ctx.strokeStyle = '#F00';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(p.x - p.r, p.y);
      ctx.lineTo(p.x + p.r, p.y);
      ctx.stroke();
    }
  }

  // ボールの描画
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = '#0FF'; // シアン色のボール
  ctx.fill();
  
  // UIの描画
  if (currentState === STATE_ANGLE) {
    drawAngleArrow();
  }
  if (currentState === STATE_POWER) {
    drawAngleArrow(); // 角度固定で表示
    drawPowerMeter();
  }
}

function drawAngleArrow() {
  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.rotate(targetAngle * Math.PI / 180);
  
  // 矢印の描画
  ctx.fillStyle = '#FF2A2A';
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(10, -5);
  ctx.lineTo(-10, -5);
  ctx.closePath();
  ctx.fill();
  
  // 線
  ctx.strokeStyle = '#FF2A2A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 20);
  ctx.stroke();
  
  ctx.restore();
}

function drawPowerMeter() {
  // パワーゲージ枠
  const meterX = 50;
  const meterY = canvas.height - 200;
  const meterWidth = 30;
  const maxHeight = 150;
  
  ctx.strokeStyle = '#FFF';
  ctx.lineWidth = 2;
  ctx.strokeRect(meterX, meterY, meterWidth, maxHeight);
  
  // パワー本体
  const fillHeight = (power / 100) * maxHeight;
  // 色の変化 (緑 -> 黄 -> 赤)
  if (power > 80) ctx.fillStyle = '#FF2A2A';
  else if (power > 50) ctx.fillStyle = '#FFD700';
  else ctx.fillStyle = '#39FF14';
  
  ctx.fillRect(meterX, meterY + (maxHeight - fillHeight), meterWidth, fillHeight);
  
  // 'POWER'文字
  ctx.fillStyle = '#FFF';
  ctx.font = "12px 'Press Start 2P', monospace";
  ctx.fillText("POWER", meterX - 10, meterY + maxHeight + 15);
}

// ===== DOMによるスコアボードUIの更新 =====

function renderScoreboardUI() {
  // ヘッダー再構築
  scoreTableHeaders.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const th = document.createElement('th');
    th.textContent = i;
    scoreTableHeaders.appendChild(th);
  }
  
  // 投球結果(X, /, -) 再構築
  scoreTableRolls.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const td = document.createElement('td');
    
    // 1-9フレーム目
    if (i < 9) {
      td.innerHTML = `<div class="frame-rolls">
                        <div class="roll-box">${formatRoll(frames[i].rolls[0])}</div>
                        <div class="roll-box">${formatRoll(frames[i].rolls[1], frames[i].rolls[0])}</div>
                      </div>`;
    } 
    // 10フレーム目（最大3投）
    else {
      td.innerHTML = `<div class="frame-10-rolls">
                        <div class="roll-box">${formatRoll(frames[i].rolls[0])}</div>
                        <div class="roll-box">${formatRoll(frames[i].rolls[1], frames[i].rolls[0], true)}</div>
                        <div class="roll-box">${formatRoll(frames[i].rolls[2], frames[i].rolls[1], true, frames[i].rolls[0])}</div>
                      </div>`;
    }
    scoreTableRolls.appendChild(td);
  }
  
  // トータルスコア行再構築
  scoreTableTotals.innerHTML = '';
  let finalScore = 0;
  for (let i = 0; i < 10; i++) {
    const td = document.createElement('td');
    // まだスコアが入ってない（または計算できない）場合は空文字
    if (frames[i].rolls.length > 0 && cumulativeScores[i] > 0) {
      td.textContent = cumulativeScores[i];
      finalScore = cumulativeScores[i];
    }
    scoreTableTotals.appendChild(td);
  }
  
  // 合計点ラベル表示
  totalScoreDisplay.textContent = finalScore;
}

// 数値を X, /, -, 数値 の文字列に変換する
function formatRoll(roll, prevRoll = null, isTentFrame = false, prevPrevRoll = null) {
  if (roll === undefined) return '';
  if (roll === 0) return '-';
  
  if (isTentFrame) {
    if (roll === 10) return 'X'; // 10フレーム目は何度でもXが出る可能性あり
    if (prevRoll !== null && prevRoll !== 10 && prevRoll + roll === 10) return '/';
    return roll; // それ以外はそのまま数値
  } else {
    if (roll === 10 && prevRoll === null) return 'X'; // 1投目の10はストライク
    if (prevRoll !== null && prevRoll + roll === 10) return '/'; // 2投の合計10はスペア
    return roll;
  }
}

// ===== 画面演出オーバーレイ表示 =====

function showOverlay(textHtml, doFlash) {
  overlayText.innerHTML = textHtml;
  overlayText.classList.remove('hidden');
  if (doFlash) {
    overlayText.classList.add('flashing');
  } else {
    overlayText.classList.remove('flashing');
  }
  
  if (doFlash) {
    setTimeout(hideOverlay, 1500); // 点滅文字は1.5秒で消す
  }
}

function hideOverlay() {
  overlayText.classList.add('hidden');
  overlayText.classList.remove('flashing');
}

// ===== メインループ起動 =====

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// 初期化と開始
startNewGame();
gameLoop();
