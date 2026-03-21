/* ============================================
   和風ブロック崩し (Edo Breakout) - メインスクリプト
   Canvas APIを使用した2Dブロック崩しゲーム
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // 定数・設定
  // ============================================

  // 和色パレット（ブロックの色）
  var BLOCK_COLORS = [
    '#B5495B', // 臙脂色（えんじいろ）
    '#264E73', // 藍色（あいいろ）
    '#86A96F', // 抹茶色（まっちゃいろ）
    '#C18A26', // 金茶色（きんちゃいろ）
    '#8B81C3', // 藤色（ふじいろ）
    '#7DB9DE', // 勿忘草色（わすれなぐさいろ）
  ];

  // ゲーム設定
  var BLOCK_ROWS = 5;          // ブロックの行数
  var BLOCK_COLS = 7;          // ブロックの列数
  var BLOCK_PADDING = 4;       // ブロック間の余白（px、Canvasの基準解像度ベース）
  var BLOCK_TOP_OFFSET = 40;   // ブロック上端のオフセット
  var BALL_RADIUS = 6;         // ボールの半径
  var PADDLE_HEIGHT = 12;      // パドルの高さ
  var BALL_SPEED_BASE = 4;     // ボールの基本速度
  var POINTS_PER_BLOCK = 10;   // 1ブロック破壊あたりのスコア

  // 背景画像の透明度（0.0〜1.0、低いほど薄くうっすら表示される）
  var BG_ALPHA = 0.25;

  // Canvas基準解像度（ゲームロジックはこの解像度で動作）
  var BASE_WIDTH = 360;
  var BASE_HEIGHT = 480;

  // ゲーム状態の列挙
  var STATE_IDLE = 'idle';
  var STATE_PLAYING = 'playing';
  var STATE_GAMEOVER = 'gameover';
  var STATE_CLEAR = 'clear';

  // ============================================
  // DOM要素の取得
  // ============================================
  var canvas = document.getElementById('game-canvas');
  var ctx = canvas.getContext('2d');
  var scoreDisplay = document.getElementById('score-display');
  var startBtn = document.getElementById('start-btn');

  // ============================================
  // ゲーム変数
  // ============================================
  var gameState = STATE_IDLE;
  var score = 0;
  var animationId = null;

  // 背景画像オブジェクト（非同期で読み込み）
  var bgImage = null;
  var bgImageLoaded = false;

  // ボール
  var ball = {
    x: 0,
    y: 0,
    dx: 0,   // X方向の速度
    dy: 0,   // Y方向の速度
    radius: BALL_RADIUS
  };

  // パドル
  var paddle = {
    x: 0,
    y: 0,
    width: 60,
    height: PADDLE_HEIGHT
  };

  // ブロック配列
  var blocks = [];

  // ブロック1個のサイズ（初期化時に計算）
  var blockWidth = 0;
  var blockHeight = 18;

  // スケール情報（実際の描画サイズとの比率）
  var scaleX = 1;
  var scaleY = 1;

  // ============================================
  // 背景画像の読み込み
  // ============================================

  /**
   * 浮世絵風背景画像を非同期で読み込む
   * 画像の読み込みが完了するとbgImageLoadedフラグがtrueになる
   * 画像が読み込めなくても、ゲームは通常通り動作する（フォールバック）
   */
  function loadBackgroundImage() {
    bgImage = new Image();
    bgImage.onload = function () {
      bgImageLoaded = true;
      // IDLE状態なら即座に再描画して背景を反映
      if (gameState === STATE_IDLE) {
        drawIdleScreen();
      }
    };
    bgImage.onerror = function () {
      // 画像が読み込めなくても、ゲームに影響なし
      bgImageLoaded = false;
    };
    bgImage.src = 'bg_ukiyoe.png';
  }

  // ============================================
  // Canvas初期化・リサイズ処理
  // ============================================

  /**
   * Canvasの解像度と表示サイズを設定する
   * Retinaディスプレイ対応 + レスポンシブ
   */
  function resizeCanvas() {
    // canvasの親要素（canvas-wrapper）の実際のサイズを取得
    var wrapper = canvas.parentElement;
    var displayWidth = wrapper.clientWidth;
    var displayHeight = wrapper.clientHeight;

    // デバイスピクセル比を考慮（Retina対応）
    var dpr = window.devicePixelRatio || 1;

    // Canvas内部解像度を設定（高解像度で描画）
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    // Canvas表示サイズはCSSで100%に設定済みなので変更不要

    // スケール比率を計算（基準解像度 → 実際の描画解像度）
    scaleX = canvas.width / BASE_WIDTH;
    scaleY = canvas.height / BASE_HEIGHT;

    // コンテキストのスケーリングをリセットして再設定
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  }

  // ============================================
  // ブロック初期化
  // ============================================

  /**
   * ブロック配列を生成する
   */
  function initBlocks() {
    blocks = [];
    // ブロック1個の幅を計算
    blockWidth = (BASE_WIDTH - BLOCK_PADDING * (BLOCK_COLS + 1)) / BLOCK_COLS;

    for (var row = 0; row < BLOCK_ROWS; row++) {
      for (var col = 0; col < BLOCK_COLS; col++) {
        blocks.push({
          x: BLOCK_PADDING + col * (blockWidth + BLOCK_PADDING),
          y: BLOCK_TOP_OFFSET + row * (blockHeight + BLOCK_PADDING),
          width: blockWidth,
          height: blockHeight,
          color: BLOCK_COLORS[row % BLOCK_COLORS.length],
          alive: true  // 生存フラグ
        });
      }
    }
  }

  // ============================================
  // ボール・パドル初期化
  // ============================================

  /**
   * ボールを初期位置に配置し、速度を設定する
   */
  function initBall() {
    ball.x = BASE_WIDTH / 2;
    ball.y = BASE_HEIGHT - 50;
    // 斜め上方向に発射（ランダムに左右どちらか）
    var angle = -Math.PI / 4 + (Math.random() * Math.PI / 2); // -45度〜+45度
    // 上方向を基本にするため、dyは必ず負
    ball.dx = BALL_SPEED_BASE * Math.sin(angle);
    ball.dy = -BALL_SPEED_BASE * Math.cos(angle);
    ball.radius = BALL_RADIUS;
  }

  /**
   * パドルを初期位置に配置する
   */
  function initPaddle() {
    paddle.width = 60;
    paddle.height = PADDLE_HEIGHT;
    paddle.x = (BASE_WIDTH - paddle.width) / 2;
    paddle.y = BASE_HEIGHT - 30;
  }

  // ============================================
  // スコア更新
  // ============================================

  /**
   * スコア表示をDOMに反映する（XSS対策: textContentを使用）
   */
  function updateScoreDisplay() {
    scoreDisplay.textContent = String(score);
    // スコアポップアニメーション
    scoreDisplay.classList.add('pop');
    setTimeout(function () {
      scoreDisplay.classList.remove('pop');
    }, 150);
  }

  // ============================================
  // 衝突判定
  // ============================================

  /**
   * ボールとブロックの衝突判定
   * 矩形とボール（円）の衝突を検出
   */
  function checkBlockCollision() {
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (!b.alive) continue;

      // ボールの中心とブロック矩形の最近接点を計算
      var closestX = Math.max(b.x, Math.min(ball.x, b.x + b.width));
      var closestY = Math.max(b.y, Math.min(ball.y, b.y + b.height));

      var distX = ball.x - closestX;
      var distY = ball.y - closestY;
      var distance = Math.sqrt(distX * distX + distY * distY);

      if (distance <= ball.radius) {
        // ブロック破壊
        b.alive = false;
        score += POINTS_PER_BLOCK;
        updateScoreDisplay();

        // 反射方向を決定（ブロックのどの辺に当たったか）
        // X方向の侵入が浅いならX反転、Y方向が浅いならY反転
        var overlapX = ball.radius - Math.abs(distX);
        var overlapY = ball.radius - Math.abs(distY);

        if (overlapX < overlapY) {
          ball.dx = -ball.dx;
        } else {
          ball.dy = -ball.dy;
        }

        // 1フレームで1ブロックのみ破壊（貫通防止）
        break;
      }
    }
  }

  /**
   * ボールとパドルの衝突判定
   */
  function checkPaddleCollision() {
    // パドルの上面でのみ衝突を判定
    if (
      ball.y + ball.radius >= paddle.y &&
      ball.y + ball.radius <= paddle.y + paddle.height &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width &&
      ball.dy > 0 // 下向きに移動中のみ
    ) {
      // パドル上のどこに当たったかで反射角度を変更
      var hitPoint = (ball.x - paddle.x) / paddle.width; // 0.0〜1.0
      // -60度〜+60度の範囲で反射
      var angle = (hitPoint - 0.5) * (Math.PI * 2 / 3);
      var speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      ball.dx = speed * Math.sin(angle);
      ball.dy = -speed * Math.cos(angle);

      // ボールがパドルにめり込まないよう位置を補正
      ball.y = paddle.y - ball.radius;
    }
  }

  /**
   * ボールと壁の衝突判定
   */
  function checkWallCollision() {
    // 左壁
    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.dx = -ball.dx;
    }
    // 右壁
    if (ball.x + ball.radius >= BASE_WIDTH) {
      ball.x = BASE_WIDTH - ball.radius;
      ball.dx = -ball.dx;
    }
    // 上壁
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.dy = -ball.dy;
    }
    // 下壁（ボール落下 → ゲームオーバー）
    if (ball.y + ball.radius >= BASE_HEIGHT) {
      gameState = STATE_GAMEOVER;
    }
  }

  /**
   * 全ブロックが破壊されたかチェック
   */
  function checkAllBlocksCleared() {
    var allGone = true;
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].alive) {
        allGone = false;
        break;
      }
    }
    if (allGone) {
      gameState = STATE_CLEAR;
    }
  }

  // ============================================
  // 描画処理
  // ============================================

  /**
   * 画面をクリアし、背景画像を描画する
   * 背景画像はglobalAlphaを使って「うっすら」表示する
   */
  function clearScreen() {
    // まず画面全体を暗い色で塗りつぶす（ベース背景）
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#0F0F1A';
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    // 背景画像が読み込み済みなら、うっすら重ねて描画
    if (bgImageLoaded && bgImage) {
      ctx.globalAlpha = BG_ALPHA; // 透明度を下げて「うっすら」表示
      ctx.drawImage(bgImage, 0, 0, BASE_WIDTH, BASE_HEIGHT);
      ctx.globalAlpha = 1.0; // 透明度を元に戻す（以降の描画に影響させない）
    }
  }

  /**
   * ブロックを描画する
   */
  function drawBlocks() {
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (!b.alive) continue;

      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // ブロックに微かなハイライト線を追加（レトロ感）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(b.x, b.y, b.width, 2);
    }
  }

  /**
   * ボールを描画する
   */
  function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#F5F0E8'; // 象牙色
    ctx.fill();
    ctx.closePath();
  }

  /**
   * パドルを描画する
   */
  function drawPaddle() {
    ctx.fillStyle = '#86A96F'; // 抹茶色
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    // パドル上面にハイライト
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, 2);
  }

  /**
   * ゲームオーバー画面を描画する
   */
  function drawGameOver() {
    // 半透明オーバーレイ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    // メインテキスト（英語）
    ctx.fillStyle = '#B5495B'; // 臙脂色
    ctx.font = 'bold 28px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', BASE_WIDTH / 2, BASE_HEIGHT / 2 - 30);

    // サブテキスト（日本語）
    ctx.fillStyle = '#F5F0E8';
    ctx.font = '18px "DotGothic16", sans-serif';
    ctx.fillText('ゲームオーバー', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 10);

    // スコア表示
    ctx.fillStyle = '#C18A26'; // 金茶色
    ctx.font = '14px "DotGothic16", sans-serif';
    ctx.fillText('スコア / Score: ' + score, BASE_WIDTH / 2, BASE_HEIGHT / 2 + 50);

    // リスタート案内
    ctx.fillStyle = 'rgba(245, 240, 232, 0.6)';
    ctx.font = '12px "DotGothic16", sans-serif';
    ctx.fillText('ボタンを押してリスタート', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 80);
    ctx.fillText('Press Start to Restart', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 98);
  }

  /**
   * ゲームクリア画面を描画する
   */
  function drawGameClear() {
    // 半透明オーバーレイ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    // メインテキスト（英語）
    ctx.fillStyle = '#C18A26'; // 金茶色
    ctx.font = 'bold 24px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME CLEAR', BASE_WIDTH / 2, BASE_HEIGHT / 2 - 30);

    // サブテキスト（日本語）
    ctx.fillStyle = '#F5F0E8';
    ctx.font = '20px "DotGothic16", sans-serif';
    ctx.fillText('ゲームクリア！', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 10);

    // スコア表示
    ctx.fillStyle = '#86A96F'; // 抹茶色
    ctx.font = '14px "DotGothic16", sans-serif';
    ctx.fillText('スコア / Score: ' + score, BASE_WIDTH / 2, BASE_HEIGHT / 2 + 50);

    // リスタート案内
    ctx.fillStyle = 'rgba(245, 240, 232, 0.6)';
    ctx.font = '12px "DotGothic16", sans-serif';
    ctx.fillText('ボタンを押してリスタート', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 80);
    ctx.fillText('Press Start to Restart', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 98);
  }

  /**
   * 待機画面を描画する
   */
  function drawIdleScreen() {
    clearScreen();

    // 装飾的なブロックを描画（プレビュー）
    initBlocks();
    drawBlocks();

    // 中央メッセージ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, BASE_HEIGHT / 2 - 50, BASE_WIDTH, 100);

    ctx.fillStyle = '#F5F0E8';
    ctx.font = '18px "DotGothic16", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('「はじめる」を押してプレイ', BASE_WIDTH / 2, BASE_HEIGHT / 2 - 12);

    ctx.fillStyle = '#7DB9DE'; // 勿忘草色
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillText('Press Start', BASE_WIDTH / 2, BASE_HEIGHT / 2 + 20);
  }

  // ============================================
  // メインゲームループ
  // ============================================

  /**
   * 毎フレーム呼ばれるメインループ
   */
  function gameLoop() {
    if (gameState !== STATE_PLAYING) {
      return;
    }

    // 画面クリア（背景画像もここで描画される）
    clearScreen();

    // ボール位置更新
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 衝突判定
    checkWallCollision();
    checkPaddleCollision();
    checkBlockCollision();
    checkAllBlocksCleared();

    // 描画
    drawBlocks();
    drawBall();
    drawPaddle();

    // ゲームオーバーまたはクリア判定
    if (gameState === STATE_GAMEOVER) {
      drawGameOver();
      enableStartButton();
      return;
    }
    if (gameState === STATE_CLEAR) {
      drawGameClear();
      enableStartButton();
      return;
    }

    // 次のフレームを予約
    animationId = requestAnimationFrame(gameLoop);
  }

  // ============================================
  // ボタン制御
  // ============================================

  /**
   * スタートボタンを有効化する
   */
  function enableStartButton() {
    startBtn.disabled = false;
    startBtn.textContent = 'もう一度 / Retry';
  }

  /**
   * スタートボタンを無効化する
   */
  function disableStartButton() {
    startBtn.disabled = true;
  }

  // ============================================
  // ゲーム開始・リセット
  // ============================================

  /**
   * ゲームを開始（またはリスタート）する
   */
  function startGame() {
    // アニメーションをキャンセル（リスタート時）
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    // 状態リセット
    gameState = STATE_PLAYING;
    score = 0;
    updateScoreDisplay();

    // Canvas再計算
    resizeCanvas();

    // ゲームオブジェクト初期化
    initBlocks();
    initBall();
    initPaddle();

    // ボタン無効化
    disableStartButton();

    // ゲームループ開始
    animationId = requestAnimationFrame(gameLoop);
  }

  // ============================================
  // 入力イベント処理
  // ============================================

  /**
   * マウスのX座標をCanvas基準座標に変換してパドル位置を更新する
   */
  function handleMouseMove(e) {
    if (gameState !== STATE_PLAYING) return;

    var rect = canvas.getBoundingClientRect();
    // マウスのX座標をCanvas基準解像度に変換
    var mouseX = (e.clientX - rect.left) / rect.width * BASE_WIDTH;
    // パドルの中心がマウス位置に来るよう調整
    paddle.x = mouseX - paddle.width / 2;

    // パドルが画面外に出ないよう制限
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > BASE_WIDTH) paddle.x = BASE_WIDTH - paddle.width;
  }

  /**
   * タッチのX座標をCanvas基準座標に変換してパドル位置を更新する
   * スマホ対応の核心部分
   */
  function handleTouchMove(e) {
    if (gameState !== STATE_PLAYING) return;

    // ブラウザデフォルトのスクロール等を防止
    e.preventDefault();

    var touch = e.touches[0];
    if (!touch) return;

    var rect = canvas.getBoundingClientRect();
    // タッチ座標をCanvas基準解像度に変換
    var touchX = (touch.clientX - rect.left) / rect.width * BASE_WIDTH;
    // パドルの中心がタッチ位置に来るよう調整
    paddle.x = touchX - paddle.width / 2;

    // パドルが画面外に出ないよう制限
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > BASE_WIDTH) paddle.x = BASE_WIDTH - paddle.width;
  }

  /**
   * タッチ開始時の処理（パドルを即座にタッチ位置に移動）
   */
  function handleTouchStart(e) {
    if (gameState !== STATE_PLAYING) return;

    e.preventDefault();

    var touch = e.touches[0];
    if (!touch) return;

    var rect = canvas.getBoundingClientRect();
    var touchX = (touch.clientX - rect.left) / rect.width * BASE_WIDTH;
    paddle.x = touchX - paddle.width / 2;

    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > BASE_WIDTH) paddle.x = BASE_WIDTH - paddle.width;
  }

  // ============================================
  // イベントリスナーの登録
  // ============================================

  // スタートボタン
  startBtn.addEventListener('click', function () {
    startGame();
  });

  // マウス操作（PC対応）
  canvas.addEventListener('mousemove', handleMouseMove);

  // タッチ操作（スマホ対応）
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

  // ウィンドウリサイズ時にCanvasを再調整
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    // リサイズ中はデバウンスして負荷を軽減
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeCanvas();
      // IDLEまたは終了状態なら画面を再描画
      if (gameState === STATE_IDLE) {
        drawIdleScreen();
      } else if (gameState === STATE_GAMEOVER) {
        clearScreen();
        drawBlocks();
        drawBall();
        drawPaddle();
        drawGameOver();
      } else if (gameState === STATE_CLEAR) {
        clearScreen();
        drawBlocks();
        drawBall();
        drawPaddle();
        drawGameClear();
      }
    }, 150);
  });

  // ============================================
  // 初期表示
  // ============================================

  // 背景画像の読み込みを開始
  loadBackgroundImage();

  // Canvas初期化
  resizeCanvas();
  // 待機画面を表示
  drawIdleScreen();

})();
