// ===================================
// Smart Shopping List / スマート買い物リスト
// メインスクリプト
// ===================================

// --- 定数定義 ---
// localStorageのキー名
const STORAGE_KEY = 'smartShoppingList';

// --- DOM要素の取得 ---
const itemInput = document.getElementById('itemInput');
const addBtn = document.getElementById('addBtn');
const voiceBtn = document.getElementById('voiceBtn');
const voiceStatus = document.getElementById('voiceStatus');
const shoppingList = document.getElementById('shoppingList');
const emptyMessage = document.getElementById('emptyMessage');
const listInfo = document.getElementById('listInfo');
const itemCount = document.getElementById('itemCount');
const clearAllBtn = document.getElementById('clearAllBtn');

// --- アプリの状態（データ配列） ---
// 各アイテムは { id: ユニークID, text: アイテム名, checked: 購入済みフラグ } の形式
let items = [];

// --- 音声認識の変数 ---
let recognition = null;      // SpeechRecognitionインスタンス
let isListening = false;      // 音声認識中かどうか

// ===================================
// localStorage 操作
// ===================================

/**
 * localStorageからリストデータを読み込む関数
 * ページ読み込み時に呼び出し、前回のデータを復元する
 */
function loadItems() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            items = JSON.parse(savedData);
        }
    } catch (error) {
        // データが壊れている場合は空のリストで開始
        console.warn('データの読み込みに失敗しました:', error);
        items = [];
    }
}

/**
 * 現在のリストデータをlocalStorageに保存する関数
 * データに変更があるたびに呼び出す
 */
function saveItems() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
        console.warn('データの保存に失敗しました:', error);
    }
}

// ===================================
// リスト描画
// ===================================

/**
 * リスト全体を再描画する関数
 * アイテムの追加・削除・状態変更時に呼び出す
 */
function renderList() {
    // リストのHTMLをクリア
    shoppingList.innerHTML = '';

    // アイテム数に応じて表示を切り替え
    if (items.length === 0) {
        // リストが空の場合: 空メッセージを表示
        emptyMessage.classList.remove('hidden');
        listInfo.classList.add('hidden');
    } else {
        // アイテムがある場合: 空メッセージを非表示
        emptyMessage.classList.add('hidden');
        listInfo.classList.remove('hidden');

        // アイテム数を更新
        const checkedCount = items.filter(item => item.checked).length;
        itemCount.textContent = `${checkedCount} / ${items.length} 完了 / done`;

        // 各アイテムのHTML要素を作成
        items.forEach(item => {
            const li = createItemElement(item);
            shoppingList.appendChild(li);
        });
    }
}

/**
 * 1つのアイテム要素（li）を作成する関数
 * @param {Object} item - アイテムデータ { id, text, checked }
 * @returns {HTMLElement} リストアイテムのli要素
 */
function createItemElement(item) {
    // li要素を作成
    const li = document.createElement('li');
    li.className = 'shopping-item' + (item.checked ? ' checked' : '');
    li.dataset.id = item.id;

    // チェックボックス（丸いアイコン）
    const checkbox = document.createElement('div');
    checkbox.className = 'item-checkbox' + (item.checked ? ' checked' : '');
    checkbox.setAttribute('role', 'checkbox');
    checkbox.setAttribute('aria-checked', item.checked);
    checkbox.setAttribute('tabindex', '0');
    // クリックでチェック状態を切り替え
    checkbox.addEventListener('click', () => toggleItem(item.id));
    // キーボード操作対応（Enter/Space）
    checkbox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleItem(item.id);
        }
    });

    // アイテムテキスト
    const text = document.createElement('span');
    text.className = 'item-text';
    text.textContent = item.text;

    // 削除ボタン
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'item-delete';
    deleteBtn.textContent = '×';
    deleteBtn.title = '削除 / Delete';
    deleteBtn.setAttribute('aria-label', `${item.text} を削除`);
    // クリックで個別削除
    deleteBtn.addEventListener('click', () => deleteItem(item.id, li));

    // li要素に子要素を追加
    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(deleteBtn);

    return li;
}

// ===================================
// アイテム操作
// ===================================

/**
 * 新しいアイテムをリストに追加する関数
 * 入力欄のテキストを取得し、リストに追加後、保存・再描画する
 */
function addItem() {
    // 入力値を取得（前後の空白を除去）
    const text = itemInput.value.trim();

    // 空文字の場合は何もしない
    if (!text) {
        // 入力欄にフォーカスして入力を促す
        itemInput.focus();
        return;
    }

    // 新しいアイテムオブジェクトを作成
    const newItem = {
        id: Date.now(),       // ユニークIDとしてタイムスタンプを使用
        text: text,           // アイテム名
        checked: false        // 初期状態は未購入
    };

    // リストの先頭に追加（新しいアイテムが上に来る）
    items.unshift(newItem);

    // 入力欄をクリア
    itemInput.value = '';

    // データを保存してリストを再描画
    saveItems();
    renderList();

    // 入力欄にフォーカスを戻す（続けて入力しやすいように）
    itemInput.focus();
}

/**
 * アイテムの購入済み状態を切り替える関数
 * @param {number} id - 対象アイテムのID
 */
function toggleItem(id) {
    // 対象のアイテムを検索
    const item = items.find(item => item.id === id);
    if (item) {
        // チェック状態を反転
        item.checked = !item.checked;
        // データを保存してリストを再描画
        saveItems();
        renderList();
    }
}

/**
 * アイテムを個別に削除する関数
 * 削除アニメーション後にデータを削除・再描画する
 * @param {number} id - 対象アイテムのID
 * @param {HTMLElement} li - 対象のli要素（アニメーション用）
 */
function deleteItem(id, li) {
    // 削除アニメーションのクラスを追加
    li.classList.add('removing');

    // アニメーション完了後にデータを削除
    li.addEventListener('animationend', () => {
        // 配列からアイテムを除外
        items = items.filter(item => item.id !== id);
        // データを保存してリストを再描画
        saveItems();
        renderList();
    });
}

/**
 * リストを全消去する関数
 * confirmダイアログで確認後、全アイテムを削除する
 */
function clearAll() {
    // リストが空の場合は何もしない
    if (items.length === 0) return;

    // 確認ダイアログを表示（誤操作防止）
    const confirmed = confirm(
        'リストを全て消去しますか？\nDo you want to clear the entire list?'
    );

    if (confirmed) {
        // 全アイテムを削除
        items = [];
        // データを保存してリストを再描画
        saveItems();
        renderList();
    }
}

// ===================================
// 音声入力機能 (Web Speech API)
// ===================================

/**
 * 音声認識を初期化する関数
 * ブラウザがWeb Speech APIに対応している場合のみ実行
 */
function initSpeechRecognition() {
    // Web Speech APIの対応チェック
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        // 非対応ブラウザの場合、音声ボタンを無効化
        voiceBtn.disabled = true;
        voiceBtn.title = 'お使いのブラウザは音声入力に対応していません / Voice input not supported';
        voiceBtn.style.opacity = '0.5';
        voiceBtn.style.cursor = 'not-allowed';
        return;
    }

    // SpeechRecognitionインスタンスを作成
    recognition = new SpeechRecognition();

    // 認識設定
    recognition.lang = 'ja-JP';          // 認識言語を日本語に設定
    recognition.interimResults = false;   // 確定結果のみ取得
    recognition.maxAlternatives = 1;      // 候補は1つのみ
    recognition.continuous = false;       // 1回の発話で終了

    // --- 認識結果を取得したときのイベント ---
    recognition.onresult = (event) => {
        // 認識されたテキストを取得
        const transcript = event.results[0][0].transcript;
        // 入力欄に自動入力（既存のテキストに追加）
        if (itemInput.value) {
            itemInput.value += ' ' + transcript;
        } else {
            itemInput.value = transcript;
        }
        // 入力欄にフォーカス（ユーザーが確認してから追加ボタンを押すフロー）
        itemInput.focus();
    };

    // --- 認識が終了したときのイベント ---
    recognition.onend = () => {
        stopListening();
    };

    // --- エラーが発生したときのイベント ---
    recognition.onerror = (event) => {
        console.warn('音声認識エラー:', event.error);
        stopListening();

        // ユーザーに分かりやすいエラーメッセージ
        if (event.error === 'not-allowed') {
            alert('マイクへのアクセスが許可されていません。\nブラウザの設定からマイクの使用を許可してください。\n\nMicrophone access denied.\nPlease allow microphone access in browser settings.');
        }
    };
}

/**
 * 音声認識を開始する関数
 */
function startListening() {
    if (!recognition) return;

    isListening = true;

    // UIを認識中の状態に変更
    voiceBtn.classList.add('listening');
    voiceStatus.classList.remove('hidden');

    // 音声認識を開始
    try {
        recognition.start();
    } catch (error) {
        // すでに認識中の場合のエラーをキャッチ
        console.warn('音声認識の開始に失敗:', error);
        stopListening();
    }
}

/**
 * 音声認識を停止する関数
 */
function stopListening() {
    isListening = false;

    // UIを通常状態に戻す
    voiceBtn.classList.remove('listening');
    voiceStatus.classList.add('hidden');
}

/**
 * 音声入力ボタンのクリック処理
 * トグル動作: 押すたびに開始/停止を切り替え
 */
function toggleVoice() {
    if (isListening) {
        // 認識中の場合は停止
        recognition.stop();
        stopListening();
    } else {
        // 停止中の場合は開始
        startListening();
    }
}

// ===================================
// イベントリスナーの設定
// ===================================

// 追加ボタンのクリックイベント
addBtn.addEventListener('click', addItem);

// 入力欄でEnterキーを押した時にアイテムを追加
itemInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        addItem();
    }
});

// 音声入力ボタンのクリックイベント
voiceBtn.addEventListener('click', toggleVoice);

// 全消去ボタンのクリックイベント
clearAllBtn.addEventListener('click', clearAll);

// ===================================
// アプリの初期化処理
// ===================================

/**
 * アプリを初期化する関数
 * ページ読み込み時に実行される
 */
function init() {
    // localStorageから保存済みデータを読み込み
    loadItems();
    // リストを描画
    renderList();
    // 音声認識を初期化
    initSpeechRecognition();
    // 入力欄にフォーカス
    itemInput.focus();
}

// ページ読み込み完了時に初期化を実行
document.addEventListener('DOMContentLoaded', init);
