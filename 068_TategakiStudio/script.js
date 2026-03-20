// ==========================================
// 1. 各種DOM要素の取得
// ==========================================
const editor = document.getElementById('editor');
const previewContent = document.getElementById('previewContent');
const themeSelect = document.getElementById('themeSelect');
const rubyToggle = document.getElementById('rubyToggle');
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
  // 置換用の辞書
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  };
  // 正規表現で対象の文字列を探し、置換します
  return str.replace(/[&<>'"]/g, match => escapeMap[match]);
}

/**
 * テキストから「ルビ」を生成し、改行を適用する関数
 * "漢字(かんじ)" または "漢字（かんじ）" というフォーマットを
 * "<ruby>漢字<rt>かんじ</rt></ruby>" に変換します。
 * 
 * @param {string} text - 入力文字列
 * @returns {string} - HTMLタグに変換された文字列
 */
function parseText(text) {
  // 1. まずXSS対策として入力をすべてエスケープする
  let safeText = escapeHTML(text);

  // 2. ルビの正規表現パターン
  //   ([^\s()（）]+) -> スペースや半角・全角カッコ以外の文字の連続（漢字などの対象）
  //   (?:\(|（)       -> 半角または全角の開きカッコ (キャプチャしない)
  //   ([^)）]+)       -> 閉じカッコ以外の文字の連続（ルビの読み部分）
  //   (?:\)|）)       -> 半角または全角の閉じカッコ (キャプチャしない)
  const rubyRegex = /([^\s()（）]+)(?:\(|（)([^)）]+)(?:\)|）)/g;

  // 正規表現でマッチした箇所を ruby タグに置換します
  safeText = safeText.replace(rubyRegex, (match, baseString, rubyText) => {
    return `<ruby>${baseString}<rt>${rubyText}</rt></ruby>`;
  });

  // 3. 改行コード (\n) を <br> タグに変換して、表示にも改行を反映
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
// ユーザーが文字を打つたびに毎回 updatePreview() が発火します。
editor.addEventListener('input', updatePreview);

// ② テーマ変更の監視 (セレクトボックス)
themeSelect.addEventListener('change', (e) => {
  const selectedTheme = e.target.value; // plain, manuscript, paper のいずれか
  
  // 既存のテーマクラスをすべて削除
  previewContainer.classList.remove('plain', 'manuscript', 'paper');
  // 選択された新しいテーマクラスを付与
  previewContainer.classList.add(selectedTheme);
});

// ③ ルビ表示/非表示の切り替えボタン
rubyToggle.addEventListener('change', (e) => {
  if (e.target.checked) {
    // チェックが入っていればルビを表示
    previewContent.classList.remove('hide-ruby');
    previewContent.classList.add('show-ruby');
  } else {
    // チェックが外れていればルビを非表示
    previewContent.classList.remove('show-ruby');
    previewContent.classList.add('hide-ruby');
  }
});

// ④ 画像ダウンロードボタン
downloadBtn.addEventListener('click', async () => {
  try {
    // ダウンロード処理中は多重クリック防止のためボタンを無効化
    downloadBtn.disabled = true;
    const originalText = downloadBtn.innerHTML;
    // ボタンの見た目を「処理中」に変更
    downloadBtn.innerHTML = '画像生成中... / Processing...';

    // html2canvas ライブラリにプレビュー領域を渡し、画像(Canvas)を描画
    // scaleを上げて高画質化（2倍）
    const canvas = await html2canvas(previewContainer, {
      scale: 2,           // 高解像度
      useCORS: true,      // 外部画像等の混在を許可
      backgroundColor: null // CSSの背景色・背景画像をそのまま活かすため透過
    });

    // 生成された Canvas を Base64 画像 (PNG形式) に変換
    const imageBase64 = canvas.toDataURL("image/png");
    
    // aタグを一時的に生成し、ダウンロードを発火させる
    const link = document.createElement('a');
    link.href = imageBase64;
    link.download = 'tategaki_output.png';
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
    // 初期状態のHTML（アイコンSVG含む）に戻す
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
