/**
 * Emoji Battle Arena Logic (Final Version)
 * ユーザー対CPUのじゃんけんゲーム。
 * デザイン: グラスモーフィズム + 標準絵文字 (Large Size)
 * 機能: Web Audio APIサウンド, 連勝記録
 */

// 定数定義
const HANDS = {
    ROCK: 'rock',
    SCISSORS: 'scissors',
    PAPER: 'paper'
};

// 標準絵文字定義
const EMOJIS = {
    [HANDS.ROCK]: '✊',
    [HANDS.SCISSORS]: '✌️',
    [HANDS.PAPER]: '✋'
};

// ゲーム状態
let state = {
    streak: 0,
    isSoundOn: false,
    isProcessing: false
};

/**
 * サウンド管理クラス
 */
class SoundManager {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(type, freq, duration, startTime = 0) {
        if (!state.isSoundOn || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime + startTime;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }

    playSelect() { this.playTone('sine', 880, 0.1); }

    playWin() {
        this.playTone('triangle', 523.25, 0.2, 0);
        this.playTone('triangle', 659.25, 0.2, 0.1);
        this.playTone('triangle', 783.99, 0.2, 0.2);
        this.playTone('triangle', 1046.50, 0.4, 0.3);
    }

    playLose() {
        this.playTone('sawtooth', 392.00, 0.3, 0);
        this.playTone('sawtooth', 369.99, 0.3, 0.2);
        this.playTone('sawtooth', 349.23, 0.6, 0.4);
    }

    playDraw() {
        this.playTone('square', 440, 0.1, 0);
        this.playTone('square', 440, 0.1, 0.15);
    }
}

const soundManager = new SoundManager();

// DOM要素
const els = {
    streakCount: document.getElementById('streakCount'),
    cpuHand: document.getElementById('cpuHand'),
    userHand: document.getElementById('userHand'),
    resultMessage: document.getElementById('resultMessage'),
    handBtns: document.querySelectorAll('.hand-btn'),
    soundToggle: document.getElementById('soundLibToggle'),
    soundIcon: document.getElementById('soundIcon')
};

// 初期表示更新
els.userHand.textContent = '✊'; // 初期アイコンとして何か置いておく
els.cpuHand.textContent = '✊';

// イベント
els.soundToggle.addEventListener('click', toggleSound);
els.handBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const hand = e.target.closest('.hand-btn').dataset.hand;
        playRound(hand);
    });
});

function toggleSound() {
    state.isSoundOn = !state.isSoundOn;
    els.soundIcon.textContent = state.isSoundOn ? '🔊' : '🔇';
    if (state.isSoundOn) {
        soundManager.init();
        soundManager.playSelect();
    }
}

function getComputerChoice() {
    const choices = Object.values(HANDS);
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
}

function determineWinner(p1, p2) {
    if (p1 === p2) return 'draw';
    if (
        (p1 === HANDS.ROCK && p2 === HANDS.SCISSORS) ||
        (p1 === HANDS.PAPER && p2 === HANDS.ROCK) ||
        (p1 === HANDS.SCISSORS && p2 === HANDS.PAPER)
    ) {
        return 'win';
    }
    return 'lose';
}

async function playRound(userChoice) {
    if (state.isProcessing) return;
    state.isProcessing = true;

    soundManager.init();
    soundManager.playSelect();

    // 1. ユーザー選択反映
    els.userHand.textContent = EMOJIS[userChoice];
    els.cpuHand.textContent = '✊'; // シェイク用

    // クラスリセット (アニメーション除去)
    els.resultMessage.classList.add('hidden');
    els.resultMessage.className = 'result-message hidden';
    els.userHand.className = 'emoji-display';
    els.cpuHand.className = 'emoji-display';

    // 2. シェイク
    els.userHand.parentElement.classList.add('shake');
    els.cpuHand.parentElement.classList.add('shake');

    await new Promise(r => setTimeout(r, 500));

    els.userHand.parentElement.classList.remove('shake');
    els.cpuHand.parentElement.classList.remove('shake');

    // 3. 結果
    const cpuChoice = getComputerChoice();
    els.cpuHand.textContent = EMOJIS[cpuChoice];

    const result = determineWinner(userChoice, cpuChoice);

    handleResult(result);

    state.isProcessing = false;
}

function handleResult(result) {
    let message = '';
    let soundFn = null;

    els.resultMessage.className = 'result-message pop-in';

    // 勝者にアニメーション付与
    if (result === 'win') {
        els.userHand.classList.add('winner-anim');
        els.cpuHand.classList.add('loser-anim');
        state.streak++;
        message = 'YOU WIN!';
        els.resultMessage.classList.add('win');
        soundFn = () => soundManager.playWin();
    } else if (result === 'lose') {
        els.userHand.classList.add('loser-anim');
        els.cpuHand.classList.add('winner-anim');
        state.streak = 0;
        message = 'YOU LOSE...';
        els.resultMessage.classList.add('lose');
        soundFn = () => soundManager.playLose();
    } else {
        message = 'DRAW';
        els.resultMessage.classList.add('draw');
        soundFn = () => soundManager.playDraw();
    }

    els.resultMessage.textContent = message;
    els.resultMessage.classList.remove('hidden');
    els.streakCount.textContent = state.streak;

    if (soundFn) soundFn();
}
