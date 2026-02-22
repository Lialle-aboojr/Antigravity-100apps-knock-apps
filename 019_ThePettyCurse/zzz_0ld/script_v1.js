// ===============================================
// 呪いのデータ（100個のユニークな呪い）
// ===============================================
const CURSES = [
    // --- 日常の不便 (Daily Inconveniences) ---
    { jp: "レゴブロックを素足で踏む", en: "May you step on a Lego block barefoot." },
    { jp: "靴下にいつの間にか穴が開く", en: "May your socks always develop a hole in the toe." },
    { jp: "急いでいる時に限って赤信号に引っかかる", en: "May you hit every red light when you are late." },
    { jp: "トイレの紙が芯だけ残されている", en: "May the toilet paper roll always be empty." },
    { jp: "傘が強風でひっくり返る", en: "May your umbrella invert in every storm." },
    { jp: "入ったコンビニにトイレがない", en: "May every convenience store you enter lack a restroom." },
    { jp: "小銭を床にぶちまける", en: "May you drop your coins at the checkout counter." },
    { jp: "自動ドアが自分だけ反応しない", en: "May automatic doors never open for you on the first try." },
    { jp: "くしゃみが寸前で止まる", en: "May you lose every sneeze right before it happens." },
    { jp: "寝ようとすると蚊が耳元で鳴く", en: "May a mosquito buzz in your ear right as you drift off." },
    { jp: "洗ったばかりの車に鳥のフンが落ちる", en: "May a bird target your freshly washed car." },
    { jp: "自販機で当たりそうで当たらない", en: "May the vending machine lottery always miss by one number." },
    { jp: "本棚の角に足の小指をぶつける", en: "May you stub your pinky toe on the furniture daily." },
    { jp: "服のタグが肌にチクチク当たり続ける", en: "May your clothing tags always be itchy." },
    { jp: "ポケットの中でイヤホンが絡まる", en: "May your earphones tangle into impossible knots." },
    { jp: "大事な時にペンが出なくなる", en: "May your pen run out of ink during important notes." },
    { jp: "チャックが布を噛んで動かなくなる", en: "May your zipper always catch on the fabric." },
    { jp: "買い物袋が帰り道で破れる", en: "May your grocery bag tear halfway home." },
    { jp: "シャワーの温度調整が決まらない", en: "May your shower be too hot or too cold, never perfect." },
    { jp: "濡れた靴下を履き替えた瞬間に水たまりを踏む", en: "May you step in a wet spot immediately after changing socks." },
    { jp: "炭酸飲料を開けた瞬間に吹き出す", en: "May your soda always explode when opened." },
    { jp: "エレベーターが目の前で閉まる", en: "May the elevator doors close just as you arrive." },
    { jp: "目覚まし時計の設定をAMとPMで間違える", en: "May you confuse AM and PM on your alarm." },
    { jp: "リップクリームを出しすぎて折れる", en: "May your lip balm twist out too far and break." },
    { jp: "納豆のタレが服に飛ぶ", en: "May soy sauce packets always splash on your white shirt." },

    // --- テクノロジーの不具合 (Tech & Modern Life) ---
    { jp: "Wi-Fiが動画のいいところで止まる", en: "May your Wi-Fi buffer right at the movie's climax." },
    { jp: "USBが1回で刺さらない", en: "May your USB never plug in on the first try." },
    { jp: "スマホの充電が99%で止まる", en: "May your phone charge stop at 99%." },
    { jp: "パスワードを3回間違えてロックされる", en: "May you always forget your password until the account locks." },
    { jp: "送信ボタンを押した瞬間に誤字に気づく", en: "May you spot the typo immediately after hitting send." },
    { jp: "OSの更新が急ぎの時に始まる", en: "May your computer force an update when you are in a rush." },
    { jp: "マウスの電池が会議中に切れる", en: "May your mouse battery die during a presentation." },
    { jp: "キーボードの隙間に食べかすが挟まる", en: "May crumbs always fall between your keyboard keys." },
    { jp: "スマホを顔の上に落とす", en: "May you drop your phone on your face while lying in bed." },
    { jp: "画面の保護フィルムに気泡が入る", en: "May there always be a bubble under your screen protector." },
    { jp: "保存前にPCがフリーズする", en: "May your computer freeze before auto-save kicks in." },
    { jp: "クリックしようとした広告がいきなり動く", en: "May the ad layout shift just as you click." },
    { jp: "動画広告の「×」ボタンが小さすぎる", en: "May the 'close ad' button be microscopically small." },
    { jp: "Siriが独り言に反応する", en: "May your voice assistant activate during awkward silences." },
    { jp: "検索履歴を誰かに見られる", en: "May your search history be seen by your boss." },
    { jp: "充電ケーブルの接触が悪くなる", en: "May your charging cable only work at a specific angle." },
    { jp: "コピー機の紙詰まりが頻発する", en: "May the printer jam only when you use it." },
    { jp: "Bluetoothイヤホンが片方だけ繋がらない", en: "May only one of your earbuds connect." },
    { jp: "誤って「全員に返信」を押す", en: "May you accidentally hit 'Reply All'." },
    { jp: "重要なメールが迷惑メールフォルダに入る", en: "May your important emails always go to Spam." },
    { jp: "スマホの画面回転が意図しない時に動く", en: "May your screen rotate when you don't want it to." },
    { jp: "お気に入りのアプリがサービス終了する", en: "May your favorite app be discontinued." },
    { jp: "必須入力フォームの最後でエラーが出る", en: "May the form session expire as you click submit." },
    { jp: "SNSで間違って「いいね」を押す", en: "May you accidentally 'like' a post from 3 years ago." },
    { jp: "QRコードが何度やっても読み取れない", en: "May the QR code never scan on the first try." },

    // --- 食事・生活 (Food & Living) ---
    { jp: "ポテトチップスの袋が開かない", en: "May the chip bag tear down the side instead of opening." },
    { jp: "ヨーグルトの蓋の裏を舐められない", en: "May the yogurt lid always peel off uncleanly." },
    { jp: "アイスのスプーンが折れる", en: "May your wooden spoon break in the hard ice cream." },
    { jp: "カップ麺の蓋がまた閉まる", en: "May the cup noodle lid curl back up." },
    { jp: "ピザのチーズが全部剥がれる", en: "May the cheese slide off your pizza slice entirely." },
    { jp: "最後の一個の唐揚げを誰かに取られる", en: "May someone else take the last piece of sushi." },
    { jp: "熱々のコーヒーで舌を火傷する", en: "May you always burn your tongue on the first sip." },
    { jp: "ハンバーガーの具が後ろから出る", en: "May your burger contents slide out the back." },
    { jp: "アボカドがまだ硬い", en: "May your avocado always be unripe when you cut it." },
    { jp: "お菓子の粉がキーボードに落ちる", en: "May cookie crumbs fall into your impossible-to-clean crevices." },
    { jp: "牛乳パックが開けにくい", en: "May the milk carton spout never open cleanly." },
    { jp: "箸が左右で違う長さになる", en: "May you always pick up mismatched chopsticks." },
    { jp: "ご飯が少しだけ保温臭い", en: "May your rice always be slightly dry." },
    { jp: "調味料の蓋がちゃんと閉まっていない", en: "May the salt shaker lid be loose." },
    { jp: "冷凍食品の中心が冷たい", en: "May your microwaved food be cold in the middle." },
    { jp: "ストローに穴が開いている", en: "May your straw always have a crack in it." },
    { jp: "卵の殻が入る", en: "May a piece of eggshell fall into your batter." },
    { jp: "パンのバターが硬すぎてパンが破れる", en: "May your butter be too hard to spread." },
    { jp: "パスタを茹で過ぎる", en: "May your pasta always be slightly overcooked." },
    { jp: "醤油差しから醤油が垂れる", en: "May the soy sauce bottle always drip." },
    { jp: "スナック菓子の袋が勢いよく開きすぎる", en: "May the chip bag explode when you open it." },
    { jp: "割り箸が斜めに割れる", en: "May your disposable chopsticks break unevenly." },
    { jp: "氷が飲み物の出口を塞ぐ", en: "May the ice cubes block your drink flow." },
    { jp: "ラップの切れ目が見つからない", en: "May you never find the start of the cling film roll." },
    { jp: "三角コーナーが生ゴミで溢れる", en: "May your kitchen sink strainer always be full." },

    // --- 体感・シュール (Physical & Surreal) ---
    { jp: "背中の痒いところに手が届かない", en: "May you have an itch you just can't reach." },
    { jp: "瞬きのタイミングが合わない", en: "May your contact lens feel dry all day." },
    { jp: "深爪をする", en: "May you cut your nails just a little too short." },
    { jp: "ささくれが服に引っかかる", en: "May your hangnail catch on your sweater." },
    { jp: "足の裏に何かがついている気がする", en: "May it feel like there is always a pebble in your shoe." },
    { jp: "静電気でバチッとなる", en: "May you get a static shock from every door handle." },
    { jp: "髪の毛が顔に張り付く", en: "May a stray hair always tickle your nose." },
    { jp: "あくびが伝染する", en: "May you yawn every time you see someone else yawn." },
    { jp: "しゃっくりが止まらない", en: "May you get hiccups in a quiet library." },
    { jp: "足が痺れる", en: "May your leg fall asleep when you need to stand up." },
    { jp: "鼻毛が一本だけ出ている", en: "May you notice a nose hair only after the date." },
    { jp: "歯に何かが挟まる", en: "May spinach get stuck in your teeth at dinner." },
    { jp: "口内炎ができる", en: "May you bite your cheek in the same spot twice." },
    { jp: "筋肉痛が二日後に来る", en: "May your muscle soreness arrive two days late." },
    { jp: "眼鏡が曇る", en: "May your glasses fog up every time you enter a room." },
    { jp: "マスクの紐が耳に食い込む", en: "May your mask strap always pull on your ears." },
    { jp: "枕が温かい（裏返しても）", en: "May both sides of your pillow be warm." },
    { jp: "夢のいいところで目が覚める", en: "May you wake up right before the dream gets good." },
    { jp: "トイレのスリッパが揃っていない", en: "May the toilet slippers always be messy." },
    { jp: "階段の一段目を踏み外す", en: "May you think there is one more step when there isn't." },
    { jp: "人混みで同じ方向に避ける", en: "May you do the awkward sidewalk dance with strangers." },
    { jp: "名前を呼び間違えられる", en: "May people constantly mispronounce your name." },
    { jp: "集合写真で半目になる", en: "May you blink in every group photo." },
    { jp: "買った服が翌日セールになる", en: "May the item you bought go on sale the next day." },
    { jp: "休日に雨が降る", en: "May it rain only on your days off." }
];

// ===============================================
// ロジック設定 (Logic & Animation)
// ===============================================

const textContainer = document.getElementById('curse-text');
const btnNext = document.getElementById('btn-next');
const typeSpeed = 100; // 1文字あたりの表示速度(ms)

let isTyping = false; // タイピング中かどうかのフラグ

// 1. ランダムな呪いを取得する関数
function getRandomCurse() {
    const randomIndex = Math.floor(Math.random() * CURSES.length);
    return CURSES[randomIndex];
}

// 2. 呪いを表示する主関数
function displayCurse() {
    if (isTyping) return; // 連打防止
    isTyping = true;
    
    // 既存のテキストをクリア
    textContainer.innerHTML = '';
    btnNext.classList.add('hidden'); // ボタンを隠す

    // 新しい呪いのデータを取得
    const curse = getRandomCurse();

    // 表示用の要素を作成
    const enElement = document.createElement('div');
    enElement.className = 'curse-item en';
    const jpElement = document.createElement('div');
    jpElement.className = 'curse-item jp';
    
    // HTMLに追加
    textContainer.appendChild(enElement);
    textContainer.appendChild(jpElement);

    // タイピングアニメーション開始
    // 英語 -> 日本語の順で表示
    typeWriter(enElement, curse.en, 0, () => {
        // 英語が終わったら少し待って日本語
        setTimeout(() => {
            typeWriter(jpElement, curse.jp, 0, () => {
                // 全て終わったらボタンを表示
                finishTyping();
            });
        }, 500);
    });
}

// 3. 1文字ずつ表示する再帰関数 (Typewriter Effect)
function typeWriter(element, text, index, callback) {
    if (index < text.length) {
        element.textContent += text.charAt(index);
        
        // ランダムな揺らぎを入れて人間味（不気味さ）を出す
        const randomSpeed = typeSpeed + (Math.random() * 50 - 25);
        
        setTimeout(() => {
            typeWriter(element, text, index + 1, callback);
        }, randomSpeed);
    } else {
        // 点滅カーソル演出（任意で追加可能だが、今回はシンプルに終了）
        if (callback) callback();
    }
}

// 4. 表示完了時の処理
function finishTyping() {
    isTyping = false;
    btnNext.classList.remove('hidden'); // ボタンをフェードイン
}

// ===============================================
// イベントリスナー (Event Listeners)
// ===============================================

// 画面読み込み時に最初の呪いを実行
window.addEventListener('DOMContentLoaded', () => {
    // 少し待ってから開始（雰囲気を出すため）
    setTimeout(displayCurse, 1000);
});

// ボタンクリックで次の呪いへ
btnNext.addEventListener('click', displayCurse);
