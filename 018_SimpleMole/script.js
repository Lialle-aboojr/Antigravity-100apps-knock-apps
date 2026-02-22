// Game Configuration
const CONFIG = {
    duration: 30, // Total Game Duration (sec)
    phases: {
        normal: { end: 16, name: 'NORMAL' }, // 30-16
        chaos: { end: 11, name: 'CHAOS!' },  // 15-11
        fever: { end: 0, name: 'FEVER!!' }   // 10-0
    },
    difficulty: {
        easy: { min: 1200, max: 1800, stayMin: 1200, stayMax: 1500 },
        normal: { min: 600, max: 1000, stayMin: 700, stayMax: 1000 },
        hard: { min: 200, max: 500, stayMin: 350, stayMax: 600 }
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
let isMuted = true; // Default Mute
let bgmOscillators = [];
let nextNoteTime = 0;
let bgmTimer = null;
let currentDifficulty = 'normal';

// DOM Elements
const holes = document.querySelectorAll('.hole');
const scoreBoard = document.querySelector('.score');
const timeLeftDisplay = document.querySelector('.time-left');
const phaseDisplay = document.querySelector('#phase-display');
const startBtn = document.querySelector('#start-btn');
const soundBtn = document.querySelector('#sound-toggle');
const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
const body = document.body;

// ================= AUDIO SYSTEM (Web Audio API) =================
// Simple 8-bit Arpeggio Notes (C Major)
const BGM_NOTES = [
    261.63, 329.63, 392.00, 523.25, // C4, E4, G4, C5
    329.63, 392.00, 523.25, 659.25, // E4, G4, C5, E5
    392.00, 523.25, 659.25, 783.99, // G4, C5, E5, G5
    523.25, 392.00, 329.63, 261.63  // C5, G4, E4, C4
];
let noteIndex = 0;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function toggleSound() {
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    isMuted = !isMuted;

    if (isMuted) {
        soundBtn.textContent = "🔇 Sound OFF";
        soundBtn.classList.remove('on');
        stopBGM();
    } else {
        soundBtn.textContent = "🔊 Sound ON";
        soundBtn.classList.add('on');
        if (isPlaying) startBGM();
    }
}

// BGM Scheduler
function playBGMNote() {
    if (isMuted || !isPlaying) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'square'; // 8-bit feel
    osc.frequency.value = BGM_NOTES[noteIndex];

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    const duration = 0.15; // Short staccato notes

    gainNode.gain.setValueAtTime(0.03, now); // Low volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);

    noteIndex = (noteIndex + 1) % BGM_NOTES.length;
}

function startBGM() {
    if (isMuted || !isPlaying) return;
    if (bgmTimer) clearInterval(bgmTimer);
    noteIndex = 0;
    bgmTimer = setInterval(playBGMNote, 200); // 300 BPM arpeggio
}

function stopBGM() {
    if (bgmTimer) {
        clearInterval(bgmTimer);
        bgmTimer = null;
    }
}

function playSound(type) {
    if (isMuted || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'mole') {
        // PingPong (Sine, High, crisp)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1); // A6
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'bomb') {
        // Buzzer (Sawtooth, Low, Discordant)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'heart') {
        // Sparkle (Sine, Arpeggio-like sweep)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(2000, now + 0.4);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now); // Main tone
        osc.stop(now + 0.5);

        // overtone
        const osc2 = audioCtx.createOscillator();
        const g2 = audioCtx.createGain();
        osc2.connect(g2);
        g2.connect(audioCtx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(2400, now);
        osc2.frequency.linearRampToValueAtTime(4000, now + 0.4);
        g2.gain.setValueAtTime(0.1, now);
        g2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc2.start(now);
        osc2.stop(now + 0.4);
    }
}

// ================= GAME LOGIC =================

function randomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
    // Use holes that are not active
    const available = Array.from(holes).filter(h => !h.classList.contains('up'));
    if (available.length === 0) return null;
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

function getSettings() {
    const diffSetting = document.querySelector('input[name="difficulty"]:checked').value;
    currentDifficulty = diffSetting;
    return CONFIG.difficulty[diffSetting];
}

function spawn() {
    if (timeUp) return;

    const hole = randomHole(holes);
    const settings = getSettings(); // Dynamic difficulty fetching

    // Calculate next spawn interval based on difficulty and phase
    // We apply a multiplier for Chaos/Fever to make them denser regardless of difficulty
    let densityMultiplier = 1;
    if (currentPhase === 'chaos') densityMultiplier = 0.8;
    if (currentPhase === 'fever') densityMultiplier = 0.6;

    const nextSpawnTime = randomTime(settings.min * densityMultiplier, settings.max * densityMultiplier);

    if (hole) {
        const type = getType();

        // DISPLAY DURATION LOGIC
        let stayTime = randomTime(settings.stayMin, settings.stayMax);

        // Fix: Heart stays longer
        if (type === 'heart') {
            stayTime = stayTime * 2.0; // 2x longer for Hearts
        }

        const charDiv = hole.querySelector('.character');
        charDiv.className = 'character ' + type;

        hole.classList.add('up');

        setTimeout(() => {
            hole.classList.remove('up');
            if (hole.classList.contains('bonked')) {
                hole.classList.remove('bonked');
            }
        }, stayTime);
    }

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

    // Disable difficulty selection during game
    difficultyRadios.forEach(r => r.disabled = true);

    // Clear state
    holes.forEach(h => {
        h.classList.remove('up');
        h.classList.remove('bonked');
    });

    currentPhase = getPhase(timeLeft);
    updatePhaseDisplay();
    startBGM();

    // Timer
    gameTimer = setInterval(() => {
        timeLeft--;
        timeLeftDisplay.textContent = timeLeft;

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
            stopBGM();
            difficultyRadios.forEach(r => r.disabled = false);
            body.className = '';
            alert('Game Over!\nScore: ' + score);
        }
    }, 1000);

    spawn();
}

function bonk(e) {
    if (!e.isTrusted) return;

    // Prevent multiple clicks on same pop
    if (this.classList.contains('bonked')) return;

    const character = this.querySelector('.character');
    if (!this.classList.contains('up')) return;

    let points = 0;
    if (character.classList.contains('mole')) {
        points = 1;
        playSound('mole');
        this.classList.add('bonked');
    } else if (character.classList.contains('bomb')) {
        points = -1;
        playSound('bomb');
        // Bomb effect
        document.querySelector('.game').classList.add('shake');
        setTimeout(() => document.querySelector('.game').classList.remove('shake'), 300);
        // Don't mark bonked immediately so they might click it twice by accident? 
        // Usually bomb should disappear too or just penalty. Let's make it disappear.
        this.classList.add('bonked');
    } else if (character.classList.contains('heart')) {
        points = 3;
        playSound('heart');
        this.classList.add('bonked');
    }

    score += points;
    scoreBoard.textContent = score;

    // Visual feedback: remove 'up' class immediately to hide
    setTimeout(() => this.classList.remove('up'), 100);
}

// Event Listeners
soundBtn.addEventListener('click', toggleSound);
holes.forEach(hole => hole.addEventListener('mousedown', bonk)); // mousedown for faster reaction than click
holes.forEach(hole => hole.addEventListener('touchstart', bonk)); // touch support
