// ZenMixer Audio Logic (Fixed 3-Sound Version)

// State to track timer
let timerInterval = null;
let isFading = false;

// Sound IDs (Forest removed)
const soundIds = ['rain', 'bonfire', 'night'];

/**
 * Toggle play/pause for a specific sound
 * @param {string} id - The sound ID
 */
function toggleSound(id) {
    const audio = document.getElementById(`audio-${id}`);

    // If a fade out was successfully in progress, stop it so user can take control again
    if (isFading) {
        stopFade();
    }

    if (audio.paused) {
        audio.play()
            .then(() => {
                updateUI(id, true);
            })
            .catch(err => {
                console.error("Playback failed:", err);
                updateUI(id, false);
            });
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
        // Only play if not already playing
        if (audio.paused) {
            audio.play()
                .then(() => updateUI(id, true))
                .catch(e => console.error("Play all error:", e));
        }
    });
}

/**
 * Stop all sounds and reset UI to "Play"
 */
function stopAll() {
    soundIds.forEach(id => {
        const audio = document.getElementById(`audio-${id}`);

        audio.pause();
        audio.currentTime = 0; // Reset to start
        updateUI(id, false); // Force UI to "Play" state

        // Restore volume if it was faded out
        const slider = document.getElementById(`vol-${id}`);
        if (slider) {
            audio.volume = parseFloat(slider.value);
        }
    });

    if (isFading) {
        isFading = false;
    }

    // Stop timer logic
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        const startBtn = document.querySelector('.timer-btn');
        if (startBtn) startBtn.innerText = 'Start Timer';
    }
}

// Helper: Stop fading flag
function stopFade() {
    isFading = false;
}

/**
 * Start the countdown timer
 */
function startTimer() {
    // Reset any existing timer
    stopTimerOnly();

    const input = document.getElementById('timer-input');
    const startBtn = document.querySelector('.timer-btn');

    let minutes = parseInt(input.value);
    if (isNaN(minutes) || minutes <= 0) {
        alert("有効な時間を入力してください (1分以上)");
        return;
    }

    let totalSeconds = minutes * 60;

    startBtn.innerText = 'Restart'; // Indicate it's running
    updateDisplay(totalSeconds);

    timerInterval = setInterval(() => {
        totalSeconds--;

        if (totalSeconds < 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            updateDisplay(0);
            fadeOutAndStop(); // Start fade out sequence
            return;
        }

        updateDisplay(totalSeconds);
    }, 1000);
}

/**
 * Helper to clear timer interval without stopping audio immediately
 * (Used when restarting timer)
 */
function stopTimerOnly() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * Update the timer display (MM:SS)
 * @param {number} seconds 
 */
function updateDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const display = document.getElementById('timer-display');
    if (display) {
        display.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
}

/**
 * Fade out sounds over 3 seconds then stop everything
 */
function fadeOutAndStop() {
    isFading = true;
    const fadeDuration = 3000; // 3 seconds
    const steps = 30; // 10 steps per second approx (100ms interval)
    const stepTime = fadeDuration / steps;

    let currentStep = 0;

    const fadeInterval = setInterval(() => {
        // If user cancelled fade by interaction, abort fade loop
        if (!isFading) {
            clearInterval(fadeInterval);
            return;
        }

        currentStep++;
        const factor = 1 - (currentStep / steps); // linear fade: 1.0 -> 0.0

        soundIds.forEach(id => {
            const audio = document.getElementById(`audio-${id}`);
            const slider = document.getElementById(`vol-${id}`);

            if (!audio.paused && slider) {
                const originalVol = parseFloat(slider.value);
                audio.volume = originalVol * factor;
            }
        });

        if (currentStep >= steps) {
            clearInterval(fadeInterval);
            stopAll(); // Final stop: resets Play buttons, restores volumes

            // Reset timer button text
            const startBtn = document.querySelector('.timer-btn');
            if (startBtn) startBtn.innerText = 'Start Timer';
        }
    }, stepTime);
}
