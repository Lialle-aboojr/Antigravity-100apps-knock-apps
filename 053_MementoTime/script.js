/* ============================================
   Memento Time — 人生の残り時間時計
   メインスクリプト (script.js)
   ============================================ */

// ===== DOMの読み込み完了後に初期化 =====
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM要素の取得 ---

    // 入力セクション
    const inputSection = document.getElementById('input-section');
    const birthdayInput = document.getElementById('birthday');
    const lifespanInput = document.getElementById('lifespan');
    const btnSave = document.getElementById('btn-save');

    // カウントダウンセクション
    const countdownSection = document.getElementById('countdown-section');
    const btnReset = document.getElementById('btn-reset');

    // カウントダウン表示
    const cdYears = document.getElementById('cd-years');
    const cdMonths = document.getElementById('cd-months');
    const cdWeeks = document.getElementById('cd-weeks');
    const cdDays = document.getElementById('cd-days');
    const cdHours = document.getElementById('cd-hours');
    const cdMinutes = document.getElementById('cd-minutes');
    const cdSeconds = document.getElementById('cd-seconds');

    // プログレスバー
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressPercent = document.getElementById('progress-percent');

    // ライフイベント
    const evCherry = document.getElementById('ev-cherry');
    const evMeals = document.getElementById('ev-meals');
    const evWeekends = document.getElementById('ev-weekends');
    const evFullmoons = document.getElementById('ev-fullmoons');
    const evBooks = document.getElementById('ev-books');

    // --- ゲーム状態 ---
    let timerInterval = null; // カウントダウンのインターバルID

    // --- ローカルストレージのキー ---
    const STORAGE_KEY_BIRTHDAY = 'mementoTime_birthday';
    const STORAGE_KEY_LIFESPAN = 'mementoTime_lifespan';

    // --- 背景パーティクル（桜の花びら）の生成 ---
    function createPetals() {
        const container = document.getElementById('bg-petals');
        // 20枚の花びらを生成
        for (let i = 0; i < 20; i++) {
            const petal = document.createElement('div');
            petal.classList.add('petal');

            // ランダムなサイズ（幅: 8-16px）
            const width = Math.random() * 8 + 8;
            petal.style.width = `${width}px`;
            petal.style.height = `${width * 0.6}px`;

            // ランダムな水平位置
            petal.style.left = `${Math.random() * 100}%`;

            // ランダムなアニメーション時間（12-25秒）
            petal.style.animationDuration = `${Math.random() * 13 + 12}s`;

            // ランダムな遅延（0-15秒）
            petal.style.animationDelay = `${Math.random() * 15}s`;

            container.appendChild(petal);
        }
    }

    // 花びらを初期化
    createPetals();

    // --- 保存データの読み込み ---
    function loadSavedData() {
        const savedBirthday = localStorage.getItem(STORAGE_KEY_BIRTHDAY);
        const savedLifespan = localStorage.getItem(STORAGE_KEY_LIFESPAN);

        if (savedBirthday && savedLifespan) {
            // 保存済データがあればフォームに復元し、カウントダウンを開始
            birthdayInput.value = savedBirthday;
            lifespanInput.value = savedLifespan;
            startCountdown(savedBirthday, parseInt(savedLifespan, 10));
        }
    }

    // --- データの保存 ---
    function saveData(birthday, lifespan) {
        localStorage.setItem(STORAGE_KEY_BIRTHDAY, birthday);
        localStorage.setItem(STORAGE_KEY_LIFESPAN, lifespan.toString());
    }

    // --- データの削除 ---
    function clearData() {
        localStorage.removeItem(STORAGE_KEY_BIRTHDAY);
        localStorage.removeItem(STORAGE_KEY_LIFESPAN);
    }

    // --- 画面切り替え ---
    function showInputScreen() {
        inputSection.style.display = 'block';
        countdownSection.classList.remove('active');
    }

    function showCountdownScreen() {
        inputSection.style.display = 'none';
        countdownSection.classList.add('active');
    }

    // --- カウントダウンの開始 ---
    function startCountdown(birthdayStr, lifespanYears) {
        // 既存のタイマーがあればクリア
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        // 生年月日をDateオブジェクトに変換
        const birthDate = new Date(birthdayStr);

        // 寿命の期限日を計算（生年月日 + 想定寿命）
        const deathDate = new Date(birthDate);
        deathDate.setFullYear(deathDate.getFullYear() + lifespanYears);

        // 画面を切り替え
        showCountdownScreen();

        // 初回更新
        updateCountdown(birthDate, deathDate);

        // 1秒ごとにカウントダウンを更新
        timerInterval = setInterval(() => {
            updateCountdown(birthDate, deathDate);
        }, 1000);
    }

    // --- カウントダウンの更新処理 ---
    function updateCountdown(birthDate, deathDate) {
        const now = new Date();

        // すでに期限を過ぎている場合
        if (now >= deathDate) {
            cdYears.textContent = '0';
            cdMonths.textContent = '0';
            cdWeeks.textContent = '0';
            cdDays.textContent = '0';
            cdHours.textContent = '0';
            cdMinutes.textContent = '0';
            cdSeconds.textContent = '0';
            progressBarFill.style.width = '100%';
            progressPercent.textContent = '100%';
            updateLifeEvents(0);
            return;
        }

        // --- 残り時間の計算（年・月・日・時・分・秒を正確に） ---
        const remaining = calcRemainingTime(now, deathDate);

        // カウントダウン表示を更新
        cdYears.textContent = remaining.years.toLocaleString();
        cdMonths.textContent = remaining.months;
        cdWeeks.textContent = remaining.totalWeeks.toLocaleString();
        cdDays.textContent = remaining.days;
        cdHours.textContent = remaining.hours;
        cdMinutes.textContent = remaining.minutes;
        cdSeconds.textContent = remaining.seconds;

        // --- プログレスバーの更新 ---
        const totalLifeMs = deathDate.getTime() - birthDate.getTime();
        const elapsedMs = now.getTime() - birthDate.getTime();
        const percent = Math.min((elapsedMs / totalLifeMs) * 100, 100);
        progressBarFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent.toFixed(6)}%`;

        // --- ライフイベントの更新 ---
        const totalRemainingDays = remaining.totalDays;
        updateLifeEvents(totalRemainingDays);
    }

    // --- 残り時間を年月日時分秒に分解する関数 ---
    function calcRemainingTime(now, deathDate) {
        // 年の差を計算
        let years = deathDate.getFullYear() - now.getFullYear();
        let months = deathDate.getMonth() - now.getMonth();
        let days = deathDate.getDate() - now.getDate();
        let hours = deathDate.getHours() - now.getHours();
        let minutes = deathDate.getMinutes() - now.getMinutes();
        let seconds = deathDate.getSeconds() - now.getSeconds();

        // 秒が負なら繰り下がり
        if (seconds < 0) {
            seconds += 60;
            minutes--;
        }

        // 分が負なら繰り下がり
        if (minutes < 0) {
            minutes += 60;
            hours--;
        }

        // 時間が負なら繰り下がり
        if (hours < 0) {
            hours += 24;
            days--;
        }

        // 日が負なら繰り下がり（前月の日数を足す）
        if (days < 0) {
            // 前月の最後の日を取得して加算
            const prevMonth = new Date(deathDate.getFullYear(), deathDate.getMonth(), 0);
            days += prevMonth.getDate();
            months--;
        }

        // 月が負なら繰り下がり
        if (months < 0) {
            months += 12;
            years--;
        }

        // 年が負の場合（すでに超過）
        if (years < 0) {
            years = 0;
            months = 0;
            days = 0;
            hours = 0;
            minutes = 0;
            seconds = 0;
        }

        // 総残り日数の計算（ライフイベント計算用）
        const diffMs = deathDate.getTime() - now.getTime();
        const totalDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const totalWeeks = Math.max(0, Math.floor(totalDays / 7));

        return {
            years,
            months,
            days,
            hours,
            minutes,
            seconds,
            totalDays,
            totalWeeks
        };
    }

    // --- ライフイベントの残り回数を更新 ---
    function updateLifeEvents(totalRemainingDays) {
        // 残り年数（小数含む）
        const remainingYears = totalRemainingDays / 365.25;

        // 🌸 桜を見る回数（年1回）
        const cherry = Math.max(0, Math.floor(remainingYears));
        evCherry.textContent = cherry.toLocaleString();

        // 🍚 食事の回数（1日3食）
        const meals = Math.max(0, totalRemainingDays * 3);
        evMeals.textContent = meals.toLocaleString();

        // ☕ 週末の回数（年52回 → 7日に1回）
        const weekends = Math.max(0, Math.floor(totalRemainingDays / 7));
        evWeekends.textContent = weekends.toLocaleString();

        // 🌕 満月を見る回数（年12回 → 約29.5日に1回）
        const fullmoons = Math.max(0, Math.floor(totalRemainingDays / 29.53));
        evFullmoons.textContent = fullmoons.toLocaleString();

        // 📚 新しい本との出会い（月1冊 → 約30.44日に1冊）
        const books = Math.max(0, Math.floor(totalRemainingDays / 30.44));
        evBooks.textContent = books.toLocaleString();
    }

    // --- 数値のフォーマット（3桁カンマ区切り） ---
    // ※ toLocaleString() を使用済みのため不要だが、念のため残す

    // --- イベントリスナーの登録 ---

    // 保存ボタン
    btnSave.addEventListener('click', () => {
        const birthday = birthdayInput.value;
        const lifespan = parseInt(lifespanInput.value, 10);

        // バリデーション
        if (!birthday) {
            alert('生年月日を入力してください。\nPlease enter your date of birth.');
            return;
        }

        if (!lifespan || lifespan < 1 || lifespan > 150) {
            alert('想定寿命は1〜150の間で入力してください。\nPlease enter a lifespan between 1 and 150.');
            return;
        }

        // 将来の日付チェック
        const birthDate = new Date(birthday);
        const now = new Date();
        if (birthDate > now) {
            alert('生年月日が未来の日付になっています。\nDate of birth cannot be in the future.');
            return;
        }

        // データを保存
        saveData(birthday, lifespan);

        // カウントダウン開始
        startCountdown(birthday, lifespan);
    });

    // 設定変更ボタン
    btnReset.addEventListener('click', () => {
        // タイマーを停止
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        // 入力画面に戻す
        showInputScreen();
    });

    // --- 初期化：保存データがあればカウントダウン開始 ---
    loadSavedData();
});
