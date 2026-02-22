// ===============================================
// 呪いのデータ（100個のユニークな呪い）
// ===============================================
const CURSES = [
    // --- ユーザー提供リスト (50 items) ---
    { jp: "靴の中で靴下が脱げて、土踏まずのあたりで団子になりますように。", en: "May your socks slide down and bunch up under your arch." },
    { jp: "手を洗った直後に、袖口が濡れていることに気づきますように。", en: "May you notice your cuffs are wet immediately after washing your hands." },
    { jp: "スマホの顔認証が、寝起きでむくんでいるせいで反応しませんように。", en: "May your face ID fail because you look too puffy in the morning." },
    { jp: "自販機で温かい飲み物を買ったら、微妙にぬるいですように。", en: "May your hot vending machine drink be lukewarm." },
    { jp: "トイレットペーパーを使おうとしたら、ちょうど芯になるところで交換させられますように。", en: "May you usually be the one to change the empty toilet paper roll." },
    { jp: "あくびをした瞬間に、口の中に小さな虫が入りますように。", en: "May a small bug fly into your mouth right as you yawn." },
    { jp: "レジで小銭を出そうとして、1円だけ足りなくてお札を崩しますように。", en: "May you be one yen short and have to break a large bill." },
    { jp: "お風呂に入ろうとして服を脱いだ瞬間に、宅急便が来ますように。", en: "May the delivery arrive the moment you get naked for a bath." },
    { jp: "カップ麺の蓋を開けたら、かやくの袋が粉まみれになって入っていますように。", en: "May the seasoning packet in your cup noodle be covered in powder." },
    { jp: "歩いている時に、自分の足音だけが妙に響く靴を履いてしまいますように。", en: "May your shoes squeak loudly in a quiet hallway." },
    { jp: "セロハンテープの切り口が見つからず、爪でカリカリする時間を過ごしますように。", en: "May you never find the edge of the clear tape roll." },
    { jp: "本を読んでいる時に、紙の端で指をスッと切って地味に痛みますように。", en: "May you get a paper cut from your favorite book." },
    { jp: "傘をさした瞬間に雨が止んで、たたんだ瞬間にまた降り出しますように。", en: "May it stop raining when you open your umbrella and start when you close it." },
    { jp: "エレベーターの「開」ボタンを押そうとして、間違えて「閉」を押して気まずくなりますように。", en: "May you accidentally hit 'Close' instead of 'Open' on the elevator." },
    { jp: "夜中にふと目が覚めて、あと5分でアラームが鳴る時間だと気づきますように。", en: "May you wake up naturally 5 minutes before your alarm." },
    { jp: "リップクリームを塗った直後に、マスクの内側にべったりつきますように。", en: "May your fresh lip balm smear inside your mask immediately." },
    { jp: "スーパーの袋を開けようとして、指が乾燥してて全然開けられませんように。", en: "May your dry fingers never be able to open the plastic produce bag." },
    { jp: "納豆のタレの小袋を切る時に、中身が飛び散って手に付きますように。", en: "May the natto sauce packet splash on your thumb." },
    { jp: "テレビのリモコンの電池が切れて、電池を回しながら必死に操作しますように。", en: "May you have to roll the batteries to make the remote work." },
    { jp: "炭酸飲料を開けた瞬間に、盛大に吹きこぼれて服にかかりますように。", en: "May your soda foam over onto your clothes every time." },
    { jp: "イヤホンがカバンの中で知恵の輪のように絡まりますように。", en: "May your earbuds tangle into a puzzle in your bag." },
    { jp: "横断歩道を渡りきった瞬間に、信号が赤に変わって後ろの人が渡れず気まずくなりますように。", en: "May the light turn red right after you, stranding the person behind you." },
    { jp: "お気に入りの靴の紐が、歩いている最中に何度も解けますように。", en: "May your shoelaces come untied every few blocks." },
    { jp: "くしゃみが出そうで出なくて、変な顔のまま止まりますように。", en: "May your sneeze stall out, leaving you with a weird face." },
    { jp: "目薬をさそうとして、目に入らずに頬を伝って化粧が崩れますように。", en: "May your eye drops miss your eye and ruin your makeup." },
    { jp: "シャンプーの詰め替えをする時、入り口が小さくて溢れさせますように。", en: "May you spill the shampoo while refilling the bottle." },
    { jp: "掃除機をかけている時に、コードが家具の角に引っかかってイラッとしますように。", en: "May the vacuum cord catch on every piece of furniture." },
    { jp: "ヨーグルトの蓋の裏を舐めようとしたら、鼻の頭につきますように。", en: "May you get yogurt on your nose when licking the lid." },
    { jp: "爪を切ったら深爪しすぎて、何をするにも指先が痛みますように。", en: "May you trim your nails too short and feel pain with every touch." },
    { jp: "蚊に刺された場所が、足の裏か指の関節でありますように。", en: "May all your mosquito bites be on your knuckles or soles." },
    { jp: "駐車券を取ろうとして手が届かず、ドアを開けて身を乗り出しますように。", en: "May you have to open the car door to reach the parking ticket." },
    { jp: "ご飯を食べている時に、お箸のささくれが指に刺さりますように。", en: "May a splinter from your chopsticks poke your finger." },
    { jp: "自転車のサドルが、雨上がりで濡れているのに気づかず座ってしまいますように。", en: "May you sit on a wet bike seat without noticing." },
    { jp: "USBメモリを挿そうとして向きが合わず、裏返しても合わず、もう一度戻してやっと入りますように。", en: "May the USB drive require three tries to insert." },
    { jp: "検索しようとしてブラウザを開いた瞬間、何を検索するか忘れますように。", en: "May you forget what you were searching for the moment the browser opens." },
    { jp: "スマホの保護フィルムを貼る時、小さな気泡やホコリが画面のど真ん中に入りますように。", en: "May a single dust mote get stuck right in the middle of your screen protector." },
    { jp: "カレーうどんを食べた日に限って、真っ白い服を着ていますように。", en: "May you wear white on the day you eat curry udon." },
    { jp: "お風呂上がりにドライヤーを使おうとしたら、コンセントが抜けていますように。", en: "May the hairdryer be unplugged every time you reach for it." },
    { jp: "ゆで卵の殻を剥くとき、白身がボロボロに取れて小さくなりますように。", en: "May half the egg white come off with the shell." },
    { jp: "電車の座席に座ったら、暖房が効きすぎてお尻が熱すぎますように。", en: "May the train seat heater be uncomfortably hot." },
    { jp: "電車で隣に座った人が爆睡して、自分の肩にもたれかかってきますように。", en: "May the stranger next to you fall asleep on your shoulder." },
    { jp: "知り合いだと思って手を振ったら、全くの別人で見知らぬ人に怪訝な顔をされますように。", en: "May you wave at a stranger thinking they are a friend." },
    { jp: "美容院で「かゆいところありませんか」と言われて「ないです」と答えた直後に猛烈に頭がかゆくなりますように。", en: "May your head itch immediately after telling the hairdresser 'it's fine'." },
    { jp: "静かなエレベーターの中で、お腹が「ギュルル」と盛大な音を立てますように。", en: "May your stomach growl loudly in a silent elevator." },
    { jp: "カフェで「ホットコーヒー」と言ったつもりが「ホットココア」が出てきて言い出せませんように。", en: "May you be served cocoa instead of coffee and be too polite to correct it." },
    { jp: "映画館のいいシーンで、尿意が限界に達しますように。", en: "May you need to pee during the climax of the movie." },
    { jp: "久しぶりに履いた靴で、家を出て5分後に激しい靴擦れを起こしますように。", en: "May your shoes give you blisters five minutes away from home." },
    { jp: "歯医者で口を開けている時に、唾液が飲み込めず溺れそうになりますように。", en: "May you feel like you're drowning in saliva at the dentist." },
    { jp: "PCのキーボードの隙間に、お菓子のカスが入って取れなくなりますように。", en: "May a crumb fall into your keyboard and never come out." },
    { jp: "公衆トイレに入ったら、トイレットペーパーが三角折りじゃなくグチャグチャになっていますように。", en: "May the public toilet paper always be a crumpled mess." },

    // --- 追加の呪い (Additional 50 items to reach 100) ---
    { jp: "パスタを茹でる時に、塩を入れ忘れて味がぼやけますように。", en: "May you forget to salt the pasta water." },
    { jp: "コピー機を使おうとしたら、用紙切れで補充させられますように。", en: "May the photocopier always run out of paper on your turn." },
    { jp: "買ったばかりの本の帯が、カバンの中で破れますように。", en: "May the jacket of your new book tear in your bag." },
    { jp: "濡れた傘を畳もうとして、手が雨水でぐしょぐしょになりますように。", en: "May your hands get soaked every time you fold your umbrella." },
    { jp: "カフェで席を立った瞬間に、隣の人の荷物が倒れてきますように。", en: "May your neighbor's bag fall over the moment you stand up." },
    { jp: "映画の予告編で、一番見たかったシーンが全部流れてしまいますように。", en: "May the trailer spoil the best scene of the movie." },
    { jp: "久しぶりに開いたお菓子の缶が、裁縫道具入れになっていますように。", en: "May the cookie tin contain sewing supplies instead of cookies." },
    { jp: "充電ケーブルの根本が、徐々に裂けて中の配線が見え始めますように。", en: "May your charging cable fray just enough to look dangerous." },
    { jp: "焼肉で一番美味しそうな肉を、誰かに横取りされますように。", en: "May someone else snatch the best piece of meat from the grill." },
    { jp: "お風呂のシャワーヘッドが、あらぬ方向を向いて水が出ますように。", en: "May the shower head spray water in a random direction." },
    { jp: "スマホの画面回転ロックを解除し忘れて、動画を小さいまま見続けますように。", en: "May you forget to unlock screen rotation and watch the whole video in portrait mode." },
    { jp: "服屋さんで試着したら、脱ぐときに静電気で髪が爆発しますように。", en: "May your hair explode with static when you take off the fitting room clothes." },
    { jp: "大事な書類に、フリクションボールペンの文字が熱で消えてしまいますように。", en: "May your erasable pen ink vanish from the heat of your coffee cup." },
    { jp: "お弁当の醤油入れの蓋が固くて、開いた勢いで中身が飛び出しますように。", en: "May the soy sauce packet in your lunch box explode upon opening." },
    { jp: "駅の改札で、ICカードの残高が10円足りなくて止められますように。", en: "May you be 10 yen short on your transit card at the gate." },
    { jp: "アイスコーヒーの氷が溶けて、最後の方がただの水になりますように。", en: "May your iced coffee be completely watery by the time you finish it." },
    { jp: "マスクをしたままガムを噛んで、自分の息の匂いが気になりますように。", en: "May you chew mint gum in a mask and sting your own eyes." },
    { jp: "オンライン会議で、ミュートにし忘れて独り言が筒抜けになりますように。", en: "May you forget you're unmuted and broadcast your sigh to the meeting." },
    { jp: "トイレのウォシュレットの水圧が、強すぎて飛び上がりますように。", en: "May the bidet pressure be surprisingly high." },
    { jp: "雨の日に白いスニーカーを履いて、泥水を跳ね上げますように。", en: "May you splash mud on your white sneakers." },
    { jp: "スーパーでレジ袋を断ったのに、商品が持ちきれなくて後悔しますように。", en: "May you decline a bag and then struggle to carry everything." },
    { jp: "動画サイトの広告が、スキップできない15秒のやつでありますように。", en: "May all your video ads be unskippable 15-second clips." },
    { jp: "寝る前にスマホを見ていたら、顔にそのまま落ちてきますように。", en: "May you drop your phone on your face in bed." },
    { jp: "キーボードの「A」のキーだけ、反応が悪くなりますように。", en: "May only the 'A' key on your keyboard be sticky." },
    { jp: "エレベーターに乗ろうとしたら、満員で自分だけ乗れませんように。", en: "May the elevator be full right when it's your turn to board." },
    { jp: "目覚ましを止めたつもりで、スヌーズにして二度寝して遅刻しますように。", en: "May you hit snooze thinking it's off and oversleep." },
    { jp: "カフェでWifiが繋がらず、テザリングでギガを消費しますように。", en: "May the cafe Wi-Fi fail and force you to use your data." },
    { jp: "新しい靴のタグを切ろうして、間違えて紐を切ってしまいますように。", en: "May you accidentally cut the shoelace while removing the tag." },
    { jp: "友達に送るLINEを、間違えて上司に送ってしまいますように。", en: "May you send that casual text to your boss by mistake." },
    { jp: "美味しいケーキを食べている時に、銀紙を一緒に噛んでしまいますように。", en: "May you bite into the foil wrapper while eating cake." },
    { jp: "スマホの充電器を忘れて、バッテリー残量を気にしながら一日を過ごしますように。", en: "May you forget your charger and stress about 10% battery all day." },
    { jp: "雨の日に傘立てから自分の傘がなくなっていますように。", en: "May someone take your umbrella from the stand on a rainy day." },
    { jp: "トイレに入っている時に、清掃のおばちゃんにノックされますように。", en: "May the cleaning staff knock while you are in the stall." },
    { jp: "服を裏返しに着ていることに、家を出てから気づきますように。", en: "May you realize your shirt is inside out only after you leave the house." },
    { jp: "電車で降りる駅を寝過ごして、反対方向の電車も行ってしまった後でありますように。", en: "May you miss your stop and watch the return train leave." },
    { jp: "映画館で、前の人の座高が高くて字幕が見えませんように。", en: "May the tall person in front of you block the subtitles." },
    { jp: "コンビニでお弁当を温めてもらったのに、箸が入っていませんように。", en: "May the clerk forget to give you chopsticks for your heated bento." },
    { jp: "自販機のお釣りの出口が、錆びていて小銭が取りにくいですように。", en: "May the coin return slot be rusty and hard to reach." },
    { jp: "大切な電話中に、宅配便のチャイムが鳴り響きますように。", en: "May the doorbell ring loudly during your important call." },
    { jp: "パソコンのアップデートが、プレゼン直前に始まって終わらなくなりますように。", en: "May Windows update start 5 minutes before your presentation." },
    { jp: "お風呂の栓をしっかりしたつもりで、お湯が全部抜けていますように。", en: "May the bath plug be loose and drain all the hot water." },
    { jp: "料理の最後に塩と砂糖を間違えて、味が台無しになりますように。", en: "May you confuse sugar and salt at the very end of cooking." },
    { jp: "新しい服に、醤油を一滴こぼして染みになりますように。", en: "May you spill a single drop of soy sauce on your new shirt." },
    { jp: "スマホの保護ガラスが、端っこから欠けてヒビが入りますように。", en: "May your screen protector chip at the edge and crack." },
    { jp: "イヤホンの片方だけ、充電できていなくて使えませんように。", en: "May only one earbud create a charge overnight." },
    { jp: "電子レンジで温めたご飯が、爆発して庫内に飛び散りますように。", en: "May your rice explode in the microwave." },
    { jp: "自転車のチェーンが、急いでいる時に限って外れますように。", en: "May your bike chain slip off when you are in a hurry." },
    { jp: "靴の中に小石が入って、取ってもまたすぐ入りますように。", en: "May a pebble get in your shoe immediately after you remove it." },
    { jp: "寝癖がどうしても直らず、一日中変な髪型で過ごしますように。", en: "May your bedhead be unfixable for the entire day." },
    { jp: "好きなドラマの最終回を、録画失敗して見逃しますように。", en: "May your DVR fail to record the season finale." }
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

// 3. タイプライター風アニメーション (ねっとり遅く)
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
    // 最初の呪いを自動表示
    setTimeout(displayCurse, 1500);
});

// ボタンクリック
btnNext.addEventListener('click', displayCurse);
