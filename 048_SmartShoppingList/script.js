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
const voiceLang = document.getElementById('voiceLang'); // 音声認識言語セレクター

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
 * テキスト名が一致するアイテムを検索して削除する関数（音声コマンド用）
 * @param {string} targetText - 削除対象のアイテム名
 */
function deleteItemByText(targetText) {
    // リストの中からテキストが完全一致するアイテムを検索
    const targetItem = items.find(item => item.text === targetText);

    if (targetItem) {
        // 該当アイテムのDOM要素を取得（アニメーション用）
        const li = document.querySelector(`.shopping-item[data-id="${targetItem.id}"]`);

        if (li) {
            // 削除アニメーション付きで削除
            li.classList.add('removing');
            li.addEventListener('animationend', () => {
                items = items.filter(item => item.id !== targetItem.id);
                saveItems();
                renderList();
            });
        } else {
            // DOM要素が見つからない場合はデータだけ削除
            items = items.filter(item => item.id !== targetItem.id);
            saveItems();
            renderList();
        }
    } else {
        // 該当アイテムが見つからない場合はアラート表示
        alert('「' + targetText + '」は見つかりませんでした / Item not found');
    }
}

/**
 * 音声認識結果を解析し、削除コマンドか通常追加かを判定する関数
 * - 日本語: 末尾が「を削除」「を消して」→ 削除モード
 * - 英語: 先頭が "Delete " "Remove " → 削除モード
 * - それ以外 → 通常の追加モード
 * @param {string} transcript - 音声認識されたテキスト
 */
function handleVoiceCommand(transcript) {
    // 現在選択されている認識言語を取得
    const currentLang = voiceLang.value;

    // --- 日本語モードの削除コマンド判定 ---
    if (currentLang === 'ja-JP') {
        if (transcript.endsWith('を削除')) {
            // 「〇〇を削除」→ 対象の単語を抽出して削除
            const target = transcript.replace(/を削除$/, '').trim();
            deleteItemByText(target);
            return;
        }
        if (transcript.endsWith('を消して')) {
            // 「〇〇を消して」→ 対象の単語を抽出して削除
            const target = transcript.replace(/を消して$/, '').trim();
            deleteItemByText(target);
            return;
        }
    }

    // --- 英語モードの削除コマンド判定（大文字・小文字を区別しない） ---
    if (currentLang === 'en-US') {
        const lowerTranscript = transcript.toLowerCase();
        if (lowerTranscript.startsWith('delete ')) {
            // "Delete 〇〇" → 対象の単語を抽出して削除
            const target = transcript.substring(7).trim();
            deleteItemByText(target);
            return;
        }
        if (lowerTranscript.startsWith('remove ')) {
            // "Remove 〇〇" → 対象の単語を抽出して削除
            const target = transcript.substring(7).trim();
            deleteItemByText(target);
            return;
        }
    }

    // --- 通常モード: リストへの新規追加 ---
    itemInput.value = transcript;
    addItem();
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
        // 音声コマンドを解析（削除コマンドか通常追加かを判定）
        handleVoiceCommand(transcript);
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
        // プルダウンで選択中の言語を音声認識にセット
        recognition.lang = voiceLang.value;
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
// ※ IME変換中（日本語入力の確定操作）の場合は追加しない
itemInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
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
