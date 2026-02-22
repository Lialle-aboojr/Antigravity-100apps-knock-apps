/**
 * Autophagy Cycle Script
 * 
 * 16時間断食と8時間食事のサイクルを管理するアプリケーションロジック。
 * Web Audio APIによる「ピンポーン」という心地よいチャイム音と、
 * 正確な時間管理、および開発者用テスト機能を実装しています。
 */

// 定数設定
const FASTING_HOURS = 16; // 断食時間（時間）
const EATING_HOURS = 8;   // 食事時間（時間）
const SECONDS_PER_HOUR = 3600; // 1時間は3600秒

class FastingTimer {
    constructor() {
        // SVG円周の長さ計算 (半径140px * 2 * π)
        this.radius = 140;
        this.circumference = 2 * Math.PI * this.radius;

        // DOM要素の取得
        this.progressRing = document.querySelector('.progress-ring__circle');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.statusLabelJa = document.querySelector('#statusLabel .ja');
        this.statusLabelEn = document.querySelector('#statusLabel .en');
        this.modeIndicator = document.getElementById('modeIndicator');
        this.toggleBtn = document.getElementById('toggleBtn');
        this.switchModeBtn = document.getElementById('switchModeBtn');
        this.body = document.body;

        // テスト用ボタンの取得
        this.testTimerBtn = document.getElementById('testTimerBtn');
        this.soundCheckBtn = document.getElementById('soundCheckBtn');

        // 状態の初期化
        this.currentMode = 'fasting'; // 'fasting' or 'eating'
        this.isRunning = false;
        this.startTime = null;
        this.remainingSeconds = FASTING_HOURS * SECONDS_PER_HOUR;
        this.totalDuration = FASTING_HOURS * SECONDS_PER_HOUR;
        this.timerInterval = null;

        // 初期セットアップ
        this.init();
    }

    init() {
        // リングの初期設定
        this.progressRing.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        this.progressRing.style.strokeDashoffset = 0;

        // イベントリスナーの登録
        this.toggleBtn.addEventListener('click', () => this.toggleTimer());
        this.switchModeBtn.addEventListener('click', () => this.switchMode());

        // テスト用リスナー
        this.testTimerBtn.addEventListener('click', () => this.startTestMode());
        this.soundCheckBtn.addEventListener('click', () => this.playChime());

        // 初期表示更新
        this.updateDisplay();
        this.updateModeUI();
    }

    // タイマーの開始・一時停止切り替え
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    // タイマー開始
    startTimer() {
        if (this.isRunning) return;

        this.isRunning = true;

        // 開始/再開時の現在時刻を記録
        this.lastFrameTime = Date.now();

        this.timerInterval = setInterval(() => {
            const now = Date.now();
            const deltaTime = (now - this.lastFrameTime) / 1000; // 経過秒数
            this.lastFrameTime = now;

            this.remainingSeconds = Math.max(0, this.remainingSeconds - deltaTime);

            this.updateDisplay();
            this.updateProgressRing();

            // 時間終了時の処理
            if (this.remainingSeconds <= 0) {
                this.finishTimer();
            }
        }, 100); // 0.1秒ごとに更新して滑らかに

        this.updateBtnState();

        // ユーザー操作時にAudioContextを再開/生成して準備
        this.prepareAudio();
    }

    // タイマー一時停止
    pauseTimer() {
        if (!this.isRunning) return;

        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.updateBtnState();
    }

    // タイマー終了処理
    finishTimer() {
        this.pauseTimer();
        this.remainingSeconds = 0;
        this.updateDisplay();
        this.updateProgressRing();
        this.playChime();

        // チャイムの余韻を待ってからアラート表示
        setTimeout(() => {
            alert(this.currentMode === 'fasting'
                ? '断食時間が終了しました！食事を始めても良い時間です。'
                : '食事時間が終了しました！断食を開始しましょう。');

            // 完了後、自動でモードを切り替えてリセット状態にする
            this.switchMode();
        }, 2000);
    }

    // モード切替（断食 ⇔ 食事）
    switchMode() {
        // タイマーリセット
        this.pauseTimer();

        if (this.currentMode === 'fasting') {
            this.currentMode = 'eating';
            this.totalDuration = EATING_HOURS * SECONDS_PER_HOUR;
        } else {
            this.currentMode = 'fasting';
            this.totalDuration = FASTING_HOURS * SECONDS_PER_HOUR;
        }

        this.remainingSeconds = this.totalDuration;
        this.updateModeUI();
        this.updateDisplay();
        this.updateProgressRing(); // リングを満タンに戻す
    }

    // ★ テストモード開始（残り時間を1分にする）
    startTestMode() {
        this.pauseTimer();
        this.remainingSeconds = 60;
        this.updateDisplay();
        this.updateProgressRing();
        alert('テストモード: 残り時間を1分に設定しました。\n開始ボタンを押すとカウントダウンします。');
    }

    // 画面表示（UI）の更新
    updateModeUI() {
        if (this.currentMode === 'fasting') {
            this.body.className = 'mode-fasting';
            this.statusLabelJa.textContent = '空腹期';
            this.statusLabelEn.textContent = 'Fasting Phase';
            this.modeIndicator.textContent = '16 Hours Target';
        } else {
            this.body.className = 'mode-eating';
            this.statusLabelJa.textContent = '摂食期';
            this.statusLabelEn.textContent = 'Eating Phase';
            this.modeIndicator.textContent = '8 Hours Window';
        }
    }

    // ボタンの状態更新
    updateBtnState() {
        if (this.isRunning) {
            this.toggleBtn.innerHTML = '<span class="ja">一時停止</span> / <span class="en">Pause</span>';
            this.toggleBtn.classList.add('active');
            this.switchModeBtn.disabled = true; // 実行中はモード変更不可
            this.switchModeBtn.style.opacity = '0.5';
        } else {
            this.toggleBtn.innerHTML = '<span class="ja">開始</span> / <span class="en">Start</span>';
            this.toggleBtn.classList.remove('active');
            this.switchModeBtn.disabled = false;
            this.switchModeBtn.style.opacity = '1';
        }
    }

    // 時間表示の更新
    updateDisplay() {
        const seconds = Math.ceil(this.remainingSeconds);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        const pad = (num) => num.toString().padStart(2, '0');
        this.timeDisplay.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

        document.title = `${pad(h)}:${pad(m)} - Autophagy Cycle`;
    }

    updateProgressRing() {
        const offset = this.circumference - (this.remainingSeconds / this.totalDuration) * this.circumference;
        this.progressRing.style.strokeDashoffset = offset;
    }

    // Web Audio APIの準備
    prepareAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    // ★ チャイム音再生「ピン・ポーン」 (Ding-dong)
    playChime() {
        try {
            if (!this.audioCtx) this.prepareAudio();
            const ctx = this.audioCtx;
            const now = ctx.currentTime;

            // 1音目「ピン」 (Ding) - 高い音 (例: 880Hz A5)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, now); // 高音

            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(0.5, now + 0.05); // アタック
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // 長い減衰

            osc1.connect(gain1);
            gain1.connect(ctx.destination);

            osc1.start(now);
            osc1.stop(now + 1.5);

            // 2音目「ポーン」 (Dong) - 少し低い音 (例: 700Hz くらい)
            // 0.6秒後に鳴らす
            const start2 = now + 0.6;
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(698.46, start2); // F5

            gain2.gain.setValueAtTime(0, start2);
            gain2.gain.linearRampToValueAtTime(0.5, start2 + 0.05);
            gain2.gain.exponentialRampToValueAtTime(0.001, start2 + 2.5); // さらに長い余韻

            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            osc2.start(start2);
            osc2.stop(start2 + 2.5);

        } catch (e) {
            console.error('Audio play failed:', e);
            alert('通知音の再生に失敗しました。');
        }
    }
}

// アプリケーション開始
window.addEventListener('DOMContentLoaded', () => {
    new FastingTimer();
});
