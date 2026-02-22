// ===============================================
// 呪いのデータ（100個のユニークな呪い）
// ===============================================
const CURSES = [
    // --- 日常の不便 (Daily Inconveniences) ---
    { jp: "レゴブロックを素足で踏みますように。", en: "May you step on a Lego block barefoot." },
    { jp: "靴下にいつの間にか穴が開きますように。", en: "May your socks always develop a hole in the big toe." },
    { jp: "急いでいる時に限って赤信号に引っかかりますように。", en: "May you hit every red light when you are late." },
    { jp: "トイレの紙が芯だけ残されていますように。", en: "May the toilet paper roll always be empty when you need it." },
    { jp: "傘が強風でひっくり返りますように。", en: "May your umbrella invert in every heavy storm." },
    { jp: "入ったコンビニにトイレがありませんように。", en: "May every convenience store you enter lack a restroom." },
    { jp: "レジで小銭を床にぶちまけますように。", en: "May you scatter your coins all over the floor at the checkout." },
    { jp: "自動ドアが自分だけ反応しませんように。", en: "May automatic doors never open for you on the first try." },
    { jp: "くしゃみが寸前で止まりますように。", en: "May you lose every sneeze right before the satisfaction." },
    { jp: "寝ようとすると蚊が耳元で鳴きますように。", en: "May a mosquito buzz in your ear right as you drift off." },
    { jp: "洗ったばかりの車に鳥のフンが落ちますように。", en: "May a bird target your freshly washed car." },
    { jp: "自販機で当たりそうで当たりませんように。", en: "May the vending machine lottery always miss by one number." },
    { jp: "本棚の角に足の小指をぶつけますように。", en: "May you stub your pinky toe on the furniture daily." },
    { jp: "服のタグが肌にチクチク当たり続けますように。", en: "May your clothing tags always be itchy." },
    { jp: "ポケットの中でイヤホンが絡まりますように。", en: "May your earphones tangle into impossible knots." },
    { jp: "大事な時にペンが出なくなりますように。", en: "May your pen run out of ink during important notes." },
    { jp: "チャックが布を噛んで動かなくなりますように。", en: "May your zipper always catch on the fabric." },
    { jp: "買い物袋が帰り道で破れますように。", en: "May your grocery bag tear halfway home." },
    { jp: "シャワーの温度調整が決まりませんように。", en: "May your shower be either too hot or too cold, never perfect." },
    { jp: "靴下を履き替えた瞬間に水たまりを踏みますように。", en: "May you step in a wet spot immediately after changing socks." },
    { jp: "炭酸飲料を開けた瞬間に吹き出しますように。", en: "May your soda always explode when opened." },
    { jp: "エレベーターが目の前で閉まりますように。", en: "May the elevator doors close just as you arrive." },
    { jp: "目覚まし時計の設定をAMとPMで間違えますように。", en: "May you confuse AM and PM on your alarm." },
    { jp: "リップクリームを出しすぎて折れますように。", en: "May your lip balm twist out too far and break." },
    { jp: "納豆のタレが服に飛びますように。", en: "May soy sauce packets always splash on your white shirt." },

    // --- テクノロジーの不具合 (Tech & Modern Life) ---
    { jp: "Wi-Fiが動画のいいところで止まりますように。", en: "May your Wi-Fi buffer right at the movie's climax." },
    { jp: "USBが1回で刺さりませんように。", en: "May your USB never plug in on the first try." },
    { jp: "スマホの充電が99%で止まりますように。", en: "May your phone charge stop at 99%." },
    { jp: "パスワードを3回間違えてロックされますように。", en: "May you always forget your password until the account locks." },
    { jp: "送信ボタンを押した瞬間に誤字に気づきますように。", en: "May you spot the typo immediately after hitting send." },
    { jp: "OSの更新が急ぎの時に始まりますように。", en: "May your computer force an update when you are in a rush." },
    { jp: "マウスの電池が会議中に切れますように。", en: "May your mouse battery die during a presentation." },
    { jp: "キーボードの隙間に食べかすが挟まりますように。", en: "May crumbs always fall between your keyboard keys." },
    { jp: "スマホを顔の上に落としますように。", en: "May you drop your phone on your face while lying in bed." },
    { jp: "画面の保護フィルムに気泡が入りますように。", en: "May there always be a bubble under your screen protector." },
    { jp: "保存前にPCがフリーズしますように。", en: "May your computer freeze before auto-save kicks in." },
    { jp: "クリックしようとした広告がいきなり動きますように。", en: "May the ad layout shift just as you click." },
    { jp: "動画広告の「×」ボタンが小さすぎますように。", en: "May the 'close ad' button be microscopically small." },
    { jp: "Siriが独り言に反応しますように。", en: "May your voice assistant activate during awkward silences." },
    { jp: "検索履歴を誰かに見られますように。", en: "May your search history be seen by your boss." },
    { jp: "充電ケーブルの接触が悪くなりますように。", en: "May your charging cable only work at a specific angle." },
    { jp: "コピー機の紙詰まりが頻発しますように。", en: "May the printer jam only when you use it." },
    { jp: "Bluetoothイヤホンが片方だけ繋がりませんように。", en: "May only one of your earbuds connect." },
    { jp: "誤って「全員に返信」を押してしまいますように。", en: "May you accidentally hit 'Reply All'." },
    { jp: "重要なメールが迷惑メールフォルダに入り続けますように。", en: "May your important emails always go to Spam." },
    { jp: "スマホの画面回転が意図しない時に動きますように。", en: "May your screen rotate when you don't want it to." },
    { jp: "お気に入りのアプリがサービス終了しますように。", en: "May your favorite app be discontinued." },
    { jp: "必須入力フォームの最後でエラーが出ますように。", en: "May the form session expire as you click submit." },
    { jp: "SNSで間違って「いいね」を押してしまいますように。", en: "May you accidentally 'like' a post from 3 years ago." },
    { jp: "QRコードが何度やっても読み取れませんように。", en: "May the QR code never scan on the first try." },

    // --- 食事・生活 (Food & Living) ---
    { jp: "ポテトチップスの袋が縦に裂けますように。", en: "May the chip bag tear down the side instead of opening." },
    { jp: "ヨーグルトの蓋の裏を舐められませんように。", en: "May the yogurt lid always peel off uncleanly." },
    { jp: "アイスのスプーンが折れますように。", en: "May your wooden spoon break in the hard ice cream." },
    { jp: "カップ麺の蓋がまた閉まってしまいますように。", en: "May the cup noodle lid curl back up." },
    { jp: "ピザのチーズが全部剥がれますように。", en: "May the cheese slide off your pizza slice entirely." },
    { jp: "最後の一個の唐揚げを誰かに取られますように。", en: "May someone else take the last piece of sushi." },
    { jp: "熱々のコーヒーで舌を火傷しますように。", en: "May you always burn your tongue on the first sip of coffee." },
    { jp: "ハンバーガーの具が後ろから飛び出ますように。", en: "May your burger contents slide out the back." },
    { jp: "アボカドがまだ硬すぎますように。", en: "May your avocado always be unripe when you cut it." },
    { jp: "お菓子の粉がキーボードに落ちますように。", en: "May cookie crumbs fall into your impossible-to-clean crevices." },
    { jp: "牛乳パックが開けにくいものでありますように。", en: "May the milk carton spout never open cleanly." },
    { jp: "箸が左右で違う長さになりますように。", en: "May you always pick up mismatched chopsticks." },
    { jp: "ご飯が少しだけ保温臭くなりますように。", en: "May your rice always be slightly dry and stale." },
    { jp: "調味料の蓋がちゃんと閉まっていませんように。", en: "May the salt shaker lid be loose." },
    { jp: "冷凍食品の中心が冷たいままでありますように。", en: "May your microwaved food be cold in the middle." },
    { jp: "ストローに穴が開いていますように。", en: "May your straw always have a crack in it." },
    { jp: "卵の殻が生地に入りますように。", en: "May a piece of eggshell fall into your batter." },
    { jp: "パンのバターが硬すぎてパンが破れますように。", en: "May your butter be too hard to spread." },
    { jp: "パスタを茹で過ぎてしまいますように。", en: "May your pasta always be slightly overcooked." },
    { jp: "醤油差しから醤油が垂れますように。", en: "May the soy sauce bottle always drip." },
    { jp: "スナック菓子の袋が勢いよく開きすぎますように。", en: "May the chip bag explode when you open it." },
    { jp: "割り箸が斜めに割れてしまいますように。", en: "May your disposable chopsticks break unevenly." },
    { jp: "氷が飲み物の出口を塞ぎますように。", en: "May the ice cubes block your drink flow." },
    { jp: "ラップの切れ目が見つかりませんように。", en: "May you never find the start of the cling film roll." },
    { jp: "三角コーナーが生ゴミで溢れかえりますように。", en: "May your kitchen sink strainer always be full." },

    // --- 体感・シュール (Physical & Surreal) ---
    { jp: "背中の痒いところに手が届きませんように。", en: "May you have an itch you just can't reach." },
    { jp: "瞬きのタイミングがコンタクトと合いませんように。", en: "May your contact lens feel dry all day." },
    { jp: "深爪をしてしまいますように。", en: "May you cut your nails just a little too short." },
    { jp: "ささくれが服に引っかかり続けますように。", en: "May your hangnail catch on your sweater." },
    { jp: "足の裏に何かがついている気がし続けますように。", en: "May it feel like there is always a pebble in your shoe." },
    { jp: "静電気でバチッとなりますように。", en: "May you get a static shock from every door handle." },
    { jp: "髪の毛が顔に張り付きますように。", en: "May a stray hair always tickle your nose." },
    { jp: "あくびが伝染し続けますように。", en: "May you yawn every time you see someone else yawn." },
    { jp: "しゃっくりが止まりませんように。", en: "May you get hiccups in a quiet library." },
    { jp: "立ち上がる時に足が痺れていますように。", en: "May your leg fall asleep when you need to stand up." },
    { jp: "鼻毛が一本だけ出ていることに気づきませんように。", en: "May you notice a nose hair only after the date." },
    { jp: "歯に何かが挟まりますように。", en: "May spinach get stuck in your teeth at dinner." },
    { jp: "口内炎を同じ場所で噛みますように。", en: "May you bite your cheek in the same spot twice." },
    { jp: "筋肉痛が二日後に来ますように。", en: "May your muscle soreness arrive two days late." },
    { jp: "入室するたびに眼鏡が曇りますように。", en: "May your glasses fog up every time you enter a room." },
    { jp: "マスクの紐が耳に食い込みますように。", en: "May your mask strap always pull on your ears." },
    { jp: "枕が両面とも生温かくありますように。", en: "May both sides of your pillow be warm." },
    { jp: "夢のいいところで目が覚めますように。", en: "May you wake up right before the dream gets good." },
    { jp: "トイレのスリッパがいつも散らかっていますように。", en: "May the toilet slippers always be messy." },
    { jp: "階段の一段目を踏み外しますように。", en: "May you think there is one more step when there isn't." },
    { jp: "人混みで他人と同じ方向に避け続けますように。", en: "May you do the awkward sidewalk dance with strangers." },
    { jp: "名前をいつも呼び間違えられますように。", en: "May people constantly mispronounce your name." },
    { jp: "集合写真で必ず半目になりますように。", en: "May you blink in every group photo." },
    { jp: "買った服が翌日セールになりますように。", en: "May the item you bought go on sale the next day." },
    { jp: "休日にだけ雨が降りますように。", en: "May it rain only on your days off." }
];

// ===============================================
// ロジック設定
// ===============================================

const jpContainer = document.getElementById('curse-jp');
const enContainer = document.getElementById('curse-en');
const btnNext = document.getElementById('btn-next');

let isTyping = false;

// 1. ランダムな呪いを取得
function getRandomCurse() {
    return CURSES[Math.floor(Math.random() * CURSES.length)];
}

// 2. 呪いを表示する主関数 (Animation Flow)
function displayCurse() {
    if (isTyping) return;
    isTyping = true;

    // リセット
    jpContainer.textContent = '';
    enContainer.textContent = '';
    enContainer.classList.remove('visible'); // 英語を隠す
    btnNext.classList.add('hidden');         // ボタンを隠す

    // データ取得
    const curse = getRandomCurse();

    // 英語を先にセットしておく（見えない状態）
    enContainer.textContent = curse.en;

    // 日本語のタイピングアニメーション開始
    typeWriter(jpContainer, curse.jp, 0, () => {
        // 日本語が終わったら..
        setTimeout(() => {
            // 英語をフェードイン
            enContainer.classList.add('visible');

            // 少し待ってボタンを表示
            setTimeout(() => {
                isTyping = false;
                btnNext.classList.remove('hidden');
            }, 800);
        }, 500);
    });
}

// 3. タイプライター風アニメーション (修正版: ゆっくり不気味に)
function typeWriter(element, text, index, callback) {
    if (index < text.length) {
        element.textContent += text.charAt(index);

        // 速度に人間味のある揺らぎを与える (100ms 〜 250ms でランダム)
        const randomSpeed = Math.floor(Math.random() * 151) + 100; // 100〜250

        setTimeout(() => {
            typeWriter(element, text, index + 1, callback);
        }, randomSpeed);
    } else {
        if (callback) callback();
    }
}

// ===============================================
// イベントリスナー
// ===============================================

window.addEventListener('DOMContentLoaded', () => {
    // 最初の呪いを自動表示 (ねっとりとした速度で開始)
    setTimeout(displayCurse, 1500);
});

// ボタンクリック
btnNext.addEventListener('click', displayCurse);
