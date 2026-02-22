/*
 * Memory Garden - Main Logic
 * 機能: ゲーム進行、カード生成、Web Audio Sound、タイマー
 */

// --- 定数と設定 ---
// 使用する植物の絵文字リスト (24種類)
const PLANT_EMOJIS = [
    '🌿', '🌸', '🌵', '🌻', '🌹', '🌷', '🌲', '🌳', 
    '🌴', '🍀', '🍁', '🍂', '🍄', '🌾', '🌺', '🌼', 
    '🎍', '🍃', '🪴', '🌱', '💐', '🎋', '🪵', '🍋'
];

// 難易度設定 (cards = 枚数)
const DIFFICULTY_SETTINGS = {
    'easy': { pairs: 4, cols: 4 },       // 8枚
    'normal': { pairs: 8, cols: 4 },     // 16枚
    'hard': { pairs: 12, cols: 6 },      // 24枚
    'super-hard': { pairs: 18, cols: 6 } // 36枚
};

// --- グローバル変数 ---
let currentDifficulty = 'normal';
let cards = [];             // 現在のゲームのカード配列
let flippedCards = [];      // 現在めくられているカード (最大2枚)
let matchedPairs = 0;       // マッチしたペアの数
let moveCount = 0;          // 手数
let timerInterval = null;   // タイマーID
let startTime = null;       // 開始時間
let isMuted = false;        // ミュート状態
let isLocked = false;       // カード操作ロック (判定中など)

// Web Audio API Context
let audioCtx = null;

// DOM要素の取得
const gameBoard = document.getElementById('game-board');
const difficultySelect = document.getElementById('difficulty');
const timerDisplay = document.getElementById('timer');
const movesDisplay = document.getElementById('moves');
const restartBtn = document.getElementById('restart-btn');
const muteBtn = document.getElementById('mute-btn');
const modal = document.getElementById('modal');
const modalRestartBtn = document.getElementById('modal-restart-btn');
const finalTimeDisplay = document.getElementById('final-time');
const finalMovesDisplay = document.getElementById('final-moves');

/*
 * --- Web Audio API 音響システム ---
 * 外部ファイルを使わず、ブラウザのシンセサイザー機能で音を生成します。
 */
function initAudio() {
    if (!audioCtx) {
        // クロスブラウザ対応
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
}

// BGM再生用 (単純なループ音)
let bgmOscillator = null;
let bgmGain = null;

function playBgm() {
    if (isMuted || bgmOscillator) return;
    initAudio();

    // 非常にシンプルで穏やかなドローン音 (Ambient Drone)
    // 複数のオシレーターを組み合わせて厚みを出す
    const t = audioCtx.currentTime;
    
    // 音の出口
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.05; // 音量は控えめに
    masterGain.connect(audioCtx.destination);
    bgmGain = masterGain;

    // ベース音 (Low)
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 220; // A3
    osc1.connect(masterGain);
    
    // ハーモニー (High) - ゆらぎを持たせる
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 329.63; // E4
    osc2.connect(masterGain);

    // LFOで音量をゆっくり揺らす (呼吸のような効果)
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2; // 5秒周期
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.02; // 音量変化の幅
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);

    osc1.start();
    osc2.start();
    lfo.start();

    // 停止用に関数を保持 (実際にはオブジェクトで管理する方が良いが簡易実装)
    bgmOscillator = { stop: () => { 
        osc1.stop(); osc2.stop(); lfo.stop();
        osc1.disconnect(); osc2.disconnect(); lfo.disconnect();
        bgmOscillator = null; 
    }};
}

function stopBgm() {
    if (bgmOscillator) {
        bgmOscillator.stop();
    }
}

// 効果音 (SE) 再生関数
function playSound(type) {
    if (isMuted) return;
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'flip') {
        // カードをめくる音: 短いクリック音
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);

    } else if (type === 'match') {
        // 正解: ピンポン (高音2回)
        osc.type = 'sine';
        // 1音目
        osc.frequency.setValueAtTime(1046, now); // C6
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        // 2音目を別のオシレーターで鳴らすほうが綺麗だが、簡易的に周波数を変える
        setTimeout(() => {
            const osc2 = audioCtx.createOscillator();
            const g2 = audioCtx.createGain();
            osc2.connect(g2);
            g2.connect(audioCtx.destination);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1318, audioCtx.currentTime); // E6
            g2.gain.setValueAtTime(0.1, audioCtx.currentTime);
            g2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.5);
        }, 150);

        osc.start(now);
        osc.stop(now + 0.2);

    } else if (type === 'mismatch') {
        // 不正解: ブブー (低音ノコギリ波)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}

// --- ゲームロジック ---

// ゲーム初期化
function initGame() {
    // 状態リセット
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moveCount = 0;
    isLocked = false;
    clearInterval(timerInterval);
    timerDisplay.textContent = '00:00';
    movesDisplay.textContent = '0';
    modal.classList.add('hidden');

    // データ生成
    const setting = DIFFICULTY_SETTINGS[currentDifficulty];
    const numPairs = setting.pairs;
    
    // 必要な数の絵文字をランダムに選ぶ
    // まず絵文字リストをシャッフル
    const shuffledEmojis = [...PLANT_EMOJIS].sort(() => 0.5 - Math.random());
    const selectedEmojis = shuffledEmojis.slice(0, numPairs);
    
    // ペアを作成 (A, A, B, B...)
    const deck = [...selectedEmojis, ...selectedEmojis];
    
    // デッキをシャッフル (Fisher-Yates algorithm)
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // HTML生成
    renderBoard(deck, setting.cols);
    
    // タイマースタート
    startTimer();

    // BGMスタート (ユーザー操作後でないと鳴らないブラウザ制限があるため、初回は何かクリック後に鳴る想定)
    // ここではリスタート時などに呼ばれるので再生を試みる
    if (!isMuted) playBgm();
}

// ボード描画
function renderBoard(deck, cols) {
    gameBoard.innerHTML = '';
    // グリッドのカラム数をCSSクラスで制御
    gameBoard.className = 'game-board ' + currentDifficulty;
    
    deck.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.index = index;
        card.dataset.emoji = emoji;

        // カードの内部構造 (3Dフリップ用)
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

// カードクリック時の処理
function handleCardClick(e) {
    const clickedCard = e.currentTarget;

    // すでにめくられている、マッチ済み、ロック中なら何もしない
    if (
        isLocked || 
        clickedCard.classList.contains('flipped') || 
        clickedCard.classList.contains('matched')
    ) {
        return;
    }

    // 初回インタラクションでAudioContextをResumeする (ブラウザポリシー対応)
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
        if(!isMuted && !bgmOscillator) playBgm();
    }

    // カードをめくる
    flipCard(clickedCard);
    playSound('flip');
    flippedCards.push(clickedCard);

    // 2枚めくったら判定
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

// マッチ判定
function checkForMatch() {
    isLocked = true; // 判定中は操作禁止
    
    const [card1, card2] = flippedCards;
    const emoji1 = card1.dataset.emoji;
    const emoji2 = card2.dataset.emoji;

    if (emoji1 === emoji2) {
        // 正解
        playSound('match');
        card1.classList.add('matched');
        card2.classList.add('matched');
        // flippedクラスは残したままにするか、matchedスタイルで上書きするか
        // ここではmatchedスタイルがflux状態を維持するようにCSSで制御済み
        
        matchedPairs++;
        flippedCards = [];
        isLocked = false;
        
        // クリア判定
        const setting = DIFFICULTY_SETTINGS[currentDifficulty];
        if (matchedPairs === setting.pairs) {
            gameFinished();
        }
    } else {
        // 不正解
        playSound('mismatch');
        // 少し待ってから裏返す
        setTimeout(() => {
            unflipCard(card1);
            unflipCard(card2);
            flippedCards = [];
            isLocked = false;
        }, 1000);
    }
}

// タイマー機能
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const delta = Math.floor((Date.now() - startTime) / 1000);
        const m = Math.floor(delta / 60).toString().padStart(2, '0');
        const s = (delta % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;
    }, 1000);
}

// ゲーム終了処理
function gameFinished() {
    clearInterval(timerInterval);
    setTimeout(() => {
        // リザルト表示
        finalTimeDisplay.textContent = timerDisplay.textContent;
        finalMovesDisplay.textContent = moveCount;
        modal.classList.remove('hidden');
        
        // BGM停止
        stopBgm();
        // ファンファーレ的な音を鳴らしてもよい
        playSound('match'); 
    }, 500);
}

// --- イベントリスナー設定 ---

// 難易度変更
difficultySelect.addEventListener('change', (e) => {
    currentDifficulty = e.target.value;
    initGame();
});

// リスタートボタン
restartBtn.addEventListener('click', initGame);
modalRestartBtn.addEventListener('click', initGame);

// ミュート切り替え
muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    if (isMuted) {
        muteBtn.textContent = '🔈 Sound OFF';
        stopBgm();
    } else {
        muteBtn.textContent = '🔊 Sound ON';
        playBgm();
    }
});

// 初期ロード時
window.addEventListener('DOMContentLoaded', () => {
    initGame();
});
