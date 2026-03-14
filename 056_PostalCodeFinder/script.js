// ==============================
// 郵便番号かんたん検索 / Postal Code Finder
// メインスクリプト
// ==============================

// --- DOM要素の取得（ページ読み込み後に使用する各要素の参照を保持） ---
const searchForm = document.getElementById('searchForm');
const postalCodeInput = document.getElementById('postalCodeInput');
const searchButton = document.getElementById('searchButton');
const errorArea = document.getElementById('errorArea');
const errorMessage = document.getElementById('errorMessage');
const resultArea = document.getElementById('resultArea');
const resultPostalCode = document.getElementById('resultPostalCode');
const resultAddress = document.getElementById('resultAddress');
const copyButton = document.getElementById('copyButton');
const copyIcon = document.getElementById('copyIcon');
const copyText = document.getElementById('copyText');
const loadingArea = document.getElementById('loadingArea');

// --- 現在表示中の住所テキストを保持する変数 ---
let currentAddress = '';

// ==============================
// セキュリティ: HTMLエスケープ関数
// XSS（クロスサイトスクリプティング）対策として、
// APIから取得したデータやユーザー入力を画面に描画する前に
// 必ずこの関数を通してサニタイズ（無害化）する
// ==============================
function escapeHtml(str) {
  // 文字列でない場合は空文字を返す（安全策）
  if (typeof str !== 'string') {
    return '';
  }
  // HTMLの特殊文字を安全な文字参照に変換する
  return str
    .replace(/&/g, '&amp;')   // & → &amp;
    .replace(/</g, '&lt;')    // < → &lt;
    .replace(/>/g, '&gt;')    // > → &gt;
    .replace(/"/g, '&quot;')  // " → &quot;
    .replace(/'/g, '&#039;'); // ' → &#039;
}

// ==============================
// 入力フィールドのリアルタイムフォーマット
// ユーザーが入力するたびに、自動でハイフンを挿入する
// 例: "1000001" → "100-0001"
// ==============================
postalCodeInput.addEventListener('input', function (e) {
  // 入力値から数字以外を全て除去
  let value = this.value.replace(/[^0-9]/g, '');

  // 7桁を超えた分は切り捨て
  if (value.length > 7) {
    value = value.substring(0, 7);
  }

  // 4桁以上入力されたらハイフンを自動挿入
  if (value.length > 3) {
    value = value.substring(0, 3) + '-' + value.substring(3);
  }

  // フォーマット済みの値を入力欄にセット
  this.value = value;
});

// ==============================
// 郵便番号のバリデーション（入力チェック）
// 正しい形式であれば数字7桁の文字列を返す
// 不正であればnullを返す
// ==============================
function validatePostalCode(input) {
  // 入力からハイフン・スペースを除去し、数字のみ取り出す
  const cleaned = input.replace(/[-\s\u3000]/g, '');

  // 数字のみかチェック
  if (!/^[0-9]+$/.test(cleaned)) {
    showError(
      '数字のみ入力してください。\n' +
      'Please enter numbers only.'
    );
    return null;
  }

  // 7桁かチェック
  if (cleaned.length !== 7) {
    showError(
      '郵便番号は7桁で入力してください。（例: 100-0001）\n' +
      'Please enter a 7-digit postal code. (e.g. 100-0001)'
    );
    return null;
  }

  return cleaned;
}

// ==============================
// エラーメッセージの表示
// ==============================
function showError(message) {
  // エスケープ処理してからHTMLに表示（改行は<br>に変換）
  errorMessage.innerHTML = escapeHtml(message).replace(/\n/g, '<br>');
  errorArea.hidden = false;

  // 結果エリアは非表示にする
  resultArea.hidden = true;
}

// ==============================
// エラーメッセージの非表示
// ==============================
function hideError() {
  errorArea.hidden = true;
  errorMessage.innerHTML = '';
}

// ==============================
// 検索結果の表示
// ==============================
function showResult(postalCode, address) {
  // 郵便番号と住所をエスケープしてから表示
  resultPostalCode.textContent = escapeHtml(postalCode);
  resultAddress.textContent = escapeHtml(address);
  resultArea.hidden = false;

  // 住所をコピー用に保持
  currentAddress = address;

  // コピーボタンの状態をリセット
  resetCopyButton();

  // エラーは非表示にする
  hideError();
}

// ==============================
// 検索結果の非表示
// ==============================
function hideResult() {
  resultArea.hidden = true;
  currentAddress = '';
}

// ==============================
// ローディング表示の切り替え
// ==============================
function setLoading(isLoading) {
  loadingArea.hidden = !isLoading;
  searchButton.disabled = isLoading;

  if (isLoading) {
    // 検索中は結果とエラーを非表示
    hideResult();
    hideError();
  }
}

// ==============================
// コピーボタンの状態リセット
// ==============================
function resetCopyButton() {
  copyIcon.textContent = '📋';
  copyText.textContent = '住所をコピー / Copy Address';
  copyButton.classList.remove('copied');
}

// ==============================
// zipcloud APIを使った住所検索（JSONP方式）
// CORS制限を回避するため、<script>タグを動的に生成してJSON Pで通信する
// ==============================
function searchAddress(postalCode) {
  // ローディング表示を開始
  setLoading(true);

  // コールバック関数名をユニークに生成（重複回避）
  const callbackName = 'zipcloudCallback_' + Date.now();

  // タイムアウト処理（10秒以内に応答がなければエラー）
  const timeoutId = setTimeout(function () {
    // タイムアウト発生時の処理
    cleanup();
    setLoading(false);
    showError(
      '通信がタイムアウトしました。インターネット接続を確認してください。\n' +
      'Connection timed out. Please check your internet connection.'
    );
  }, 10000);

  // クリーンアップ関数（使い終わった要素や関数を削除）
  function cleanup() {
    // タイムアウトタイマーを解除
    clearTimeout(timeoutId);
    // グローバル関数を削除
    delete window[callbackName];
    // scriptタグをDOMから削除
    const scriptTag = document.getElementById('jsonp-script');
    if (scriptTag) {
      scriptTag.remove();
    }
  }

  // JSONPコールバック関数をグローバルスコープに登録
  window[callbackName] = function (data) {
    // クリーンアップ（タグ・関数・タイマーの後片付け）
    cleanup();
    // ローディングを終了
    setLoading(false);

    // APIレスポンスのステータスをチェック
    if (data.status !== 200) {
      // APIがエラーステータスを返した場合
      showError(
        'APIエラーが発生しました: ' + (data.message || '不明なエラー') + '\n' +
        'API error occurred: ' + (data.message || 'Unknown error')
      );
      return;
    }

    // 検索結果がない（該当する住所が存在しない）場合
    if (!data.results || data.results.length === 0) {
      showError(
        '該当する住所が見つかりませんでした。郵便番号を確認してください。\n' +
        'No address found. Please check the postal code.'
      );
      return;
    }

    // 検索結果の先頭データを取得
    const result = data.results[0];

    // 都道府県 + 市区町村 + 町域 を結合して完全な住所を作成
    const fullAddress =
      (result.address1 || '') +
      (result.address2 || '') +
      (result.address3 || '');

    // 郵便番号をフォーマット（XXX-XXXX形式）
    const formattedCode = postalCode.substring(0, 3) + '-' + postalCode.substring(3);

    // 結果を表示
    showResult(formattedCode, fullAddress);
  };

  // JSONP用のscriptタグを作成してAPIを呼び出す
  const script = document.createElement('script');
  script.id = 'jsonp-script';
  script.src =
    'https://zipcloud.ibsnet.co.jp/api/search?zipcode=' +
    encodeURIComponent(postalCode) +
    '&callback=' +
    encodeURIComponent(callbackName);

  // scriptタグの読み込みエラー時の処理
  script.onerror = function () {
    cleanup();
    setLoading(false);
    showError(
      '通信エラーが発生しました。インターネット接続を確認してください。\n' +
      'A network error occurred. Please check your internet connection.'
    );
  };

  // scriptタグをDOMに追加（これによりAPIリクエストが発行される）
  document.head.appendChild(script);
}

// ==============================
// フォーム送信イベントの処理
// ==============================
searchForm.addEventListener('submit', function (e) {
  // フォームのデフォルト送信（ページリロード）を防止
  e.preventDefault();

  // 入力値を取得
  const input = postalCodeInput.value.trim();

  // 空欄チェック
  if (input === '') {
    showError(
      '郵便番号を入力してください。\n' +
      'Please enter a postal code.'
    );
    return;
  }

  // バリデーション（正しければ7桁の数字文字列が返る）
  const postalCode = validatePostalCode(input);
  if (postalCode === null) {
    // バリデーションエラー（showErrorは関数内で呼ばれている）
    return;
  }

  // APIで検索を実行
  searchAddress(postalCode);
});

// ==============================
// コピーボタンのクリックイベント
// Clipboard APIを使って住所をクリップボードにコピー
// ==============================
copyButton.addEventListener('click', function () {
  // コピーする住所がなければ何もしない
  if (!currentAddress) {
    return;
  }

  // Clipboard APIでコピーを実行
  navigator.clipboard.writeText(currentAddress)
    .then(function () {
      // コピー成功: ボタンの見た目を変更してフィードバック
      copyIcon.textContent = '✅';
      copyText.textContent = 'コピーしました！ / Copied!';
      copyButton.classList.add('copied');

      // 2秒後に元のボタン表示に戻す
      setTimeout(function () {
        resetCopyButton();
      }, 2000);
    })
    .catch(function () {
      // コピー失敗: フォールバック処理
      // 一部ブラウザやHTTP環境ではClipboard APIが使えないため、
      // 従来のdocument.execCommandを試みる
      try {
        const textArea = document.createElement('textarea');
        textArea.value = currentAddress;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        // フォールバック成功
        copyIcon.textContent = '✅';
        copyText.textContent = 'コピーしました！ / Copied!';
        copyButton.classList.add('copied');

        setTimeout(function () {
          resetCopyButton();
        }, 2000);
      } catch (err) {
        // フォールバックも失敗
        showError(
          'コピーに失敗しました。手動でテキストを選択してコピーしてください。\n' +
          'Copy failed. Please manually select and copy the text.'
        );
      }
    });
});

// ==============================
// Enterキーでの検索（入力フィールドでEnterを押した時もフォーム送信される）
// ※ <form>内の<input>なので、デフォルトでEnterキーでsubmitされるが、
//    念のため明示的にも対応しておく
// ==============================
postalCodeInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    searchForm.dispatchEvent(new Event('submit'));
  }
});

// ==============================
// ページ読み込み完了時、入力フィールドにフォーカスを合わせる
// ==============================
window.addEventListener('DOMContentLoaded', function () {
  postalCodeInput.focus();
});
