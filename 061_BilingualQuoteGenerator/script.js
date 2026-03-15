/**
 * 名言・格言ジェネレーター メインスクリプト
 * 
 * 50個以上の名言データを配列で持ち、ランダムに表示します。
 * 初心者にも分かりやすいように、詳細な日本語コメントを記述しています。
 */

// 1. 名言データの配列（50個のデータを格納）
// 歴史上の偉人、哲学者、ビジネスリーダー、文学など、多様なジャンルから選定
const quotes = [
    {
        en: "The only limit to our realization of tomorrow is our doubts of today.",
        ja: "私たちの明日の実現への唯一の限界は、今日の疑いである。",
        authorEn: "Franklin D. Roosevelt",
        authorJa: "フランクリン・D・ルーズベルト"
    },
    {
        en: "Stay hungry, stay foolish.",
        ja: "ハングリーであれ。愚かであれ。",
        authorEn: "Steve Jobs",
        authorJa: "スティーブ・ジョブズ"
    },
    {
        en: "Imagination is more important than knowledge.",
        ja: "想像力は知識よりも重要である。",
        authorEn: "Albert Einstein",
        authorJa: "アルベルト・アインシュタイン"
    },
    {
        en: "Be the change that you wish to see in the world.",
        ja: "あなたがこの世で見たいと願う変化に、あなた自身がなりなさい。",
        authorEn: "Mahatma Gandhi",
        authorJa: "マハトマ・ガンディー"
    },
    {
        en: "It always seems impossible until it's done.",
        ja: "何事も達成するまでは不可能に見えるものである。",
        authorEn: "Nelson Mandela",
        authorJa: "ネルソン・マンデラ"
    },
    {
        en: "The way to get started is to quit talking and begin doing.",
        ja: "何かを始めるためには、しゃべるのをやめて行動し始めることだ。",
        authorEn: "Walt Disney",
        authorJa: "ウォルト・ディズニー"
    },
    {
        en: "In the end, it's not the years in your life that count. It's the life in your years.",
        ja: "結局のところ、大切なのは生きた年数ではない。その年数にどれだけの命が吹き込まれているかだ。",
        authorEn: "Abraham Lincoln",
        authorJa: "エイブラハム・リンカーン"
    },
    {
        en: "The secret of getting ahead is getting started.",
        ja: "前進するための秘訣は、まず始めることである。",
        authorEn: "Mark Twain",
        authorJa: "マーク・トウェイン"
    },
    {
        en: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        ja: "成功は決定的ではなく、失敗は致命的ではない。大切なのは、続ける勇気だ。",
        authorEn: "Winston Churchill",
        authorJa: "ウィンストン・チャーチル"
    },
    {
        en: "Knowing yourself is the beginning of all wisdom.",
        ja: "自分自身を知ることが、すべての知恵の始まりである。",
        authorEn: "Aristotle",
        authorJa: "アリストテレス"
    },
    {
        en: "Do not go where the path may lead, go instead where there is no path and leave a trail.",
        ja: "道が続いているところへ行くのではなく、道のないところへ行き、そこに足跡を残しなさい。",
        authorEn: "Ralph Waldo Emerson",
        authorJa: "ラルフ・ワルド・エマーソン"
    },
    {
        en: "I have not failed. I've just found 10,000 ways that won't work.",
        ja: "私は失敗したことがない。ただ、1万通りのうまく行かない方法を見つけただけだ。",
        authorEn: "Thomas Edison",
        authorJa: "トーマス・エジソン"
    },
    {
        en: "Life is what happens when you're busy making other plans.",
        ja: "人生とは、他の計画を立てるのに忙しい時に起きる出来事のことである。",
        authorEn: "John Lennon",
        authorJa: "ジョン・レノン"
    },
    {
        en: "You miss 100% of the shots you don't take.",
        ja: "打たないシュートは、100%外れる。",
        authorEn: "Wayne Gretzky",
        authorJa: "ウェイン・グレツキー"
    },
    {
        en: "Whether you think you can or you think you can't, you're right.",
        ja: "できると思えばできる、できないと思えばできない。どちらにしてもあなたが正しい。",
        authorEn: "Henry Ford",
        authorJa: "ヘンリー・フォード"
    },
    {
        en: "The future belongs to those who believe in the beauty of their dreams.",
        ja: "未来は、自分の夢の美しさを信じる人たちのものだ。",
        authorEn: "Eleanor Roosevelt",
        authorJa: "エレノア・ルーズベルト"
    },
    {
        en: "Happiness is not something ready made. It comes from your own actions.",
        ja: "幸せはあらかじめそこにあるものではない。自身の行動から生まれるものである。",
        authorEn: "Dalai Lama",
        authorJa: "ダライ・ラマ"
    },
    {
        en: "Everything you've ever wanted is on the other side of fear.",
        ja: "あなたが望むすべてのものは、恐怖の向こう側にある。",
        authorEn: "George Addair",
        authorJa: "ジョージ・アデア"
    },
    {
        en: "I attribute my success to this: I never gave or took any excuse.",
        ja: "私の成功の理由はこれだ。言い訳をせず、言い訳を受け入れなかったこと。",
        authorEn: "Florence Nightingale",
        authorJa: "フローレンス・ナイチンゲール"
    },
    {
        en: "Life is 10% what happens to me and 90% of how I react to it.",
        ja: "人生は、私に起こる出来事が10%、それに対する私の反応が90%でできている。",
        authorEn: "Charles Swindoll",
        authorJa: "チャールズ・スウィンドル"
    },
    {
        en: "Your time is limited, so don't waste it living someone else's life.",
        ja: "あなたの時間は限られている。だから、他人の人生を生きることで時間を無駄にしてはいけない。",
        authorEn: "Steve Jobs",
        authorJa: "スティーブ・ジョブズ"
    },
    {
        en: "Two roads diverged in a wood, and I—I took the one less traveled by, And that has made all the difference.",
        ja: "森の中で道が二つに分かれていた。私は人があまり通っていない道を選んだ。そして、それがすべてを変えた。",
        authorEn: "Robert Frost",
        authorJa: "ロバート・フロスト"
    },
    {
        en: "When everything seems to be going against you, remember that the airplane takes off against the wind, not with it.",
        ja: "すべてが自分に逆風として吹いているように見える時は、思い出してほしい。飛行機は追い風ではなく、向かい風によって離陸するのだということを。",
        authorEn: "Henry Ford",
        authorJa: "ヘンリー・フォード"
    },
    {
        en: "It does not matter how slowly you go as long as you do not stop.",
        ja: "止まりさえしなければ、どんなにゆっくり進んでも構わない。",
        authorEn: "Confucius",
        authorJa: "孔子"
    },
    {
        en: "I can't change the direction of the wind, but I can adjust my sails to always reach my destination.",
        ja: "風の向きを変えることはできないが、いつも目的地にたどり着くために、帆を調整することはできる。",
        authorEn: "Jimmy Dean",
        authorJa: "ジミー・ディーン"
    },
    {
        en: "Believe you can and you're halfway there.",
        ja: "できると信じれば、もう半分は終わったようなものだ。",
        authorEn: "Theodore Roosevelt",
        authorJa: "セオドア・ルーズベルト"
    },
    {
        en: "To handle yourself, use your head; to handle others, use your heart.",
        ja: "自分自身を扱うには頭を使いなさい。他人を扱うには心を使用しなさい。",
        authorEn: "Eleanor Roosevelt",
        authorJa: "エレノア・ルーズベルト"
    },
    {
        en: "Too many of us are not living our dreams because we are living our fears.",
        ja: "私たちの多くは、夢を生きていない。なぜなら、恐れを生きているからだ。",
        authorEn: "Les Brown",
        authorJa: "レス・ブラウン"
    },
    {
        en: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
        ja: "目標を達成することによって得るものは、目標を達成することによって自分が何になるかほど重要ではない。",
        authorEn: "Zig Ziglar",
        authorJa: "ジグ・ジグラー"
    },
    {
        en: "I would rather die of passion than of boredom.",
        ja: "退屈で死ぬくらいなら、情熱によって死にたい。",
        authorEn: "Vincent van Gogh",
        authorJa: "フィンセント・ファン・ゴッホ"
    },
    {
        en: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
        ja: "生きる上での最大の栄光は、決して転ばないことではなく、転ぶたびに起き上がることである。",
        authorEn: "Nelson Mandela",
        authorJa: "ネルソン・マンデラ"
    },
    {
        en: "Life is short, and it is here to be lived.",
        ja: "人生は短い。そして、生きるためにここにある。",
        authorEn: "Kate Winslet",
        authorJa: "ケイト・ウィンスレット"
    },
    {
        en: "Change your thoughts and you change your world.",
        ja: "考え方を変えれば、世界が変わる。",
        authorEn: "Norman Vincent Peale",
        authorJa: "ノーマン・ヴィンセント・ピール"
    },
    {
        en: "If you want to lift yourself up, lift up someone else.",
        ja: "自分自身を引き上げたいのなら、他の誰かを引き上げなさい。",
        authorEn: "Booker T. Washington",
        authorJa: "ブッカー・T・ワシントン"
    },
    {
        en: "Action is the foundational key to all success.",
        ja: "行動こそが、すべての成功への基本的な鍵である。",
        authorEn: "Pablo Picasso",
        authorJa: "パブロ・ピカソ"
    },
    {
        en: "If you tell the truth, you don't have to remember anything.",
        ja: "真実を語るなら、何も記憶しておく必要はない。",
        authorEn: "Mark Twain",
        authorJa: "マーク・トウェイン"
    },
    {
        en: "Without music, life would be a mistake.",
        ja: "音楽のない人生は、間違いであろう。",
        authorEn: "Friedrich Nietzsche",
        authorJa: "フリードリヒ・ニーチェ"
    },
    {
        en: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
        ja: "あなたを他の何かにしようと絶えず試みる世界の中で、自分自身であり続けることは最大の成果である。",
        authorEn: "Ralph Waldo Emerson",
        authorJa: "ラルフ・ワルド・エマーソン"
    },
    {
        en: "Don't judge each day by the harvest you reap but by the seeds that you plant.",
        ja: "その日に収穫したものによって日々を判断するのではなく、その日に植えた種によって判断しなさい。",
        authorEn: "Robert Louis Stevenson",
        authorJa: "ロバート・ルイス・スティーヴンソン"
    },
    {
        en: "There is no charm equal to tenderness of heart.",
        ja: "心の優しさに勝る魅力はない。",
        authorEn: "Jane Austen",
        authorJa: "ジェーン・オースティン"
    },
    {
        en: "All our dreams can come true, if we have the courage to pursue them.",
        ja: "夢を追い求める勇気さえあれば、すべての夢は実現できる。",
        authorEn: "Walt Disney",
        authorJa: "ウォルト・ディズニー"
    },
    {
        en: "Try not to become a man of success. Rather become a man of value.",
        ja: "成功する人間になろうとするな。それよりも、価値のある人間になろうとしなさい。",
        authorEn: "Albert Einstein",
        authorJa: "アルベルト・アインシュタイン"
    },
    {
        en: "Great minds discuss ideas; average minds discuss events; small minds discuss people.",
        ja: "偉大な心はアイデアを論じ、普通の心は出来事を論じ、狭い心は人々を論じる。",
        authorEn: "Eleanor Roosevelt",
        authorJa: "エレノア・ルーズベルト"
    },
    {
        en: "A successful man is one who can lay a firm foundation with the bricks others have thrown at him.",
        ja: "成功する人間とは、他人が自分に投げつけたレンガでしっかりとした基礎を築くことができる人のことである。",
        authorEn: "David Brinkley",
        authorJa: "デビッド・ブリンクリー"
    },
    {
        en: "Those who dare to fail miserably can achieve greatly.",
        ja: "惨めな失敗を恐れない者だけが、偉大なことを成し遂げることができる。",
        authorEn: "John F. Kennedy",
        authorJa: "ジョン・F・ケネディ"
    },
    {
        en: "Only put off until tomorrow what you are willing to die having left undone.",
        ja: "死ぬときに未練が残るものだけを、明日に延期しなさい。",
        authorEn: "Pablo Picasso",
        authorJa: "パブロ・ピカソ"
    },
    {
        en: "The whole secret of a successful life is to find out what is one's destiny to do, and then do it.",
        ja: "成功する人生の全秘訣は、自分の運命が何をすることであるかを見出し、そしてそれをすることである。",
        authorEn: "Henry Ford",
        authorJa: "ヘンリー・フォード"
    },
    {
        en: "Love all, trust a few, do wrong to none.",
        ja: "すべてを愛し、少しを信じ、誰にも過ちを犯さないようにしなさい。",
        authorEn: "William Shakespeare",
        authorJa: "ウィリアム・シェイクスピア"
    },
    {
        en: "You only live once, but if you do it right, once is enough.",
        ja: "人生は一度きりだが、正しく生きるなら、一度で十分だ。",
        authorEn: "Mae West",
        authorJa: "メイ・ウエスト"
    },
    {
        en: "In three words I can sum up everything I've learned about life: it goes on.",
        ja: "人生について学んだすべてを3語で要約できる。「それは進んでいく（It goes on）」。",
        authorEn: "Robert Frost",
        authorJa: "ロバート・フロスト"
    }
];

// 2. DOM（HTML要素）の取得
const elements = {
    card: document.getElementById('quote-card'),
    quoteEn: document.getElementById('quote-en'),
    quoteJa: document.getElementById('quote-ja'),
    authorEn: document.getElementById('author-en'),
    authorJa: document.getElementById('author-ja'),
    nextBtn: document.getElementById('next-btn')
};

/**
 * 3. クロスサイトスクリプティング（XSS）対策のためのサニタイズ関数
 * ユーザー入力ではありませんが、セキュリティのベストプラクティスとして
 * テキストをHTMLに出力する前に特殊文字をエスケープします。
 * @param {string} str - サニタイズする文字列
 * @returns {string} サニタイズされた安全な文字列
 */
function sanitizeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}

// 4. 新しい名言を取得して画面に表示する関数
function displayRandomQuote() {
    // データ配列からランダムなインデックスを選ぶ
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];

    // 透明にしてフェードアウトさせる（CSSアニメーションと連携）
    elements.card.classList.add('fade-out');

    // トランジション（CSSのアニメーション）が終わるタイミングで中身を書き換える
    // 今回はCSSで0.5s（500ms）を指定しているので、少し短い400ms後くらいに変更
    setTimeout(() => {
        // サニタイズ関数を通してからDOMに反映（セキュリティ対策）
        elements.quoteEn.textContent = `"${sanitizeHTML(quote.en)}"`;
        elements.quoteJa.textContent = sanitizeHTML(quote.ja);
        elements.authorEn.textContent = `- ${sanitizeHTML(quote.authorEn)}`;
        elements.authorJa.textContent = sanitizeHTML(quote.authorJa);

        // フェードアウトクラスを外して再度表示（フェードイン）させる
        elements.card.classList.remove('fade-out');
    }, 400); // 400ミリ秒後に実行
}

// 5. ボタンがクリックされたときのイベントリスナーを設定
elements.nextBtn.addEventListener('click', displayRandomQuote);

// 6. 画像が無い場合（エラー時）のファビコンフォールバック処理
const setupFaviconFallback = () => {
    const faviconElement = document.getElementById('dynamic-favicon');
    const tempImage = new Image();
    
    // 画像が読み込めたかどうかテスト
    tempImage.src = 'favicon.png';
    tempImage.onerror = () => {
        // もし画像が存在しない場合は、絵文字（💬）を使ったSVGデータURIをセット
        const emojiSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💬</text></svg>`;
        faviconElement.href = 'data:image/svg+xml,' + encodeURIComponent(emojiSvg);
    };
};

// 7. アプリケーション開始時の初期化処理
function init() {
    // 最初の名言を表示
    displayRandomQuote();
    
    // ファビコンのフォールバックをセットアップ
    setupFaviconFallback();
}

// ページの読み込みが完了したら初期化処理を実行
window.addEventListener('DOMContentLoaded', init);
