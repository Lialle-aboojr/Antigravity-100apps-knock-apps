/* ============================================
   タイピング勇者 / Typing Hero
   メインスクリプト (script.js)
   ============================================ */

// ===== DOMの読み込み完了後に初期化 =====
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM要素の取得 ---

    // 画面要素
    const screenStart = document.getElementById('screen-start');
    const screenGame = document.getElementById('screen-game');
    const screenResult = document.getElementById('screen-result');

    // ボタンと入力
    const btnStart = document.getElementById('btn-start');
    const btnRetry = document.getElementById('btn-retry');
    const btnQuit = document.getElementById('btn-quit'); // 【追加】Quitボタン
    const modeSelect = document.getElementById('game-mode');

    // ゲーム画面の要素
    const monsterEmoji = document.getElementById('monster-emoji');
    const monsterHpFill = document.getElementById('monster-hp-fill');
    const wordMeaning = document.getElementById('word-meaning');
    const wordRomaji = document.getElementById('word-romaji');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const comboDisplay = document.getElementById('combo');
    const flashOverlay = document.getElementById('flash-overlay');
    const damagePopup = document.getElementById('damage-popup');

    // リザルト画面の要素
    const resultScore = document.getElementById('result-score');
    const resultMaxCombo = document.getElementById('result-max-combo');
    const resultAccuracy = document.getElementById('result-accuracy');
    const rankTitle = document.getElementById('rank-title');
    const rankTitleEn = document.getElementById('rank-title-en');

    // --- ランダムモンスターの配列 ---
    const randomMonsters = ['👾', '👻', '👹', '👽', '🐉', '🦇', '🕷️', '🧟', '🧛', '🦖', '🦂', '🦈'];

    // --- モード別の単語リスト（各50個以上、合計200個以上） ---
    const allWordLists = {
        // == モード1: 単語（日本語） - 50個 ==
        words_ja: [
            { japanese: 'ねこ', romaji: 'neko' }, { japanese: 'いぬ', romaji: 'inu' },
            { japanese: 'うさぎ', romaji: 'usagi' }, { japanese: 'くま', romaji: 'kuma' },
            { japanese: 'さる', romaji: 'saru' }, { japanese: 'とり', romaji: 'tori' },
            { japanese: 'さかな', romaji: 'sakana' }, { japanese: 'りんご', romaji: 'ringo' },
            { japanese: 'ばなな', romaji: 'banana' }, { japanese: 'すいか', romaji: 'suika' },
            { japanese: 'ぶどう', romaji: 'budou' }, { japanese: 'ケーキ', romaji: 'keeki' },
            { japanese: 'ラーメン', romaji: 'raamen' }, { japanese: 'おにぎり', romaji: 'onigiri' },
            { japanese: 'あか', romaji: 'aka' }, { japanese: 'あお', romaji: 'ao' },
            { japanese: 'みどり', romaji: 'midori' }, { japanese: 'きいろ', romaji: 'kiiro' },
            { japanese: 'ドラゴン', romaji: 'doragon' }, { japanese: 'おばけ', romaji: 'obake' },
            { japanese: 'がいこつ', romaji: 'gaikotsu' }, { japanese: 'あくま', romaji: 'akuma' },
            { japanese: 'ロボット', romaji: 'robotto' }, { japanese: 'エイリアン', romaji: 'eirian' },
            { japanese: 'はな', romaji: 'hana' }, { japanese: 'やま', romaji: 'yama' },
            { japanese: 'うみ', romaji: 'umi' }, { japanese: 'ほし', romaji: 'hoshi' },
            { japanese: 'たいよう', romaji: 'taiyou' }, { japanese: 'つき', romaji: 'tsuki' },
            { japanese: 'くるま', romaji: 'kuruma' }, { japanese: 'でんしゃ', romaji: 'densha' },
            { japanese: 'ひこうき', romaji: 'hikouki' }, { japanese: 'ふね', romaji: 'fune' },
            { japanese: 'じてんしゃ', romaji: 'jitensha' }, { japanese: 'とけい', romaji: 'tokei' },
            { japanese: 'めがね', romaji: 'megane' }, { japanese: 'かばん', romaji: 'kaban' },
            { japanese: 'くつ', romaji: 'kutsu' }, { japanese: 'ぼうし', romaji: 'boushi' },
            { japanese: 'えんぴつ', romaji: 'enpitsu' }, { japanese: 'けしゴム', romaji: 'keshigomu' },
            { japanese: 'はさみ', romaji: 'hasami' }, { japanese: 'ノート', romaji: 'noto' },
            { japanese: 'いし', romaji: 'ishi' }, { japanese: 'みず', romaji: 'mizu' },
            { japanese: 'ひ', romaji: 'hi' }, { japanese: 'かぜ', romaji: 'kaze' },
            { japanese: 'つち', romaji: 'tsuchi' }, { japanese: 'そら', romaji: 'sora' }
        ],
        // == モード2: 短文・フレーズ（日本語） - 50個 ==
        phrases_ja: [
            { japanese: 'おはよう ございます', romaji: 'ohayou gozaimasu' },
            { japanese: 'こんにちは', romaji: 'konnichiwa' },
            { japanese: 'こんばんは', romaji: 'konbanwa' },
            { japanese: 'ありがとう ございます', romaji: 'arigatou gozaimasu' },
            { japanese: 'さようなら', romaji: 'sayounara' },
            { japanese: 'おやすみ なさい', romaji: 'oyasumi nasai' },
            { japanese: 'いただきます', romaji: 'itadakimasu' },
            { japanese: 'ごちそうさま', romaji: 'gochisousama' },
            { japanese: 'ただいま', romaji: 'tadaima' },
            { japanese: 'おかえり なさい', romaji: 'okaeri nasai' },
            { japanese: 'いってらっしゃい', romaji: 'itterasshai' },
            { japanese: 'いってきます', romaji: 'ittekimasu' },
            { japanese: 'すみません', romaji: 'sumimasen' },
            { japanese: 'ごめんなさい', romaji: 'gomennasai' },
            { japanese: 'よろしく おねがいします', romaji: 'yoroshiku onegaishimasu' },
            { japanese: 'わかりました', romaji: 'wakarimashita' },
            { japanese: 'わかりません', romaji: 'wakarimasen' },
            { japanese: 'しりません', romaji: 'shirimasen' },
            { japanese: 'だいじょうぶ です', romaji: 'daijoubu desu' },
            { japanese: 'ほんとう です', romaji: 'hontou desu' },
            { japanese: 'うそでしょ', romaji: 'usodesho' },
            { japanese: 'まじで', romaji: 'mazide' },
            { japanese: 'きもちいい', romaji: 'kimochiii' },
            { japanese: 'たのしい', romaji: 'tanoshii' },
            { japanese: 'うれしい', romaji: 'ureshii' },
            { japanese: 'かなしい', romaji: 'kanashii' },
            { japanese: 'さびしい', romaji: 'sabishii' },
            { japanese: 'いたい', romaji: 'itai' },
            { japanese: 'あつい', romaji: 'atsui' },
            { japanese: 'さむい', romaji: 'samui' },
            { japanese: 'つかれた', romaji: 'tsukareta' },
            { japanese: 'ねむい', romaji: 'nemui' },
            { japanese: 'おなかが すいた', romaji: 'onakaga suita' },
            { japanese: 'のどが かわいた', romaji: 'nodoga kawaita' },
            { japanese: 'あいしている', romaji: 'aishiteiru' },
            { japanese: 'すき です', romaji: 'suki desu' },
            { japanese: 'きらい です', romaji: 'kirai desu' },
            { japanese: 'きれい ですね', romaji: 'kirei desune' },
            { japanese: 'かわいい', romaji: 'kawaii' },
            { japanese: 'かっこいい', romaji: 'kakkoii' },
            { japanese: 'やばい', romaji: 'yabai' },
            { japanese: 'すごい', romaji: 'sugoi' },
            { japanese: 'おもしろい', romaji: 'omoshiroi' },
            { japanese: 'つまらない', romaji: 'tsumaranai' },
            { japanese: 'むずかしい', romaji: 'muzukashii' },
            { japanese: 'かんたん', romaji: 'kantan' },
            { japanese: 'いそがしい', romaji: 'isogashii' },
            { japanese: 'ひま です', romaji: 'hima desu' },
            { japanese: 'はやく して', romaji: 'hayaku shite' },
            { japanese: 'ゆっくり でいいよ', romaji: 'yukkuri deiiyo' }
        ],
        // == モード3: 単語（英語） - 50個 ==
        words_en: [
            { japanese: 'りんご (Apple)', romaji: 'apple' }, { japanese: '水 (Water)', romaji: 'water' },
            { japanese: '火 (Fire)', romaji: 'fire' }, { japanese: '山 (Mountain)', romaji: 'mountain' },
            { japanese: '星 (Star)', romaji: 'star' }, { japanese: '犬 (Dog)', romaji: 'dog' },
            { japanese: '猫 (Cat)', romaji: 'cat' }, { japanese: '家 (House)', romaji: 'house' },
            { japanese: '車 (Car)', romaji: 'car' }, { japanese: '本 (Book)', romaji: 'book' },
            { japanese: '時計 (Clock)', romaji: 'clock' }, { japanese: '月 (Moon)', romaji: 'moon' },
            { japanese: '太陽 (Sun)', romaji: 'sun' }, { japanese: '木 (Tree)', romaji: 'tree' },
            { japanese: '雪 (Snow)', romaji: 'snow' }, { japanese: '花 (Flower)', romaji: 'flower' },
            { japanese: '鳥 (Bird)', romaji: 'bird' }, { japanese: '魚 (Fish)', romaji: 'fish' },
            { japanese: '魔法 (Magic)', romaji: 'magic' }, { japanese: '剣 (Sword)', romaji: 'sword' },
            { japanese: '盾 (Shield)', romaji: 'shield' }, { japanese: '鍵 (Key)', romaji: 'key' },
            { japanese: '勇者 (Hero)', romaji: 'hero' }, { japanese: '海 (Ocean)', romaji: 'ocean' },
            { japanese: '虎 (Tiger)', romaji: 'tiger' }, { japanese: 'ライオン (Lion)', romaji: 'lion' },
            { japanese: '熊 (Bear)', romaji: 'bear' }, { japanese: '馬 (Horse)', romaji: 'horse' },
            { japanese: '王 (King)', romaji: 'king' }, { japanese: '女王 (Queen)', romaji: 'queen' },
            { japanese: '騎士 (Knight)', romaji: 'knight' }, { japanese: 'ドラゴン (Dragon)', romaji: 'dragon' },
            { japanese: '城 (Castle)', romaji: 'castle' }, { japanese: '森 (Forest)', romaji: 'forest' },
            { japanese: '川 (River)', romaji: 'river' }, { japanese: '石 (Stone)', romaji: 'stone' },
            { japanese: '風 (Wind)', romaji: 'wind' }, { japanese: '光 (Light)', romaji: 'light' },
            { japanese: '闇 (Dark)', romaji: 'dark' }, { japanese: '影 (Shadow)', romaji: 'shadow' },
            { japanese: '友達 (Friend)', romaji: 'friend' }, { japanese: '敵 (Enemy)', romaji: 'enemy' },
            { japanese: '戦い (Battle)', romaji: 'battle' }, { japanese: '勝利 (Victory)', romaji: 'victory' },
            { japanese: '平和 (Peace)', romaji: 'peace' }, { japanese: '愛 (Love)', romaji: 'love' },
            { japanese: '命 (Life)', romaji: 'life' }, { japanese: '時間 (Time)', romaji: 'time' },
            { japanese: '宇宙 (Space)', romaji: 'space' }, { japanese: '世界 (World)', romaji: 'world' }
        ],
        // == モード4: 短文・フレーズ（英語） - 50個 ==
        phrases_en: [
            { japanese: 'おはよう (Good morning)', romaji: 'good morning' },
            { japanese: 'ありがとう (Thank you)', romaji: 'thank you' },
            { japanese: 'さようなら (Good bye)', romaji: 'good bye' },
            { japanese: 'はい、お願いします (Yes please)', romaji: 'yes please' },
            { japanese: 'お元気ですか？ (How are you)', romaji: 'how are you' },
            { japanese: 'すみません (Excuse me)', romaji: 'excuse me' },
            { japanese: 'ごめんなさい (I am sorry)', romaji: 'i am sorry' },
            { japanese: 'これは何ですか？ (What is this)', romaji: 'what is this' },
            { japanese: '見せてください (Show me)', romaji: 'show me' },
            { japanese: 'わかりました (I understand)', romaji: 'i understand' },
            { japanese: 'わかりません (I dont know)', romaji: 'i dont know' },
            { japanese: '助けて！ (Help me)', romaji: 'help me' },
            { japanese: 'いい天気ですね (Nice weather)', romaji: 'nice weather' },
            { japanese: 'お腹が空きました (I am hungry)', romaji: 'i am hungry' },
            { japanese: '喉が渇きました (I am thirsty)', romaji: 'i am thirsty' },
            { japanese: '一緒に遊ぼう (Lets play)', romaji: 'lets play' },
            { japanese: 'またね (See you soon)', romaji: 'see you soon' },
            { japanese: 'よくできました (Well done)', romaji: 'well done' },
            { japanese: '気をつけて (Take care)', romaji: 'take care' },
            { japanese: 'おやすみなさい (Good night)', romaji: 'good night' },
            { japanese: '頑張って！ (Do your best)', romaji: 'do your best' },
            { japanese: '幸運を (Good luck)', romaji: 'good luck' },
            { japanese: 'また後で (See you later)', romaji: 'see you later' },
            { japanese: '初めまして (Nice to meet you)', romaji: 'nice to meet you' },
            { japanese: 'どういたしまして (You are welcome)', romaji: 'you are welcome' },
            { japanese: '問題ないよ (No problem)', romaji: 'no problem' },
            { japanese: 'いくらですか (How much)', romaji: 'how much' },
            { japanese: 'いくつですか (How many)', romaji: 'how many' },
            { japanese: 'どこですか (Where is it)', romaji: 'where is it' },
            { japanese: '何時ですか (What time)', romaji: 'what time' },
            { japanese: 'まさか (No way)', romaji: 'no way' },
            { japanese: 'もちろんです (Of course)', romaji: 'of course' },
            { japanese: 'ちょっと待って (Just a moment)', romaji: 'just a moment' },
            { japanese: '待ってて (Wait for me)', romaji: 'wait for me' },
            { japanese: '戻ってきて (Come back)', romaji: 'come back' },
            { japanese: 'どうぞ (Go ahead)', romaji: 'go ahead' },
            { japanese: '気をつけて！(Watch out)', romaji: 'watch out' },
            { japanese: '注意して (Be careful)', romaji: 'be careful' },
            { japanese: 'まだです (Not yet)', romaji: 'not yet' },
            { japanese: '今すぐ (Right now)', romaji: 'right now' },
            { japanese: 'あそこです (Over there)', romaji: 'over there' },
            { japanese: 'ここです (Right here)', romaji: 'right here' },
            { japanese: 'たぶん後で (Maybe later)', romaji: 'maybe later' },
            { japanese: '私も (Me too)', romaji: 'me too' },
            { japanese: '久しぶり (Long time no see)', romaji: 'long time no see' },
            { japanese: '元気を出して (Cheer up)', romaji: 'cheer up' },
            { japanese: '気にしないで (Dont worry)', romaji: 'dont worry' },
            { japanese: '愛してるよ (I love you)', romaji: 'i love you' },
            { japanese: 'いい夢を (Sweet dreams)', romaji: 'sweet dreams' },
            { japanese: '誕生日おめでとう (Happy birthday)', romaji: 'happy birthday' }
        ]
    };

    // --- 称号リスト（撃破数に応じて変わる） ---
    const rankList = [
        { min: 0, ja: '見習い剣士', en: 'Apprentice Swordsman' },
        { min: 3, ja: '初心者ファイター', en: 'Beginner Fighter' },
        { min: 6, ja: '駆け出し勇者', en: 'Novice Hero' },
        { min: 10, ja: 'タイピング戦士', en: 'Typing Warrior' },
        { min: 15, ja: 'スピードハンター', en: 'Speed Hunter' },
        { min: 20, ja: '伝説の勇者', en: 'Legendary Hero' },
        { min: 25, ja: '神速のタイピスト', en: 'Godspeed Typist' },
        { min: 30, ja: 'タイピングの王', en: 'King of Typing' },
    ];

    // --- ゲーム状態の変数 ---
    let currentWordIndex = 0;       // 現在の単語インデックス
    let currentCharIndex = 0;       // 現在の文字位置
    let score = 0;                  // 撃破数（スコア）
    let combo = 0;                  // 現在のコンボ数
    let maxCombo = 0;               // 最大コンボ数
    let totalKeystrokes = 0;        // 総キー入力数
    let correctKeystrokes = 0;      // 正解キー入力数
    let timeLeft = 60;              // 残り時間（秒）
    let timerInterval = null;       // タイマーのインターバルID
    let flashTimeout = null;        // フラッシュ解除用のタイマーID
    let isPlaying = false;          // ゲーム中かどうか
    let activeWordList = [];        // 選択されたモードの単語全件
    let shuffledWords = [];         // シャッフル済みの出題リスト

    // --- 背景パーティクルの生成 ---
    function createBgParticles() {
        const container = document.getElementById('bg-particles');
        // 30個の星パーティクルを生成
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.classList.add('bg-particle');
            // ランダムなサイズ
            const size = Math.random() * 8 + 3;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            // ランダムな位置
            particle.style.left = `${Math.random() * 100}%`;
            // ランダムなアニメーション時間
            particle.style.animationDuration = `${Math.random() * 10 + 8}s`;
            // ランダムな遅延
            particle.style.animationDelay = `${Math.random() * 10}s`;
            // ランダムな色（ポップな色合い）
            const colors = ['#ffd23f', '#ff6b35', '#06d6a0', '#7b2ff7', '#f093fb', '#ffffff'];
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            container.appendChild(particle);
        }
    }

    // 背景パーティクルを初期化
    createBgParticles();

    // --- 画面切り替え関数 ---
    function showScreen(screen) {
        // すべての画面を非アクティブにする
        screenStart.classList.remove('active');
        screenGame.classList.remove('active');
        screenResult.classList.remove('active');
        // 指定された画面をアクティブにする
        screen.classList.add('active');
    }

    // --- 単語リストをシャッフルする関数（フィッシャー・イェーツ法） ---
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // --- ゲーム開始関数 ---
    function startGame() {
        // 状態のリセット
        score = 0;
        combo = 0;
        maxCombo = 0;
        totalKeystrokes = 0;
        correctKeystrokes = 0;
        timeLeft = 60;
        currentWordIndex = 0;
        currentCharIndex = 0;
        isPlaying = true;

        // 表示のリセット
        scoreDisplay.textContent = '0';
        comboDisplay.textContent = '0';
        timerDisplay.textContent = '60';
        timerDisplay.classList.remove('timer-danger');

        // 選択されたモードの単語リストを取得
        const selectedMode = modeSelect.value;
        activeWordList = allWordLists[selectedMode];

        // 単語リストをシャッフル（最低50個確保ずみ）
        shuffledWords = shuffleArray(activeWordList);

        // 最初の単語を設定
        setNewWord();

        // ゲーム画面に切り替え
        showScreen(screenGame);

        // タイマーを開始
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;

            // 残り10秒以下で赤く点滅
            if (timeLeft <= 10) {
                timerDisplay.classList.add('timer-danger');
            }

            // 時間切れ
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    // --- 新しい単語を設定する関数 ---
    function setNewWord() {
        // 全部の単語を使い切ったら再シャッフル
        if (currentWordIndex >= shuffledWords.length) {
            shuffledWords = shuffleArray(activeWordList);
            currentWordIndex = 0;
        }

        const word = shuffledWords[currentWordIndex];
        currentCharIndex = 0;

        // ランダムなモンスターを選択し表示
        const randomEmoji = randomMonsters[Math.floor(Math.random() * randomMonsters.length)];
        monsterEmoji.textContent = randomEmoji;
        monsterEmoji.classList.remove('shake', 'defeated');

        // HPバーをリセット
        monsterHpFill.style.width = '100%';
        monsterHpFill.classList.remove('hp-mid', 'hp-low');

        // 日本語の意味（または問題文）を表示
        wordMeaning.textContent = word.japanese;

        // ローマ字を1文字ずつspan要素で表示
        wordRomaji.innerHTML = '';
        for (let i = 0; i < word.romaji.length; i++) {
            const span = document.createElement('span');
            span.classList.add('romaji-char');

            // スペースの対応（フレーズモード用）
            if (word.romaji[i] === ' ') {
                span.textContent = '\u00A0'; // Non-breaking space
                span.classList.add('space-char');
            } else {
                span.textContent = word.romaji[i];
            }

            // 最初の文字にcurrentクラスを付与
            if (i === 0) {
                span.classList.add('current');
            }
            wordRomaji.appendChild(span);
        }
    }

    // --- HPバーを更新する関数 ---
    function updateHpBar() {
        const word = shuffledWords[currentWordIndex];
        const totalChars = word.romaji.length;
        const remaining = totalChars - currentCharIndex;
        const hpPercent = (remaining / totalChars) * 100;

        monsterHpFill.style.width = `${hpPercent}%`;

        // HP量に応じて色を変更
        monsterHpFill.classList.remove('hp-mid', 'hp-low');
        if (hpPercent <= 25) {
            monsterHpFill.classList.add('hp-low');
        } else if (hpPercent <= 50) {
            monsterHpFill.classList.add('hp-mid');
        }
    }

    // --- ダメージポップアップを表示する関数 ---
    function showDamagePopup(text) {
        damagePopup.textContent = text;
        damagePopup.classList.remove('show');
        // モンスターの位置付近にポップアップを表示
        const monsterRect = monsterEmoji.getBoundingClientRect();
        damagePopup.style.left = `${monsterRect.left + monsterRect.width / 2 - 30}px`;
        damagePopup.style.top = `${monsterRect.top - 10}px`;
        // アニメーションをリスタート
        void damagePopup.offsetWidth;
        damagePopup.classList.add('show');
    }

    // --- 赤フラッシュ演出 ---
    function showFlash() {
        // 既存のタイマーがあればクリアする
        if (flashTimeout) {
            clearTimeout(flashTimeout);
        }

        // CSSアニメーションを再起動するために一度外して即座に追加
        flashOverlay.classList.remove('flash');
        void flashOverlay.offsetWidth;
        flashOverlay.classList.add('flash');

        // アニメーションが完了する頃（0.3秒後）に確実にクラスを削除
        flashTimeout = setTimeout(() => {
            flashOverlay.classList.remove('flash');
        }, 300);
    }

    // --- モンスター撃破処理 ---
    function defeatMonster() {
        score++;
        scoreDisplay.textContent = score;

        // 撃破アニメーション
        monsterEmoji.classList.add('defeated');

        // ダメージポップアップ
        showDamagePopup('💥 DEFEAT!');

        // 少し待ってから次の単語へ
        setTimeout(() => {
            currentWordIndex++;
            setNewWord();
        }, 500);
    }

    // --- キー入力処理 ---
    function handleKeyPress(event) {
        // ゲーム中でなければ無視
        if (!isPlaying) return;

        // 特殊キーは無視（Shift, Ctrl, Alt, etc.）
        if (event.key.length !== 1) return;

        const word = shuffledWords[currentWordIndex];

        // 【エラー回避】
        // 単語が未定義の場合や、単語の文字をすべて打ち終えた後に
        // 連続してキーを叩いた場合に備える（配列範囲外アクセスの回避）
        if (!word || currentCharIndex >= word.romaji.length) {
            return;
        }

        const expectedChar = word.romaji[currentCharIndex];
        // スペースも判定できるように toLowerCase() して判定
        const pressedChar = event.key.toLowerCase();

        totalKeystrokes++;

        const charSpans = wordRomaji.querySelectorAll('.romaji-char');

        if (pressedChar === expectedChar) {
            // === 正解 ===
            correctKeystrokes++;
            combo++;
            if (combo > maxCombo) {
                maxCombo = combo;
            }
            comboDisplay.textContent = combo;

            // 現在の文字を正解表示にする
            charSpans[currentCharIndex].classList.remove('current');
            charSpans[currentCharIndex].classList.add('correct');

            // モンスターを揺らす
            monsterEmoji.classList.remove('shake');
            void monsterEmoji.offsetWidth;
            monsterEmoji.classList.add('shake');

            // ダメージポップアップ（コンボ時は特別表示）
            if (combo >= 10) {
                showDamagePopup(`🔥 ${combo} COMBO!`);
            } else if (combo >= 5) {
                showDamagePopup(`⚡ ${combo} COMBO!`);
            }

            // 次の文字へ進む
            currentCharIndex++;

            // HPバーの更新
            updateHpBar();

            // 単語を全部入力できたらモンスター撃破
            if (currentCharIndex >= word.romaji.length) {
                defeatMonster();
            } else {
                // 次の文字にcurrentクラスを付与
                charSpans[currentCharIndex].classList.add('current');
            }
        } else {
            // === ミス ===
            combo = 0;
            comboDisplay.textContent = '0';

            // 現在の文字をミス表示にする
            charSpans[currentCharIndex].classList.add('miss');

            // 赤フラッシュ演出を呼ぶ
            showFlash();

            // 少し待ってからミス表示を解除
            setTimeout(() => {
                // ここでも念のため、ゲームリセット等で消滅している可能性を考慮
                if (charSpans[currentCharIndex]) {
                    charSpans[currentCharIndex].classList.remove('miss');
                }
            }, 300);
        }
    }

    // --- ゲーム終了処理 ---
    function endGame() {
        isPlaying = false;
        clearInterval(timerInterval);

        // 念のためフラッシュ状態を解除
        if (flashTimeout) clearTimeout(flashTimeout);
        flashOverlay.classList.remove('flash');

        // リザルト画面に値を反映
        resultScore.textContent = score;
        resultMaxCombo.textContent = maxCombo;

        // 正確率の計算
        const accuracy = totalKeystrokes > 0
            ? Math.round((correctKeystrokes / totalKeystrokes) * 100)
            : 0;
        resultAccuracy.textContent = `${accuracy}%`;

        // 称号の決定（撃破数に応じて）
        let rank = rankList[0];
        for (let i = rankList.length - 1; i >= 0; i--) {
            if (score >= rankList[i].min) {
                rank = rankList[i];
                break;
            }
        }
        rankTitle.textContent = rank.ja;
        rankTitleEn.textContent = rank.en;

        // リザルト画面に切り替え
        setTimeout(() => {
            showScreen(screenResult);
        }, 500);
    }

    // --- 【機能追加】ゲーム強制リセット処理 ---
    function resetGame() {
        isPlaying = false;

        // タイマー等をクリア
        if (timerInterval) clearInterval(timerInterval);
        if (flashTimeout) clearTimeout(flashTimeout);
        flashOverlay.classList.remove('flash');

        // スタート画面に戻す
        showScreen(screenStart);
    }

    // --- イベントリスナーの登録 ---

    // スタートボタン
    btnStart.addEventListener('click', startGame);

    // リトライボタン
    btnRetry.addEventListener('click', () => {
        // スタート画面に戻してモード選択できるようにする
        showScreen(screenStart);
    });

    // 【追加】Quitボタン
    btnQuit.addEventListener('click', resetGame);

    // キー入力（ゲーム全体でリスン）
    document.addEventListener('keydown', handleKeyPress);
});
