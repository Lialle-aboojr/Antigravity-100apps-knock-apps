/**
 * Autophagy Cycle Script
 * 
 * 16時間断食と8時間食事のサイクルを管理するアプリケーションロジック。
 * Web Audio APIによる通知音と、正確な時間管理を実装しています。
 */

// 定数設定
const FASTING_HOURS = 16; // 断食時間（時間）
const EATING_HOURS = 8;   // 食事時間（時間）
const SECONDS_PER_HOUR = 3600; // 1時間は3600秒（テスト時はここを小さくすると早送り確認可能）
// const SECONDS_PER_HOUR = 5; // ★デバッグ用（1時間=5秒）

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
        // 以前の残り時間から計算して「終了予定時刻」を逆算することも可能だが、
        // 今回はシンプルに「経過時間」を減算していく方式で実装
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
        
        // ユーザーインタラクションがあったタイミングでAudioContextを準備（ブラウザ制限対策）
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
        this.playNotificationSound();
        
        // 自動で次のモードに切り替える準備（または通知のみ）
        // ここでは完了を示すためにアラート的な表示変更を行う
        alert(this.currentMode === 'fasting' 
            ? '断食時間が終了しました！食事を始めても良い時間です。' 
            : '食事時間が終了しました！断食を開始しましょう。');
            
        // 完了後、自動でモードを切り替えてリセット状態にする
        this.switchMode();
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

        // ゼロ埋め表示
        const pad = (num) => num.toString().padStart(2, '0');
        this.timeDisplay.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
        
        // タイトルバーにも時間を表示
        document.title = `${pad(h)}:${pad(m)} - Autophagy Cycle`;
    }

    // プログレスリング（円グラフ）の更新
    updateProgressRing() {
        // 進捗率（残り時間の割合）
        const offset = this.circumference - (this.remainingSeconds / this.totalDuration) * this.circumference;
        this.progressRing.style.strokeDashoffset = offset;
    }

    // Web Audio APIの準備（iOS等での再生制限解除のため）
    prepareAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // 通知音の再生（シンプルなビープ音）
    playNotificationSound() {
        if (!this.audioCtx) this.prepareAudio();

        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        // 心地よいベルのような音を作成
        osc.type = 'sine';
        
        // 周波数エンベロープ（ピッチが少し下がる）
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);

        // 音量エンベロープ（フェードアウト）
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    }
}

// アプリケーション開始
window.addEventListener('DOMContentLoaded', () => {
    new FastingTimer();
});
