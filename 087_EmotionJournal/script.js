// 感情ごとのデータ構造（絵文字、ラベル、パステルカラーの背景色）を定義します
const emotionsData = {
    happy: { emoji: '😄', label: '嬉しい / Happy', color: '#ffebd2' },  // やわらかいオレンジ・ピーチ系
    calm:  { emoji: '😌', label: '穏やか / Calm', color: '#d4f0f0' },  // やわらかいミント・ブルー系
    sad:   { emoji: '😢', label: '悲しい / Sad', color: '#dbeafe' },  // やわらかいペールブルー系
    angry: { emoji: '😡', label: '怒り / Angry', color: '#ffe4e6' },  // やわらかいピンク・レッド系
    tired: { emoji: '😫', label: '疲れた / Tired', color: '#fae8ff' }   // やわらかいパープル系
};

// HTMLの中から操作したい要素（DOM要素）を取得します
const emojiBtns = document.querySelectorAll('.emoji-btn');           // 感情ボタンすべて
const journalText = document.getElementById('journal-text');         // テキスト入力欄
const saveBtn = document.getElementById('save-btn');                 // 保存ボタン
const journalList = document.getElementById('journal-list');         // 日記のリスト表示部分
const emotionFilter = document.getElementById('emotion-filter');     // 絞り込みセレクトボックス
const deleteAllBtn = document.getElementById('delete-all-btn');      // 全件削除ボタン

// 状態管理用の変数
let selectedEmotion = null;                                          // 現在選択されている感情
const STORAGE_KEY = 'emotion_journal_data';                          // 保存時のキー（目印の名前）

// アプリ起動時：ブラウザのローカルストレージからデータを読み込みます（データがなければ空の配列 `[]` になります）
let journalEntries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// 初期化：保存されている記録を画面に表示します
renderList();

// ==========================================
// イベントリスナー（ユーザーの操作に対する処理）
// ==========================================

// 1. 感情ボタンがクリックされたときの処理
emojiBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 全てのボタンから 'active'（選択状態）の印を外します
        emojiBtns.forEach(b => b.classList.remove('active'));
        
        // クリックされたボタンに 'active' の印を付け、CSSで目立たせます
        btn.classList.add('active');
        
        // どの感情が選ばれたかを変数に保存します（htmlのdata-emotion属性の値を読み取ります）
        selectedEmotion = btn.getAttribute('data-emotion');
    });
});

// 2. 「記録する / Save」ボタンがクリックされたときの処理
saveBtn.addEventListener('click', () => {
    // 入力エリアの前後の余白スペースを削り取ったテキストを取得します
    const text = journalText.value.trim();

    // 入力チェック（感情が選ばれているか、テキストが書かれているか確認）
    if (!selectedEmotion) {
        alert('感情を選んでください。(Please select an emotion.)');
        return; // これ以上処理を進めない
    }
    if (!text) {
        alert('今の気持ちを書いてください。(Please write how you feel.)');
        return;
    }

    // 新しい記録のまとまり（オブジェクト）を作成します
    const newEntry = {
        id: Date.now(), // 一意のIDとして、現在時刻のミリ秒（連番のようなもの）を使用します
        emotion: selectedEmotion,
        text: text,
        date: new Date().toISOString() // 保存時の日時
    };

    // 配列の「一番前（最新）」に新しい記録を追加します
    journalEntries.unshift(newEntry);
    
    // データをローカルストレージに保存します
    saveData();
    
    // 入力フォームをリセット（空に）します
    journalText.value = '';
    selectedEmotion = null;
    emojiBtns.forEach(b => b.classList.remove('active'));

    // 最新のデータでリストを再描画します
    renderList();
});

// 3. 絞り込み（フィルター）が変更されたときの処理
emotionFilter.addEventListener('change', () => {
    // リストを描画し直す（関数の中でフィルターの値を読み取って動作します）
    renderList();
});

// 4. 全件削除ボタンがクリックされたときの処理
deleteAllBtn.addEventListener('click', () => {
    if (journalEntries.length === 0) return; // すでに空なら何もしない
    
    // 確認のポップアップを出します
    const confirmDelete = confirm('すべての記録を削除しますか？ / Are you sure you want to delete all records?');
    if (confirmDelete) {
        journalEntries = []; // 配列を空にする
        saveData();          // 空のデータを保存
        renderList();        // 表示を更新
    }
});

// ==========================================
// 共通関数（何度も呼び出される便利な処理）
// ==========================================

// 最新のデータをブラウザ（ローカルストレージ）に保存する関数
function saveData() {
    // JSON文字列に変換して保存します
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journalEntries));
}

// 【重要: XSS（クロスサイトスクリプティング）対策】
// 悪意のあるコード（<script>など）が入力された場合、ただの文字列として無害化するための関数です。
function escapeHTML(string) {
    if (!string) return '';
    return string
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\n/g, '<br>'); // 同時に、テキストエリアの改行をHTMLタグの <br> に変換して表示が崩れないようにします。
}

// 記録のリストを画面に描画する関数
function renderList() {
    // 現在のフィルター（絞り込み）の選択値を取得します
    const currentFilter = emotionFilter.value;

    // リストのHTMLを一旦すべて空にします（入れ替えのため）
    journalList.innerHTML = '';

    // フィルタリング処理： 'all' なら全部、それ以外なら感情が一致するものだけを抽出
    const filteredEntries = currentFilter === 'all' 
        ? journalEntries 
        : journalEntries.filter(entry => entry.emotion === currentFilter);

    // 空（表示するデータがない）の場合のメッセージ
    if (filteredEntries.length === 0) {
        journalList.innerHTML = '<p class="empty-msg">まだ記録がありません。(No records yet.)</p>';
        return;
    }

    // 抽出されたデータ1つずつに対して、HTMLを作成して画面に追加します
    filteredEntries.forEach(entry => {
        // 保存されている感情文字列から、色や絵文字のデータを引き出します（見つからなければcalmを代用）
        const emotionData = emotionsData[entry.emotion] || emotionsData.calm; 
        
        // 日付を「YYYY/MM/DD HH:MM」の分かりやすいフォーマットに変換します
        const dateObj = new Date(entry.date);
        const dateString = `${dateObj.getFullYear()}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

        // 1つの項目を包む <div> 要素を作成します
        const itemEl = document.createElement('div');
        itemEl.classList.add('journal-item');
        
        // 感情に応じたパステルカラーの背景色を設定します
        itemEl.style.backgroundColor = emotionData.color;

        // 【セキュリティ確保】 先ほど作成したエスケープ機能を使ってテキストを無害化します
        const safeText = escapeHTML(entry.text);

        // 要素の中のHTMLを組み立てます
        itemEl.innerHTML = `
            <div class="item-header">
                <span class="item-emoji" title="${emotionData.label}">${emotionData.emoji}</span>
                <span class="item-date">${dateString}</span>
                <button class="delete-btn" data-id="${entry.id}" aria-label="Delete">🗑️</button>
            </div>
            <div class="item-text">${safeText}</div>
        `;

        // 作成したアイテムごとに、ごみ箱（削除）ボタンのイベントを追加します
        const deleteBtn = itemEl.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            const confirmDel = confirm('この記録を削除しますか？ / Delete this record?');
            if (confirmDel) {
                // 配列の中から「クリックしたアイテムのIDと一致しないもの」だけを残して上書きする（結果として削除される）
                journalEntries = journalEntries.filter(e => e.id !== entry.id);
                saveData();     // 削除した状態を保存
                renderList();   // 再描画
            }
        });

        // 組み立てたアイテムをリストの中へ実際に追加します
        journalList.appendChild(itemEl);
    });
}
