// ==========================================
// 1. 各種DOM要素の取得
// ==========================================
const editor = document.getElementById('editor');
const previewContent = document.getElementById('previewContent');
const themeSelect = document.getElementById('themeSelect');
const downloadBtn = document.getElementById('downloadBtn');
const previewContainer = document.getElementById('previewContainer');

// ==========================================
// 2. ユーティリティ・パース関数群
// ==========================================

/**
 * XSS対策（入力を無害化するエスケープ処理）
 * ユーザーが入力した悪意のあるタグ（<script>など）が解釈されないようにします。
 * 
 * @param {string} str - 入力文字列
 * @returns {string} - エスケープ後の文字列
 */
function escapeHTML(str) {
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  };
  return str.replace(/[&<>'"]/g, match => escapeMap[match]);
}

/**
 * テキストの改行を適用する関数
 * 
 * @param {string} text - 入力文字列
 * @returns {string} - HTMLタグに変換された文字列
 */
function parseText(text) {
  // 1. まずXSS対策として入力をすべてエスケープする
  let safeText = escapeHTML(text);

  // 2. 改行コード (\n) を <br> タグに変換して、表示にも改行を反映
  safeText = safeText.replace(/\n/g, '<br>');

  return safeText;
}

/**
 * テキスト入力内容をプレビューエリアに反映する関数
 */
function updatePreview() {
  const text = editor.value;
  // パースした安全なHTMLを入れ込みます
  previewContent.innerHTML = parseText(text);
}


// ==========================================
// 3. イベントリスナーの設定
// ==========================================

// ① テキストエリアの入力監視 (リアルタイム更新)
// ユーザーが文字を打つたびに毎回パースし直して updatePreview() が発火します。
editor.addEventListener('input', updatePreview);

// ② テーマ変更の監視 (セレクトボックス)
themeSelect.addEventListener('change', (e) => {
  const selectedTheme = e.target.value; // plain, grid, paper のいずれか
  
  // 既存のテーマクラスをすべて削除
  previewContainer.classList.remove('plain', 'grid', 'paper');
  // 選択された新しいテーマクラスを付与
  previewContainer.classList.add(selectedTheme);
});

// ③ 画像ダウンロードボタン
downloadBtn.addEventListener('click', async () => {
  try {
    // ダウンロード処理中は多重クリック防止のためボタンを無効化
    downloadBtn.disabled = true;
    const originalText = downloadBtn.innerHTML;
    // ボタンの見た目を「処理中」に変更
    downloadBtn.innerHTML = '画像生成中... / Processing...';

    // html-to-image ライブラリにプレビュー領域を渡し、PNG画像 (Data URI) を生成
    // pixelRatioプロパティで高解像度化
    const dataUrl = await htmlToImage.toPng(previewContainer, {
      pixelRatio: 2,
      backgroundColor: null // CSS背景色を活かすため透過
    });

    // aタグを一時的に生成し、ダウンロードを発火させる
    const link = document.createElement('a');
    link.download = 'tategaki.png'; // 必ず拡張子を指定
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    
    // 不要になったaタグを削除
    document.body.removeChild(link);

  } catch (error) {
    console.error("画像生成エラー:", error);
    alert('画像の生成に失敗しました。時間をおいて再度お試しください。/ Failed to generate image.');
  } finally {
    // 成功・失敗にかかわらず、ボタンの状態を元に戻す
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = `
      画像として保存 / Save as Image
      <svg class="icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
    `;
  }
});

// ==========================================
// 4. 初期化処理
// ==========================================
// 最初から placeholder の文章等が入っている場合を考慮し、
// 一度プレビューを更新しておく。
updatePreview();
