/* ==============================
   ハンバーガーメニュービルダー - スクリプト
   Hamburger Menu Builder - Script
   ============================== */

// ===== DOM要素の取得 =====
const lineWidthInput = document.getElementById('line-width');
const lineWidthValue = document.getElementById('line-width-value');
const lineColorInput = document.getElementById('line-color');
const animationTypeSelect = document.getElementById('animation-type');
const menuBgColorInput = document.getElementById('menu-bg-color');
const menuTextColorInput = document.getElementById('menu-text-color');
const menuFontFamilySelect = document.getElementById('menu-font-family');
const slideDirectionSelect = document.getElementById('slide-direction');

const hamburgerIcon = document.getElementById('hamburger-icon');
const menuPanel = document.getElementById('menu-panel');
const codeContent = document.getElementById('code-content');
const copyBtn = document.getElementById('copy-btn');
const copyAllBtn = document.getElementById('copy-all-btn');
const codeTabs = document.querySelectorAll('.code-tab');

// ===== 状態管理 =====
let isMenuOpen = false; // メニューが開いているかどうか
let currentTab = 'html'; // 現在表示中のタブ

// ===== 生成コードを保持するオブジェクト =====
let generatedCode = {
  html: '',
  css: '',
  js: ''
};

// ===== 初期化処理 =====
function init() {
  // 初期スタイルを適用
  updatePreview();
  // コードを生成
  generateCode();
  // コードを表示
  displayCode(currentTab);
}

// ===== プレビュー更新（設定が変わるたびに呼び出す） =====
function updatePreview() {
  // 線の太さを取得して表示を更新
  const lineWidth = lineWidthInput.value;
  lineWidthValue.textContent = lineWidth;

  // 線の色を取得
  const lineColor = lineColorInput.value;

  // アニメーションの種類を取得
  const animationType = animationTypeSelect.value;

  // メニューパネルの背景色・テキスト色を取得
  const menuBgColor = menuBgColorInput.value;
  const menuTextColor = menuTextColorInput.value;

  // フォントを取得
  const menuFontFamily = menuFontFamilySelect.value;

  // スライド方向を取得
  const slideDirection = slideDirectionSelect.value;

  // ===== ハンバーガーアイコンのスタイルを更新 =====
  const lines = hamburgerIcon.querySelectorAll('.hamburger-line');
  lines.forEach(line => {
    line.style.height = lineWidth + 'px';
    line.style.background = lineColor;
    line.style.borderRadius = Math.max(1, Math.floor(lineWidth / 2)) + 'px';
  });

  // 線のGap計算（線の太さ + 5px余白）
  const lineGap = parseInt(lineWidth) + 5;
  hamburgerIcon.style.setProperty('--line-gap', lineGap + 'px');
  hamburgerIcon.style.gap = (lineGap - parseInt(lineWidth)) + 'px';

  // アニメーションクラスをリセットして再設定
  hamburgerIcon.classList.remove('anim-cross', 'anim-rotate-cross', 'anim-minus');
  hamburgerIcon.classList.add('anim-' + animationType);

  // ===== メニューパネルのスタイルを更新 =====
  menuPanel.style.backgroundColor = menuBgColor;
  menuPanel.style.color = menuTextColor;

  // メニュー内のリンクテキスト色も変更
  const menuLinks = menuPanel.querySelectorAll('.menu-list li a');
  menuLinks.forEach(link => {
    link.style.color = menuTextColor;
  });

  // フォントをメニューパネルに適用
  menuPanel.style.fontFamily = menuFontFamily;

  // スライド方向クラスをリセットして再設定
  menuPanel.classList.remove('slide-right', 'slide-left', 'slide-top');
  menuPanel.classList.add('slide-' + slideDirection);

  // メニューが開いている場合、一度閉じてから再度開く（方向変更対応）
  if (isMenuOpen) {
    menuPanel.classList.remove('is-open');
    hamburgerIcon.classList.remove('is-open');
    // 少し待ってから再度開く
    setTimeout(() => {
      menuPanel.classList.add('is-open');
      hamburgerIcon.classList.add('is-open');
    }, 50);
  }

  // コードも再生成
  generateCode();
  displayCode(currentTab);
}

// ===== ハンバーガーアイコンのクリックで開閉 =====
hamburgerIcon.addEventListener('click', () => {
  isMenuOpen = !isMenuOpen;

  if (isMenuOpen) {
    hamburgerIcon.classList.add('is-open');
    menuPanel.classList.add('is-open');
  } else {
    hamburgerIcon.classList.remove('is-open');
    menuPanel.classList.remove('is-open');
  }
});

// ===== 各設定項目の変更イベントリスナー =====
lineWidthInput.addEventListener('input', updatePreview);
lineColorInput.addEventListener('input', updatePreview);
animationTypeSelect.addEventListener('change', updatePreview);
menuBgColorInput.addEventListener('input', updatePreview);
menuTextColorInput.addEventListener('input', updatePreview);
menuFontFamilySelect.addEventListener('change', updatePreview);
slideDirectionSelect.addEventListener('change', updatePreview);

// ===== コード生成 =====
function generateCode() {
  // 設定値を取得
  const lineWidth = lineWidthInput.value;
  const lineColor = lineColorInput.value;
  const animationType = animationTypeSelect.value;
  const menuBgColor = menuBgColorInput.value;
  const menuTextColor = menuTextColorInput.value;
  const menuFontFamily = menuFontFamilySelect.value;
  const slideDirection = slideDirectionSelect.value;

  // 線の間隔を計算
  const lineGap = parseInt(lineWidth) + 5;
  const borderRadius = Math.max(1, Math.floor(parseInt(lineWidth) / 2));

  // ===== HTML コード生成 =====
  generatedCode.html =
    `<!-- ハンバーガーメニュー / Hamburger Menu -->
<!-- このHTMLをbody内の適切な位置に貼り付けてください -->

<!-- ハンバーガーアイコン（ボタン） -->
<button class="hamburger-icon" id="hamburger-icon" aria-label="メニューを開閉する">
  <span class="hamburger-line line-top"></span>
  <span class="hamburger-line line-middle"></span>
  <span class="hamburger-line line-bottom"></span>
</button>

<!-- メニューパネル -->
<nav class="menu-panel" id="menu-panel">
  <ul class="menu-list">
    <li><a href="#">ホーム / Home</a></li>
    <li><a href="#">概要 / About</a></li>
    <li><a href="#">サービス / Services</a></li>
    <li><a href="#">お問い合わせ / Contact</a></li>
  </ul>
</nav>`;

  // ===== CSS コード生成 =====
  // アニメーション別のCSSを準備
  let animationCSS = '';

  if (animationType === 'cross') {
    // 王道のクロス
    animationCSS =
      `/* --- 王道のクロス アニメーション --- */
/* 上の線: 中央に移動して45度回転 */
.hamburger-icon.is-open .line-top {
  transform: translateY(${lineGap}px) rotate(45deg);
}
/* 中央の線: 非表示にする */
.hamburger-icon.is-open .line-middle {
  opacity: 0;
  transform: scaleX(0);
}
/* 下の線: 中央に移動して-45度回転 */
.hamburger-icon.is-open .line-bottom {
  transform: translateY(-${lineGap}px) rotate(-45deg);
}`;
  } else if (animationType === 'rotate-cross') {
    // 回転してクロス
    animationCSS =
      `/* --- 回転してクロス アニメーション --- */
/* アイコン全体を360度回転させてダイナミックに変化 */
.hamburger-icon.is-open {
  transform: rotate(360deg);
}
/* 上の線: 中央に移動して45度回転 */
.hamburger-icon.is-open .line-top {
  transform: translateY(${lineGap}px) rotate(45deg);
}
/* 中央の線: 非表示にする */
.hamburger-icon.is-open .line-middle {
  opacity: 0;
  transform: scaleX(0);
}
/* 下の線: 中央に移動して-45度回転 */
.hamburger-icon.is-open .line-bottom {
  transform: translateY(-${lineGap}px) rotate(-45deg);
}`;
  } else if (animationType === 'minus') {
    // マイナス
    animationCSS =
      `/* --- マイナス アニメーション --- */
/* 上の線: 中央に移動して非表示 */
.hamburger-icon.is-open .line-top {
  transform: translateY(${lineGap}px);
  opacity: 0;
}
/* 中央の線: 少し縮小してマイナス記号に */
.hamburger-icon.is-open .line-middle {
  transform: scaleX(0.7);
}
/* 下の線: 中央に移動して非表示 */
.hamburger-icon.is-open .line-bottom {
  transform: translateY(-${lineGap}px);
  opacity: 0;
}`;
  }

  // スライド方向別のCSS
  let slideCSS = '';

  if (slideDirection === 'right') {
    slideCSS =
      `/* --- 右からスライド --- */
.menu-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 260px;
  height: 100%;
  transform: translateX(100%);
}
/* メニューが開いた状態 */
.menu-panel.is-open {
  transform: translateX(0);
}`;
  } else if (slideDirection === 'left') {
    slideCSS =
      `/* --- 左からスライド --- */
.menu-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100%;
  transform: translateX(-100%);
}
/* メニューが開いた状態 */
.menu-panel.is-open {
  transform: translateX(0);
}`;
  } else if (slideDirection === 'top') {
    slideCSS =
      `/* --- 上からスライド --- */
.menu-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: translateY(-100%);
}
/* メニューが開いた状態 */
.menu-panel.is-open {
  transform: translateY(0);
}`;
  }

  generatedCode.css =
    `/* ===== ハンバーガーメニュー スタイル ===== */
/* このCSSをあなたのスタイルシートに追加してください */

/* ハンバーガーアイコンのボタン */
.hamburger-icon {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  gap: ${lineGap - parseInt(lineWidth)}px;
  transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

/* ハンバーガーの各線 */
.hamburger-line {
  display: block;
  width: 26px;
  height: ${lineWidth}px;
  background: ${lineColor};
  border-radius: ${borderRadius}px;
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  transform-origin: center center;
}

${animationCSS}

/* メニューパネルの共通スタイル */
${slideCSS}

/* メニューパネルの見た目 */
.menu-panel {
  background-color: ${menuBgColor};
  color: ${menuTextColor};
  font-family: ${menuFontFamily};
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* メニューリストのスタイル */
.menu-list {
  list-style: none;
  padding: 20px;
  margin: 0;
  width: 100%;
}

.menu-list li {
  margin-bottom: 8px;
}

.menu-list li a {
  color: ${menuTextColor};
  text-decoration: none;
  font-size: 1rem;
  display: block;
  padding: 12px 16px;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.menu-list li a:hover {
  background: rgba(255, 255, 255, 0.1);
}`;

  // ===== JavaScript コード生成 =====
  generatedCode.js =
    `// ===== ハンバーガーメニュー スクリプト =====
// このJavaScriptをあなたのスクリプトに追加してください

// ハンバーガーアイコンとメニューパネルを取得
const hamburgerIcon = document.getElementById('hamburger-icon');
const menuPanel = document.getElementById('menu-panel');

// メニューの開閉状態を管理する変数
let isMenuOpen = false;

// ハンバーガーアイコンがクリックされたときの処理
hamburgerIcon.addEventListener('click', function() {
  // 状態を切り替える
  isMenuOpen = !isMenuOpen;

  if (isMenuOpen) {
    // メニューを開く
    hamburgerIcon.classList.add('is-open');
    menuPanel.classList.add('is-open');
  } else {
    // メニューを閉じる
    hamburgerIcon.classList.remove('is-open');
    menuPanel.classList.remove('is-open');
  }
});

// メニュー内のリンクがクリックされたらメニューを閉じる
const menuLinks = menuPanel.querySelectorAll('.menu-list li a');
menuLinks.forEach(function(link) {
  link.addEventListener('click', function() {
    isMenuOpen = false;
    hamburgerIcon.classList.remove('is-open');
    menuPanel.classList.remove('is-open');
  });
});`;
}

// ===== コード表示 =====
function displayCode(tab) {
  currentTab = tab;
  codeContent.textContent = generatedCode[tab];
}

// ===== タブ切り替えイベント =====
codeTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // アクティブクラスをリセット
    codeTabs.forEach(t => t.classList.remove('active'));
    // クリックされたタブをアクティブに
    tab.classList.add('active');
    // 対応するコードを表示
    displayCode(tab.dataset.tab);
  });
});

// ===== 個別コピーボタン =====
copyBtn.addEventListener('click', () => {
  // 現在のタブのコードをクリップボードにコピー
  navigator.clipboard.writeText(generatedCode[currentTab]).then(() => {
    // コピー成功時のフィードバック
    copyBtn.textContent = '✅ コピー完了! / Copied!';
    copyBtn.classList.add('copied');
    // 2秒後に元に戻す
    setTimeout(() => {
      copyBtn.textContent = '📋 コピー / Copy';
      copyBtn.classList.remove('copied');
    }, 2000);
  });
});

// ===== 全コードコピーボタン =====
copyAllBtn.addEventListener('click', () => {
  // 全コードを結合
  const allCode =
    `/* ===========================
   HTML コード
   =========================== */
${generatedCode.html}

/* ===========================
   CSS コード
   =========================== */
${generatedCode.css}

/* ===========================
   JavaScript コード
   =========================== */
${generatedCode.js}`;

  // クリップボードにコピー
  navigator.clipboard.writeText(allCode).then(() => {
    // コピー成功時のフィードバック
    copyAllBtn.textContent = '✅ すべてコピー完了! / All Copied!';
    copyAllBtn.classList.add('copied');
    // 2秒後に元に戻す
    setTimeout(() => {
      copyAllBtn.textContent = '📦 すべてコピー / Copy All';
      copyAllBtn.classList.remove('copied');
    }, 2000);
  });
});

// ===== ページ読み込み時に初期化 =====
window.addEventListener('DOMContentLoaded', init);
