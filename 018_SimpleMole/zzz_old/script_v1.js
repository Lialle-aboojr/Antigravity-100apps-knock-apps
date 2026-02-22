// HTMLの要素を取得します
const holes = document.querySelectorAll('.hole'); // すべての穴
const scoreBoard = document.querySelector('.score'); // スコア表示部分
const moles = document.querySelectorAll('.mole'); // すべてのモグラ
const locations = document.querySelectorAll('.hole'); // 穴の場所
const timeLeftDisplay = document.querySelector('.time-left'); //残り時間表示

// ゲームの状態を管理する変数
let lastHole;   // 最後にモグラが出た穴（同じ穴に連続で出ないようにする）
let timeUp = false; // ゲーム終了フラグ
let score = 0; // 現在のスコア
let countdown; // タイマーのカウントダウン用

// ランダムな時間を生成する関数 (モグラが出ている時間)
// min: 最小時間(ミリ秒), max: 最大時間(ミリ秒)
function randomTime(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

// ランダムな穴を選ぶ関数
function randomHole(holes) {
  // holesの数（今回は9個）からランダムなインデックス(0-8)を選ぶ
  const idx = Math.floor(Math.random() * holes.length);
  const hole = holes[idx];

  // 直前と同じ穴だった場合は、もう一度選び直す
  if (hole === lastHole) {
    console.log('同じ穴でした！再抽選します');
    return randomHole(holes);
  }

  // 選ばれた穴を記録して返す
  lastHole = hole;
  return hole;
}

// モグラが顔を出す関数
function peep() {
  // モグラが出ている時間をランダムに決める (200ms 〜 1000ms)
  const time = randomTime(500, 1000);
  // モグラが出る穴をランダムに決める
  const hole = randomHole(holes);

  // 穴に 'up' クラスをつけてモグラを表示させる (CSSで制御)
  hole.classList.add('up');

  // 指定された時間が経ったらモグラを引っ込める
  setTimeout(() => {
    hole.classList.remove('up');
    
    // ゲームが終わっていなければ、次のモグラを出す
    if (!timeUp) {
      peep();
    }
  }, time);
}

// ゲームを開始する関数 (スタートボタンが押されたら実行)
function startGame() {
  // スコアと終了フラグをリセット
  scoreBoard.textContent = 0;
  score = 0;
  timeUp = false;
  
  // 残り時間を30秒にリセット
  let timeLeft = 30;
  timeLeftDisplay.textContent = timeLeft;
  
  // 既存のタイマーがあればクリアする
  if(countdown) clearInterval(countdown);

  // タイマーを開始 (1秒ごとに実行)
  countdown = setInterval(() => {
    timeLeft--;
    timeLeftDisplay.textContent = timeLeft;
    
    // 時間切れになったら
    if(timeLeft <= 0) {
      clearInterval(countdown);
      timeUp = true;
      alert('Game Over! Score: ' + score);
    }
  }, 1000);

  // 最初のモグラを出す
  peep();
}

// モグラを叩いた時の処理
function bonk(e) {
  // isTrustedはユーザーが実際にクリックしたかどうかの判定 (スクリプトによるクリックを防ぐ)
  if(!e.isTrusted) return; 

  // スコアを1増やす
  score++;
  
  // モグラをすぐに引っ込める (親要素の穴から 'up' クラスを外す)
  this.parentNode.classList.remove('up');
  
  // 画面のスコア表示を更新する
  scoreBoard.textContent = score;
}

// すべてのモグラに対して、クリックイベントを設定する
moles.forEach(mole => mole.addEventListener('click', bonk));
