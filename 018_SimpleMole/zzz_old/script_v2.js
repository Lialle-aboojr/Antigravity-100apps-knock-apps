// Game Configuration
const CONFIG = {
    duration: 30, // Total Game Duration (sec)
    phases: {
        normal: { end: 16, name: 'FAST' }, // 30-16
        chaos: { end: 11, name: 'CHAOS' },  // 15-11
        fever: { end: 0, name: 'FEVER!!' }  // 10-0
    },
    spawnRates: {
        normal: { min: 800, max: 1200, stayMin: 800, stayMax: 1000 },
        chaos: { min: 600, max: 1000, stayMin: 700, stayMax: 900 },
        fever: { min: 300, max: 600, stayMin: 400, stayMax: 700 }
    },
    probs: {
        normal: { mole: 100, bomb: 0, heart: 0 },
        chaos: { mole: 70, bomb: 30, heart: 0 },
        fever: { mole: 50, bomb: 30, heart: 20 }
    }
};

// State
let score = 0;
let timeLeft = CONFIG.duration;
let timeUp = false;
let isPlaying = false;
let currentPhase = 'normal';
let spawnTimeout;
let gameTimer;
let audioCtx = null;

// DOM Elements
const holes = document.querySelectorAll('.hole');
const scoreBoard = document.querySelector('.score');
const timeLeftDisplay = document.querySelector('.time-left');
const phaseDisplay = document.querySelector('#phase-display');
const startBtn = document.querySelector('#start-btn');
const body = document.body;

// ================= AUDIO SYSTEM (Web Audio API) =================
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'mole') {
        // Bonk sound (Triangle wave, quick pitch drop)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gainNode.gain.setValueAtTime(1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'bomb') {
        // Explosion sound (Sawtooth, low pitch, longer decay)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
        gainNode.gain.setValueAtTime(1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'heart') {
        // Sparkle sound (Sine, high pitch arpeggio effect via multiple oscillators? tailored simply here)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}

// ================= GAME LOGIC =================

function randomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
    // 既にモグラが出ている穴を除外して候補を作成
    const available = Array.from(holes).filter(h => !h.classList.contains('up'));

    if (available.length === 0) return null; // 空きがない場合はnullを返す

    const idx = Math.floor(Math.random() * available.length);
    return available[idx];
}

function getPhase(time) {
    if (time > CONFIG.phases.normal.end) return 'normal';
    if (time > CONFIG.phases.chaos.end) return 'chaos';
    return 'fever';
}

function updatePhaseDisplay() {
    phaseDisplay.textContent = CONFIG.phases[currentPhase].name;

    // Update Body Class for visual cues
    body.classList.remove('chaos-mode', 'fever-mode');
    if (currentPhase === 'chaos') body.classList.add('chaos-mode');
    if (currentPhase === 'fever') body.classList.add('fever-mode');
}

function getType() {
    const rand = Math.random() * 100;
    const p = CONFIG.probs[currentPhase];

    if (rand < p.mole) return 'mole';
    if (rand < p.mole + p.bomb) return 'bomb';
    return 'heart';
}

function spawn() {
    if (timeUp) return;

    const hole = randomHole(holes);
    const rates = CONFIG.spawnRates[currentPhase];
    const nextSpawnTime = randomTime(rates.min, rates.max);

    // 空き穴がある場合のみ出現処理を行う
    if (hole) {
        const type = getType();
        const time = randomTime(rates.stayMin, rates.stayMax);

        // Setup character
        const charDiv = hole.querySelector('.character');
        charDiv.className = 'character ' + type;

        hole.classList.add('up');

        // Schedule removal
        setTimeout(() => {
            hole.classList.remove('up');
        }, time);
    }

    // Schedule next spawn independent of whether this one succeeded
    spawnTimeout = setTimeout(spawn, nextSpawnTime);
}

function startGame() {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    scoreBoard.textContent = 0;
    score = 0;
    timeUp = false;
    isPlaying = true;
    timeLeft = CONFIG.duration;
    timeLeftDisplay.textContent = timeLeft;
    startBtn.disabled = true;

    // Clear any existing state
    body.className = '';
    holes.forEach(h => h.classList.remove('up'));

    currentPhase = getPhase(timeLeft);
    updatePhaseDisplay();

    // Start Timer
    gameTimer = setInterval(() => {
        timeLeft--;
        timeLeftDisplay.textContent = timeLeft;

        // Check Phase Change
        const nextPhase = getPhase(timeLeft);
        if (nextPhase !== currentPhase) {
            currentPhase = nextPhase;
            updatePhaseDisplay();
        }

        if (timeLeft <= 0) {
            clearInterval(gameTimer);
            timeUp = true;
            isPlaying = false;
            startBtn.disabled = false;
            body.className = ''; // Reset visuals
            alert('Game Over!\nScore: ' + score);
        }
    }, 1000);

    // Start Spawing
    spawn();
}

function bonk(e) {
    if (!e.isTrusted) return;

    const character = this.querySelector('.character');
    if (!this.classList.contains('up')) return;

    let points = 0;
    // Check type based on class
    if (character.classList.contains('mole')) {
        points = 1;
        playSound('mole');
    } else if (character.classList.contains('bomb')) {
        points = -1;
        playSound('bomb');
        // Visual feedback for bomb
        document.querySelector('.game').classList.add('shake');
        setTimeout(() => document.querySelector('.game').classList.remove('shake'), 300);
    } else if (character.classList.contains('heart')) {
        points = 3;
        playSound('heart');
    }

    score += points;
    scoreBoard.textContent = score;

    this.classList.remove('up');
}

holes.forEach(hole => hole.addEventListener('click', bonk));
