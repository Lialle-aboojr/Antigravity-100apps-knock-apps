/* ========================================
   Quick QR Generator — メインスクリプト
   機能: QRコード生成・ダウンロード・エラーハンドリング
   ======================================== */

// --- DOM要素の取得 ---
const qrInput = document.getElementById('qr-input');           // テキスト入力欄
const qrCanvas = document.getElementById('qr-canvas');         // QRコード描画用canvas
const qrPlaceholder = document.getElementById('qr-placeholder'); // 空欄時のプレースホルダー
const qrDisplay = document.getElementById('qr-display');       // QRコード表示エリア
const downloadBtn = document.getElementById('download-btn');   // ダウンロードボタン
const charCount = document.getElementById('char-count');       // 文字数カウンター

// --- QRiousインスタンスを作成（ライブラリの初期化） ---
const qr = new QRious({
    element: qrCanvas,   // 描画先のcanvas要素
    size: 800,           // 内部解像度（高品質でダウンロードするため大きめに設定）
    level: 'M',          // 誤り訂正レベル（M = 中程度）
    backgroundAlpha: 1,  // 背景の透明度（1 = 不透明な白）
    foreground: '#222222', // QRコードの色（ダークグレー）
    background: '#ffffff'  // 背景色（白）
});

// --- デバウンス用のタイマーID ---
// 入力のたびにQRコードを再生成すると重くなるため、少し遅延させる
let debounceTimer = null;

// --- 入力イベントの監視（リアルタイム生成） ---
qrInput.addEventListener('input', function () {
    // 文字数カウンターを更新
    const text = qrInput.value;
    charCount.textContent = text.length;

    // デバウンス: 前回のタイマーをキャンセルして、150ms後に実行
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
        updateQRCode(text);
    }, 150);
});

// --- QRコードの更新処理 ---
function updateQRCode(text) {
    // 入力が空（文字数ゼロ）の場合
    if (!text || text.trim().length === 0) {
        hideQRCode();
        return;
    }

    // QRコードを生成（QRiousが自動的にcanvasに描画する）
    qr.value = text;

    // 表示を切り替え: プレースホルダーを隠してcanvasを表示
    showQRCode();
}

// --- QRコードを表示する関数 ---
function showQRCode() {
    // canvasを表示
    qrCanvas.classList.add('visible');
    // プレースホルダーを非表示
    qrPlaceholder.classList.add('hidden');
    // 表示エリアにスタイルクラスを適用
    qrDisplay.classList.add('has-qr');
    // ダウンロードボタンを有効化
    downloadBtn.disabled = false;
}

// --- QRコードを非表示にする関数（空欄時のエラーハンドリング） ---
function hideQRCode() {
    // canvasを非表示
    qrCanvas.classList.remove('visible');
    // プレースホルダーを表示
    qrPlaceholder.classList.remove('hidden');
    // 表示エリアのスタイルクラスを解除
    qrDisplay.classList.remove('has-qr');
    // ダウンロードボタンを非活性にする（グレーアウト）
    downloadBtn.disabled = true;
}

// --- ダウンロードボタンのクリックイベント ---
downloadBtn.addEventListener('click', function () {
    // ボタンが非活性の場合は何もしない（安全措置）
    if (downloadBtn.disabled) return;

    // canvasの内容をPNG画像としてData URLに変換
    const dataURL = qrCanvas.toDataURL('image/png');

    // ダウンロード用の一時的なリンク要素を作成
    const link = document.createElement('a');
    link.href = dataURL;

    // ファイル名を生成（入力テキストから安全な名前を作る）
    const inputText = qrInput.value.trim();
    const safeName = generateFileName(inputText);
    link.download = safeName + '.png';

    // リンクをクリックしてダウンロードを開始
    document.body.appendChild(link);
    link.click();

    // 一時リンクを削除（クリーンアップ）
    document.body.removeChild(link);
});

// --- ファイル名を生成するヘルパー関数 ---
function generateFileName(text) {
    // テキストの先頭30文字を使用（長すぎるファイル名を防ぐ）
    let name = text.substring(0, 30);

    // ファイル名に使えない文字を除去（安全な名前にする）
    name = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');

    // スペースをアンダースコアに置換
    name = name.replace(/\s+/g, '_');

    // 名前が空になった場合のフォールバック
    if (!name) {
        name = 'qrcode';
    }

    // プレフィックスを追加して識別しやすくする
    return 'QR_' + name;
}

// --- 初期状態の設定 ---
// ページ読み込み時はQRコードを非表示にしておく
hideQRCode();
