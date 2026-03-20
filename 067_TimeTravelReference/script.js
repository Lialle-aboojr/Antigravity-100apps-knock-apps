/**
 * タイムトラベル早見表 メインスクリプト
 * 初心者に分かりやすいよう全て日本語でコメントしています。
 */

// ---------------------------
// 1. 定数とデータの定義
// ---------------------------
const currentYear = new Date().getFullYear(); // 実行時の年
const START_YEAR = currentYear; // 最新年
const END_YEAR = currentYear - 100; // 初期表示は100年前まで

// 干支（十二支）の配列データ定義（西暦を12で割った余りがインデックスに対応します）
const ZODIACS = [
    { name: '申年', en: 'Monkey', emoji: '🐒' }, // 0
    { name: '酉年', en: 'Rooster', emoji: '🐓' }, // 1
    { name: '戌年', en: 'Dog',    emoji: '🐕' }, // 2
    { name: '亥年', en: 'Boar',   emoji: '🐗' }, // 3
    { name: '子年', en: 'Rat',    emoji: '🐀' }, // 4
    { name: '丑年', en: 'Ox',     emoji: '🐂' }, // 5
    { name: '寅年', en: 'Tiger',  emoji: '🐅' }, // 6
    { name: '卯年', en: 'Rabbit', emoji: '🐇' }, // 7
    { name: '辰年', en: 'Dragon', emoji: '🐉' }, // 8
    { name: '巳年', en: 'Snake',  emoji: '🐍' }, // 9
    { name: '午年', en: 'Horse',  emoji: '🐎' }, // 10
    { name: '未年', en: 'Sheep',  emoji: '🐏' }  // 11
];

// ---------------------------
// 2. ユーティリティ系関数群
// ---------------------------

/**
 * 西暦を受け取り、和暦（元号）の情報オブジェクトを返す関数
 */
function getEraInfo(year) {
    if (year >= 2019) return { era: "令和", romaji: "Reiwa", offset: 2018, class: "era-reiwa" };
    if (year >= 1989) return { era: "平成", romaji: "Heisei", offset: 1988, class: "era-heisei" };
    if (year >= 1926) return { era: "昭和", romaji: "Showa", offset: 1925, class: "era-showa" };
    return { era: "大正以前", romaji: "Before Taisho", offset: 0, class: "era-old" };
}

/**
 * 年齢からライフイベントのHTMLスタンプを生成する関数
 */
function getLifeEventsHtml(age) {
    let eventsHtml = ''; // 複数のイベントが重なることも考慮して文字列を結合していく方針に変更

    // 各年齢に合致するイベントがあればスタンプ文字列を連結する
    // ---- 誕生・学校系 ----
    if (age === 0) eventsHtml += `<span class="stamp stamp-birth"><span class="material-symbols-rounded">child_care</span>誕生 (Birth)</span>`;
    if (age === 6) eventsHtml += `<span class="stamp stamp-school"><span class="material-symbols-rounded">school</span>小学校入学</span>`;
    if (age === 12) eventsHtml += `<span class="stamp stamp-school"><span class="material-symbols-rounded">backpack</span>中学校入学</span>`;
    if (age === 15) eventsHtml += `<span class="stamp stamp-school"><span class="material-symbols-rounded">menu_book</span>高校入学</span>`;
    if (age === 18) eventsHtml += `<span class="stamp stamp-adult"><span class="material-symbols-rounded">celebration</span>成人 (18歳)</span>`;
    if (age === 20) eventsHtml += `<span class="stamp stamp-adult"><span class="material-symbols-rounded">local_bar</span>ハタチ (20歳)</span>`;

    // ---- 厄年 (19, 25, 33, 42, 61) ----
    if (age === 19 || age === 25 || age === 33 || age === 42 || age === 61) {
        // 絵文字はランダムでも良いですが、固定の🔥を使って強調します
        eventsHtml += `<span class="stamp stamp-yakudoshi">🔥厄年 (Yakudoshi)</span>`;
    }

    // ---- 周年・長寿系 ----
    if (age === 30) eventsHtml += `<span class="stamp stamp-milestone"><span class="material-symbols-rounded">trending_up</span>30歳</span>`;
    if (age === 40) eventsHtml += `<span class="stamp stamp-milestone"><span class="material-symbols-rounded">sports_score</span>40歳 (不惑)</span>`;
    if (age === 60) eventsHtml += `<span class="stamp stamp-kanreki"><span class="material-symbols-rounded">cake</span>還暦 (60歳)</span>`;
    if (age === 70) eventsHtml += `<span class="stamp stamp-old"><span class="material-symbols-rounded">park</span>古希 (70歳)</span>`;
    if (age === 77) eventsHtml += `<span class="stamp stamp-old"><span class="material-symbols-rounded">diversity_1</span>喜寿 (77歳)</span>`;
    if (age === 88) eventsHtml += `<span class="stamp stamp-old"><span class="material-symbols-rounded">spa</span>米寿 (88歳)</span>`;
    if (age === 99) eventsHtml += `<span class="stamp stamp-old"><span class="material-symbols-rounded">verified_user</span>白寿 (99歳)</span>`;
    if (age === 100) eventsHtml += `<span class="stamp stamp-old"><span class="material-symbols-rounded">emoji_events</span>百寿 (100歳)</span>`;

    return eventsHtml;
}

// ---------------------------
// 3. 描画・更新系関数群
// ---------------------------

/**
 * テーブルを生成・描画する関数
 * @param {number|null} userBirthYear - ユーザーの入力年（未入力ならnull）
 */
function renderTable(userBirthYear = null) {
    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = ""; // 一度テーブルの中身をクリアする

    // 表示する一番古い年を決定。生まれ年が入力されていれば、その年までを描画。
    // まだ入力がない場合は END_YEAR (100年前) まで。
    const theOldestYearToRender = userBirthYear ? userBirthYear : END_YEAR;

    for (let year = START_YEAR; year >= theOldestYearToRender; year--) {
        const eraInfo = getEraInfo(year);
        // 和暦の年数計算
        const eraNum = year - eraInfo.offset;
        const eraDisplay = eraNum === 1 ? "元年" : `${eraNum}年`;
        
        let ageText = "-";
        let eventsHtml = "";
        let rowClassList = ["year-row"];
        
        // マイタイムラインの年齢計算部分
        if (userBirthYear && year >= userBirthYear) {
            const age = year - userBirthYear;
            ageText = `${age}歳`;
            
            // 年齢に基づくイベントスタンプを取得
            eventsHtml = getLifeEventsHtml(age);
            
            // 生まれた年(0歳)は特別にハイライト
            if (age === 0) {
                rowClassList.push("highlight-birth");
            }
        }

        // 行(tr)を生成
        const tr = document.createElement("tr");
        tr.className = rowClassList.join(" ");
        tr.setAttribute("data-era", eraInfo.romaji.toLowerCase());

        tr.innerHTML = `
            <td>${year}</td>
            <td><span class="era-label ${eraInfo.class}">${eraInfo.era} ${eraDisplay}</span></td>
            <td><strong>${ageText}</strong></td>
            <td>${eventsHtml}</td>
        `;

        tableBody.appendChild(tr);
    }
}

/**
 * プロフィール（アバターと干支）エリアを更新する関数
 * @param {number} birthYear - 生まれ年
 */
function updateProfile(birthYear) {
    const avatarContainer = document.getElementById("avatar-container");
    const containerImg = document.getElementById("user-avatar");
    const containerDesc = document.getElementById("avatar-desc");
    const zodiacInfo = document.getElementById("zodiac-info");
    
    // アニメーションを再実行させるためのちょっとしたテクニック（一度クラスを外してつけ直す）
    avatarContainer.classList.remove("hidden");
    
    // アバター画像の更新
    containerImg.src = `https://api.dicebear.com/7.x/bottts/svg?seed=TimeTraveler${birthYear}&radius=50`;
    containerDesc.textContent = `${birthYear}年生まれのタイムトラベラーさん！`;
    
    // 干支の計算と更新
    // 生まれ年を12で割った余りが、定数で定義したZODIACS配列の順序と一致します
    const zodiacIndex = birthYear % 12;
    const zodiac = ZODIACS[zodiacIndex];
    zodiacInfo.innerHTML = `${zodiac.emoji} ${zodiac.name} / ${zodiac.en}`;
}

/**
 * 時代フィルタを適用する関数
 */
function applyEraFilter(eraTarget) {
    const rows = document.querySelectorAll(".year-row");
    rows.forEach(row => {
        const rowEra = row.getAttribute("data-era");
        if (eraTarget === "all" || rowEra === eraTarget) {
            row.classList.remove("hidden");
        } else {
            row.classList.add("hidden");
        }
    });
}

// ---------------------------
// 4. イベントリスナー（連動UI処理など）
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    
    // 初回のテーブル描画
    renderTable();

    const inputBirthYear = document.getElementById("birth-year");
    const inputCurrentAge = document.getElementById("current-age");

    /**
     * 【追加機能】入力欄の自動連動システム
     * どちらかの入力枠に数値が打ち込まれると、リアルタイムでもう一方を逆算してセットします。
     */
    // ① 「生まれ年」が打ち込まれたら「現在の年齢」を計算
    inputBirthYear.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 1900 && val <= currentYear) {
            inputCurrentAge.value = currentYear - val;
        } else {
            // 不正値なら片方をクリア
            inputCurrentAge.value = "";
        }
    });

    // ② 「現在の年齢」が打ち込まれたら「生まれ年」を計算
    inputCurrentAge.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 0 && val <= 150) {
            inputBirthYear.value = currentYear - val;
        } else {
            inputBirthYear.value = "";
        }
    });

    // ----------------------------------------
    // 「スケジュールを反映」ボタンのクリック処理
    // ----------------------------------------
    const applyBtn = document.getElementById("apply-btn");
    applyBtn.addEventListener("click", () => {
        
        // メインとなるのは「生まれ年」の値
        const birthYear = parseInt(inputBirthYear.value, 10);
        
        if (!isNaN(birthYear) && birthYear >= 1900 && birthYear <= currentYear) {
            // 正しい年が入力されていれば
            
            // 1. 表の再描画（誕生年までの行しか描画されないように修正済み）
            renderTable(birthYear);
            
            // 2. プロフィール（アバターと干支）の更新
            updateProfile(birthYear);
            
            // 3. フィルタの見た目を「すべて(all)」に戻し、フィルタを解除する
            document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
            document.querySelector('.filter-btn[data-era="all"]').classList.add("active");
            applyEraFilter("all");
            
        } else {
            alert(`1900年から${currentYear}年の間で、正しい年（または年齢）を入力してください。`);
        }
    });

    // ----------------------------------------
    // 時代フィルタボタンのクリック処理
    // ----------------------------------------
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const targetEra = e.target.getAttribute("data-era");
            
            // アクティブ状態の切り替え
            filterButtons.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            
            // フィルタ実行
            applyEraFilter(targetEra);
        });
    });
});
