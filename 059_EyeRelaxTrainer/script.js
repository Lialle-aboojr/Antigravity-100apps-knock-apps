/**
 * EyeRelax Trainer - Main Script
 * Handles navigation, timers, and the 3 training modes (Eye Tracking, Gabor Patch, Blink Training).
 * No external images are used; all graphics are generated via Canvas/DOM.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Utility / Security ---
    // Sanitize text output just in case (though we mostly use textContent anyway)
    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- Global State ---
    let globalTimerInterval = null;
    let timeRemaining = 0; // in seconds
    let isTimerRunning = false;
    let audioContext = null;

    // View Elements
    const views = {
        trackingView: document.getElementById('trackingView'),
        gaborView: document.getElementById('gaborView'),
        blinkView: document.getElementById('blinkView')
    };

    // --- Navigation ---
    const menuBtns = document.querySelectorAll('.menu-btn');
    menuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update Active Menu Button
            menuBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');

            // Switch View Panel
            const targetId = btn.getAttribute('data-target');
            Object.values(views).forEach(view => view.classList.add('hidden'));
            if (views[targetId]) {
                views[targetId].classList.remove('hidden');
            }

            // Reset current active training and timer
            stopAllTrainings();
            resetTimerUI();
        });
    });

    // --- Global Timer Logic ---
    const durationBtns = document.querySelectorAll('.duration-btn');
    const timeValueDisplay = document.querySelector('.time-value');
    let selectedDuration = 60; // default 1 min

    durationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            durationBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDuration = parseInt(btn.getAttribute('data-time'), 10);
            resetTimerUI();
        });
    });

    function resetTimerUI() {
        clearInterval(globalTimerInterval);
        isTimerRunning = false;
        timeRemaining = selectedDuration;
        updateTimerDisplay();
        timeValueDisplay.classList.remove('urgent');
    }

    function updateTimerDisplay() {
        if (selectedDuration === 0) {
            timeValueDisplay.textContent = '--:--';
            return;
        }
        const m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
        const s = (timeRemaining % 60).toString().padStart(2, '0');
        timeValueDisplay.textContent = `${m}:${s}`;
    }

    function startTimer() {
        if (selectedDuration === 0) return; // Free mode
        if (isTimerRunning) return;

        timeRemaining = selectedDuration;
        isTimerRunning = true;
        updateTimerDisplay();
        timeValueDisplay.classList.remove('urgent');

        globalTimerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();

            if (timeRemaining <= 10 && timeRemaining > 0) {
                timeValueDisplay.classList.add('urgent');
            }

            if (timeRemaining <= 0) {
                clearInterval(globalTimerInterval);
                isTimerRunning = false;
                timeValueDisplay.classList.remove('urgent');
                playEndSound();
                stopAllTrainings();
            }
        }, 1000);
    }

    // --- Audio Synthesis (Web Audio API) ---
    function playEndSound() {
        try {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }

            // Create a soothing chime
            const osc = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            osc.frequency.setTargetAtTime(1046.50, audioContext.currentTime + 0.1, 0.1); // Slide to C6

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.5);

            osc.connect(gainNode);
            gainNode.connect(audioContext.destination);

            osc.start();
            osc.stop(audioContext.currentTime + 1.5);

            alert("セッションが終了しました！ / Session Complete!");
        } catch (e) {
            console.error("Audio block: ", e);
            alert("セッションが終了しました！ / Session Complete!");
        }
    }


    // --- Shared Training Stop ---
    function stopAllTrainings() {
        stopEyeTracking();
        stopGaborGame();
        stopBlinkTraining();
        resetTimerUI();
    }


    // ==========================================
    // 1. Eye Tracking Training Logic
    // ==========================================
    const tkCanvas = document.getElementById('trackingCanvas');
    const tkCtx = tkCanvas.getContext('2d');
    const btnStartTracking = document.getElementById('startTrackingBtn');
    const tkOverlay = document.getElementById('trackingOverlay');
    const patternSelect = document.getElementById('trackingPattern');
    
    let tkReqId = null;
    let targetObj = { x: 400, y: 200, radius: 15, angle: 0, speed: 0.05 };

    function renderTrackingTarget() {
        // Clear background with theme color
        tkCtx.fillStyle = '#f4f9f4';
        tkCtx.fillRect(0, 0, tkCanvas.width, tkCanvas.height);

        // Draw track guide (faint line in center)
        tkCtx.strokeStyle = 'rgba(82, 183, 136, 0.2)';
        tkCtx.lineWidth = 2;
        tkCtx.beginPath();
        tkCtx.moveTo(0, tkCanvas.height/2);
        tkCtx.lineTo(tkCanvas.width, tkCanvas.height/2);
        tkCtx.stroke();
        tkCtx.beginPath();
        tkCtx.moveTo(tkCanvas.width/2, 0);
        tkCtx.lineTo(tkCanvas.width/2, tkCanvas.height);
        tkCtx.stroke();

        // Draw Target (green circle)
        tkCtx.beginPath();
        tkCtx.arc(targetObj.x, targetObj.y, targetObj.radius, 0, Math.PI * 2);
        tkCtx.fillStyle = '#eb5e28'; // A contrasting warm color (orange) to follow easily
        tkCtx.fill();
        tkCtx.strokeStyle = '#fff';
        tkCtx.lineWidth = 3;
        tkCtx.stroke();
        
        // Inner dot
        tkCtx.beginPath();
        tkCtx.arc(targetObj.x, targetObj.y, targetObj.radius / 3, 0, Math.PI * 2);
        tkCtx.fillStyle = '#fff';
        tkCtx.fill();
    }

    function animateTracking() {
        const pattern = patternSelect.value;
        targetObj.angle += targetObj.speed;

        if (pattern === 'figure8') {
            // Figure-8 (Lemniscate)
            // scale visually to fit canvas
            const scale = 250;
            const a = targetObj.angle;
            // Parametric equations for Figure 8
            targetObj.x = tkCanvas.width/2 + (scale * Math.cos(a)) / (1 + Math.pow(Math.sin(a), 2));
            targetObj.y = tkCanvas.height/2 + (scale * Math.sin(a) * Math.cos(a)) / (1 + Math.pow(Math.sin(a), 2));
        } else {
            // Random floating (lissajous curve with different frequencies)
            const a = targetObj.angle;
            targetObj.x = tkCanvas.width/2 + 300 * Math.sin(a * 0.7) * Math.cos(a * 0.4);
            targetObj.y = tkCanvas.height/2 + 150 * Math.sin(a * 1.3) * Math.cos(a * 0.8);
        }

        renderTrackingTarget();
        tkReqId = requestAnimationFrame(animateTracking);
    }

    function stopEyeTracking() {
        if (tkReqId) cancelAnimationFrame(tkReqId);
        tkReqId = null;
        tkOverlay.style.opacity = '1';
        tkOverlay.style.pointerEvents = 'auto';
        renderInitialEyeTracking();
    }
    
    function renderInitialEyeTracking() {
        targetObj.x = tkCanvas.width/2;
        targetObj.y = tkCanvas.height/2;
        renderTrackingTarget();
    }

    btnStartTracking.addEventListener('click', () => {
        tkOverlay.style.opacity = '0';
        tkOverlay.style.pointerEvents = 'none';
        targetObj.angle = 0;
        startTimer();
        animateTracking();
    });

    renderInitialEyeTracking(); // draw initial state


    // ==========================================
    // 2. Gabor Patch Game Logic
    // ==========================================
    const gbCanvas = document.getElementById('gaborCanvas');
    const gbCtx = gbCanvas.getContext('2d');
    const btnStartGabor = document.getElementById('startGaborBtn');
    const gbOverlay = document.getElementById('gaborOverlay');
    const scoreValJa = document.getElementById('gaborScore');
    const scoreValEn = document.getElementById('gaborScoreEn');

    let gaborScore = 0;
    let isGaborActive = false;
    let patches = []; // array of {x, y, r, angle, isTarget}
    let targetAngle = 0;

    // Generates a Gabor Patch visually on canvas
    function drawGaborPatch(ctx, x, y, radius, angle, freq=0.5) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Clip to circle
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.clip();

        // Base blurred background
        const radGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        radGrad.addColorStop(0, 'rgba(128,128,128,1)');
        radGrad.addColorStop(1, 'rgba(128,128,128,0)');
        
        // Draw stripes by alternating black/white lines
        ctx.fillStyle = '#808080';
        ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
        
        ctx.globalCompositeOperation = 'multiply';
        // Generate stripes
        for (let i = -radius; i <= radius; i += 2) {
            // Sine wave pattern representation simplified with lines and opacity
            const val = (Math.sin(i * freq) + 1) / 2; // 0 to 1
            ctx.fillStyle = `rgba(0,0,0,${val * 0.8})`;
            ctx.fillRect(i, -radius, 2, radius * 2);
        }

        // Apply radial Gaussian blur mask effect
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = radGrad;
        ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
        
        ctx.restore();
    }

    function initGaborLevel() {
        gbCtx.fillStyle = '#f4f9f4';
        gbCtx.fillRect(0, 0, gbCanvas.width, gbCanvas.height);

        patches = [];
        // Target is always in the center
        targetAngle = (Math.floor(Math.random() * 4) * 45) * Math.PI / 180; // 0, 45, 90, 135 deg
        
        // Draw Center Target (radius 40)
        drawGaborPatch(gbCtx, gbCanvas.width/2, gbCanvas.height/2, 40, targetAngle, 0.3);
        
        // Draw Border around center to distinguish
        gbCtx.strokeStyle = 'rgba(0, 119, 182, 0.5)';
        gbCtx.lineWidth = 2;
        gbCtx.strokeRect(gbCanvas.width/2 - 45, gbCanvas.height/2 - 45, 90, 90);

        // Generate choices around the target
        const numChoices = 6;
        const radiusMap = 120;
        let hasTarget = false;

        const angles = [0, 45, 90, 135].map(deg => deg * Math.PI / 180);
        
        for (let i = 0; i < numChoices; i++) {
            const posAngle = (i / numChoices) * Math.PI * 2;
            const px = gbCanvas.width/2 + Math.cos(posAngle) * radiusMap;
            const py = gbCanvas.height/2 + Math.sin(posAngle) * radiusMap;
            
            // Randomly pick rotation for the choice
            let patchAngle = angles[Math.floor(Math.random() * angles.length)];
            
            // Ensure at least one matches target, but not all
            let isTarget = false;
            if (i === numChoices - 1 && !hasTarget) {
                patchAngle = targetAngle;
            }
            if (Math.abs(patchAngle - targetAngle) < 0.01) {
                isTarget = true;
                hasTarget = true;
            }

            patches.push({ x: px, y: py, r: 30, angle: patchAngle, isTarget: isTarget });
            drawGaborPatch(gbCtx, px, py, 30, patchAngle, 0.3);
        }
    }

    gbCanvas.addEventListener('click', (e) => {
        if (!isGaborActive) return;
        const rect = gbCanvas.getBoundingClientRect();
        // Calculate scale ratios if CSS scaled the canvas
        const scaleX = gbCanvas.width / rect.width;
        const scaleY = gbCanvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Check intersection with patches
        let hit = false;
        for (let p of patches) {
            const dx = x - p.x;
            const dy = y - p.y;
            if (dx*dx + dy*dy <= p.r*p.r) {
                if (p.isTarget) {
                    // Correct
                    gaborScore += 10;
                    scoreValJa.textContent = gaborScore.toString();
                    scoreValEn.textContent = gaborScore.toString();
                    // Optional visual feedback could go here
                    initGaborLevel();
                } else {
                    // Wrong
                    gaborScore = Math.max(0, gaborScore - 5);
                    scoreValJa.textContent = gaborScore.toString();
                    scoreValEn.textContent = gaborScore.toString();
                }
                hit = true;
                break;
            }
        }
    });

    function stopGaborGame() {
        isGaborActive = false;
        gbOverlay.style.opacity = '1';
        gbOverlay.style.pointerEvents = 'auto';
        gaborScore = 0;
        scoreValJa.textContent = '0';
        scoreValEn.textContent = '0';
        gbCtx.fillStyle = '#f4f9f4';
        gbCtx.fillRect(0, 0, gbCanvas.width, gbCanvas.height);
    }

    btnStartGabor.addEventListener('click', () => {
        gbOverlay.style.opacity = '0';
        gbOverlay.style.pointerEvents = 'none';
        isGaborActive = true;
        gaborScore = 0;
        scoreValJa.textContent = '0';
        scoreValEn.textContent = '0';
        startTimer();
        initGaborLevel();
    });

    // Initial empty state
    gbCtx.fillStyle = '#f4f9f4';
    gbCtx.fillRect(0, 0, gbCanvas.width, gbCanvas.height);


    // ==========================================
    // 3. Blink Training Logic
    // ==========================================
    const blinkCircle = document.getElementById('blinkCircle');
    const btnStartBlink = document.getElementById('startBlinkBtn');
    const bkOverlay = document.getElementById('blinkOverlay');
    const bkInstruction = document.getElementById('blinkInstruction');
    
    let bkReqId = null;
    let isBlinkActive = false;
    let blinkPhase = 0; // 0=Open, 1=Close
    let phaseTime = 3000; // 3 seconds per phase

    let blinkAudioCtx = null;
    
    // Play short beep (Web Audio API)
    function playBlinkTick(high = false) {
        if (!blinkAudioCtx) {
            blinkAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (blinkAudioCtx.state === 'suspended') blinkAudioCtx.resume();
        
        const osc = blinkAudioCtx.createOscillator();
        const gain = blinkAudioCtx.createGain();
        osc.type = 'sine';
        // 'high' for phase change (action), 'low' for countdown ticks
        osc.frequency.setValueAtTime(high ? 880 : 440, blinkAudioCtx.currentTime); 
        
        gain.gain.setValueAtTime(0, blinkAudioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, blinkAudioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, blinkAudioCtx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(blinkAudioCtx.destination);
        osc.start();
        osc.stop(blinkAudioCtx.currentTime + 0.2);
    }

    function runBlinkCycle() {
        if (!isBlinkActive) return;

        // Play high pitch on action boundary ("ポーン")
        playBlinkTick(true);

        if (blinkPhase === 0) {
            // Instruct to Close
            bkInstruction.innerHTML = '<span class="ja">ギュッと閉じる (3秒)</span><span class="en">Close tightly (3s)</span>';
            blinkCircle.classList.remove('is-opening');
            blinkCircle.classList.add('is-closing');
            blinkPhase = 1;
        } else {
            // Instruct to Open
            bkInstruction.innerHTML = '<span class="ja">パッと開く (3秒)</span><span class="en">Open wide (3s)</span>';
            blinkCircle.classList.remove('is-closing');
            blinkCircle.classList.add('is-opening');
            blinkPhase = 0;
        }

        // Ticks at 1s and 2s ("ピッ", "ピッ")
        setTimeout(() => isBlinkActive && playBlinkTick(false), 1000);
        setTimeout(() => isBlinkActive && playBlinkTick(false), 2000);

        // Schedule next phase
        bkReqId = setTimeout(runBlinkCycle, phaseTime);
    }

    function stopBlinkTraining() {
        isBlinkActive = false;
        clearTimeout(bkReqId);
        bkOverlay.style.opacity = '1';
        bkOverlay.style.pointerEvents = 'auto';
        blinkCircle.classList.remove('is-closing');
        blinkCircle.classList.remove('is-opening');
        bkInstruction.innerHTML = '<span class="ja">準備ができたらスタート</span><span class="en">Press Start when ready</span>';
    }

    btnStartBlink.addEventListener('click', () => {
        bkOverlay.style.opacity = '0';
        bkOverlay.style.pointerEvents = 'none';
        isBlinkActive = true;
        blinkPhase = 0; // Start with instruct to close
        startTimer();
        runBlinkCycle();
    });

});
