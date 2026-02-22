// ==========================================
// My Comic Shelf - アプリケーションロジック
// ==========================================

// DOM要素の取得
// フォーム要素やリスト要素を取得します
const comicForm = document.getElementById('comic-form');
const comicGrid = document.getElementById('comic-grid');
const emptyState = document.getElementById('empty-state');

// ローカルストレージのキー
const AC_STORAGE_KEY = 'my_comic_shelf_data';

// アプリケーションの状態（漫画データの配列）
let comics = [];

// ==========================================
// 初期化処理
// ==========================================

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', () => {
    loadData();     // データの読み込み
    renderComics(); // 画面描画
});

// ==========================================
// データ操作・永続化 (LocalStorage)
// ==========================================

/**
 * LocalStorageからデータを読み込む
 */
function loadData() {
    const json = localStorage.getItem(AC_STORAGE_KEY);
    if (json) {
        comics = JSON.parse(json);
    } else {
        comics = [];
    }
}

/**
 * 現在のデータをLocalStorageに保存する
 */
function saveData() {
    const json = JSON.stringify(comics);
    localStorage.setItem(AC_STORAGE_KEY, json);
}

// ==========================================
// イベントハンドラ (Event Delegation徹底)
// ==========================================

// 1. フォーム送信（追加）の処理
comicForm.addEventListener('submit', (event) => {
    event.preventDefault(); // リロード防止

    // 入力値を取得
    const titleInput = document.getElementById('title');
    const imageInput = document.getElementById('image-url');
    const volumeInput = document.getElementById('volume');
    const statusInput = document.getElementById('status');

    // 新しい漫画オブジェクトを作成
    const newComic = {
        id: Date.now(),
        title: titleInput.value,
        image: imageInput.value,
        volume: volumeInput.value,
        status: statusInput.value
    };

    // 配列の先頭に追加
    comics.unshift(newComic);

    // 保存と再描画
    saveData();
    renderComics();

    // フォームのリセット
    comicForm.reset();
});

// 2. 削除ボタンの処理 (Event Delegation)
// 親要素(#comic-grid)でイベントをキャッチ
comicGrid.addEventListener('click', (event) => {
    // クリックされた要素が .delete-btn 自身、またはその内部要素かを確認
    const deleteBtn = event.target.closest('.delete-btn');

    // 削除ボタン以外なら何もしない
    if (!deleteBtn) return;

    // デフォルト動作（ある場合）やバブリングを停止
    event.preventDefault();
    event.stopPropagation();

    // IDを取得
    const id = Number(deleteBtn.dataset.id);

    // タイトルを取得（確認メッセージ用）
    // ボタンの親要素であるカードから情報を探す
    const card = deleteBtn.closest('.comic-card');
    const titleElement = card ? card.querySelector('.comic-info h3') : null;
    const title = titleElement ? titleElement.textContent : 'この漫画';

    // 削除確認と実行
    if (confirm(`『${title}』を削除してよろしいですか？`)) {
        // データ削除
        comics = comics.filter(comic => comic.id !== id);

        // 保存と再描画
        saveData();
        renderComics();
    }
});

// ==========================================
// 画面描画 (DOM操作)
// ==========================================

/**
 * 漫画リストを画面に描画する
 */
function renderComics() {
    comicGrid.innerHTML = '';

    if (comics.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    comics.forEach(comic => {
        const card = createCardElement(comic);
        comicGrid.appendChild(card);
    });
}

/**
 * 漫画データからカードのDOM要素を作成する
 * 画像エラー対策を含む
 */
function createCardElement(comic) {
    const div = document.createElement('div');
    div.className = 'comic-card';

    const statusText = getStatusText(comic.status);

    // ダミー画像のURL
    const PLACEHOLDER_URL = 'https://placehold.jp/150x200.png?text=No%20Image';

    // 画像URLの設定（空ならダミー）
    const imageUrl = comic.image ? escapeHtml(comic.image) : PLACEHOLDER_URL;

    // HTMLの構築
    // onerror属性を直接埋め込み、リンク切れ時に即座に置換
    div.innerHTML = `
        <div class="comic-image-container">
            <span class="delete-btn" data-id="${comic.id}" title="削除">
                &times;
            </span>
            <img 
                src="${imageUrl}" 
                alt="${escapeHtml(comic.title)}" 
                class="comic-image" 
                onerror="this.onerror=null; this.src='${PLACEHOLDER_URL}';"
            >
            <span class="status-badge ${comic.status}">${statusText}</span>
        </div>
        <div class="comic-info">
            <h3>${escapeHtml(comic.title)}</h3>
            <div class="volume-info">
                <span>最新:</span>
                <span class="volume-number">${escapeHtml(comic.volume)}</span>
                <span>巻</span>
            </div>
        </div>
    `;

    return div;
}

/**
 * ステータスコードから表示用のラベルを取得
 */
function getStatusText(status) {
    switch (status) {
        case 'next': return '次を買う';
        case 'purchased': return '購入済み';
        case 'completed': return '完結';
        case 'unread': return '積読中';
        default: return status;
    }
}

/**
 * HTML特殊文字をエスケープする
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
