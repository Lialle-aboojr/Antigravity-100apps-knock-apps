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

    // ボタン
    const btnStart = document.getElementById('btn-start');
    const btnRetry = document.getElementById('btn-retry');

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

    // --- 単語リスト（20個以上：日本語の意味 + ローマ字 + モンスター絵文字） ---
    const wordList = [
        // 動物
        { japanese: 'ねこ', romaji: 'neko', monster: '🐱' },
        { japanese: 'いぬ', romaji: 'inu', monster: '🐶' },
        { japanese: 'うさぎ', romaji: 'usagi', monster: '🐰' },
        { japanese: 'くま', romaji: 'kuma', monster: '🐻' },
        { japanese: 'さる', romaji: 'saru', monster: '🐵' },
        { japanese: 'とり', romaji: 'tori', monster: '🐦' },
        { japanese: 'さかな', romaji: 'sakana', monster: '🐟' },
        // 食べ物
        { japanese: 'りんご', romaji: 'ringo', monster: '🍎' },
        { japanese: 'ばなな', romaji: 'banana', monster: '🍌' },
        { japanese: 'すいか', romaji: 'suika', monster: '🍉' },
        { japanese: 'ぶどう', romaji: 'budou', monster: '🍇' },
        { japanese: 'ケーキ', romaji: 'keeki', monster: '🍰' },
        { japanese: 'ラーメン', romaji: 'raamen', monster: '🍜' },
        { japanese: 'おにぎり', romaji: 'onigiri', monster: '🍙' },
        // 色
        { japanese: 'あか', romaji: 'aka', monster: '🔴' },
        { japanese: 'あお', romaji: 'ao', monster: '🔵' },
        { japanese: 'みどり', romaji: 'midori', monster: '🟢' },
        { japanese: 'きいろ', romaji: 'kiiro', monster: '🟡' },
        // モンスター系
        { japanese: 'ドラゴン', romaji: 'doragon', monster: '🐉' },
        { japanese: 'おばけ', romaji: 'obake', monster: '👻' },
        { japanese: 'がいこつ', romaji: 'gaikotsu', monster: '💀' },
        { japanese: 'あくま', romaji: 'akuma', monster: '😈' },
        { japanese: 'ロボット', romaji: 'robotto', monster: '🤖' },
        { japanese: 'エイリアン', romaji: 'eirian', monster: '👾' },
        // 自然
        { japanese: 'はな', romaji: 'hana', monster: '🌸' },
        { japanese: 'やま', romaji: 'yama', monster: '⛰️' },
        { japanese: 'うみ', romaji: 'umi', monster: '🌊' },
        { japanese: 'ほし', romaji: 'hoshi', monster: '⭐' },
        { japanese: 'たいよう', romaji: 'taiyou', monster: '☀️' },
        { japanese: 'つき', romaji: 'tsuki', monster: '🌙' },
    ];

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
    let isPlaying = false;          // ゲーム中かどうか
    let shuffledWords = [];         // シャッフル済みの単語リスト

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

        // 単語リストをシャッフル
        shuffledWords = shuffleArray(wordList);

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
        // 単語リストを使い切ったら再シャッフル
        if (currentWordIndex >= shuffledWords.length) {
            shuffledWords = shuffleArray(wordList);
            currentWordIndex = 0;
        }

        const word = shuffledWords[currentWordIndex];
        currentCharIndex = 0;

        // モンスター絵文字の表示
        monsterEmoji.textContent = word.monster;
        monsterEmoji.classList.remove('shake', 'defeated');

        // HPバーをリセット
        monsterHpFill.style.width = '100%';
        monsterHpFill.classList.remove('hp-mid', 'hp-low');

        // 日本語の意味を表示
        wordMeaning.textContent = word.japanese;

        // ローマ字を1文字ずつspan要素で表示
        wordRomaji.innerHTML = '';
        for (let i = 0; i < word.romaji.length; i++) {
            const span = document.createElement('span');
            span.classList.add('romaji-char');
            span.textContent = word.romaji[i];
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
        flashOverlay.classList.remove('flash');
        void flashOverlay.offsetWidth;
        flashOverlay.classList.add('flash');
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
        const expectedChar = word.romaji[currentCharIndex];
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

            // 赤フラッシュ演出
            showFlash();

            // 少し待ってからミス表示を解除
            setTimeout(() => {
                charSpans[currentCharIndex].classList.remove('miss');
            }, 300);
        }
    }

    // --- ゲーム終了処理 ---
    function endGame() {
        isPlaying = false;
        clearInterval(timerInterval);

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

    // --- イベントリスナーの登録 ---

    // スタートボタン
    btnStart.addEventListener('click', startGame);

    // リトライボタン
    btnRetry.addEventListener('click', startGame);

    // キー入力（ゲーム全体でリスン）
    document.addEventListener('keydown', handleKeyPress);
});
