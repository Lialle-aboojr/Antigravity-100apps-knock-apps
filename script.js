// ■ 設定 / Configuration
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzTtZHdQ6094Nmu90-VgyIUWuNES5_uA8fyIY-qJlXa3Hw6yVgCWtxKlBitavZn0N6T/exec";

// ■ DOM要素の取得 / Get DOM elements
const columns = document.querySelectorAll('.column');
const loadingOverlay = document.getElementById('loading-overlay');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalId = document.getElementById('modal-id');
const modalGithub = document.getElementById('modal-github');
const modalDemo = document.getElementById('modal-demo');
const closeButton = document.querySelector('.close-button');

// ■ 初期化 / Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
});

// ■ データ取得 / Fetch Data
async function fetchTasks() {
    showLoading(true);
    try {
        const response = await fetch(GAS_API_URL);
        const tasks = await response.json();

        // エラーチェック
        if (tasks.error) {
            alert('エラーが発生しました / Error: ' + tasks.error);
            return;
        }

        renderTasks(tasks);
    } catch (error) {
        console.error('Fetch error:', error);
        alert('データの取得に失敗しました。URLを確認してください。\nFailed to fetch data. Please check the URL.');
    } finally {
        showLoading(false);
    }
}

// ■ タスク描画 / Render Tasks
function renderTasks(tasks) {
    // リストをクリア
    document.getElementById('todo-list').innerHTML = '';
    document.getElementById('doing-list').innerHTML = '';
    document.getElementById('done-list').innerHTML = '';

    tasks.forEach(task => {
        const card = createCard(task);
        const status = task.status || "To Do"; // デフォルトは To Do

        // カラムへの振り分け
        let listId = 'todo-list';
        if (status === 'Doing') listId = 'doing-list';
        if (status === 'Done') listId = 'done-list';

        document.getElementById(listId).appendChild(card);
    });
}

// ■ カード作成 / Create Card Element
function createCard(task) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.draggable = true;
    card.dataset.id = task.id;
    card.dataset.appName = task.appName;
    card.dataset.githubUrl = task.githubUrl;
    card.dataset.demoUrl = task.demoUrl;

    card.innerHTML = `
        <div class="card-id">#${task.id}</div>
        <div class="card-title">${task.appName}</div>
    `;

    // ドラッグイベントの付与
    addDragEvents(card);

    // クリックでモーダル表示
    card.addEventListener('click', () => openModal(task));

    return card;
}

// ■ Drag and Drop Logic
function addDragEvents(card) {
    card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.id);
        e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        columns.forEach(col => col.classList.remove('drag-over'));
    });
}

// カラムへのドロップ受け入れ設定
columns.forEach(column => {
    column.addEventListener('dragover', (e) => {
        e.preventDefault(); // ドロップを許可
        column.classList.add('drag-over');
    });

    column.addEventListener('dragleave', () => {
        column.classList.remove('drag-over');
    });

    column.addEventListener('drop', async (e) => {
        e.preventDefault();
        column.classList.remove('drag-over');

        const cardId = e.dataTransfer.getData('text/plain');
        const card = document.querySelector(`.card[data-id="${cardId}"]`);
        const newStatus = column.dataset.status;

        // 視覚的な移動（即座に反映）
        const list = column.querySelector('.card-list');
        list.appendChild(card);

        // バックエンド更新
        await updateStatus(cardId, newStatus);
    });
});

// ■ ステータス更新 / Update Status via API
async function updateStatus(id, newStatus) {
    showLoading(true); // 保存中表示

    try {
        // GASのdoPostにデータを送る
        // no-corsモードだとレスポンスが読めないので、corsモード推奨だが
        // GAS側でContentService.createTextOutputしていれば通常は読める
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ id: id, status: newStatus })
        });

        const result = await response.json();
        if (!result.success) {
            alert('更新に失敗しました: ' + result.message);
        }

    } catch (error) {
        console.error('Update error:', error);
        alert('保存に失敗しました / Failed to save');
    } finally {
        showLoading(false);
    }
}

// ■ モーダル操作 / Modal Operations
function openModal(task) {
    modalTitle.textContent = task.appName;
    modalId.textContent = `ID: ${task.id}`;
    modalGithub.href = task.githubUrl || '#';
    modalDemo.href = task.demoUrl || '#';

    modal.classList.remove('hidden');
}

closeButton.addEventListener('click', () => {
    modal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

// ■ ユーティリティ / Utility
function showLoading(isLoading) {
    if (isLoading) {
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}
