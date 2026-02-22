/*
 * Memory Garden - Main Logic
 * 機能: ゲーム進行、コントロール(Start/Stop/Reset/Shuffle)、タイマー、SE
 */

// --- 定数と設定 ---
const PLANT_EMOJIS = [
    '🌿', '🌸', '🌵', '🌻', '🌹', '🌷', '🌲', '🌳',
    '🌴', '🍀', '🍁', '🍂', '🍄', '🌾', '🌺', '🌼',
    '🎍', '🍃', '🪴', '🌱', '💐', '🎋', '🪵', '🍋'
];

const DIFFICULTY_SETTINGS = {
    'easy': { pairs: 4, cols: 4 },       // 8枚
    'normal': { pairs: 8, cols: 4 },     // 16枚
    'hard': { pairs: 12, cols: 6 },      // 24枚
    'super-hard': { pairs: 18, cols: 6 } // 36枚
};

// --- グローバル変数 ---
let currentDifficulty = 'normal';
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moveCount = 0;

// タイマー関連
let timerInterval = null;
let startTime = 0;
let elapsedTime = 0; // 経過時間(秒)
let isRunning = false; // タイマー動作中フラグ

// DOM要素
const gameBoard = document.getElementById('game-board');
const difficultySelect = document.getElementById('difficulty');
const timerDisplay = document.getElementById('timer');
const movesDisplay = document.getElementById('moves');

const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnReset = document.getElementById('btn-reset');
const btnShuffle = document.getElementById('btn-shuffle');

const modal = document.getElementById('modal');
const modalRestartBtn = document.getElementById('modal-restart-btn');
const finalTimeDisplay = document.getElementById('final-time');
const finalMovesDisplay = document.getElementById('final-moves');

/*
 * --- Web Audio API: SE Only ---
 * BGM機能は削除済み。優しい効果音のみ再生。
 */
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
}

function playSound(type) {
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'flip') {
        // コロっという丸い音
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);

    } else if (type === 'match') {
        // ポロン♪ (アルペジオ風)
        playTone(523.25, t, 0.3); // C5
        setTimeout(() => playTone(659.25, audioCtx.currentTime, 0.4), 100); // E5

    } else if (type === 'mismatch') {
        // 低めのぽよん音
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.2);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
    }
}

function playTone(freq, startTime, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    gain.gain.setValueAtTime(0.05, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
}

// --- ゲームロジック ---

// 初期化（ボード生成のみ、開始はしない）
function initGame() {
    // 状態クリア
    stopTimer();
    elapsedTime = 0;
    moveCount = 0;
    matchedPairs = 0;
    flippedCards = [];
    isRunning = false;

    updateDisplay();
    updateControlsState('reset'); // リセット状態

    // データ生成
    createBoard();

    modal.classList.add('hidden');
}

function createBoard() {
    const setting = DIFFICULTY_SETTINGS[currentDifficulty];
    const numPairs = setting.pairs;
    const shuffled = [...PLANT_EMOJIS].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numPairs);
    const deck = [...selected, ...selected];

    // シャッフル
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // HTML生成
    gameBoard.innerHTML = '';
    gameBoard.className = 'game-board ' + currentDifficulty + ' locked';
    cards = [];

    deck.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.emoji = emoji;
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">${emoji}</div>
                <div class="card-back"></div>
            </div>
        `;
        card.addEventListener('click', handleCardClick);
        gameBoard.appendChild(card);
        cards.push(card);
    });
}

// コントロール状態管理
function updateControlsState(state) {
    if (state === 'running') {
        // スタート中
        btnStart.disabled = true;
        btnStop.disabled = false;
        btnReset.disabled = false;
        btnShuffle.disabled = false;
        difficultySelect.disabled = true;
        gameBoard.classList.remove('locked');
    } else if (state === 'paused') {
        // 一時停止中
        btnStart.disabled = false;
        btnStop.disabled = true;
        btnReset.disabled = false;
        btnShuffle.disabled = false;
        difficultySelect.disabled = true; // 途中変更は不可
        gameBoard.classList.add('locked');
    } else if (state === 'reset') {
        // 初期状態
        btnStart.disabled = false;
        btnStop.disabled = true;
        btnReset.disabled = true;
        btnShuffle.disabled = false; // シャッフルして開始準備OK
        difficultySelect.disabled = false;
        gameBoard.classList.add('locked');
    }
}

// ボタンアクション
function handleStart() {
    if (isRunning) return;
    startTimer();
    updateControlsState('running');

    // Audio Context Resume (User Action)
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function handleStop() {
    if (!isRunning) return;
    stopTimer();
    updateControlsState('paused');
}

function handleReset() {
    initGame(); // 初期状態に戻る
}

function handleReshuffle() {
    // リシャッフルは現在の難易度で最初からやり直すイメージ
    handleReset();
    handleStart();
}

// カードロジック
function handleCardClick(e) {
    if (!isRunning || gameBoard.classList.contains('locked')) return;

    const clickedCard = e.currentTarget;
    if (
        flippedCards.length >= 2 ||
        clickedCard.classList.contains('flipped') ||
        clickedCard.classList.contains('matched')
    ) {
        return;
    }

    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    flipCard(clickedCard);
    playSound('flip');
    flippedCards.push(clickedCard);

    if (flippedCards.length === 2) {
        moveCount++;
        movesDisplay.textContent = moveCount;
        checkForMatch();
    }
}

function flipCard(card) {
    card.classList.add('flipped');
}

function unflipCard(card) {
    card.classList.remove('flipped');
}

function checkForMatch() {
    const [card1, card2] = flippedCards;
    const match = card1.dataset.emoji === card2.dataset.emoji;

    if (match) {
        playSound('match');
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        flippedCards = [];

        const setting = DIFFICULTY_SETTINGS[currentDifficulty];
        if (matchedPairs === setting.pairs) {
            gameFinished();
        }
    } else {
        playSound('mismatch');
        setTimeout(() => {
            unflipCard(card1);
            unflipCard(card2);
            flippedCards = [];
        }, 1000);
    }
}

// タイマー機能 (Pause/Resume対応)
function startTimer() {
    if (isRunning) return;
    isRunning = true;

    // 現在時刻から、すでに経過した時間を引いた時間を「開始時刻」とみなす
    startTime = Date.now() - (elapsedTime * 1000);

    timerInterval = setInterval(() => {
        const now = Date.now();
        elapsedTime = Math.floor((now - startTime) / 1000);
        updateDisplay();
    }, 1000);
}

function stopTimer() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(timerInterval);
}

function updateDisplay() {
    const m = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
    const s = (elapsedTime % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
    movesDisplay.textContent = moveCount;
}

function gameFinished() {
    stopTimer();
    setTimeout(() => {
        finalTimeDisplay.textContent = timerDisplay.textContent;
        finalMovesDisplay.textContent = moveCount;
        modal.classList.remove('hidden');
        playSound('match');

        // 完了状態
        btnStart.disabled = true;
        btnStop.disabled = true;
    }, 500);
}

// イベントリスナー
btnStart.addEventListener('click', handleStart);
btnStop.addEventListener('click', handleStop);
btnReset.addEventListener('click', handleReset);
btnShuffle.addEventListener('click', handleReshuffle);

modalRestartBtn.addEventListener('click', () => {
    handleReset();
    handleStart(); // リスタートボタンなので即開始
});

difficultySelect.addEventListener('change', (e) => {
    currentDifficulty = e.target.value;
    initGame();
});

// ゲームロード時
document.addEventListener('DOMContentLoaded', initGame);
