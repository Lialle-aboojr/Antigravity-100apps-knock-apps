/* =========================================
   String Replacer / 文字列一括置換ツール
   メインスクリプト

   機能:
   - 正規表現を使った文字列の一括置換
   - 大文字・小文字の区別切り替え
   - 特殊文字のエスケープ処理
   - ワンクリックでのクリップボードコピー
   ========================================= */

// ===== DOM要素の取得 =====
const originalText = document.getElementById('original-text');
const findText = document.getElementById('find-text');
const replaceText = document.getElementById('replace-text');
const caseSensitive = document.getElementById('case-sensitive');
const btnReplace = document.getElementById('btn-replace');
const resultText = document.getElementById('result-text');
const btnCopy = document.getElementById('btn-copy');
const btnCopyText = document.getElementById('btn-copy-text');
const appIcon = document.getElementById('app-icon');

// ===== ファビコン画像の読み込みエラー処理 =====
// 画像が見つからない場合はアイコンを非表示にする
appIcon.addEventListener('error', function () {
    this.classList.add('hidden');
});

// ===== 正規表現の特殊文字をエスケープする関数 =====
// ユーザーが入力した文字列に含まれる特殊文字（. * + ? など）を
// リテラル文字として検索できるようにエスケープする
function escapeRegExp(string) {
    // 正規表現で特別な意味を持つ文字の前にバックスラッシュを追加
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ===== 置換処理を実行する関数 =====
function performReplace() {
    // 元のテキストを取得
    const source = originalText.value;

    // 検索する文字列を取得
    const find = findText.value;

    // 検索文字列が空の場合は何もしない（元のテキストをそのまま表示）
    if (find === '') {
        resultText.value = source;
        return;
    }

    // 置換後の文字列を取得
    const replaceWith = replaceText.value;

    // 検索文字列の特殊文字をエスケープ
    const escapedFind = escapeRegExp(find);

    // 正規表現のフラグを設定
    // g: グローバルフラグ（全ての一致箇所を置換）
    // i: 大文字・小文字を区別しないフラグ（チェックが入っていない場合に追加）
    let flags = 'g';
    if (!caseSensitive.checked) {
        // チェックが入っていない場合は大文字・小文字を区別しない
        flags += 'i';
    }

    // 正規表現オブジェクトを作成して置換を実行
    const regex = new RegExp(escapedFind, flags);
    const result = source.replace(regex, replaceWith);

    // 結果をテキストエリアに表示
    resultText.value = result;
}

// ===== クリップボードにコピーする関数 =====
function copyResult() {
    // 結果テキストを取得
    const text = resultText.value;

    // テキストが空の場合は何もしない
    if (text === '') {
        return;
    }

    // クリップボードにコピー
    navigator.clipboard.writeText(text).then(function () {
        // コピー成功時のフィードバック表示
        btnCopyText.textContent = '✅ Copied!';
        btnCopy.classList.add('copied');

        // 1.5秒後に元のテキストに戻す
        setTimeout(function () {
            btnCopyText.textContent = '📋 コピー / Copy';
            btnCopy.classList.remove('copied');
        }, 1500);
    }).catch(function (err) {
        // クリップボードAPIが使えない場合のフォールバック
        // テキストエリアを選択してコピーする方法
        resultText.select();
        document.execCommand('copy');

        // フィードバック表示
        btnCopyText.textContent = '✅ Copied!';
        btnCopy.classList.add('copied');

        setTimeout(function () {
            btnCopyText.textContent = '📋 コピー / Copy';
            btnCopy.classList.remove('copied');
        }, 1500);
    });
}

// ===== イベントリスナーの設定 =====

// 「一括置換 / Replace All」ボタンのクリックイベント
btnReplace.addEventListener('click', performReplace);

// 「コピー / Copy」ボタンのクリックイベント
btnCopy.addEventListener('click', copyResult);

// Enterキーでも置換を実行できるようにする（検索欄・置換欄で）
findText.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        performReplace();
    }
});

replaceText.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        performReplace();
    }
});
