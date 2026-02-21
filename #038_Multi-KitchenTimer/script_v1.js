/* ============================================
   マルチ・キッチンタイマー / Multi-Kitchen Timer
   メインスクリプト

   3つの独立したタイマーを管理し、
   AudioContextによるビープ音と
   画面点滅でアラートを通知する。
   ============================================ */

// ===== グローバル状態管理 =====

/**
 * 各タイマーの状態を管理するオブジェクト
 * キー: タイマー番号 (1, 2, 3)
 * 値: タイマーの状態オブジェクト
 */
const timers = {
  1: { intervalId: null, remainingSeconds: 0, isRunning: false, isFinished: false, originalSeconds: 0 },
  2: { intervalId: null, remainingSeconds: 0, isRunning: false, isFinished: false, originalSeconds: 0 },
  3: { intervalId: null, remainingSeconds: 0, isRunning: false, isFinished: false, originalSeconds: 0 }
};

/**
 * アラーム音を管理するための変数
 * AudioContextとoscillatorNodeの参照を保持
 */
let audioContext = null;
let activeOscillators = []; // 現在鳴っているオシレーターのリスト

/**
 * 画面点滅の状態
 * 点滅中のタイマーIDを保持する配列
 */
let flashingTimers = [];


// ===== 初期化処理 =====

/**
 * ページ読み込み完了時に初期化処理を実行
 */
document.addEventListener('DOMContentLoaded', () => {
  // 全タイマーの表示を初期化
  for (let i = 1; i <= 3; i++) {
    updateDisplay(i);
  }
});


// ===== タイマー操作関数 =====

/**
 * タイマーを開始する
 * @param {number} id - タイマー番号（1, 2, 3）
 */
function startTimer(id) {
  const timer = timers[id];

  // アラート中の場合は先にアラートを停止
  if (timer.isFinished) {
    dismissAlert(id);
    return;
  }

  // すでに動作中の場合は何もしない
  if (timer.isRunning) return;

  // 残り時間がない場合は入力値から取得
  if (timer.remainingSeconds <= 0) {
    const minutes = parseInt(document.getElementById(`min-${id}`).value) || 0;
    const seconds = parseInt(document.getElementById(`sec-${id}`).value) || 0;
    const totalSeconds = minutes * 60 + seconds;

    // 0秒の場合は開始しない
    if (totalSeconds <= 0) return;

    timer.remainingSeconds = totalSeconds;
    timer.originalSeconds = totalSeconds;
  }

  // タイマーを開始状態に設定
  timer.isRunning = true;

  // 入力フィールドを無効化（動作中は編集不可）
  setInputDisabled(id, true);

  // ボタンの有効/無効を切り替え
  updateButtonStates(id);

  // カードの見た目を更新
  updateCardAppearance(id, 'running');

  // 1秒ごとにカウントダウンを実行
  timer.intervalId = setInterval(() => {
    timer.remainingSeconds--;
    updateDisplay(id);

    // 残り時間が0になったらタイマー完了
    if (timer.remainingSeconds <= 0) {
      timerFinished(id);
    }
  }, 1000);

  // 表示を即座に更新
  updateDisplay(id);
}

/**
 * タイマーを停止する（一時停止）
 * @param {number} id - タイマー番号（1, 2, 3）
 */
function stopTimer(id) {
  const timer = timers[id];

  // 動作中でない場合は何もしない
  if (!timer.isRunning) return;

  // インターバルをクリアして停止
  clearInterval(timer.intervalId);
  timer.intervalId = null;
  timer.isRunning = false;

  // ボタンの有効/無効を切り替え
  updateButtonStates(id);

  // カードの見た目を更新（一時停止状態）
  updateCardAppearance(id, 'paused');
}

/**
 * タイマーをリセットする（初期状態に戻す）
 * @param {number} id - タイマー番号（1, 2, 3）
 */
function resetTimer(id) {
  const timer = timers[id];

  // アラート中の場合は先にアラートを停止
  if (timer.isFinished) {
    dismissAlert(id);
  }

  // インターバルをクリア
  if (timer.intervalId) {
    clearInterval(timer.intervalId);
    timer.intervalId = null;
  }

  // 状態をリセット
  timer.isRunning = false;
  timer.isFinished = false;
  timer.remainingSeconds = 0;
  timer.originalSeconds = 0;

  // 入力フィールドを有効化して値をリセット
  setInputDisabled(id, false);
  document.getElementById(`min-${id}`).value = 0;
  document.getElementById(`sec-${id}`).value = 0;

  // 表示とボタンを更新
  updateDisplay(id);
  updateButtonStates(id);
  updateCardAppearance(id, 'ready');

  // アラート停止ボタンを非表示
  document.getElementById(`dismiss-btn-${id}`).style.display = 'none';
}

/**
 * すべてのタイマーを一括リセットする
 */
function resetAllTimers() {
  for (let i = 1; i <= 3; i++) {
    resetTimer(i);
  }

  // 全てのアラーム音を停止
  stopAllAlarmSounds();

  // 画面点滅を停止
  stopFlashOverlay();
}


// ===== タイマー完了処理 =====

/**
 * タイマーが0になったときの処理
 * @param {number} id - タイマー番号（1, 2, 3）
 */
function timerFinished(id) {
  const timer = timers[id];

  // インターバルをクリア
  clearInterval(timer.intervalId);
  timer.intervalId = null;
  timer.isRunning = false;
  timer.isFinished = true;
  timer.remainingSeconds = 0;

  // 表示を更新
  updateDisplay(id);
  updateButtonStates(id);
  updateCardAppearance(id, 'finished');

  // アラート停止ボタンを表示
  document.getElementById(`dismiss-btn-${id}`).style.display = 'block';

  // 音設定がONの場合、アラーム音を鳴らす
  const soundEnabled = document.getElementById('sound-toggle').checked;
  if (soundEnabled) {
    playAlarmSound(id);
  }

  // 点滅設定がONの場合、画面を点滅させる
  const flashEnabled = document.getElementById('flash-toggle').checked;
  if (flashEnabled) {
    startFlashOverlay(id);
  }
}

/**
 * アラートを停止する（アラート停止ボタン押下時）
 * @param {number} id - タイマー番号（1, 2, 3）
 */
function dismissAlert(id) {
  const timer = timers[id];
  timer.isFinished = false;

  // アラーム音を停止
  stopAlarmSound(id);

  // 画面点滅からこのタイマーを除去
  stopFlashForTimer(id);

  // アラート停止ボタンを非表示
  document.getElementById(`dismiss-btn-${id}`).style.display = 'none';

  // カードの見た目を待機状態に戻す
  updateCardAppearance(id, 'ready');
  updateButtonStates(id);

  // 入力フィールドを有効化
  setInputDisabled(id, false);
}


// ===== 表示更新関数 =====

/**
 * カウントダウン表示を更新する
 * @param {number} id - タイマー番号（1, 2, 3）
 */
function updateDisplay(id) {
  const timer = timers[id];
  const minutes = Math.floor(timer.remainingSeconds / 60);
  const seconds = timer.remainingSeconds % 60;

  // 0埋めの2桁表示にフォーマット
  const displayText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  document.getElementById(`countdown-${id}`).textContent = displayText;
}

/**
 * ボタンの有効/無効を切り替える
 * @param {number} id - タイマー番号（1, 2, 3）
 */
function updateButtonStates(id) {
  const timer = timers[id];
  const startBtn = document.getElementById(`start-btn-${id}`);
  const stopBtn = document.getElementById(`stop-btn-${id}`);
  const resetBtn = document.getElementById(`reset-btn-${id}`);

  if (timer.isFinished) {
    // 完了状態: 全ボタン無効、リセットのみ有効
    startBtn.disabled = true;
    stopBtn.disabled = true;
    resetBtn.disabled = false;
  } else if (timer.isRunning) {
    // 動作中: 停止のみ有効
    startBtn.disabled = true;
    stopBtn.disabled = false;
    resetBtn.disabled = false;
  } else {
    // 待機中 or 一時停止中: 開始とリセットが有効
    startBtn.disabled = false;
    stopBtn.disabled = true;
    resetBtn.disabled = false;
  }
}

/**
 * タイマーカードの見た目を状態に応じて更新する
 * @param {number} id - タイマー番号（1, 2, 3）
 * @param {string} state - 状態 ('ready', 'running', 'paused', 'finished')
 */
function updateCardAppearance(id, state) {
  const card = document.getElementById(`timer-card-${id}`);
  const badge = document.getElementById(`status-badge-${id}`);

  // 全状態クラスを一旦削除
  card.classList.remove('is-running', 'is-paused', 'is-finished');

  // バッジのクラスを一旦削除
  badge.classList.remove('badge-running', 'badge-paused', 'badge-finished');

  // 状態に応じてクラスを追加
  switch (state) {
    case 'running':
      card.classList.add('is-running');
      badge.classList.add('badge-running');
      badge.textContent = '動作中 / Running';
      break;
    case 'paused':
      card.classList.add('is-paused');
      badge.classList.add('badge-paused');
      badge.textContent = '一時停止 / Paused';
      break;
    case 'finished':
      card.classList.add('is-finished');
      badge.classList.add('badge-finished');
      badge.textContent = '完了！/ Done!';
      break;
    default: // 'ready'
      badge.textContent = '待機中 / Ready';
      break;
  }
}

/**
 * 入力フィールドの有効/無効を切り替える
 * @param {number} id - タイマー番号（1, 2, 3）
 * @param {boolean} disabled - 無効化するかどうか
 */
function setInputDisabled(id, disabled) {
  const inputArea = document.getElementById(`input-area-${id}`);
  const inputs = inputArea.querySelectorAll('.time-input');
  inputs.forEach(input => {
    input.disabled = disabled;
    // 無効時は薄く表示
    input.style.opacity = disabled ? '0.5' : '1';
  });
}


// ===== アラーム音関連 =====

/**
 * AudioContextを初期化する（初回のみ）
 * ブラウザのオーディオポリシーに対応するため、
 * ユーザーの操作（ボタンクリック）をトリガーにして初期化する
 */
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  // suspendedの場合はresumeする
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

/**
 * アラーム音を鳴らす（ビープ音をパターンで繰り返す）
 * @param {number} id - タイマー番号（1, 2, 3）
 */
function playAlarmSound(id) {
  initAudioContext();

  // ビープパターンを繰り返し鳴らすためのインターバル
  const beepPattern = setInterval(() => {
    // タイマーが完了状態でなくなったら停止
    if (!timers[id].isFinished) {
      clearInterval(beepPattern);
      return;
    }
    // ビープ音を再生
    playBeep(880, 0.15); // A5音（880Hz）を0.15秒間
    setTimeout(() => {
      if (timers[id].isFinished) {
        playBeep(880, 0.15);
      }
    }, 200);
    setTimeout(() => {
      if (timers[id].isFinished) {
        playBeep(1100, 0.2); // 少し高い音
      }
    }, 400);
  }, 1200); // 1.2秒間隔でパターンを繰り返す

  // インターバルIDを保存して後で停止できるようにする
  timers[id].beepIntervalId = beepPattern;

  // 最初のビープをすぐ鳴らす
  playBeep(880, 0.15);
  setTimeout(() => playBeep(880, 0.15), 200);
  setTimeout(() => playBeep(1100, 0.2), 400);
}

/**
 * 単発のビープ音を再生する
 * @param {number} frequency - 周波数（Hz）
 * @param {number} duration - 持続時間（秒）
 */
function playBeep(frequency, duration) {
  if (!audioContext) return;

  // オシレーター（音源）を作成
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine'; // サイン波（柔らかい音）
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  // ゲインノード（音量調整）を作成
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // 音量0.3
  // フェードアウトで自然に消える
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  // 接続: オシレーター → ゲイン → スピーカー
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // 再生開始・停止
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

/**
 * 特定タイマーのアラーム音を停止する
 * @param {number} id - タイマー番号（1, 2, 3）
 */
function stopAlarmSound(id) {
  if (timers[id].beepIntervalId) {
    clearInterval(timers[id].beepIntervalId);
    timers[id].beepIntervalId = null;
  }
}

/**
 * すべてのアラーム音を停止する
 */
function stopAllAlarmSounds() {
  for (let i = 1; i <= 3; i++) {
    stopAlarmSound(i);
  }
}


// ===== 画面点滅関連 =====

/**
 * 画面点滅を開始する
 * @param {number} id - タイマー番号（1, 2, 3）
 */
function startFlashOverlay(id) {
  // 点滅中タイマーリストにIDを追加（重複防止）
  if (!flashingTimers.includes(id)) {
    flashingTimers.push(id);
  }

  // オーバーレイに点滅クラスを追加
  const overlay = document.getElementById('flash-overlay');
  overlay.classList.add('is-flashing');
}

/**
 * 特定タイマーの点滅を停止する
 * @param {number} id - タイマー番号（1, 2, 3）
 */
function stopFlashForTimer(id) {
  // 点滅中タイマーリストからIDを除去
  flashingTimers = flashingTimers.filter(timerId => timerId !== id);

  // 点滅中のタイマーがなくなったらオーバーレイを非表示
  if (flashingTimers.length === 0) {
    stopFlashOverlay();
  }
}

/**
 * 画面点滅を完全に停止する
 */
function stopFlashOverlay() {
  const overlay = document.getElementById('flash-overlay');
  overlay.classList.remove('is-flashing');
  flashingTimers = [];
}
