/* ============================================
   Memento Time — 人生の残り時間時計
   メインスクリプト (script.js) v3
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

    // ステータスバー
    const stToday = document.getElementById('st-today');
    const stAge = document.getElementById('st-age');
    const stLifespan = document.getElementById('st-lifespan');

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

    // 格言エリア
    const footerQuote = document.getElementById('footer-quote');

    // --- 状態管理 ---
    let timerInterval = null; // カウントダウンのインターバルID

    // --- ローカルストレージのキー ---
    const STORAGE_KEY_BIRTHDAY = 'mementoTime_birthday';
    const STORAGE_KEY_LIFESPAN = 'mementoTime_lifespan';

    // --- 格言データ（20個・日本語＆英語併記） ---
    const quotes = [
        {
            ja: '「あなたの時間は限られている。他の誰かの人生を生きることに、それを費やしてはいけない。」 — スティーブ・ジョブズ',
            en: '"Your time is limited, don\'t waste it living someone else\'s life." — Steve Jobs'
        },
        {
            ja: '「一日一日を、最後の日のように生きよ。」 — マルクス・アウレリウス',
            en: '"Live each day as if it were your last." — Marcus Aurelius'
        },
        {
            ja: '「死ぬことを恐れるのではない。生きていないことを恐れるのだ。」 — マルクス・アウレリウス',
            en: '"It is not death that a man should fear, but he should fear never beginning to live." — Marcus Aurelius'
        },
        {
            ja: '「人生とは、自分を見つけることではない。人生とは、自分を創ることである。」 — ジョージ・バーナード・ショー',
            en: '"Life isn\'t about finding yourself. Life is about creating yourself." — George Bernard Shaw'
        },
        {
            ja: '「最終的に重要なのは、あなたの人生の年数ではなく、あなたの年数の中の人生だ。」 — エイブラハム・リンカーン',
            en: '"In the end, it\'s not the years in your life that count. It\'s the life in your years." — Abraham Lincoln'
        },
        {
            ja: '「人生は短い。だから友よ、空騒ぎはやめて、生きることに時間を使おう。」 — シェイクスピア',
            en: '"Life is short. Let\'s stop the fuss and spend time living." — Shakespeare'
        },
        {
            ja: '「千里の道も一歩から。」 — 老子',
            en: '"A journey of a thousand miles begins with a single step." — Lao Tzu'
        },
        {
            ja: '「未来は、今日始めたことで決まる。」 — マハトマ・ガンジー',
            en: '"The future depends on what you do today." — Mahatma Gandhi'
        },
        {
            ja: '「幸福は完成品ではない。自分自身の行動から生まれるものだ。」 — ダライ・ラマ14世',
            en: '"Happiness is not something readymade. It comes from your own actions." — Dalai Lama'
        },
        {
            ja: '「今日という日は、残りの人生の最初の日である。」 — チャールズ・ディードリッヒ',
            en: '"Today is the first day of the rest of your life." — Charles Dederich'
        },
        {
            ja: '「大切なのは、疑わずに生きることだ。何が起こっても、それで良いのだ、と。」 — ライナー・マリア・リルケ',
            en: '"The point is to live everything. Live the questions now." — Rainer Maria Rilke'
        },
        {
            ja: '「時を刻む音は、人生が前に進んでいる証拠だ。」 — 作者不詳',
            en: '"The ticking of the clock is proof that life is moving forward." — Unknown'
        },
        {
            ja: '「人は必ず死ぬ。だからこそ人生は美しいのだ。」 — 手塚治虫',
            en: '"Everyone dies eventually. That is what makes life beautiful." — Osamu Tezuka'
        },
        {
            ja: '「明日死ぬかのように生きよ。永遠に生きるかのように学べ。」 — マハトマ・ガンジー',
            en: '"Live as if you were to die tomorrow. Learn as if you were to live forever." — Mahatma Gandhi'
        },
        {
            ja: '「人生で最も大切な日は二日ある。生まれた日と、なぜ生まれたかを知る日だ。」 — マーク・トウェイン',
            en: '"The two most important days in your life are the day you are born and the day you find out why." — Mark Twain'
        },
        {
            ja: '「変えられないことを嘆くより、変えられることに集中せよ。」 — セネカ',
            en: '"We suffer more often in imagination than in reality." — Seneca'
        },
        {
            ja: '「散りぬべき時知りてこそ、世の中の花は花なれ、人は人なれ。」 — 細川ガラシャ',
            en: '"Knowing when to fall is what makes a flower a flower, and a person a person." — Hosokawa Gracia'
        },
        {
            ja: '「人生は、勇気を持って挑む限り、退屈にはならない。」 — エレノア・ルーズベルト',
            en: '"Life was meant to be lived, and curiosity must be kept alive." — Eleanor Roosevelt'
        },
        {
            ja: '「この瞬間を大切にしなさい。この瞬間こそが、あなたの人生なのだから。」 — オマル・ハイヤーム',
            en: '"Be happy for this moment. This moment is your life." — Omar Khayyam'
        },
        {
            ja: '「行く川の流れは絶えずして、しかももとの水にあらず。」 — 鴨長明',
            en: '"The flowing river never stops, and yet the water never stays the same." — Kamo no Chōmei'
        }
    ];

    // --- 背景パーティクル（桜の花びら・強化版）の生成 ---
    function createPetals() {
        const container = document.getElementById('bg-petals');
        // 花びらのバリエーション
        const variants = ['petal--a', 'petal--b', 'petal--c'];
        // 40枚の花びらを生成（以前の約2.5倍）
        for (let i = 0; i < 40; i++) {
            const petal = document.createElement('div');
            petal.classList.add('petal');
            // ランダムにバリエーションを付与
            petal.classList.add(variants[Math.floor(Math.random() * variants.length)]);

            // ランダムなサイズ（幅: 8-18px）
            const width = Math.random() * 10 + 8;
            petal.style.width = `${width}px`;
            petal.style.height = `${width * 0.6}px`;

            // ランダムな水平位置
            petal.style.left = `${Math.random() * 100}%`;

            // ランダムなアニメーション時間（10-22秒 → 少し速めに）
            petal.style.animationDuration = `${Math.random() * 12 + 10}s`;

            // ランダムな遅延（0-20秒）
            petal.style.animationDelay = `${Math.random() * 20}s`;

            container.appendChild(petal);
        }
    }

    // 花びらを初期化
    createPetals();

    // --- ランダム格言を表示 ---
    function displayRandomQuote() {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const quote = quotes[randomIndex];
        footerQuote.innerHTML = `
            <span class="quote-ja">${quote.ja}</span>
            <span class="quote-en">${quote.en}</span>
        `;
    }

    // 初期表示
    displayRandomQuote();

    // --- 今日の日付をフォーマット ---
    function formatToday(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}/${m}/${d}`;
    }

    // --- 現在の年齢を正確に計算（整数） ---
    function calcAge(birthDate, now) {
        let age = now.getFullYear() - birthDate.getFullYear();
        const monthDiff = now.getMonth() - birthDate.getMonth();
        // まだ誕生日を迎えていなければ1歳引く
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    // --- ステータスバーの更新 ---
    function updateStatusBar(birthDate, lifespanYears) {
        const now = new Date();
        // 今日の日付
        stToday.textContent = formatToday(now);
        // 現在の年齢
        const age = calcAge(birthDate, now);
        stAge.textContent = `${age}歳 / years old`;
        // 想定寿命
        stLifespan.textContent = `${lifespanYears}歳 / years old`;
    }

    // --- 保存データの読み込み ---
    function loadSavedData() {
        const savedBirthday = localStorage.getItem(STORAGE_KEY_BIRTHDAY);
        const savedLifespan = localStorage.getItem(STORAGE_KEY_LIFESPAN);

        if (savedBirthday && savedLifespan) {
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

        // ステータスバーの初回更新
        updateStatusBar(birthDate, lifespanYears);

        // カウントダウンの初回更新
        updateCountdown(birthDate, deathDate);

        // 1秒ごとにカウントダウンとステータスを更新
        timerInterval = setInterval(() => {
            updateStatusBar(birthDate, lifespanYears);
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
        const remainingYears = totalRemainingDays / 365.25;

        // 🌸 桜を見る回数（年1回）
        const cherry = Math.max(0, Math.floor(remainingYears));
        evCherry.textContent = cherry.toLocaleString();

        // 🍚 食事の回数（1日3食）
        const meals = Math.max(0, totalRemainingDays * 3);
        evMeals.textContent = meals.toLocaleString();

        // ☕ 週末の回数（7日に1回）
        const weekends = Math.max(0, Math.floor(totalRemainingDays / 7));
        evWeekends.textContent = weekends.toLocaleString();

        // 🌕 満月を見る回数（約29.5日に1回）
        const fullmoons = Math.max(0, Math.floor(totalRemainingDays / 29.53));
        evFullmoons.textContent = fullmoons.toLocaleString();

        // 📚 新しい本との出会い（約30.44日に1冊）
        const books = Math.max(0, Math.floor(totalRemainingDays / 30.44));
        evBooks.textContent = books.toLocaleString();
    }

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
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        showInputScreen();
    });

    // --- 初期化：保存データがあればカウントダウン開始 ---
    loadSavedData();
});
