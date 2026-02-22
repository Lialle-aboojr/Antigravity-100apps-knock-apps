/* ============================================================
   表記ゆれ整え君 - JavaScriptメイン処理
   プログラミング初心者の方にもわかるよう、コメントを詳しく書いています。
   ============================================================ */

/* ----------------------------------------------------------
   1. 辞書データ（ルールセット）の定義
   ここにある「悪い例(bad)」を「良い例(good)」に置き換えます。
   ---------------------------------------------------------- */

// 🇯🇵 日本語（ビジネス・IT）用ルール
// 配列（リスト）の中に、オブジェクト（ペアのデータ）を書き足していきます。
const rulesJP = [
    { bad: '問合せ', good: '問い合わせ' },
    { bad: '申込', good: '申し込み' },
    { bad: '見積り', good: '見積もり' },
    { bad: '打合せ', good: '打ち合わせ' },
    { bad: '取り組', good: '取り組み' }, 
    { bad: '振込', good: '振り込み' },
    { bad: 'ユーザ', good: 'ユーザー' },
    { bad: 'サーバ', good: 'サーバー' },
    { bad: 'ブラウザ', good: 'ブラウザー' },
    { bad: 'プリンタ', good: 'プリンター' },
    { bad: 'コンピュータ', good: 'コンピューター' },
    { bad: 'フォルダ', good: 'フォルダー' },
    { bad: '出来る', good: 'できる' },
    { bad: '事', good: 'こと' },      // 例: 大事な事 -> 大事なこと
    { bad: '為', good: 'ため' },      // 例: 君の為 -> 君のため
    { bad: '、', good: '、' },        // プレースホルダー
    { bad: '下さい', good: 'ください' }, 
    { bad: '致します', good: 'いたします' },
    { bad: '又は', good: 'または' },
    { bad: '及び', good: 'および' },
    { bad: '且つ', good: 'かつ' },
    { bad: '時', good: 'とき' }
];

// 🇺🇸 英語（US統一・スペルミス）用ルール
const rulesEN = [
    { bad: 'colour', good: 'color' },
    { bad: 'centre', good: 'center' },
    { bad: 'theatre', good: 'theater' },
    { bad: 'metre', good: 'meter' },
    { bad: 'analyse', good: 'analyze' },
    { bad: 'organisation', good: 'organization' },
    { bad: 'behaviour', good: 'behavior' },
    { bad: 'favour', good: 'favor' },
    { bad: 'defence', good: 'defense' },
    { bad: 'licence', good: 'license' },
    { bad: 'e-mail', good: 'email' },
    { bad: 'internet', good: 'Internet' }
];


/* ----------------------------------------------------------
   2. HTMLの要素（部品）をJavaScriptで操作できるように取得する
   ---------------------------------------------------------- */
// ラジオボタン（モード切替）のグループ
const modeRadios = document.getElementsByName('lang-mode'); 
// 入力エリア
const inputText = document.getElementById('inputText');
// チェックボタン
const checkBtn = document.getElementById('checkBtn');
// 結果を表示するエリア
const resultArea = document.getElementById('resultArea');
// コピーボタン
const copyBtn = document.getElementById('copyBtn');
// コピーしましたメッセージ
const copyMessage = document.getElementById('copyMessage');
// bodyタグ（全体のデザイン色を変えるため）
const body = document.body;

// 現在のモードを保存する変数（初期値は 'jp'）
let currentMode = 'jp';


/* ----------------------------------------------------------
   3. モード切り替えの仕組み
   「日本語」か「英語」が選ばれたときに動く処理です。
   ---------------------------------------------------------- */
// ラジオボタンそれぞれに「変更があったら(switchModeを実行)」という命令をつけます
modeRadios.forEach(radio => {
    radio.addEventListener('change', switchMode);
});

function switchMode() {
    // どちらが選ばれているか確認
    const selectedRadio = Array.from(modeRadios).find(r => r.checked);
    currentMode = selectedRadio.value;

    if (currentMode === 'jp') {
        // bodyのクラスを書き換えて、青色テーマにする
        body.classList.remove('mode-en');
        body.classList.add('mode-jp');
        inputText.placeholder = "ここにチェックしたい文章を入力してください...";
    } else {
        // bodyのクラスを書き換えて、オレンジ色テーマにする
        body.classList.remove('mode-jp');
        body.classList.add('mode-en');
        inputText.placeholder = "Please enter text to check here...";
    }
}


/* ----------------------------------------------------------
   4. 「チェックする」ボタンを押したときの動き
   ---------------------------------------------------------- */
checkBtn.addEventListener('click', () => {
    // 1. 入力されたテキストを取得
    const text = inputText.value;

    // もし空っぽなら終了
    if (!text) {
        resultArea.innerHTML = '<p style="color:#aaa;">テキストが入力されていません。</p>';
        return;
    }

    // 2. 現在のモードに合わせて、使う辞書（ルール）を選ぶ
    let rules = [];
    if (currentMode === 'jp') {
        rules = rulesJP;
    } else {
        rules = rulesEN;
    }

    // 3. テキストをチェックして、修正箇所を強調表示する処理
    let processedText = text;

    // HTMLタグとして表示するために、改行コード(\n)を <br> タグに変換しておく前に、
    // XSS対策としてエスケープします。
    processedText = escapeHtml(processedText);

    // ルールをひとつずつ適用していく
    rules.forEach(rule => {
        // 正規表現を使って、「変更前の文字」を「ハイライト付きの変更後の文字」に変えます
        // "g"フラグは「全部置き換える」という意味です
        const regex = new RegExp(escapeRegExp(rule.bad), 'g');
        
        // 置き換え後のHTML: <span class="highlight-fix" title="元: 〇〇">修正後</span>
        const replacementHtml = `<span class="highlight-fix" title="修正前: ${rule.bad}">${rule.good}</span>`;
        
        processedText = processedText.replace(regex, replacementHtml);
    });

    // 改行コードを <br> に変換して見やすくする
    processedText = processedText.replace(/\n/g, '<br>');

    // 4. 結果を画面に表示
    resultArea.innerHTML = processedText;

    // 5. コピーボタンを使えるようにする
    copyBtn.disabled = false;
});


/* ----------------------------------------------------------
   5. 「一括修正してコピー」ボタンの動き
   ---------------------------------------------------------- */
copyBtn.addEventListener('click', () => {
    // resultArea.innerText を使うと、タグを除いた見た目通りのテキストが取れます。
    const finalText = resultArea.innerText;

    // クリップボードに書き込む
    navigator.clipboard.writeText(finalText).then(() => {
        // 成功したらメッセージを表示
        copyMessage.classList.remove('hidden');
        setTimeout(() => {
            copyMessage.classList.add('hidden');
        }, 3000);
    }).catch(err => {
        console.error('コピーに失敗しました', err);
        alert('コピーに失敗しました。');
    });
});


/* ----------------------------------------------------------
   【便利関数】セキュリティと文字処理のためのサポート関数
   ---------------------------------------------------------- */

// HTMLエスケープ
function escapeHtml(str) {
    if(!str) return str;
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
}

// 正規表現エスケープ
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}
