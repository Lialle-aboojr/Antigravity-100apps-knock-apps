
// Miyabi Pass Logic

// ==========================================
// 1. Data Definitions (50 items each)
// ==========================================

// List A: Adjectives / Adverbs (第一単語)
const listA = [
    { romaji: "Imijiku", kana: "いみじく", meaning: "並々ならず" },
    { romaji: "Ito", kana: "いと", meaning: "とても" },
    { romaji: "Wokashi", kana: "をかし", meaning: "趣深い" },
    { romaji: "Ayaniku", kana: "あやにく", meaning: "あいにく" },
    { romaji: "Utata", kana: "うたた", meaning: "ますます" },
    { romaji: "Emo", kana: "えも", meaning: "なんとも" },
    { romaji: "Oboroge", kana: "おぼろげ", meaning: "並大抵" },
    { romaji: "Kata-mini", kana: "かたみに", meaning: "互いに" },
    { romaji: "Koko-ra", kana: "ここら", meaning: "たくさん" },
    { romaji: "Sude-ni", kana: "すでに", meaning: "もはや" },
    { romaji: "Semete", kana: "せめて", meaning: "強いて" },
    { romaji: "Tsui-ni", kana: "ついに", meaning: "とうとう" },
    { romaji: "Tokaku", kana: "とかく", meaning: "あれこれ" },
    { romaji: "Nanome", kana: "なのめ", meaning: "平凡な" },
    { romaji: "Hatashite", kana: "はたして", meaning: "やはり" },
    { romaji: "Madashimo", kana: "まだしも", meaning: "まだよい" },
    { romaji: "Mube", kana: "むべ", meaning: "なるほど" },
    { romaji: "Yaya", kana: "やや", meaning: "少し" },
    { romaji: "Yo-ni", kana: "よに", meaning: "実に" },
    { romaji: "Wazato", kana: "わざと", meaning: "わざわざ" },
    { romaji: "Aha-re", kana: "あはれ", meaning: "しみじみとした" },
    { romaji: "Tsurezure", kana: "つれづれ", meaning: "手持ち無沙汰" },
    { romaji: "Sarasara", kana: "さらさら", meaning: "すらすらと" },
    { romaji: "Amaneku", kana: "あまねく", meaning: "広く" },
    { romaji: "Isasaka", kana: "いささか", meaning: "少し" },
    { romaji: "Itazura", kana: "いたづら", meaning: "無駄に" },
    { romaji: "Karoujite", kana: "かろうじて", meaning: "やっとのことで" },
    { romaji: "Kihaya", kana: "きはや", meaning: "目立って" },
    { romaji: "Kotogotoku", kana: "ことごとく", meaning: "すべて" },
    { romaji: "Sayaka", kana: "さやか", meaning: "はっきりと" },
    { romaji: "Shin-shincu", kana: "しんしん", meaning: "深々と" },
    { romaji: "Sukoburu", kana: "すこぶる", meaning: "かなり" },
    { romaji: "Tachimachi", kana: "たちまち", meaning: "すぐに" },
    { romaji: "Tokoshie", kana: "とこしへ", meaning: "永遠に" },
    { romaji: "Nakanzuku", kana: "なかんづく", meaning: "とりわけ" },
    { romaji: "Nemogoro", kana: "ねもごろ", meaning: "丁重に" },
    { romaji: "Harubaru", kana: "はるばる", meaning: "遠くから" },
    { romaji: "Hitabu-ru", kana: "ひたぶる", meaning: "ひたすら" },
    { romaji: "Futatabi", kana: "ふたたび", meaning: "再び" },
    { romaji: "Mata", kana: "また", meaning: "やはり" },
    { romaji: "Mizukara", kana: "みづから", meaning: "自分から" },
    { romaji: "Mutsumajiku", kana: "むつまじく", meaning: "仲良く" },
    { romaji: "Motoyori", kana: "もとより", meaning: "もちろん" },
    { romaji: "Yagate", kana: "やがて", meaning: "そのうち" },
    { romaji: "Youyaku", kana: "やうやく", meaning: "次第に" },
    { romaji: "Yomosugara", kana: "よもすがら", meaning: "一晩中" },
    { romaji: "Hitasura", kana: "ひたすら", meaning: "いちずに" },
    { romaji: "Mattaku", kana: "まったく", meaning: "完全に" },
    { romaji: "Oitachi", kana: "おひたち", meaning: "成長" },
    { romaji: "Itodo", kana: "いとど", meaning: "いっそう" }
];

// List B: Nouns / Nature / Colors (第二単語)
const listB = [
    { romaji: "Akebono", kana: "あけぼの", meaning: "夜明け" },
    { romaji: "Kawazu", kana: "かわづ", meaning: "蛙" },
    { romaji: "Tefutefu", kana: "てふてふ", meaning: "蝶々" },
    { romaji: "Shinonome", kana: "しののめ", meaning: "夜明け方" },
    { romaji: "Asagi", kana: "あさぎ", meaning: "薄い青" },
    { romaji: "Tamayura", kana: "たまゆら", meaning: "ほんの少し" },
    { romaji: "Tokiwa", kana: "ときは", meaning: "常緑" },
    { romaji: "Miyako", kana: "みやこ", meaning: "都" },
    { romaji: "Momiji", kana: "もみぢ", meaning: "紅葉" },
    { romaji: "Sakura", kana: "さくら", meaning: "桜" },
    { romaji: "Kasumi", kana: "かすみ", meaning: "霞" },
    { romaji: "Shigure", kana: "しぐれ", meaning: "時雨" },
    { romaji: "Yugure", kana: "ゆふぐれ", meaning: "夕暮れ" },
    { romaji: "Hotaru", kana: "ほたる", meaning: "蛍" },
    { romaji: "Kagero", kana: "かげろふ", meaning: "陽炎" },
    { romaji: "Haru", kana: "はる", meaning: "春" },
    { romaji: "Natsu", kana: "なつ", meaning: "夏" },
    { romaji: "Aki", kana: "あき", meaning: "秋" },
    { romaji: "Fuyu", kana: "ふゆ", meaning: "冬" },
    { romaji: "Tsuki", kana: "つき", meaning: "月" },
    { romaji: "Kaze", kana: "かぜ", meaning: "風" },
    { romaji: "Kumo", kana: "くも", meaning: "雲" },
    { romaji: "Yuki", kana: "ゆき", meaning: "雪" },
    { romaji: "Hana", kana: "はな", meaning: "花" },
    { romaji: "Tori", kana: "とり", meaning: "鳥" },
    { romaji: "Waka", kana: "わか", meaning: "和歌" },
    { romaji: "Oto", kana: "おと", meaning: "音" },
    { romaji: "Nioi", kana: "におい", meaning: "色つや" },
    { romaji: "Kokoro", kana: "こころ", meaning: "心" },
    { romaji: "Yume", kana: "ゆめ", meaning: "夢" },
    { romaji: "Utsutsu", kana: "うつつ", meaning: "現実" },
    { romaji: "Awai", kana: "あはひ", meaning: "間柄" },
    { romaji: "Sugata", kana: "すがた", meaning: "姿" },
    { romaji: "Kage", kana: "かげ", meaning: "光・姿" },
    { romaji: "Hikari", kana: "ひかり", meaning: "光" },
    { romaji: "Nishiki", kana: "にしき", meaning: "錦" },
    { romaji: "Koromo", kana: "ころも", meaning: "衣" },
    { romaji: "Ouse", kana: "あふせ", meaning: "逢瀬" },
    { romaji: "Chigiri", kana: "ちぎり", meaning: "約束" },
    { romaji: "Enishi", kana: "えにし", meaning: "縁" },
    { romaji: "Nasake", kana: "なさけ", meaning: "風流心" },
    { romaji: "Iro", kana: "いろ", meaning: "色・恋" },
    { romaji: "Ka", kana: "か", meaning: "香り" },
    { romaji: "Ne", kana: "ね", meaning: "音色" },
    { romaji: "Shirabe", kana: "しらべ", meaning: "調べ" },
    { romaji: "Utage", kana: "うたげ", meaning: "宴" },
    { romaji: "Asobi", kana: "あそび", meaning: "管弦の遊び" },
    { romaji: "Yamabuki", kana: "やまぶき", meaning: "山吹" },
    { romaji: "Shion", kana: "しをん", meaning: "紫苑" },
    { romaji: "Kuchiba", kana: "くちば", meaning: "朽葉" }
];

// List C: Verbs / Auxiliary / Endings (第三単語)
const listC = [
    { romaji: "Keri", kana: "けり", meaning: "〜した" },
    { romaji: "Beshi", kana: "べし", meaning: "〜でしょう" },
    { romaji: "Nari", kana: "なり", meaning: "〜である" },
    { romaji: "Haberi", kana: "はべり", meaning: "〜でございます" },
    { romaji: "Sourau", kana: "さうらふ", meaning: "〜でございます" },
    { romaji: "Ramu", kana: "らむ", meaning: "〜だろう" },
    { romaji: "Gotoshi", kana: "ごとし", meaning: "〜のようだ" },
    { romaji: "Tari", kana: "たり", meaning: "〜ている" },
    { romaji: "Ri", kana: "り", meaning: "〜ている" },
    { romaji: "Mu", kana: "む", meaning: "〜しよう" },
    { romaji: "Ji", kana: "じ", meaning: "〜まい" },
    { romaji: "Maji", kana: "まじ", meaning: "〜ないだろう" },
    { romaji: "Mashi", kana: "まし", meaning: "〜ならよかったのに" },
    { romaji: "Mahoshi", kana: "まほし", meaning: "〜したい" },
    { romaji: "Tashi", kana: "たし", meaning: "〜したい" },
    { romaji: "Kem", kana: "けむ", meaning: "〜しただろう" },
    { romaji: "Tsu", kana: "つ", meaning: "〜してしまった" },
    { romaji: "Nu", kana: "ぬ", meaning: "〜してしまった" },
    { romaji: "Zu", kana: "ず", meaning: "〜ない" },
    { romaji: "Ki", kana: "き", meaning: "〜した" },
    { romaji: "Sasu", kana: "さす", meaning: "〜させる" },
    { romaji: "Shimu", kana: "しむ", meaning: "〜させる" },
    { romaji: "Ru", kana: "る", meaning: "〜れる" },
    { romaji: "Raru", kana: "らる", meaning: "〜られる" },
    { romaji: "Su", kana: "す", meaning: "〜する" },
    { romaji: "Ku", kana: "く", meaning: "来る" },
    { romaji: "Owasu", kana: "おはす", meaning: "いらっしゃる" },
    { romaji: "Notamau", kana: "のたまふ", meaning: "おっしゃる" },
    { romaji: "Mesau", kana: "めす", meaning: "お呼びになる" },
    { romaji: "Mairu", kana: "まいる", meaning: "参上する" },
    { romaji: "Tatematsuru", kana: "たてまつる", meaning: "差し上げる" },
    { romaji: "Tamau", kana: "たまふ", meaning: "〜なさる" },
    { romaji: "Kikoyu", kana: "きこゆ", meaning: "申し上げる" },
    { romaji: "Saburau", kana: "さぶらふ", meaning: "お仕えする" },
    { romaji: "Tsukau", kana: "つかふ", meaning: "仕える" },
    { romaji: "Miru", kana: "みる", meaning: "見る・世話する" },
    { romaji: "Kiku", kana: "きく", meaning: "聞く" },
    { romaji: "Omou", kana: "おもふ", meaning: "想う" },
    { romaji: "Naku", kana: "なく", meaning: "泣く" },
    { romaji: "Warau", kana: "わらふ", meaning: "笑う" },
    { romaji: "Isogu", kana: "いそぐ", meaning: "急ぐ" },
    { romaji: "Matu", kana: "まつ", meaning: "待つ" },
    { romaji: "Yobu", kana: "よぶ", meaning: "呼ぶ" },
    { romaji: "Kaku", kana: "かく", meaning: "書く" },
    { romaji: "Yomu", kana: "よむ", meaning: "詠む" },
    { romaji: "Okuru", kana: "おくる", meaning: "送る" },
    { romaji: "Kaeru", kana: "かへる", meaning: "帰る" },
    { romaji: "Idazu", kana: "いだす", meaning: "出す" },
    { romaji: "Miyuru", kana: "みゆる", meaning: "見える" },
    { romaji: "Obo-yu", kana: "おぼゆ", meaning: "思われる" }
];

// Traditional Japanese Colors (Backgrounds)
const traditionalColors = [
    "#F5B199", // Araigo
    "#F0908D", // Toki-iro
    "#E6CDE3", // Fujinezumi
    "#B44C97", // Botan
    "#E198B4", // Nadeshiko
    "#C57F2E", // Kouji
    "#D0104C", // Karakurenai
    "#E95295", // Tsutsuji
    "#F4A7B9", // Ikkon-zome
    "#B5525C", // Umenezu
    "#D9333F", // Beni
    "#C7372F", // Suou
    "#915C8B", // Kyofuji
    "#6A4C9C", // Kikyo
    "#7B6C3D", // Rikyu-cha
    "#F7D94C", // Yamabuki
    "#F7C114", // Kiwangon
    "#D7C4BB", // Rikyu-shiracha
    "#E0C38C", // Kariyasu
    "#726D40", // Miru
    "#007B43", // Tokiwa
    "#393F2C", // Mushi-ao
    "#69821B", // Moegi
    "#227D51", // Midori
    "#86C166", // Nae-iro
    "#005CAF", // Ruri
    "#33A6B8", // Asagi
    "#90B68D", // Byakuroku
    "#A0D8EF", // Sora-iro
    "#2CA9E1", // Wasurenagusa
    "#00A381", // Tokusa
    "#465DAA", // Hana-asagi
    "#1E50A2", // Ruri-kon
    "#274A78", // Kon-kikyo
    "#0F2350", // Kachi-iro
    "#84A2D4", // Usu-hanada
    "#4D4C61", // Tetsukon
    "#7DB4B5", // Kamenozoki
    "#595455", // Dobu-nezumi
    "#EDEDE4", // Gofun
    "#B1B1B1", // Gin-nezu
    "#707C74", // Rikyu-nezumi
    "#595857", // Sumi
    "#24140E", // Kenpo-zuro
    "#35332F", // Keshi-zumi
    "#474a4d", // Aoji
    "#554236", // Tobiiro
    "#762f07", // Kakishibu
    "#892f1b", // Hiwada
    "#aacf53", // Hiwa-iro
];

// Special Characters & Numbers for List D
const symbols = ["!", "@", "#", "$", "%", "&", "?", "+", "*", "="];

// ==========================================
// 2. Core Functions
// ==========================================

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateListD() {
    // Generate format like "99!" or "24#" or "07$"
    const num = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const sym = getRandomItem(symbols);
    return `${num}${sym}`;
}

function calculateContrastColor(hex) {
    // Simple logic to determine if text should be white or black based on bg brightness
    // Convert hex to RGB
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    // YIQ equation
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#2c2c2c' : '#ffffff';
}

function updateBackgroundColor() {
    const color = getRandomItem(traditionalColors);
    document.body.style.backgroundColor = color;

    // Adjust header and footer text color based on background
    const textColor = calculateContrastColor(color);
    document.querySelector('.header').style.color = textColor;
    document.querySelector('.footer').style.color = textColor;

    // Adjust button shadow or border slightly for visibility if needed (optional)
}

function generatePassphrase() {
    const itemA = getRandomItem(listA);
    const itemB = getRandomItem(listB);
    const itemC = getRandomItem(listC);
    const itemD = generateListD();

    // 1. Create base array [A, B, C]
    const parts = [itemA, itemB, itemC];

    // 2. Insert D (symbol) at random position (0 to 3)
    const insertIndex = Math.floor(Math.random() * 4);

    // Create a compatible object for the symbol to simplify mapping
    const symbolObj = { romaji: itemD, kana: itemD, meaning: itemD };

    parts.splice(insertIndex, 0, symbolObj);

    // 3. Join them
    const passphrase = parts.map(p => p.romaji).join('-');
    const reading = parts.map(p => p.kana).join('・');
    const meaning = parts.map(p => p.meaning).join('・');

    // Update DOM
    document.getElementById('passphrase').textContent = passphrase;
    document.getElementById('reading').textContent = reading;
    document.getElementById('meaning').textContent = meaning;

    updateBackgroundColor();
}

function copyToClipboard() {
    const text = document.getElementById('passphrase').textContent;
    if (text === "---" || text === "Generating...") return;

    navigator.clipboard.writeText(text).then(() => {
        showToast();
    }).catch(err => {
        // Fallback for older browsers or if navigator fails
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("Copy");
        textArea.remove();
        showToast();
    });
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// ==========================================
// 3. Event Listeners
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');

    generateBtn.addEventListener('click', generatePassphrase);
    copyBtn.addEventListener('click', copyToClipboard);

    // Generate initial passphrase on load
    generatePassphrase();
});
