/* =========================================
   Mood & Shred Contact / エモ・シュレッダー・フォーム
   メインスクリプト

   機能:
   - メッセージ本文のリアルタイム感情検知
   - 感情スコアに応じた背景グラデーション変化
   - シュレッダー発動条件の判定
   - シュレッダー・アニメーションの実行
   - 通常送信のダミー処理
   ========================================= */

// ===== DOM要素の取得 =====
const moodBg = document.getElementById('mood-bg');
const moodEmoji = document.getElementById('mood-emoji');
const moodLabel = document.getElementById('mood-label');
const formCard = document.getElementById('form-card');
const contactForm = document.getElementById('contact-form');
const categorySelect = document.getElementById('category');
const messageTextarea = document.getElementById('message');
const btnSubmit = document.getElementById('btn-submit');
const btnSubmitIcon = document.getElementById('btn-submit-icon');
const btnSubmitText = document.getElementById('btn-submit-text');
const shredderContainer = document.getElementById('shredder-container');
const completionMessage = document.getElementById('completion-message');
const completionEmoji = document.getElementById('completion-emoji');
const completionText = document.getElementById('completion-text');
const btnReset = document.getElementById('btn-reset');
const appIcon = document.getElementById('app-icon');

// ===== ファビコン画像読み込みエラー時の処理 =====
appIcon.addEventListener('error', function () {
    this.classList.add('hidden');
});

// ===== 感情辞書の定義 =====
// ポジティブワード（日本語＋英語）
const POSITIVE_WORDS = [
    '嬉しい', 'うれしい', '最高', 'ありがとう', '好き', '素晴らしい',
    '楽しい', 'たのしい', '幸せ', 'しあわせ', '感謝', '大好き',
    'いいね', '素敵', 'すてき', '最高', 'すごい', '凄い',
    'おめでとう', 'よかった', '良かった', 'わくわく', 'ワクワク',
    'happy', 'great', 'thanks', 'thank', 'love', 'wonderful',
    'amazing', 'awesome', 'excellent', 'fantastic', 'beautiful',
    'perfect', 'brilliant', 'good', 'nice', 'joy', 'glad',
    'pleased', 'grateful', 'appreciate', 'congratulations'
];

// ネガティブワード（日本語＋英語）
const NEGATIVE_WORDS = [
    '最悪', '疲れた', 'つかれた', 'むかつく', '悲しい', 'かなしい',
    '嫌い', 'きらい', '腹立つ', 'うざい', 'ウザい', 'だるい',
    'ダルい', 'つらい', '辛い', 'しんどい', '許せない', 'ゆるせない',
    'ふざけるな', '死にたい', 'ムカつく', '頭にくる', 'イライラ',
    'いらいら', '不満', '苦痛', '面倒', 'めんどう', 'めんどくさい',
    'bad', 'tired', 'angry', 'sad', 'hate', 'terrible',
    'horrible', 'awful', 'worst', 'annoying', 'frustrated',
    'upset', 'disgusted', 'furious', 'miserable', 'painful',
    'sick', 'stress', 'depressed', 'disappointed', 'damn'
];

// ===== シュレッダーモードになるネガティブスコアの閾値 =====
const SHRED_THRESHOLD = 3;

// ===== 現在の感情状態を追跡する変数 =====
let currentMoodScore = 0; // 正=ポジティブ、負=ネガティブ
let isShredMode = false;

// ===== メッセージ本文の感情スコアを計算する関数 =====
function calculateMoodScore(text) {
    // テキストを小文字に統一（英語の大文字小文字を無視するため）
    const lowerText = text.toLowerCase();
    let score = 0;

    // ポジティブワードのカウント
    POSITIVE_WORDS.forEach(function (word) {
        // 単語がテキスト内に含まれる回数を数える
        const regex = new RegExp(word.toLowerCase(), 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
            score += matches.length;
        }
    });

    // ネガティブワードのカウント
    NEGATIVE_WORDS.forEach(function (word) {
        const regex = new RegExp(word.toLowerCase(), 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
            score -= matches.length;
        }
    });

    return score;
}

// ===== 感情スコアに基づいてUIを更新する関数 =====
function updateMoodUI(score) {
    currentMoodScore = score;

    // カテゴリが「愚痴・不満」の場合はスコアを強制的にネガティブに
    const isVentCategory = categorySelect.value === 'vent';

    // body要素から既存のムードクラスを除去
    document.body.classList.remove('mood-positive', 'mood-negative', 'mood-very-negative');

    if (isVentCategory || score <= -SHRED_THRESHOLD) {
        // === 強ネガティブ（シュレッダー発動ライン） ===
        document.body.classList.add('mood-very-negative');
        moodEmoji.textContent = '😡';
        moodLabel.textContent = 'かなりネガティブ / Very Negative';
        activateShredMode();
    } else if (score < 0) {
        // === ネガティブ ===
        document.body.classList.add('mood-negative');
        moodEmoji.textContent = '😟';
        moodLabel.textContent = 'ネガティブ / Negative';
        // スコアがまだ閾値未満ならシュレッドモードは解除（カテゴリ依存）
        if (isVentCategory) {
            activateShredMode();
        } else {
            deactivateShredMode();
        }
    } else if (score > 0) {
        // === ポジティブ ===
        document.body.classList.add('mood-positive');
        moodEmoji.textContent = '😊';
        moodLabel.textContent = 'ポジティブ / Positive';
        deactivateShredMode();
    } else {
        // === ニュートラル ===
        moodEmoji.textContent = '😐';
        moodLabel.textContent = 'ニュートラル / Neutral';
        if (isVentCategory) {
            activateShredMode();
        } else {
            deactivateShredMode();
        }
    }
}

// ===== シュレッダーモードを有効にする関数 =====
function activateShredMode() {
    if (isShredMode) return; // 既にシュレッドモードなら何もしない
    isShredMode = true;
    btnSubmit.classList.add('shred-mode');
    btnSubmitIcon.textContent = '🗑️';
    btnSubmitText.textContent = 'シュレッダーにかける / Shred';
}

// ===== シュレッダーモードを無効にする関数 =====
function deactivateShredMode() {
    if (!isShredMode) return; // 既に通常モードなら何もしない
    isShredMode = false;
    btnSubmit.classList.remove('shred-mode');
    btnSubmitIcon.textContent = '✉️';
    btnSubmitText.textContent = '送信 / Send';
}

// ===== シュレッダー・アニメーションを実行する関数 =====
function executeShredAnimation() {
    // フォームカードを非表示にする
    formCard.style.display = 'none';

    // シュレッダーコンテナを表示
    shredderContainer.classList.add('active');

    // フォームカードの寸法を取得してストライプを生成
    const cardWidth = 600; // おおよそのフォーム幅
    const cardHeight = 400; // おおよそのフォーム高さ
    const stripCount = 12; // ストライプの数
    const stripWidth = Math.ceil(cardWidth / stripCount);

    // シュレッダーコンテナの高さを設定
    shredderContainer.style.height = cardHeight + 'px';

    // フォーム内のテキスト内容を取得（ストライプに表示するため）
    const formData = [
        document.getElementById('user-name').value || '名前...',
        document.getElementById('user-email').value || 'メール...',
        categorySelect.options[categorySelect.selectedIndex]
            ? categorySelect.options[categorySelect.selectedIndex].text
            : 'カテゴリ...',
        messageTextarea.value || 'メッセージ...'
    ];

    // ストライプを生成して配置
    for (let i = 0; i < stripCount; i++) {
        const strip = document.createElement('div');
        strip.classList.add('shred-strip');

        // 各ストライプの位置とサイズを設定
        strip.style.left = (i * stripWidth) + 'px';
        strip.style.width = stripWidth + 'px';
        strip.style.height = cardHeight + 'px';

        // ストライプにランダムな回転角度を設定
        const rotation = (Math.random() - 0.5) * 12; // -6度〜+6度
        strip.style.setProperty('--shred-rotation', rotation + 'deg');

        // ストライプ内にテキスト断片を追加
        const content = document.createElement('div');
        content.classList.add('shred-strip-content');
        // フォームデータからランダムにテキストを選択
        content.textContent = formData[i % formData.length];
        strip.appendChild(content);

        // 各ストライプに異なるアニメーション遅延を設定（中央から外側へ）
        const delay = Math.abs(i - stripCount / 2) * 0.08;
        const duration = 1.2 + Math.random() * 0.6;
        strip.style.animation = `shred-fall ${duration}s ${delay}s ease-in forwards`;

        shredderContainer.appendChild(strip);
    }

    // アニメーション終了後に完了メッセージを表示
    const totalAnimTime = 2.5 * 1000; // 全ストライプのアニメーション完了まで
    setTimeout(function () {
        shredderContainer.classList.remove('active');
        shredderContainer.innerHTML = ''; // ストライプをクリーンアップ
        showCompletionMessage('shred');
    }, totalAnimTime);
}

// ===== 完了メッセージを表示する関数 =====
function showCompletionMessage(type) {
    completionMessage.classList.add('active');

    if (type === 'shred') {
        // シュレッダー完了メッセージ
        completionEmoji.textContent = '🎉';
        completionText.innerHTML =
            'スッキリしましたね！<br>送信はされませんでした。' +
            '<br><br>' +
            '<span style="color: #999; font-size: 0.85rem;">' +
            'Feel better? It was not sent.' +
            '</span>';
        // 背景をニュートラルに戻す
        document.body.classList.remove('mood-positive', 'mood-negative', 'mood-very-negative');
    } else {
        // 通常送信完了メッセージ
        completionEmoji.textContent = '✅';
        completionText.innerHTML =
            '送信が完了しました！<br>ありがとうございます。' +
            '<br><br>' +
            '<span style="color: #999; font-size: 0.85rem;">' +
            'Message Sent. Thank you!' +
            '</span>';
    }
}

// ===== フォームを初期状態にリセットする関数 =====
function resetForm() {
    // 完了メッセージを非表示
    completionMessage.classList.remove('active');

    // フォームカードを表示
    formCard.style.display = '';

    // フォームの入力をリセット
    contactForm.reset();

    // ムードをニュートラルに戻す
    currentMoodScore = 0;
    isShredMode = false;
    document.body.classList.remove('mood-positive', 'mood-negative', 'mood-very-negative');
    moodEmoji.textContent = '😐';
    moodLabel.textContent = 'ニュートラル / Neutral';
    btnSubmit.classList.remove('shred-mode');
    btnSubmitIcon.textContent = '✉️';
    btnSubmitText.textContent = '送信 / Send';
}

// ===== イベントリスナーの設定 =====

// メッセージ本文のリアルタイム感情検知
messageTextarea.addEventListener('input', function () {
    const score = calculateMoodScore(this.value);
    updateMoodUI(score);
});

// カテゴリ変更時にもムードを再評価
categorySelect.addEventListener('change', function () {
    const score = calculateMoodScore(messageTextarea.value);
    updateMoodUI(score);
});

// フォーム送信イベント
contactForm.addEventListener('submit', function (event) {
    // ページ遷移を防止
    event.preventDefault();

    // 簡易バリデーション（名前とメールが空でないか）
    const name = document.getElementById('user-name').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const category = categorySelect.value;
    const message = messageTextarea.value.trim();

    if (!name || !email || !category || !message) {
        // 未入力項目がある場合はアラートで通知
        alert('すべての項目を入力してください / Please fill in all fields.');
        return;
    }

    if (isShredMode) {
        // === シュレッダーモードの場合 ===
        executeShredAnimation();
    } else {
        // === 通常送信の場合 ===
        formCard.style.display = 'none';
        showCompletionMessage('send');
    }
});

// リセットボタンでフォームを初期状態に戻す
btnReset.addEventListener('click', resetForm);
