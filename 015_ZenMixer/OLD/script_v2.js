// ZenMixer Audio Logic (Fixed Version)

// State to track timer
let timerInterval = null;
let isFading = false;

// Sound IDs used in HTML
const soundIds = ['rain', 'bonfire', 'forest', 'night'];

/**
 * Toggle play/pause for a specific sound
 * @param {string} id - The sound ID (e.g., 'rain')
 */
function toggleSound(id) {
    const audio = document.getElementById(`audio-${id}`);

    // Stop fading if user interacts manually
    if (isFading) {
        stopFade();
    }

    if (audio.paused) {
        audio.play();
        updateUI(id, true);
    } else {
        audio.pause();
        updateUI(id, false);
    }
}

/**
 * Update the UI (Button text & Card style) for a specific sound
 * @param {string} id 
 * @param {boolean} isPlaying 
 */
function updateUI(id, isPlaying) {
    const card = document.getElementById(`card-${id}`);
    const button = card.querySelector('.toggle-btn');

    if (isPlaying) {
        card.classList.add('active');
        button.innerText = 'Stop';
    } else {
        card.classList.remove('active');
        button.innerText = 'Play';
    }
}

/**
 * Set the volume for a specific sound
 * @param {string} id - The sound ID
 * @param {number} value - Volume level (0.0 - 1.0)
 */
function setVolume(id, value) {
    const audio = document.getElementById(`audio-${id}`);
    audio.volume = value;
}

/**
 * Play all sounds
 */
function playAll() {
    if (isFading) stopFade();

    soundIds.forEach(id => {
        const audio = document.getElementById(`audio-${id}`);
        if (audio.paused) {
            audio.play().then(() => {
                updateUI(id, true);
            }).catch(e => console.error("Audio play failed:", e));
        }
    });
}

/**
 * Stop all sounds and reset UI
 */
function stopAll() {
    soundIds.forEach(id => {
        const audio = document.getElementById(`audio-${id}`);

        audio.pause();
        audio.currentTime = 0; // Reset playback position
        updateUI(id, false); // Force UI to "Play" state

        // Restore volume if it was faded
        const slider = document.getElementById(`vol-${id}`);
        audio.volume = slider.value;
    });

    if (isFading) {
        isFading = false;
    }

    // Stop timer if running
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        document.querySelector('.timer-btn').innerText = 'Start Timer';
    }
}

// Helper to stop fading explicitly
function stopFade() {
    isFading = false;
    // We don't clear interval here because the fade loop checks the flag or just finishes
    // But to be safe, we rely on the fade loop to exit or soundIds loop to overwrite volume
}

/**
 * Start the countdown timer
 */
function startTimer() {
    // Clear existing timer if any
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    const input = document.getElementById('timer-input');
    const display = document.getElementById('timer-display');
    const startBtn = document.querySelector('.timer-btn');

    let minutes = parseInt(input.value);
    if (isNaN(minutes) || minutes <= 0) {
        alert("有効な時間を入力してください (1分以上)");
        return;
    }

    let totalSeconds = minutes * 60;

    startBtn.innerText = 'Restart';
    updateDisplay(totalSeconds);

    timerInterval = setInterval(() => {
        totalSeconds--;

        if (totalSeconds < 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            fadeOutAndStop();
            startBtn.innerText = 'Start Timer';
            display.innerText = "00:00";
            return;
        }

        updateDisplay(totalSeconds);
    }, 1000);
}

/**
 * Update the timer display (MM:SS)
 * @param {number} seconds 
 */
function updateDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const display = document.getElementById('timer-display');
    display.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Fade out sounds over 3 seconds then stop
 */
function fadeOutAndStop() {
    isFading = true;
    const fadeDuration = 3000; // 3 seconds
    const steps = 30; // Number of steps
    const stepTime = fadeDuration / steps;

    let currentStep = 0;

    const fadeInterval = setInterval(() => {
        // If user stopped fade manually (by pressing play/stop), exit
        if (!isFading) {
            clearInterval(fadeInterval);
            return;
        }

        currentStep++;
        const factor = 1 - (currentStep / steps); // 0.9, 0.8 ... 0

        soundIds.forEach(id => {
            const audio = document.getElementById(`audio-${id}`);
            const slider = document.getElementById(`vol-${id}`);

            if (!audio.paused) {
                const originalVol = parseFloat(slider.value);
                audio.volume = originalVol * factor;
            }
        });

        if (currentStep >= steps) {
            clearInterval(fadeInterval);
            stopAll(); // This will reset volumes and UI
        }
    }, stepTime);
}
