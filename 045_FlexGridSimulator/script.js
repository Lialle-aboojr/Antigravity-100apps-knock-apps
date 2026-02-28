/* =============================================
   Flex & Grid Layout Simulator - スクリプト
   ============================================= */

// ---- 現在のモード（'flex' または 'grid'） ----
var currentMode = 'flex';

// ---- アイテム数の初期値 ----
var itemCount = 5;

// ---- DOM要素の取得 ----
var elTabFlex = document.getElementById('tab-flex');
var elTabGrid = document.getElementById('tab-grid');
var elPanelFlex = document.getElementById('panel-flex');
var elPanelGrid = document.getElementById('panel-grid');
var elPreviewContainer = document.getElementById('preview-container');
var elCodeOutput = document.getElementById('code-output');
var elBtnCopy = document.getElementById('btn-copy');
var elBtnAddItem = document.getElementById('btn-add-item');
var elBtnRemoveItem = document.getElementById('btn-remove-item');
var elItemCount = document.getElementById('item-count');
var elToast = document.getElementById('toast');

// ---- Flexbox操作パネルの要素 ----
var elFlexDirection = document.getElementById('flex-direction');
var elFlexWrap = document.getElementById('flex-wrap');
var elFlexJustify = document.getElementById('flex-justify');
var elFlexAlign = document.getElementById('flex-align');
var elFlexAlignContent = document.getElementById('flex-align-content');
var elFlexGap = document.getElementById('flex-gap');
var elFlexGapValue = document.getElementById('flex-gap-value');

// ---- CSS Grid操作パネルの要素 ----
var elGridColumns = document.getElementById('grid-columns');
var elGridRows = document.getElementById('grid-rows');
var elGridJustifyItems = document.getElementById('grid-justify-items');
var elGridAlignItems = document.getElementById('grid-align-items');
var elGridJustifyContent = document.getElementById('grid-justify-content');
var elGridAlignContent = document.getElementById('grid-align-content');
var elGridGap = document.getElementById('grid-gap');
var elGridGapValue = document.getElementById('grid-gap-value');

// =============================================
// プレビューアイテムを生成する
// =============================================
function renderItems() {
    // 既存のアイテムをすべて削除
    elPreviewContainer.innerHTML = '';

    // 指定された数だけアイテムを生成
    for (var i = 1; i <= itemCount; i++) {
        var item = document.createElement('div');
        item.className = 'preview-item';
        item.textContent = i;
        elPreviewContainer.appendChild(item);
    }

    // アイテム数の表示を更新
    elItemCount.textContent = itemCount;
}

// =============================================
// モード切替処理
// =============================================
function switchMode(mode) {
    currentMode = mode;

    // タブのアクティブ状態を切り替え
    if (mode === 'flex') {
        elTabFlex.classList.add('active');
        elTabGrid.classList.remove('active');
        elPanelFlex.classList.remove('hidden');
        elPanelGrid.classList.add('hidden');
    } else {
        elTabGrid.classList.add('active');
        elTabFlex.classList.remove('active');
        elPanelGrid.classList.remove('hidden');
        elPanelFlex.classList.add('hidden');
    }

    // プレビューとコードを更新
    updatePreview();
    updateCode();
}

// =============================================
// プレビューコンテナのスタイルを更新する
// =============================================
function updatePreview() {
    // まずスタイルをリセット
    elPreviewContainer.style.display = '';
    elPreviewContainer.style.flexDirection = '';
    elPreviewContainer.style.flexWrap = '';
    elPreviewContainer.style.justifyContent = '';
    elPreviewContainer.style.alignItems = '';
    elPreviewContainer.style.alignContent = '';
    elPreviewContainer.style.gap = '';
    elPreviewContainer.style.gridTemplateColumns = '';
    elPreviewContainer.style.gridTemplateRows = '';
    elPreviewContainer.style.justifyItems = '';

    if (currentMode === 'flex') {
        // Flexboxモードのスタイル適用
        elPreviewContainer.style.display = 'flex';
        elPreviewContainer.style.flexDirection = elFlexDirection.value;
        elPreviewContainer.style.flexWrap = elFlexWrap.value;
        elPreviewContainer.style.justifyContent = elFlexJustify.value;
        elPreviewContainer.style.alignItems = elFlexAlign.value;
        elPreviewContainer.style.alignContent = elFlexAlignContent.value;
        elPreviewContainer.style.gap = elFlexGap.value + 'px';
    } else {
        // CSS Gridモードのスタイル適用
        elPreviewContainer.style.display = 'grid';
        elPreviewContainer.style.gridTemplateColumns = elGridColumns.value;
        elPreviewContainer.style.gridTemplateRows = elGridRows.value;
        elPreviewContainer.style.justifyItems = elGridJustifyItems.value;
        elPreviewContainer.style.alignItems = elGridAlignItems.value;
        elPreviewContainer.style.justifyContent = elGridJustifyContent.value;
        elPreviewContainer.style.alignContent = elGridAlignContent.value;
        elPreviewContainer.style.gap = elGridGap.value + 'px';
    }
}

// =============================================
// CSSコードをシンタックスハイライト付きで生成する
// =============================================
function updateCode() {
    var lines = [];

    if (currentMode === 'flex') {
        // Flexboxモードのコード生成
        lines.push(formatComment('/* Flexbox コンテナ */'));
        lines.push(formatSelector('.container'));
        lines.push(formatBrace('{'));
        lines.push(formatProperty('display', 'flex'));
        lines.push(formatProperty('flex-direction', elFlexDirection.value));
        lines.push(formatProperty('flex-wrap', elFlexWrap.value));
        lines.push(formatProperty('justify-content', elFlexJustify.value));
        lines.push(formatProperty('align-items', elFlexAlign.value));

        // align-contentはnormal以外のときだけ出力
        if (elFlexAlignContent.value !== 'normal') {
            lines.push(formatProperty('align-content', elFlexAlignContent.value));
        }

        lines.push(formatProperty('gap', elFlexGap.value + 'px'));
        lines.push(formatBrace('}'));
    } else {
        // CSS Gridモードのコード生成
        lines.push(formatComment('/* CSS Grid コンテナ */'));
        lines.push(formatSelector('.container'));
        lines.push(formatBrace('{'));
        lines.push(formatProperty('display', 'grid'));
        lines.push(formatProperty('grid-template-columns', elGridColumns.value));

        // grid-template-rowsはauto以外のときだけ出力
        if (elGridRows.value !== 'auto') {
            lines.push(formatProperty('grid-template-rows', elGridRows.value));
        }

        lines.push(formatProperty('justify-items', elGridJustifyItems.value));
        lines.push(formatProperty('align-items', elGridAlignItems.value));
        lines.push(formatProperty('justify-content', elGridJustifyContent.value));
        lines.push(formatProperty('align-content', elGridAlignContent.value));
        lines.push(formatProperty('gap', elGridGap.value + 'px'));
        lines.push(formatBrace('}'));
    }

    // HTMLとして挿入（シンタックスハイライト用のspanタグを含む）
    elCodeOutput.innerHTML = lines.join('\n');
}

// =============================================
// コード表示用のフォーマットヘルパー関数
// =============================================

// CSS プロパティ行（ハイライト付き）
function formatProperty(prop, value) {
    return '  <span class="code-prop">' + escapeHtml(prop) + '</span>: <span class="code-val">' + escapeHtml(value) + '</span>;';
}

// セレクター行
function formatSelector(selector) {
    return '<span class="code-selector">' + escapeHtml(selector) + '</span> ';
}

// 中括弧
function formatBrace(brace) {
    return '<span class="code-brace">' + escapeHtml(brace) + '</span>';
}

// コメント行
function formatComment(comment) {
    return '<span class="code-comment">' + escapeHtml(comment) + '</span>';
}

// HTMLエスケープ（XSS対策）
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =============================================
// クリップボードにコピーする（プレーンテキスト版）
// =============================================
function getPlainCode() {
    var lines = [];

    if (currentMode === 'flex') {
        lines.push('/* Flexbox コンテナ */');
        lines.push('.container {');
        lines.push('  display: flex;');
        lines.push('  flex-direction: ' + elFlexDirection.value + ';');
        lines.push('  flex-wrap: ' + elFlexWrap.value + ';');
        lines.push('  justify-content: ' + elFlexJustify.value + ';');
        lines.push('  align-items: ' + elFlexAlign.value + ';');
        if (elFlexAlignContent.value !== 'normal') {
            lines.push('  align-content: ' + elFlexAlignContent.value + ';');
        }
        lines.push('  gap: ' + elFlexGap.value + 'px;');
        lines.push('}');
    } else {
        lines.push('/* CSS Grid コンテナ */');
        lines.push('.container {');
        lines.push('  display: grid;');
        lines.push('  grid-template-columns: ' + elGridColumns.value + ';');
        if (elGridRows.value !== 'auto') {
            lines.push('  grid-template-rows: ' + elGridRows.value + ';');
        }
        lines.push('  justify-items: ' + elGridJustifyItems.value + ';');
        lines.push('  align-items: ' + elGridAlignItems.value + ';');
        lines.push('  justify-content: ' + elGridJustifyContent.value + ';');
        lines.push('  align-content: ' + elGridAlignContent.value + ';');
        lines.push('  gap: ' + elGridGap.value + 'px;');
        lines.push('}');
    }

    return lines.join('\n');
}

// =============================================
// トースト通知を表示する
// =============================================
function showToast(message) {
    elToast.textContent = message;
    elToast.classList.add('show');
    setTimeout(function () {
        elToast.classList.remove('show');
    }, 2000);
}

// =============================================
// イベントリスナーの登録
// =============================================

// --- モード切替タブ ---
elTabFlex.addEventListener('click', function () {
    switchMode('flex');
});
elTabGrid.addEventListener('click', function () {
    switchMode('grid');
});

// --- Flexbox操作パネルのイベント ---
elFlexDirection.addEventListener('change', function () {
    updatePreview();
    updateCode();
});
elFlexWrap.addEventListener('change', function () {
    updatePreview();
    updateCode();
});
elFlexJustify.addEventListener('change', function () {
    updatePreview();
    updateCode();
});
elFlexAlign.addEventListener('change', function () {
    updatePreview();
    updateCode();
});
elFlexAlignContent.addEventListener('change', function () {
    updatePreview();
    updateCode();
});
elFlexGap.addEventListener('input', function () {
    elFlexGapValue.textContent = this.value + 'px';
    updatePreview();
    updateCode();
});

// --- CSS Grid操作パネルのイベント ---
elGridColumns.addEventListener('change', function () {
    updatePreview();
    updateCode();
});
elGridRows.addEventListener('change', function () {
    updatePreview();
    updateCode();
});
elGridJustifyItems.addEventListener('change', function () {
    updatePreview();
    updateCode();
});
elGridAlignItems.addEventListener('change', function () {
    updatePreview();
    updateCode();
});
elGridJustifyContent.addEventListener('change', function () {
    updatePreview();
    updateCode();
});
elGridAlignContent.addEventListener('change', function () {
    updatePreview();
    updateCode();
});
elGridGap.addEventListener('input', function () {
    elGridGapValue.textContent = this.value + 'px';
    updatePreview();
    updateCode();
});

// --- アイテム追加 / 削除 ---
elBtnAddItem.addEventListener('click', function () {
    if (itemCount < 12) {
        itemCount++;
        renderItems();
        updatePreview();
    } else {
        showToast('⚠️ 最大12個までです / Max 12 items');
    }
});

elBtnRemoveItem.addEventListener('click', function () {
    if (itemCount > 1) {
        itemCount--;
        renderItems();
        updatePreview();
    } else {
        showToast('⚠️ 最低1個必要です / Min 1 item');
    }
});

// --- コピーボタン ---
elBtnCopy.addEventListener('click', function () {
    var code = getPlainCode();

    // Clipboard APIを使用してコピー
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () {
            showToast('✅ コピーしました / Copied!');
            elBtnCopy.classList.add('copied');
            elBtnCopy.textContent = '✅ コピー済 / Copied!';
            setTimeout(function () {
                elBtnCopy.classList.remove('copied');
                elBtnCopy.textContent = '📋 コピー / Copy';
            }, 2000);
        });
    } else {
        // フォールバック: textareaを使ったコピー
        var textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('✅ コピーしました / Copied!');
            elBtnCopy.classList.add('copied');
            elBtnCopy.textContent = '✅ コピー済 / Copied!';
            setTimeout(function () {
                elBtnCopy.classList.remove('copied');
                elBtnCopy.textContent = '📋 コピー / Copy';
            }, 2000);
        } catch (err) {
            showToast('⚠️ コピーに失敗しました / Copy failed');
        }
        document.body.removeChild(textarea);
    }
});

// =============================================
// 初期化処理
// =============================================
function init() {
    renderItems();
    updatePreview();
    updateCode();
}

// 起動
init();
