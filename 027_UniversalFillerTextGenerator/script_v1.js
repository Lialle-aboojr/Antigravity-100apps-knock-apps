/**
 * Universal Filler Text Generator Logic
 * ユーザーの選択に応じてダミーテキストを生成・表示・コピーするスクリプト
 */

// DOM要素の取得
const outputText = document.getElementById('output-text');
const paragraphSlider = document.getElementById('paragraph-slider');
const paragraphValue = document.getElementById('paragraph-value');
const htmlTagCheck = document.getElementById('html-tag-check');
const copyBtn = document.getElementById('copy-btn');
const toast = document.getElementById('toast');
const modeRadios = document.querySelectorAll('input[name="mode"]');

// テキストデータ（単語・フレーズ集）
const textData = {
    // Standard: 一般的なLorem Ipsumの単語リスト
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
    // Japanese: 青空文庫などの著作権切れの名作からのフレーズ
    japanese: [
        "吾輩は猫である。",
        "名前はまだ無い。",
        "どこで生れたかとんと見当がつかぬ。",
        "親譲りの無鉄砲で小供の時から損ばかりしている。",
        "国境の長いトンネルを抜けると雪国であった。",
        "夜の底が白くなった。",
        "祇園精舎の鐘の声、諸行無常の響きあり。",
        "沙羅双樹の花の色、盛者必衰の理をあらはす。",
        "蜘蛛の糸が銀色に光りながら、",
        "一寸先は闇である。",
        "雨ニモマケズ、風ニモマケズ。",
        "或る日の暮方の事である。",
        "一人の下人が、羅生門の下で雨やみを待っていた。",
        "メロスは激怒した。",
        "必ず、かの邪智暴虐の王を除かなければならぬと決意した。",
        "恥の多い生涯を送って来ました。",
        "月が綺麗ですね。",
        "道草を食う。"
    ],
    // Designer's Pain: デザイナー・制作者がよく聞く「あるある」フレーズ
    designer: [
        "とりあえず仮で入れておいてください。",
        "なる早でお願いします。",
        "やっぱり元のデザインの方が良かったかも。",
        "ロゴをもっと大きくできませんか？",
        "シュッとした感じで。",
        "写真は後で送ります。",
        "来週の月曜朝イチで。",
        "予算はあまりないんですが……",
        "なんか違うんですよね。",
        "文字色、「赤」で。",
        "スマホでもパソコンと同じように見せてください。",
        "IEで崩れてます。",
        "ここ、クリックできるように見えません。",
        "余白が勿体無いので詰めましょう。",
        "参考サイトのような動きを入れてください。",
        "素材はパワポに貼ってあります。",
        "解像度が足りないみたいです。"
    ]
};

/**
 * 初期化処理
 */
function init() {
    // イベントリスナーの設定
    // モード切り替え時
    modeRadios.forEach(radio => {
        radio.addEventListener('change', generateAndDisplay);
    });

    // スライダー操作時
    paragraphSlider.addEventListener('input', (e) => {
        // 数値表示の更新
        paragraphValue.textContent = e.target.value;
        generateAndDisplay();
    });

    // HTMLタグチェックボックス切り替え時
    htmlTagCheck.addEventListener('change', generateAndDisplay);

    // コピーボタンクリック時
    copyBtn.addEventListener('click', copyToClipboard);

    // 初回生成
    generateAndDisplay();
}

/**
 * 現在の設定に基づいてテキストを生成し、表示エリアを更新する
 */
function generateAndDisplay() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const count = parseInt(paragraphSlider.value);
    const useHtml = htmlTagCheck.checked;

    const text = generateText(mode, count, useHtml);
    outputText.value = text;
}

/**
 * 指定されたモードとパラグラフループ数でテキストを生成する
 * @param {string} mode - 'standard', 'japanese', 'designer'
 * @param {number} count - 段落数
 * @param {boolean} useHtml - HTMLタグ(<p>)を含めるか
 * @returns {string} 生成されたテキスト
 */
function generateText(mode, count, useHtml) {
    const sourceData = textData[mode];
    let result = [];

    for (let i = 0; i < count; i++) {
        let paragraph = "";
        
        if (mode === 'standard') {
            // Standardモード: ランダムな単語を組み合わせて文章風にする
            paragraph = generateLoremParagraph(sourceData);
        } else {
            // Japanese / Designerモード: 既存のフレーズをランダムに連結する
            paragraph = generatePhraseParagraph(sourceData);
        }

        // HTMLタグオプションの処理
        if (useHtml) {
            paragraph = `<p>${paragraph}</p>`;
        }

        result.push(paragraph);
    }

    // 段落間の改行設定（HTMLタグなしの場合は2回改行で見やすく、ありの場合は1回）
    const separator = useHtml ? '\n' : '\n\n';
    return result.join(separator);
}

/**
 * Standardモード用のパラグラフ生成（単語ベース）
 */
function generateLoremParagraph(words) {
    // 1段落あたりの単語数（ランダム）
    const wordCount = Math.floor(Math.random() * 30) + 20; // 20~50単語
    let currentWords = [];

    // 最初の単語は必ず大文字始まりにする
    const firstWord = words[Math.floor(Math.random() * words.length)];
    currentWords.push(capitalize(firstWord));

    for (let i = 1; i < wordCount; i++) {
        const word = words[Math.floor(Math.random() * words.length)];
        currentWords.push(word);
    }

    // 単語をスペースで連結し、最後にピリオドをつける
    return currentWords.join(" ") + ".";
}

/**
 * Japanese / Designerモード用のパラグラフ生成（フレーズベース）
 */
function generatePhraseParagraph(phrases) {
    // 1段落あたりのフレーズ数（ランダム）
    const phraseCount = Math.floor(Math.random() * 4) + 3; // 3~6フレーズ
    let currentPhrases = [];

    for (let i = 0; i < phraseCount; i++) {
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        currentPhrases.push(phrase);
    }

    // フレーズをそのまま連結（日本語はスペースなし）
    return currentPhrases.join("");
}

/**
 * 先頭文字を大文字にするユーティリティ
 */
function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * クリップボードへのコピー機能とトースト通知
 */
function copyToClipboard() {
    const text = outputText.value;
    
    // Clipboard APIを使用
    navigator.clipboard.writeText(text).then(() => {
        showToast();
    }).catch(err => {
        console.error('Copy failed:', err);
        // フォールバック（万が一APIが非対応の場合）
        outputText.select();
        document.execCommand('copy');
        showToast();
    });
}

/**
 * トースト通知を表示する
 */
function showToast() {
    toast.className = "toast show";
    
    // 3秒後に非表示にする
    setTimeout(() => {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}

// アプリケーション開始
init();
