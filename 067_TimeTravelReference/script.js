/**
 * タイムトラベル早見表 メインスクリプト
 * 初心者に分かりやすいよう全て日本語でコメントしています。
 */

// 定数の定義
const currentYear = new Date().getFullYear();
const START_YEAR = currentYear; // 最新年（現在）
const END_YEAR = currentYear - 100; // 100年前まで

/**
 * 西暦を受け取り、和暦（元号）の情報オブジェクトを返す関数
 * @param {number} year - 西暦
 * @returns {object} - 元号の情報オブジェクト
 */
function getEraInfo(year) {
    if (year >= 2019) return { era: "令和", romaji: "Reiwa", offset: 2018, class: "era-reiwa" };
    if (year >= 1989) return { era: "平成", romaji: "Heisei", offset: 1988, class: "era-heisei" };
    if (year >= 1926) return { era: "昭和", romaji: "Showa", offset: 1925, class: "era-showa" };
    return { era: "大正以前", romaji: "Before Taisho", offset: 0, class: "era-old" };
}

/**
 * 年齢からライフイベントのHTMLスタンプを生成する関数
 * @param {number} age - 年齢
 * @returns {string} - アイコン付きのスタンプHTML文字列
 */
function getLifeEventHtml(age) {
    switch (age) {
        case 0: return `<span class="stamp stamp-birth"><span class="material-symbols-rounded">child_care</span>誕生 (Birth)</span>`;
        case 6: return `<span class="stamp stamp-school"><span class="material-symbols-rounded">school</span>小学校入学</span>`;
        case 12: return `<span class="stamp stamp-school"><span class="material-symbols-rounded">backpack</span>中学校入学</span>`;
        case 15: return `<span class="stamp stamp-school"><span class="material-symbols-rounded">menu_book</span>高校入学</span>`;
        case 18: return `<span class="stamp stamp-adult"><span class="material-symbols-rounded">celebration</span>成人 (18歳)</span>`;
        case 20: return `<span class="stamp stamp-adult"><span class="material-symbols-rounded">local_bar</span>ハタチ (20歳)</span>`;
        case 30: return `<span class="stamp stamp-milestone"><span class="material-symbols-rounded">trending_up</span>30歳</span>`;
        case 40: return `<span class="stamp stamp-milestone"><span class="material-symbols-rounded">sports_score</span>40歳 (不惑)</span>`;
        case 60: return `<span class="stamp stamp-kanreki"><span class="material-symbols-rounded">cake</span>還暦 (60歳)</span>`;
        case 70: return `<span class="stamp stamp-old"><span class="material-symbols-rounded">park</span>古希 (70歳)</span>`;
        case 77: return `<span class="stamp stamp-old"><span class="material-symbols-rounded">diversity_1</span>喜寿 (77歳)</span>`;
        case 88: return `<span class="stamp stamp-old"><span class="material-symbols-rounded">spa</span>米寿 (88歳)</span>`;
        case 99: return `<span class="stamp stamp-old"><span class="material-symbols-rounded">verified_user</span>白寿 (99歳)</span>`;
        case 100: return `<span class="stamp stamp-old"><span class="material-symbols-rounded">emoji_events</span>百寿 (100歳)</span>`;
        default: return "";
    }
}

/**
 * テーブルを生成・描画する関数
 * @param {number|null} userBirthYear - ユーザーの入力年（未入力ならnull）
 */
function renderTable(userBirthYear = null) {
    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = ""; // 一度テーブルの中身をクリアする

    // 現在の年から100年前へ向かってループ処理
    for (let year = START_YEAR; year >= END_YEAR; year--) {
        const eraInfo = getEraInfo(year);
        // 和暦の年数計算（計算結果が1の場合は「元年」にする）
        const eraNum = year - eraInfo.offset;
        const eraDisplay = eraNum === 1 ? "元年" : `${eraNum}年`;
        
        // マイタイムライン用変数
        let ageText = "-";
        let lifeEventHtml = "";
        let isBirthYear = false;
        
        // 入力があり、且つその年以降なら年齢を表示する
        if (userBirthYear && year >= userBirthYear) {
            const age = year - userBirthYear;
            ageText = `${age}歳`;
            
            // 年齢に応じたイベントスタンプを取得
            lifeEventHtml = getLifeEventHtml(age);
            
            if (age === 0) {
                isBirthYear = true; // 0歳（生まれた年）フラグ
            }
        }

        // DOMを使用して安全に行（tr）を生成する（基本的なXSS対策）
        const tr = document.createElement("tr");
        tr.className = "year-row";
        
        // 生まれた年なら専用のハイライトクラスを追加
        if (isBirthYear) tr.classList.add("highlight-birth");
        
        // フィルタリング用に、どの時代の行かのデータ属性(data-era)を追加
        tr.setAttribute("data-era", eraInfo.romaji.toLowerCase());

        // 各セルの内容を設定して追加
        // userBirthYearなどは数値を保証しているためInnerHTMLで問題なし
        tr.innerHTML = `
            <td>${year}</td>
            <td><span class="era-label ${eraInfo.class}">${eraInfo.era} ${eraDisplay}</span></td>
            <td><strong>${ageText}</strong></td>
            <td>${lifeEventHtml}</td>
        `;

        tableBody.appendChild(tr);
    }
}

/**
 * アバターとメッセージを更新する関数
 * @param {number} birthYear - 生まれ年
 */
function updateAvatar(birthYear) {
    const avatarContainer = document.getElementById("avatar-container");
    const containerImg = document.getElementById("user-avatar");
    const containerDesc = document.getElementById("avatar-desc");
    
    // DiceBear APIを使用して、入力された年数(birthYear)を元にユニークなアバターを生成
    containerImg.src = `https://api.dicebear.com/7.x/bottts/svg?seed=TimeTraveler${birthYear}&radius=50`;
    containerDesc.textContent = `${birthYear}年生まれのタイムトラベラーさん！`;
    
    // アバターエリアを表示する
    avatarContainer.classList.remove("hidden");
}

/**
 * 時代フィルタを適用する関数
 * @param {string} eraTarget - 押されたボタンのターゲット時代 ("all", "showa" など)
 */
function applyEraFilter(eraTarget) {
    const rows = document.querySelectorAll(".year-row");
    
    // 全ての行を確認し、条件に合わないものを hidden(非表示) クラスで隠す
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
// 以下は、画面ロード完了時に動く処理（イベントリスナーの登録）
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. 初回のテーブル描画（年齢入力なし）
    renderTable();

    // 2. 「反映する」ボタンのクリックイベント
    const applyBtn = document.getElementById("apply-btn");
    applyBtn.addEventListener("click", () => {
        const inputField = document.getElementById("birth-year");
        
        // 【重要: XSS対策】parseIntを用いて入力を文字列ではなく、強制的に数値（整数）へ変換する
        // これにより、仮にスクリプトタグが含まれていても無効化(NaN)される
        const birthYear = parseInt(inputField.value, 10);
        
        // 有効な範囲の西暦かチェック（NaNでなく、1900年から現在の年までの間）
        if (!isNaN(birthYear) && birthYear >= 1900 && birthYear <= currentYear) {
            // 正しい数値なら描画し直す
            renderTable(birthYear);
            updateAvatar(birthYear);
            
            // フィルタの見た目を「すべて(all)」に戻し、フィルタを解除する
            document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
            document.querySelector('.filter-btn[data-era="all"]').classList.add("active");
            applyEraFilter("all");
            
        } else {
            // エラー時の処理
            alert(`1900年から${currentYear}年の間で、正しい数値を入力してください。`);
            inputField.value = "";
        }
    });

    // 3. 時代フィルタボタンのクリックイベント
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            // クリックされたボタンに設定されたターゲット時代を取得
            const targetEra = e.target.getAttribute("data-era");
            
            // すべてのボタンからactive(黒塗り)状態を外し、クリックされたものだけactiveを付ける
            filterButtons.forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            
            // 表示非表示の切り替えを実行
            applyEraFilter(targetEra);
        });
    });
});
