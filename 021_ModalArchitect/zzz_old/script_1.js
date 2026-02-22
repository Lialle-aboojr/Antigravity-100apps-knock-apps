/**
 * Modal Architect - Main Script
 * 
 * このスクリプトは以下の機能を担当します：
 * 1. ユーザー入力の取得と管理
 * 2. 画像ファイルの読み込み (FileReader)
 * 3. モーダルのプレビュー表示 (DOM操作)
 * 4. HTML/CSS/JSコードの自動生成
 */

// ============================================
// 1. 要素の取得 (DOM Elements)
// ============================================

// 入力エリア / Inputs
const inputTitle = document.getElementById('input-title');
const inputContent = document.getElementById('input-content');
const inputImageUrl = document.getElementById('input-image-url');
const inputImageFile = document.getElementById('input-image-file');
const fileNameDisplay = document.getElementById('file-name-display');
const inputColor = document.getElementById('input-color');
const colorValueDisplay = document.getElementById('color-value');
const inputAnimation = document.getElementById('input-animation');

// アクションボタン / Buttons
const btnTry = document.getElementById('btn-try');
const btnGenerate = document.getElementById('btn-generate');
const btnCopy = document.getElementById('btn-copy');
const codeOutput = document.getElementById('code-output');

// モーダル要素 (プレビュー用) / Modal Elements
const modalOverlay = document.getElementById('modal-overlay');
const modalWindow = document.getElementById('modal-window');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const modalImage = document.getElementById('modal-image');
const modalHeader = document.querySelector('.modal-header');
const modalActionBtn = document.querySelector('.modal-action-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');

// トースト / Toast
const toast = document.getElementById('toast');

// ============================================
// 2. 状態管理 (State Management)
// ============================================

// 現在の設定を保存するオブジェクト
let currentSettings = {
    title: inputTitle.value,
    content: inputContent.value,
    imageUrl: '', // URL入力またはファイル読み込み結果を保持
    color: inputColor.value,
    animation: inputAnimation.value
};

// ============================================
// 3. イベントリスナーの設定 (Event Listeners)
// ============================================

// テキスト入力の監視
inputTitle.addEventListener('input', (e) => currentSettings.title = e.target.value);
inputContent.addEventListener('input', (e) => currentSettings.content = e.target.value);
inputImageUrl.addEventListener('input', (e) => currentSettings.imageUrl = e.target.value);

// ファイル入力の監視 (FileReaderを使用)
inputImageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // ファイル名を表示
        fileNameDisplay.textContent = `選択中: ${file.name}`;
        
        // ファイルを読み込んでDataURLに変換
        const reader = new FileReader();
        reader.onload = function(event) {
            // 読み込み完了後、設定オブジェクトのimageUrlを更新
            currentSettings.imageUrl = event.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        fileNameDisplay.textContent = '選択されていません / No file selected';
    }
});

// カラーピッカーの監視
inputColor.addEventListener('input', (e) => {
    currentSettings.color = e.target.value;
    colorValueDisplay.textContent = e.target.value; // カラーコード表示を更新
    
    // プレビュー表示中ならリアルタイム反映
    modalHeader.style.backgroundColor = currentSettings.color;
    modalActionBtn.style.backgroundColor = currentSettings.color;
});

// アニメーション選択の監視
inputAnimation.addEventListener('change', (e) => {
    currentSettings.animation = e.target.value;
});

// ============================================
// 4. プレビュー機能 (Preview Function)
// ============================================

// 「プレビュー実行」ボタンクリック時
btnTry.addEventListener('click', () => {
    showModal();
});

function showModal() {
    // 1. テキストを反映
    modalTitle.textContent = currentSettings.title;
    // 改行コードを<br>に変換して表示
    modalText.innerHTML = currentSettings.content.replace(/\n/g, '<br>');

    // 2. 画像を反映
    if (currentSettings.imageUrl) {
        modalImage.src = currentSettings.imageUrl;
        modalImage.classList.remove('hidden');
    } else {
        modalImage.classList.add('hidden');
    }

    // 3. 色を反映
    modalHeader.style.backgroundColor = currentSettings.color;
    modalActionBtn.style.backgroundColor = currentSettings.color;

    // 4. アニメーションクラスをリセットして適用
    // 一旦すべてのアニメーションクラスを削除
    modalOverlay.classList.remove('fade-in', 'slide-down', 'zoom-in');
    // 選択されたアニメーションクラスを追加
    modalOverlay.classList.add(currentSettings.animation);

    // 5. 表示 (activeクラス付与)
    modalOverlay.classList.add('active');
}

// モーダルを閉じる関数
function closeModal() {
    modalOverlay.classList.remove('active');
}

// 閉じるイベントの設定
modalCloseBtn.addEventListener('click', closeModal);
document.querySelector('.modal-action-btn').addEventListener('click', closeModal);

// 背景クリックで閉じる (モーダル本体のクリックは無視)
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// ============================================
// 5. コード生成機能 (Code Generator)
// ============================================

btnGenerate.addEventListener('click', () => {
    const generatedCode = generateCode();
    codeOutput.value = generatedCode;
});

function generateCode() {
    const { title, content, imageUrl, color, animation } = currentSettings;
    
    // 画像タグの生成 (画像がある場合のみ)
    const imgTag = imageUrl ? `<img src="${imageUrl}" alt="Modal Image" style="max-width:100%; height:auto; border-radius:4px; margin-bottom:1rem; display:block;">` : '';
    
    // 生成するHTML/CSS/JSテンプレート
    return `<!-- 
  Modal Architect Generated Code
  Theme Color: ${color}
  Animation: ${animation}
-->

<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  /* === CSS Styles === */
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; visibility: hidden;
    transition: opacity 0.3s, visibility 0.3s;
    z-index: 1000;
  }
  .modal-overlay.active {
    opacity: 1; visibility: visible;
  }
  .modal-window {
    background: #fff; width: 90%; max-width: 500px;
    border-radius: 8px; overflow: hidden;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    transition: transform 0.3s ease-out;
    font-family: sans-serif;
  }
  
  /* Animation: ${animation} */
  ${getAnimationCSS(animation)}

  .modal-header {
    background: ${color}; color: #fff;
    padding: 1rem 1.5rem;
    display: flex; justify-content: space-between; align-items: center;
  }
  .modal-header h3 { margin: 0; font-size: 1.25rem; }
  .modal-close {
    background: none; border: none; color: #fff;
    font-size: 1.5rem; cursor: pointer;
  }
  .modal-body { padding: 1.5rem; line-height: 1.6; color: #333; }
  .modal-footer {
    padding: 1rem 1.5rem; background: #f9f9f9;
    text-align: right; border-top: 1px solid #eee;
  }
  .modal-btn {
    background: ${color}; color: #fff; border: none;
    padding: 0.5rem 1.2rem; border-radius: 4px;
    cursor: pointer; font-weight: bold;
  }
  .modal-btn:hover { opacity: 0.9; }
</style>
</head>
<body>

<!-- === Button to Open Modal === -->
<button id="open-modal-btn" style="padding:10px 20px;">Open Modal</button>

<!-- === Modal Structure === -->
<div id="my-modal" class="modal-overlay ${animation}">
  <div class="modal-window">
    <div class="modal-header">
      <h3>${escapeHtml(title)}</h3>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      ${imgTag}
      <p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>
    </div>
    <div class="modal-footer">
      <button class="modal-btn">OK</button>
    </div>
  </div>
</div>

<script>
  /* === JavaScript Logic === */
  const modal = document.getElementById('my-modal');
  const openBtn = document.getElementById('open-modal-btn');
  const closeBtns = document.querySelectorAll('.modal-close, .modal-btn');

  // Open Modal
  openBtn.addEventListener('click', () => {
    modal.classList.add('active');
  });

  // Close Modal (Button)
  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  });

  // Close Modal (Background Click)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
<\/script>

</body>
</html>`;
}

// アニメーションCSSを返すヘルパー関数
function getAnimationCSS(animName) {
    if (animName === 'fade-in') {
        return `.modal-window { transform: scale(1); }`;
    } else if (animName === 'slide-down') {
        return `
  .modal-window { transform: translateY(-50px); }
  .modal-overlay.active .modal-window { transform: translateY(0); }`;
    } else if (animName === 'zoom-in') {
        return `
  .modal-window { transform: scale(0.5); }
  .modal-overlay.active .modal-window { transform: scale(1); }`;
    }
    return '';
}

// HTMLエスケープ処理 (XSS対策)
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(match) {
        const escape = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escape[match];
    });
}

// ============================================
// 6. コピー機能 (Copy to Clipboard)
// ============================================

btnCopy.addEventListener('click', () => {
    const code = codeOutput.value;
    if (!code) return;

    // クリップボードに書き込み
    navigator.clipboard.writeText(code).then(() => {
        showToast();
    }).catch(err => {
        console.error('Copy failed', err);
        alert('コピーに失敗しました / Copy failed');
    });
});

function showToast() {
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}
