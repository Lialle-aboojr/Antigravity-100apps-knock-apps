/*
  Daily Quote Gallery - メインスクリプト
  このファイルは、名言データの管理、ランダム表示、テーマ切り替え、
  コピー・シェア機能などのすべてのロジックを担当します。
*/

// ==========================================
// 1. 名言データ配列（超重要：ユーザーが拡張可能）
// ==========================================
const quotesArray = [
  // --- 歴史上の偉人・哲学者 ---
  {
    jpQuote: "私がやった仕事で本当に成功したものは、全体のわずか1％にすぎない。",
    enQuote: "Only 1% of the work I have done was truly successful.",
    jpAuthor: "本田宗一郎",
    enAuthor: "Soichiro Honda"
  },
  {
    jpQuote: "最大の名誉は決して倒れないことではない。倒れるたびに起き上がることである。",
    enQuote: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    jpAuthor: "ネルソン・マンデラ",
    enAuthor: "Nelson Mandela"
  },
  {
    jpQuote: "人生とは、自分を見つけることではない。自分を創ることだ。",
    enQuote: "Life isn't about finding yourself. Life is about creating yourself.",
    jpAuthor: "ジョージ・バーナード・ショー",
    enAuthor: "George Bernard Shaw"
  },
  {
    jpQuote: "考えすぎてはいけない。ただ、やりなさい。",
    enQuote: "Don't think too much. Just do it.",
    jpAuthor: "エドガー・アラン・ポー",
    enAuthor: "Edgar Allan Poe"
  },
  {
    jpQuote: "どんなに暗く見えても、星は夜に輝く。",
    enQuote: "No matter how dark it seems, stars shine at night.",
    jpAuthor: "ラルフ・ワルド・エマーソン",
    enAuthor: "Ralph Waldo Emerson"
  },
  {
    jpQuote: "あなたができること、あるいは夢見ることができることはすべて、始めなさい。",
    enQuote: "Whatever you can do or dream you can, begin it.",
    jpAuthor: "ヨハン・ヴォルフガング・フォン・ゲーテ",
    enAuthor: "Johann Wolfgang von Goethe"
  },
  {
    jpQuote: "私は失敗したことがない。ただ、1万通りのうまく行かない方法を見つけただけだ。",
    enQuote: "I have not failed. I've just found 10,000 ways that won't work.",
    jpAuthor: "トーマス・エジソン",
    enAuthor: "Thomas Edison"
  },
  {
    jpQuote: "真の発見の旅とは、新しい景色を探すことではない。新しい目で見ることだ。",
    enQuote: "The real voyage of discovery consists not in seeking new landscapes, but in having new eyes.",
    jpAuthor: "マルセル・プルースト",
    enAuthor: "Marcel Proust"
  },
  {
    jpQuote: "未来を予測する最善の方法は、それを創り出すことだ。",
    enQuote: "The best way to predict the future is to create it.",
    jpAuthor: "ピーター・ドラッカー",
    enAuthor: "Peter Drucker"
  },
  {
    jpQuote: "狂気とはすなわち、同じことを繰り返し行い、違う結果を期待することだ。",
    enQuote: "Insanity is doing the same thing over and over again and expecting different results.",
    jpAuthor: "アルベルト・アインシュタイン",
    enAuthor: "Albert Einstein"
  },
  {
    jpQuote: "最も強い者が生き残るのではなく、最も変化に敏感な者が生き残るのだ。",
    enQuote: "It is not the strongest of the species that survives, but the one most responsive to change.",
    jpAuthor: "チャールズ・ダーウィン",
    enAuthor: "Charles Darwin"
  },
  {
    jpQuote: "心に抱き、信じたことは、すべて実現できる。",
    enQuote: "Whatever the mind of man can conceive and believe, it can achieve.",
    jpAuthor: "ナポレオン・ヒル",
    enAuthor: "Napoleon Hill"
  },
  {
    jpQuote: "私は生きる上で、ただ一つのルールしか持っていない。それは『決して諦めない』ことだ。",
    enQuote: "I have only one rule in life: 'Never give up'.",
    jpAuthor: "ウィンストン・チャーチル",
    enAuthor: "Winston Churchill"
  },
  {
    jpQuote: "教育とは、世界を変えるために用いることができる、最も強力な武器である。",
    enQuote: "Education is the most powerful weapon which you can use to change the world.",
    jpAuthor: "ネルソン・マンデラ",
    enAuthor: "Nelson Mandela"
  },
  {
    jpQuote: "行動なきビジョンは、ただの白昼夢にすぎない。",
    enQuote: "Vision without action is merely a daydream.",
    jpAuthor: "日本のことわざ",
    enAuthor: "Japanese Proverb"
  },

  // --- アニメ・漫画 ---
  {
    jpQuote: "諦めたらそこで試合終了ですよ…？",
    enQuote: "If you give up, the game is already over.",
    jpAuthor: "安西先生 (スラムダンク)",
    enAuthor: "Coach Anzai (Slam Dunk)"
  },
  {
    jpQuote: "才能は開花させるもの。センスは磨くもの。",
    enQuote: "Talent is something you make bloom. Sense is something you polish.",
    jpAuthor: "及川徹 (ハイキュー!!)",
    enAuthor: "Toru Oikawa (Haikyu!!)"
  },
  {
    jpQuote: "心を燃やせ。",
    enQuote: "Set your heart ablaze.",
    jpAuthor: "煉獄杏寿郎 (鬼滅の刃)",
    enAuthor: "Kyojuro Rengoku (Demon Slayer)"
  },
  {
    jpQuote: "戦わなければ勝てない。",
    enQuote: "If you don't fight, you can't win.",
    jpAuthor: "エレン・イェーガー (進撃の巨人)",
    enAuthor: "Eren Yeager (Attack on Titan)"
  },
  {
    jpQuote: "俺の敵は、だいたい俺です。",
    enQuote: "My enemy is almost always myself.",
    jpAuthor: "南波六太 (宇宙兄弟)",
    enAuthor: "Mutta Nanba (Space Brothers)"
  },
  {
    jpQuote: "海賊王に、俺はなる！",
    enQuote: "I'm gonna be the King of the Pirates!",
    jpAuthor: "モンキー・D・ルフィ (ONE PIECE)",
    enAuthor: "Monkey D. Luffy (ONE PIECE)"
  },
  {
    jpQuote: "逃げちゃダメだ、逃げちゃダメだ、逃げちゃダメだ。",
    enQuote: "I mustn't run away, I mustn't run away, I mustn't run away.",
    jpAuthor: "碇シンジ (新世紀エヴァンゲリオン)",
    enAuthor: "Shinji Ikari (Neon Genesis Evangelion)"
  },
  {
    jpQuote: "夢は逃げない。逃げるのはいつも自分だ。",
    enQuote: "Dreams don't run away. It's always you who runs away.",
    jpAuthor: "野原ひろし (クレヨンしんちゃん)",
    enAuthor: "Hiroshi Nohara (Crayon Shin-chan)"
  },
  {
    jpQuote: "限界を超えろ！",
    enQuote: "Surpass your limits!",
    jpAuthor: "ヤミ・スケヒロ (ブラッククローバー)",
    enAuthor: "Yami Sukehiro (Black Clover)"
  },
  {
    jpQuote: "俺は、俺の責務を全うする！ここにいる者は誰も死なせない！",
    enQuote: "I will fulfill my duty! I won't allow anyone here to die!",
    jpAuthor: "煉獄杏寿郎 (鬼滅の刃)",
    enAuthor: "Kyojuro Rengoku (Demon Slayer)"
  },

  // --- アスリート ---
  {
    jpQuote: "小さいことを重ねることが、とんでもないところに行くただひとつの道。",
    enQuote: "Accumulating small things is the only way to reach an unimaginable place.",
    jpAuthor: "イチロー (野球)",
    enAuthor: "Ichiro Suzuki (Baseball)"
  },
  {
    jpQuote: "憧れるのをやめましょう。",
    enQuote: "Let's stop admiring them.",
    jpAuthor: "大谷翔平 (野球)",
    enAuthor: "Shohei Ohtani (Baseball)"
  },
  {
    jpQuote: "私は何度も何度も失敗した。だから成功したのだ。",
    enQuote: "I've failed over and over and over again in my life. And that is why I succeed.",
    jpAuthor: "マイケル・ジョーダン (バスケットボール)",
    enAuthor: "Michael Jordan (Basketball)"
  },
  {
    jpQuote: "勝つ意欲はたいして重要ではない。そんなものは誰もが持ち合わせている。重要なのは、勝つための準備をする意欲である。",
    enQuote: "The will to win is not nearly as important as the will to prepare to win.",
    jpAuthor: "ボビー・ナイト (バスケットボールコーチ)",
    enAuthor: "Bobby Knight (Basketball Coach)"
  },
  {
    jpQuote: "誰の代わりでもない、自分だけの道を進め。",
    enQuote: "Don't be a copy of anyone, walk your own path.",
    jpAuthor: "羽生結弦 (フィギュアスケート)",
    enAuthor: "Yuzuru Hanyu (Figure Skating)"
  },
  {
    jpQuote: "不可能とは、自らの力で世界を切り開くことを放棄した、臆病者の言葉だ。",
    enQuote: "Impossible is just a big word thrown around by small men. It is not a declaration, it's a dare.",
    jpAuthor: "モハメド・アリ (ボクシング)",
    enAuthor: "Muhammad Ali (Boxing)"
  },
  {
    jpQuote: "プレッシャーを感じるということは、あなたが何か重要なことをしている証拠だ。",
    enQuote: "Feeling pressure is proof that you are doing something important.",
    jpAuthor: "アーセン・ベンゲル (サッカー監督)",
    enAuthor: "Arsène Wenger (Football Manager)"
  },
  {
    jpQuote: "ボールを蹴る前には、常にどこに蹴るかを決めていなければならない。",
    enQuote: "You must always know where to pass the ball before you even get it.",
    jpAuthor: "シャビ・エルナンデス (サッカー)",
    enAuthor: "Xavi Hernandez (Football)"
  },
  {
    jpQuote: "自分に限界を設けるな。",
    enQuote: "Never put a limit on what you can do.",
    jpAuthor: "タイガー・ウッズ (ゴルフ)",
    enAuthor: "Tiger Woods (Golf)"
  },
  {
    jpQuote: "記録は破られるためにある。",
    enQuote: "Records are made to be broken.",
    jpAuthor: "マイケル・フェルプス (水泳)",
    enAuthor: "Michael Phelps (Swimming)"
  },

  // --- 著名人・起業家・タレント ---
  {
    jpQuote: "ハングリーであれ。愚かであれ。",
    enQuote: "Stay hungry. Stay foolish.",
    jpAuthor: "スティーブ・ジョブズ",
    enAuthor: "Steve Jobs"
  },
  {
    jpQuote: "人生はクローズアップで見れば悲劇だが、ロングショットで見れば喜劇だ。",
    enQuote: "Life is a tragedy when seen in close-up, but a comedy in long-shot.",
    jpAuthor: "チャールズ・チャップリン",
    enAuthor: "Charlie Chaplin"
  },
  {
    jpQuote: "成功を祝うのはいいが、もっと大切なのは失敗から学ぶことだ。",
    enQuote: "It's fine to celebrate success but it is more important to heed the lessons of failure.",
    jpAuthor: "ビル・ゲイツ",
    enAuthor: "Bill Gates"
  },
  {
    jpQuote: "完璧を目指すより、まず終わらせろ。",
    enQuote: "Done is better than perfect.",
    jpAuthor: "マーク・ザッカーバーグ",
    enAuthor: "Mark Zuckerberg"
  },
  {
    jpQuote: "努力すれば報われる？そうじゃない。報われるまで努力するんだ。",
    enQuote: "If you make an effort, will you be rewarded? No. You make an effort until you are rewarded.",
    jpAuthor: "リオネル・メッシ (サッカー)",
    enAuthor: "Lionel Messi (Football)"
  },
  {
    jpQuote: "みんな、夢を持て！そして、夢を信じろ。",
    enQuote: "Everyone, have a dream! And believe in your dream.",
    jpAuthor: "ビートたけし (北野武)",
    enAuthor: "Takeshi Kitano"
  },
  {
    jpQuote: "私は、私自身の人生の創造者です。",
    enQuote: "I am the creator of my own life.",
    jpAuthor: "オプラ・ウィンフリー",
    enAuthor: "Oprah Winfrey"
  },
  {
    jpQuote: "一番の資産は、あなた自身だ。",
    enQuote: "Your most important asset is yourself.",
    jpAuthor: "ウォーレン・バフェット",
    enAuthor: "Warren Buffett"
  },
  {
    jpQuote: "失敗とは、より賢くやり直すための良い機会に過ぎない。",
    enQuote: "Failure is simply the opportunity to begin again, this time more intelligently.",
    jpAuthor: "ヘンリー・フォード",
    enAuthor: "Henry Ford"
  },
  {
    jpQuote: "何事も完成するまでは不可能に思えるものだ。",
    enQuote: "It always seems impossible until it's done.",
    jpAuthor: "ネルソン・マンデラ",
    enAuthor: "Nelson Mandela"
  },

  // --- 現代の哲学者・その他 ---
  {
    jpQuote: "自分自身を愛することが、生涯にわたるロマンスの始まりである。",
    enQuote: "To love oneself is the beginning of a lifelong romance.",
    jpAuthor: "オスカー・ワイルド",
    enAuthor: "Oscar Wilde"
  },
  {
    jpQuote: "世界に変化を望むのなら、自らがその変化になりなさい。",
    enQuote: "Be the change that you wish to see in the world.",
    jpAuthor: "マハトマ・ガンディー",
    enAuthor: "Mahatma Gandhi"
  },
  {
    jpQuote: "幸せは、いつも自分の心が決める。",
    enQuote: "Happiness is always decided by your own heart.",
    jpAuthor: "相田みつを",
    enAuthor: "Mitsuo Aida"
  },
  {
    jpQuote: "シンプルであることは、究極の洗練である。",
    enQuote: "Simplicity is the ultimate sophistication.",
    jpAuthor: "レオナルド・ダ・ヴィンチ",
    enAuthor: "Leonardo da Vinci"
  },
  {
    jpQuote: "あなたにできることを、あなたの持っているもので、今いる場所で始めなさい。",
    enQuote: "Do what you can, with what you have, where you are.",
    jpAuthor: "セオドア・ルーズベルト",
    enAuthor: "Theodore Roosevelt"
  },
  {
    jpQuote: "今日という日は、残りの人生の最初の一日だ。",
    enQuote: "Today is the first day of the rest of your life.",
    jpAuthor: "チャールズ・ディードリッヒ",
    enAuthor: "Charles Dederich"
  },
  {
    jpQuote: "木を植えるのに一番良かった時期は20年前だった。次に良い時期は、今だ。",
    enQuote: "The best time to plant a tree was 20 years ago. The second best time is now.",
    jpAuthor: "中国の諺",
    enAuthor: "Chinese Proverb"
  },
  {
    jpQuote: "リスクを取らないことが、最大のリスクである。",
    enQuote: "The biggest risk is not taking any risk.",
    jpAuthor: "マーク・ザッカーバーグ",
    enAuthor: "Mark Zuckerberg"
  },
  {
    jpQuote: "人間は、その人が一日中考えている通りの存在になる。",
    enQuote: "A man is what he thinks about all day long.",
    jpAuthor: "ラルフ・ワルド・エマーソン",
    enAuthor: "Ralph Waldo Emerson"
  },
  {
    jpQuote: "美しい唇であるためには、美しい言葉を使いなさい。",
    enQuote: "For beautiful lips, speak only words of kindness.",
    jpAuthor: "オードリー・ヘプバーン",
    enAuthor: "Audrey Hepburn"
  }
];

// ==========================================
// 2. DOM要素の取得
// ==========================================
const currentJpQuote = document.getElementById('jp-quote');
const currentEnQuote = document.getElementById('en-quote');
const currentJpAuthor = document.getElementById('jp-author');
const currentEnAuthor = document.getElementById('en-author');
const quoteContainer = document.getElementById('quote-container');

const btnNewQuote = document.getElementById('btn-new-quote');
const btnCopy = document.getElementById('btn-copy');
const btnShare = document.getElementById('btn-share');
const themeSelector = document.getElementById('theme-selector');
const toast = document.getElementById('toast');

// ==========================================
// 3. コア機能の関数群
// ==========================================

// ランダムな名言を取得し、DOMにセットする関数
function displayRandomQuote() {
  // アニメーションのために一旦フェードアウト
  quoteContainer.classList.add('fade-out');

  setTimeout(() => {
    // 乱数を生成して配列からランダムに1つ選ぶ
    const randomIndex = Math.floor(Math.random() * quotesArray.length);
    const selectedQuote = quotesArray[randomIndex];

    // XSS対策のため、innerHTMLではなく textContent を使用する（超重要）
    currentJpQuote.textContent = selectedQuote.jpQuote;
    currentEnQuote.textContent = selectedQuote.enQuote;
    currentJpAuthor.textContent = `- ${selectedQuote.jpAuthor}`;
    currentEnAuthor.textContent = `- ${selectedQuote.enAuthor}`;

    // フェードイン
    quoteContainer.classList.remove('fade-out');
  }, 400); // CSSのtransition時間と合わせる
}

// テーマを変更する関数
function changeTheme() {
  const selectedTheme = themeSelector.value;
  // 一度すべてのテーマクラスをリムーブ
  quoteContainer.classList.remove('theme-museum', 'theme-bubble', 'theme-soft');
  // 選択されたテーマを付与
  quoteContainer.classList.add(selectedTheme);
}

// クリップボードにコピーする関数
async function copyQuoteToClipboard() {
  // コピーするテキストの組み立て
  const textToCopy = `"${currentJpQuote.textContent}"\n"${currentEnQuote.textContent}"\n${currentJpAuthor.textContent}\n#DailyQuoteGallery`;
  
  try {
    await navigator.clipboard.writeText(textToCopy);
    showToast();
  } catch (err) {
    console.error('コピーに失敗しました', err);
    alert('コピーに失敗しました。');
  }
}

// トースト通知を表示するヘルパー関数
function showToast() {
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000); // 3秒後に消える
}

// シェア機能を呼び出す関数
async function shareQuote() {
  const shareText = `"${currentJpQuote.textContent}"\n${currentJpAuthor.textContent}\n\n"${currentEnQuote.textContent}"\n\nDaily Quote Galleryからシェア #名言`;
  
  // Web Share API が使える環境（モバイル端末など）の場合
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Daily Quote',
        text: shareText
      });
      console.log('Share successful');
    } catch (err) {
      console.error('Share failed', err);
    }
  } else {
    // Web Share APIが使えない環境（PCブラウザ等）のフォールバックとして、
    // X (旧Twitter) のシェア画面を新しいタブで開く
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  }
}

// ==========================================
// 4. イベントリスナーの登録
// ==========================================

// 初期ロード時に1つ名言を表示
window.addEventListener('DOMContentLoaded', () => {
  displayRandomQuote();
});

// 各ボタンのクリックイベント
btnNewQuote.addEventListener('click', displayRandomQuote);
btnCopy.addEventListener('click', copyQuoteToClipboard);
btnShare.addEventListener('click', shareQuote);
themeSelector.addEventListener('change', changeTheme);
