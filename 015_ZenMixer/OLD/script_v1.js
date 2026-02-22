// ZenMixer Audio Logic

// State to track timer
let timerInterval = null;

// Sound IDs used in HTML
const soundIds = ['rain', 'bonfire', 'forest', 'night'];

/**
 * Toggle play/pause for a specific sound
 * @param {string} id - The sound ID (e.g., 'rain')
 */
function toggleSound(id) {
    const audio = document.getElementById(`audio-${id}`);
    const card = document.getElementById(`card-${id}`);
    const button = card.querySelector('.toggle-btn');

    if (audio.paused) {
        audio.play();
        card.classList.add('active');
        button.innerText = 'Stop';
    } else {
        audio.pause();
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
    soundIds.forEach(id => {
        const audio = document.getElementById(`audio-${id}`);
        // Only play if not already playing to avoid resetting start time or glitches
        if (audio.paused) {
            toggleSound(id);
        }
    });
}

/**
 * Stop all sounds
 */
function stopAll() {
    soundIds.forEach(id => {
        const audio = document.getElementById(`audio-${id}`);
        const card = document.getElementById(`card-${id}`);
        const button = card.querySelector('.toggle-btn');

        if (!audio.paused) {
            audio.pause();
            // Reset to beginning if desired, or just pause. 
            // Often just pause is better for resuming, but 'Stop' implies reset? 
            // Let's just pause for this simple mixer.
            audio.currentTime = 0; 
            
            card.classList.remove('active');
            button.innerText = 'Play';
        }
    });
    
    // Also stop timer if running
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        document.querySelector('.timer-btn').innerText = 'Start Timer';
    }
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
    const fadeDuration = 3000; // 3 seconds
    const steps = 30; // Number of steps
    const stepTime = fadeDuration / steps;

    // Store initial volumes to potentially restore them later or just fade from current
    // We will just fade the actual volume property down to 0
    
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
        currentStep++;
        const factor = 1 - (currentStep / steps); // 0.9, 0.8 ... 0

        soundIds.forEach(id => {
            const audio = document.getElementById(`audio-${id}`);
            const slider = document.getElementById(`vol-${id}`);
            
            // Calculate new volume based on slider value (max volume user set)
            // But to keep it simple, we just scale existing volume
            // Actually, modifying audio.volume directly is easiest
            // But we must remember the user's slider position might be different if we just used it as max
            
            // To do it right: use the slider value as the 'target max', and reduce from THAT.
            // But `audio.volume` might already be lower if we started fade from middle.
            
            // Simpler approach: Just reduce current volume
            if (!audio.paused) {
                 // We don't have the "original" volume easily unless we store it.
                 // Let's just linearly reduce whatever it is? 
                 // No, that's tricky. 
                 
                 // Better: Use the slider value as the reference.
                 const originalVol = parseFloat(slider.value);
                 audio.volume = originalVol * factor;
            }
        });

        if (currentStep >= steps) {
            clearInterval(fadeInterval);
            stopAll();
            // Restore volumes to slider values so user isn't confused next time they press play
            soundIds.forEach(id => {
                const slider = document.getElementById(`vol-${id}`);
                const audio = document.getElementById(`audio-${id}`);
                audio.volume = parseFloat(slider.value);
            });
        }
    }, stepTime);
}
