/*
 * Memory Garden - Main Logic
 * 機能: ゲーム進行、カード生成、Web Audio Sound (Pentatonic Pad), タイマー
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
let timerInterval = null;
let startTime = null;

// 追加: ゲーム状態管理
let gameStarted = false; // スタートボタンを押したかどうか
let isMuted = true;      // 初期状態はミュート(OFF)

// DOM要素
const gameBoard = document.getElementById('game-board');
const difficultySelect = document.getElementById('difficulty');
const timerDisplay = document.getElementById('timer');
const movesDisplay = document.getElementById('moves');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const soundToggleBtn = document.getElementById('sound-toggle');
const modal = document.getElementById('modal');
const modalRestartBtn = document.getElementById('modal-restart-btn');
const finalTimeDisplay = document.getElementById('final-time');
const finalMovesDisplay = document.getElementById('final-moves');

/*
 * --- Web Audio API Design: Gentle Pad & Soft SE ---
 */
let audioCtx = null;
let bgmNodes = []; // オシレーターとゲインノードを保持

function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
}

// BGM: ペンタトニックスケール (C Major Pentatonic: C, D, E, G, A)
// ここでは優しく響く和音として Cadd9 っぽい構成 (C, E, G, D) や 
// シンプルな C Major (C, E, G) + A (C6) などを採用
// 構成音: C4(261.63), E4(329.63), G4(392.00), A4(440.00)
function playGentlePad() {
    if (isMuted || bgmNodes.length > 0) return;
    initAudio();

    const t = audioCtx.currentTime;
    const masterGain = audioCtx.createGain();
    // 全体の音量をかなり絞る (BGMなので主張しすぎない)
    masterGain.gain.setValueAtTime(0, t);
    masterGain.gain.linearRampToValueAtTime(0.04, t + 2); // 2秒かけてフェードイン
    masterGain.connect(audioCtx.destination);

    // 和音の周波数リスト
    const frequencies = [261.63, 329.63, 392.00, 440.00]; // C4, E4, G4, A4

    const nodes = [];

    frequencies.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        // 正弦波 (sine) は丸くて柔らかい音
        // 三角波 (triangle) を少し混ぜるとキラキラ感が出るが、
        // 今回は「耳鳴りのしない」要望なので Sine をベースにする
        osc.type = 'sine';
        osc.frequency.value = freq;

        // 微妙にデチューンさせて厚みを出す
        const detune = (Math.random() - 0.5) * 4; // -2 ~ +2 cents
        osc.detune.value = detune;

        // 各オシレーターにLFOをかけて揺らぎを作る
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1 + (Math.random() * 0.1); // ゆったりした周期

        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.3; // 揺れ幅

        // メインの音量調整用ゲイン
        const oscGain = audioCtx.createGain();
        oscGain.gain.value = 0.8; // 個別の音量

        // 接続: LFO -> OscGain.gain -> Master
        lfo.connect(lfoGain);
        lfoGain.connect(oscGain.gain);

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start();
        lfo.start();

        nodes.push({ osc, lfo, oscGain });
    });

    bgmNodes = nodes;
    bgmNodes.master = masterGain; // 停止時のフェードアウト用に保持
}

function stopBgm() {
    if (bgmNodes.length > 0 && bgmNodes.master) {
        const t = audioCtx.currentTime;
        // フェードアウト
        bgmNodes.master.gain.setValueAtTime(bgmNodes.master.gain.value, t);
        bgmNodes.master.gain.linearRampToValueAtTime(0, t + 1); // 1秒かけて消す

        const nodesToStop = [...bgmNodes];
        bgmNodes = []; // 参照を切る

        setTimeout(() => {
            nodesToStop.forEach(n => {
                n.osc.stop();
                n.lfo.stop();
                n.osc.disconnect();
            });
            nodesToStop.master.disconnect();
        }, 1100);
    }
}

// SE: 柔らかい効果音
function playSound(type) {
    if (isMuted) return;
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
        // 1音目
        playTone(523.25, t, 0.3); // C5
        // 2音目
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

// 初期化（ページロード時、またはリセット時）
function initGame(autoStart = false) {
    // 状態クリア
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moveCount = 0;
    gameStarted = autoStart; // 自動開始フラグがなければFalse(待機状態)

    clearInterval(timerInterval);
    timerDisplay.textContent = '00:00';
    movesDisplay.textContent = '0';

    // UI状態
    modal.classList.add('hidden');
    gameBoard.className = 'game-board ' + currentDifficulty;

    if (gameStarted) {
        gameBoard.classList.remove('locked');
        startBtn.classList.add('hidden');
        restartBtn.classList.remove('hidden');
        difficultySelect.disabled = true; // ゲーム中は変更不可
    } else {
        gameBoard.classList.add('locked'); // ロック状態
        startBtn.classList.remove('hidden');
        restartBtn.classList.add('hidden');
        difficultySelect.disabled = false;
        stopBgm(); // 待機中はBGMなし
    }

    // データ生成
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

    // カード配置
    gameBoard.innerHTML = '';
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

    if (gameStarted) {
        startTimer();
        if (!isMuted) playGentlePad();
    }
}

// ゲーム開始アクション
function startGame() {
    gameStarted = true;
    gameBoard.classList.remove('locked');
    startBtn.classList.add('hidden');
    restartBtn.classList.remove('hidden');
    difficultySelect.disabled = true;

    // オーディオコンテキスト再開 (ユーザー操作起点)
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    startTimer();
    if (!isMuted) playGentlePad();
}

function handleCardClick(e) {
    // ゲーム開始前またはロック中は反応しない
    if (!gameStarted || gameBoard.classList.contains('locked')) return;

    const clickedCard = e.currentTarget;
    if (
        flippedCards.length >= 2 ||
        clickedCard.classList.contains('flipped') ||
        clickedCard.classList.contains('matched')
    ) {
        return;
    }

    // 初回操作時の念押しResume
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
        // 操作ブロック用 (gameBoardに一時的にlockedをつける手もあるが、
        // flippedCards.lengthチェックで十分制御できている)
        setTimeout(() => {
            unflipCard(card1);
            unflipCard(card2);
            flippedCards = [];
        }, 1000);
    }
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const delta = Math.floor((Date.now() - startTime) / 1000);
        const m = Math.floor(delta / 60).toString().padStart(2, '0');
        const s = (delta % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;
    }, 1000);
}

function gameFinished() {
    clearInterval(timerInterval);
    setTimeout(() => {
        finalTimeDisplay.textContent = timerDisplay.textContent;
        finalMovesDisplay.textContent = moveCount;
        modal.classList.remove('hidden');
        stopBgm();
        playSound('match'); // ファンファーレ代わり
    }, 500);
}

// --- イベントリスナー ---

startBtn.addEventListener('click', startGame);

restartBtn.addEventListener('click', () => {
    // リスタート時は即座にゲーム開始状態にする
    initGame(true);
});

modalRestartBtn.addEventListener('click', () => {
    // モーダルからのリスタートも即開始
    initGame(true);
});

difficultySelect.addEventListener('change', (e) => {
    currentDifficulty = e.target.value;
    // 難易度変更時は未開始状態でリセット
    initGame(false);
});

soundToggleBtn.addEventListener('click', () => {
    isMuted = !isMuted;

    // アイコン切り替え
    if (isMuted) {
        soundToggleBtn.textContent = '🔇 Sound OFF';
        stopBgm();
    } else {
        soundToggleBtn.textContent = '🔊 Sound ON';
        // ゲーム中ならBGM再開
        if (gameStarted) {
            playGentlePad();
        }
    }
});

// 初回読み込み
initGame(false);
