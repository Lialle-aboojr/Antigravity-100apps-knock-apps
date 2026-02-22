/**
 * Universal Filler Text Generator V2
 * 
 * 主な機能:
 * 1. テキストタイプ選択 (Standard, Japanese, Designer)
 * 2. 生成単位選択 (段落数 vs 文字数)
 * 3. 文字数指定時のピタッと止めるロジック
 * 4. ダークモード切り替え (手動 + 保存)
 * 5. コピー機能
 */

// --- DOM要素の取得 ---
const outputText = document.getElementById('output-text');
const amountSlider = document.getElementById('amount-slider');
const amountDisplay = document.getElementById('amount-display');
const sliderLabel = document.getElementById('slider-label');
const htmlTagCheck = document.getElementById('html-tag-check');
const copyBtn = document.getElementById('copy-btn');
const toast = document.getElementById('toast');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
const currentLengthDisplay = document.getElementById('current-length');

// ラジオボタン群
const textModeRadios = document.querySelectorAll('input[name="textMode"]');
const lengthModeRadios = document.querySelectorAll('input[name="lengthMode"]');

// --- データ定義 ---
const textData = {
    standard: [
        "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
        "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
        "magna", "aliqua", "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud",
        "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea",
        "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit",
        "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla",
        "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident",
        "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum"
    ],
    japanese: [
        "吾輩は猫である。", "名前はまだ無い。", "どこで生れたかとんと見当がつかぬ。",
        "親譲りの無鉄砲で小供の時から損ばかりしている。", "国境の長いトンネルを抜けると雪国であった。",
        "夜の底が白くなった。", "祇園精舎の鐘の声、諸行無常の響きあり。",
        "沙羅双樹の花の色、盛者必衰の理をあらはす。", "蜘蛛の糸が銀色に光りながら、",
        "一寸先は闇である。", "雨ニモマケズ、風ニモマケズ。", "或る日の暮方の事である。",
        "一人の下人が、羅生門の下で雨やみを待っていた。", "メロスは激怒した。",
        "必ず、かの邪智暴虐の王を除かなければならぬと決意した。", "恥の多い生涯を送って来ました。",
        "月が綺麗ですね。", "道草を食う。"
    ],
    designer: [
        "とりあえず仮で入れておいてください。", "なる早でお願いします。", "やっぱり元のデザインの方が良かったかも。",
        "ロゴをもっと大きくできませんか？", "シュッとした感じで。", "写真は後で送ります。",
        "来週の月曜朝イチで。", "予算はあまりないんですが……", "なんか違うんですよね。",
        "文字色、「赤」で。", "スマホでもパソコンと同じように見せてください。",
        "IEで崩れてます。", "ここ、クリックできるように見えません。",
        "余白が勿体無いので詰めましょう。", "参考サイトのような動きを入れてください。",
        "素材はパワポに貼ってあります。", "解像度が足りないみたいです。"
    ]
};

// --- 初期化処理 ---
function init() {
    // 1. ローカルストレージから設定を読み込む（ダークモード）
    loadTheme();

    // 2. イベントリスナー登録
    // テキストタイプ変更
    textModeRadios.forEach(r => r.addEventListener('change', generateAndDisplay));

    // 生成単位（段落/文字数）変更 -> スライダー範囲の更新
    lengthModeRadios.forEach(r => r.addEventListener('change', updateSliderParams));

    // スライダー操作 -> 数値表示更新 & 再生成
    amountSlider.addEventListener('input', (e) => {
        amountDisplay.textContent = e.target.value;
        generateAndDisplay();
    });

    // HTMLタグチェック
    htmlTagCheck.addEventListener('change', generateAndDisplay);

    // コピーボタン
    copyBtn.addEventListener('click', copyToClipboard);

    // テーマ切り替え
    themeToggle.addEventListener('click', toggleTheme);

    // 初回実行
    updateSliderParams(); // これが generateAndDisplay も呼ぶ
}

// --- ロジック ---

/**
 * テーマ切り替え処理
 * bodyにクラスを付け外しし、ローカルストレージに保存する
 */
function toggleTheme() {
    const body = document.body;

    // 現在の状態を確認して反転
    if (body.classList.contains('dark-mode')) {
        // Dark -> Light
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themeIcon.textContent = '🌙'; // 次は月（ダーク）にできるよアイコン
        localStorage.setItem('theme', 'light');
    } else if (body.classList.contains('light-mode')) {
        // Light -> Dark
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themeIcon.textContent = '☀️'; // 次は太陽（ライト）にできるよアイコン
        localStorage.setItem('theme', 'dark');
    } else {
        // クラスがない場合（OS設定準拠）
        // 現在のブラウザの認識を確認
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isSystemDark) {
            // System Dark -> Force Light
            body.classList.add('light-mode');
            themeIcon.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        } else {
            // System Light -> Force Dark
            body.classList.add('dark-mode');
            themeIcon.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        }
    }
}

/**
 * 保存されたテーマを適用する
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.textContent = '☀️';
    } else if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeIcon.textContent = '🌙';
    }
    // 保存なしなら何もしない（OS設定に従う）
}

/**
 * 生成単位（Paragraphs/Characters）に合わせてスライダーの設定を書き換える
 */
function updateSliderParams() {
    const lengthMode = document.querySelector('input[name="lengthMode"]:checked').value;

    if (lengthMode === 'paragraph') {
        // 段落指定モード
        amountSlider.min = 1;
        amountSlider.max = 10;
        amountSlider.value = 3;
        sliderLabel.textContent = "Paragraphs / 段落数 (1-10)";
    } else {
        // 文字数指定モード
        amountSlider.min = 10;
        amountSlider.max = 1000; // 最大1000文字まで
        amountSlider.value = 200; // デフォルト200文字
        sliderLabel.textContent = "Characters / 文字数 (10-1000)";
    }

    amountDisplay.textContent = amountSlider.value;
    generateAndDisplay();
}

/**
 * テキストの生成と表示用エリアの更新
 */
function generateAndDisplay() {
    const textMode = document.querySelector('input[name="textMode"]:checked').value;
    const lengthMode = document.querySelector('input[name="lengthMode"]:checked').value;
    const amount = parseInt(amountSlider.value);
    const useHtml = htmlTagCheck.checked;

    let resultText = "";

    if (lengthMode === 'paragraph') {
        // 段落数指定の場合
        resultText = generateByParagraphs(textMode, amount, useHtml);
    } else {
        // 文字数指定の場合（指定文字数でピタッと止める）
        resultText = generateByCharacters(textMode, amount, useHtml);
    }

    outputText.value = resultText;
    currentLengthDisplay.textContent = resultText.length;
}

/**
 * 段落数指定での生成ロジック
 */
function generateByParagraphs(mode, finalCount, useHtml) {
    const sourceData = textData[mode];
    let paragraphs = [];

    for (let i = 0; i < finalCount; i++) {
        let p = "";
        if (mode === 'standard') {
            p = generateLoremParagraph(sourceData);
        } else {
            p = generatePhraseParagraph(sourceData);
        }

        if (useHtml) p = `<p>${p}</p>`;
        paragraphs.push(p);
    }

    // HTMLタグありなら改行1つ、なしなら見やすく2つ
    return paragraphs.join(useHtml ? '\n' : '\n\n');
}

/**
 * 文字数指定での生成ロジック
 */
function generateByCharacters(mode, limit, useHtml) {
    const sourceData = textData[mode];
    let buffer = "";

    // 目標文字数を超えるまで文章を生成し続ける
    // 無限ループ防止のため上限を設ける
    let safetyCounter = 0;
    while (buffer.length < limit && safetyCounter < 100) {
        let chunk = "";
        if (mode === 'standard') {
            chunk = generateLoremParagraph(sourceData);
        } else {
            chunk = generatePhraseParagraph(sourceData);
        }

        // 連結（空白を入れるかどうかはモードによるが、シンプルにスペースまたは改行でつなぐ）
        // 文字数制限モードでは、単一の巨大なテキストブロックにするのが一般的だが、
        // HTMLタグOFFの場合は読みやすくするために適宜改行を入れてもよい。
        // ここでは「文字数でピタッと」が要件なので、改行も含めて文字数とする。

        if (buffer.length > 0) {
            buffer += (mode === 'standard' ? " " : ""); // 日本語ならスペース不要
        }
        buffer += chunk;
        safetyCounter++;
    }

    // 文字数でカット (0からlimitまで)
    let finalString = buffer.substring(0, limit);

    // HTMLオプションがある場合、全体を<p>で囲む（要件: ピタッと止める優先だが、タグは外側につける）
    // 文字数カウントにHTMLタグを含めるかどうかは解釈が分かれるが、
    // 通常「本文の長さ」を指定したいはずなので、本文をカットしてからタグをつける。

    if (useHtml) {
        return `<p>${finalString}</p>`;
    }
    return finalString;
}


// --- ヘルパー関数 ---

/** Standardモード用単語ベース生成 */
function generateLoremParagraph(words) {
    const wordCount = Math.floor(Math.random() * 20) + 15; // 15-35単語
    let currentWords = [];
    currentWords.push(capitalize(words[Math.floor(Math.random() * words.length)]));

    for (let i = 1; i < wordCount; i++) {
        currentWords.push(words[Math.floor(Math.random() * words.length)]);
    }
    return currentWords.join(" ") + ".";
}

/** Japanese/Designerモード用フレーズベース生成 */
function generatePhraseParagraph(phrases) {
    const phraseCount = Math.floor(Math.random() * 3) + 3; // 3-5フレーズ
    let currentPhrases = [];
    for (let i = 0; i < phraseCount; i++) {
        currentPhrases.push(phrases[Math.floor(Math.random() * phrases.length)]);
    }
    return currentPhrases.join("");
}

function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- コピー機能 ---
function copyToClipboard() {
    const text = outputText.value;
    navigator.clipboard.writeText(text).then(() => {
        showToast();
    }).catch(() => {
        outputText.select();
        document.execCommand('copy');
        showToast();
    });
}

function showToast() {
    toast.className = "toast show";
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}

// 開始
init();
