// 感情ごとのデータ構造（絵文字、ラベル、パステルカラーの背景色）を定義します
const emotionsData = {
    happy: { emoji: '😄', label: '嬉しい / Happy', color: '#ffebd2' },  // やわらかいオレンジ・ピーチ系
    calm:  { emoji: '😌', label: '穏やか / Calm', color: '#d4f0f0' },  // やわらかいミント・ブルー系
    sad:   { emoji: '😢', label: '悲しい / Sad', color: '#dbeafe' },  // やわらかいペールブルー系
    angry: { emoji: '😡', label: '怒り / Angry', color: '#ffe4e6' },  // やわらかいピンク・レッド系
    tired: { emoji: '😫', label: '疲れた / Tired', color: '#fae8ff' }   // やわらかいパープル系
};

// ==========================================
// 1. DOM要素の取得（HTMLから操作したい部品を集める）
// ==========================================
const emojiBtns = document.querySelectorAll('.emoji-btn');           // 感情ボタンすべて
const journalText = document.getElementById('journal-text');         // テキスト入力欄
const saveBtn = document.getElementById('save-btn');                 // 保存ボタン
const emotionFilter = document.getElementById('emotion-filter');     // 絞り込みセレクトボックス
const deleteAllBtn = document.getElementById('delete-all-btn');      // 全件削除ボタン

// カレンダーと詳細表示用のDOM要素
const calendarGrid = document.getElementById('calendar-grid');       // カレンダーのマス目が入る場所
const prevMonthBtn = document.getElementById('prev-month-btn');      // 前月ボタン
const nextMonthBtn = document.getElementById('next-month-btn');      // 次月ボタン
const currentMonthDisplay = document.getElementById('current-month-display'); // 年月表示
const selectedDateDetails = document.getElementById('selected-date-details'); // 詳細表示の全体ボックス
const dateJournalList = document.getElementById('date-journal-list');// 詳細表示のリスト部分
const selectedDateTitle = document.getElementById('selected-date-title');     // 詳細表示のタイトル
const closeDetailsBtn = document.getElementById('close-details-btn');// 詳細表示の閉じるボタン

// ==========================================
// 2. 状態管理（アプリの今の状態を覚えておく変数）
// ==========================================
let selectedEmotion = null;                                          // 新規入力時に選択された感情
const STORAGE_KEY = 'emotion_journal_data';                          // 保存時のキー

// ローカルストレージからデータを読み込み（データがなければ空の配列 `[]`）
let journalEntries = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// カレンダーで「現在表示している月」と「現在選択されている日付」
let currentViewDate = new Date(); // 初期値は今日
let currentlySelectedDate = null; // 例: "2026-03-29"（何も選ばれていない時はnull）

// ==========================================
// 3. アプリ起動時の初期化処理
// ==========================================
renderCalendar(); // カレンダーを描画する

// ==========================================
// 4. イベントリスナー（ユーザーの操作に対する処理）
// ==========================================

// 4-1. 感情ボタンのクリック
emojiBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        emojiBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedEmotion = btn.getAttribute('data-emotion');
    });
});

// 4-2. 「記録する / Save」ボタンのクリック
saveBtn.addEventListener('click', () => {
    const text = journalText.value.trim();

    // 入力チェック
    if (!selectedEmotion) {
        alert('感情を選んでください。(Please select an emotion.)');
        return;
    }
    if (!text) {
        alert('今の気持ちを書いてください。(Please write how you feel.)');
        return;
    }

    // 新しい記録のデータを作成
    const newEntry = {
        id: Date.now(), // 一意のID
        emotion: selectedEmotion,
        text: text,
        date: new Date().toISOString() // 保存時の日時
    };

    // 配列の先頭（最新）に追加して保存
    journalEntries.unshift(newEntry);
    saveData();
    
    // フォームをリセット
    journalText.value = '';
    selectedEmotion = null;
    emojiBtns.forEach(b => b.classList.remove('active'));

    // 保存後は現在の月に戻り、カレンダーを再描画
    currentViewDate = new Date();
    renderCalendar();
    
    // 詳細表示が開いていた場合は閉じて混乱を防ぐ
    selectedDateDetails.style.display = 'none';
    currentlySelectedDate = null;
});

// 4-3. カレンダーの月移動ボタン
prevMonthBtn.addEventListener('click', () => {
    // 現在の表示月から1ヶ月引く
    currentViewDate.setMonth(currentViewDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    // 現在の表示月に1ヶ月足す
    currentViewDate.setMonth(currentViewDate.getMonth() + 1);
    renderCalendar();
});

// 4-4. 絞り込み（フィルター）の変更
emotionFilter.addEventListener('change', () => {
    renderCalendar();
    
    // もし詳細ページが開かれていたら、その中身も今のフィルターに合わせて更新する
    if (currentlySelectedDate && selectedDateDetails.style.display === 'block') {
        const entries = getEntriesForDate(currentlySelectedDate);
        showDetailsForDate(currentlySelectedDate, entries);
    }
});

// 4-5. 詳細パネルを閉じるボタン
closeDetailsBtn.addEventListener('click', () => {
    selectedDateDetails.style.display = 'none';
    currentlySelectedDate = null;
});

// 4-6. 全件削除ボタン
deleteAllBtn.addEventListener('click', () => {
    if (journalEntries.length === 0) return;
    
    const confirmDelete = confirm('すべての記録を削除しますか？ / Are you sure you want to delete all records?');
    if (confirmDelete) {
        journalEntries = [];
        saveData();
        renderCalendar(); // カレンダーも空になる
        selectedDateDetails.style.display = 'none';
        currentlySelectedDate = null;
    }
});

// ==========================================
// 5. 共通関数（何度も呼び出される便利な処理）
// ==========================================

// データをローカルストレージに保存する関数
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journalEntries));
}

// XSS対策：特殊文字を無害化する関数
function escapeHTML(string) {
    if (!string) return '';
    return string
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\n/g, '<br>');
}

// 現在の絞り込み状態に応じたデータを取得する関数
function getFilteredEntries() {
    const currentFilter = emotionFilter.value;
    return currentFilter === 'all' 
        ? journalEntries 
        : journalEntries.filter(entry => entry.emotion === currentFilter);
}

// 特定の日付（YYYY-MM-DD）の記録だけを抽出する関数
function getEntriesForDate(dateStr) {
    const filteredEntries = getFilteredEntries();
    return filteredEntries.filter(entry => {
        const d = new Date(entry.date);
        // 保存されている日付を YYYY-MM-DD に揃えて比較
        const entryDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return entryDateStr === dateStr;
    });
}

// ==========================================
// 6. カレンダーとリストの描画処理
// ==========================================

// カレンダーを描画する関数
function renderCalendar() {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth(); // 0(1月) 〜 11(12月)
    
    // ヘッダーに「YYYY年 MM月」を表示
    currentMonthDisplay.textContent = `${year}年 ${month + 1}月 / ${year}-${String(month + 1).padStart(2, '0')}`;
    
    // カレンダーのマス目を一旦空にする
    calendarGrid.innerHTML = '';
    
    // 月初めの日と月末の日を取得
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const firstDayOfWeek = firstDay.getDay(); // 初日が何曜日か (0:日 〜 6:土)
    const daysInMonth = lastDay.getDate();    // その月が何日まであるか
    
    // カレンダーの最初の空白セル（1日が始まる前の曜日分）を埋める
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-cell', 'empty-cell');
        calendarGrid.appendChild(emptyCell);
    }
    
    // 1日〜月末までのセルを作成する
    for (let day = 1; day <= daysInMonth; day++) {
        // 対象の日付文字列（例：2026-03-05）を作成
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // この日付の記録を取得
        const entriesForDay = getEntriesForDate(dateStr);
        
        // セルのDOM要素を作成
        const cell = document.createElement('div');
        cell.classList.add('calendar-cell');
        
        // 日付の数字を追加
        const dateNum = document.createElement('span');
        dateNum.classList.add('cell-date');
        dateNum.textContent = day;
        cell.appendChild(dateNum);
        
        // 記録があった場合のみ、背景色と絵文字をつける
        if (entriesForDay.length > 0) {
            cell.classList.add('has-record');
            
            // 背景色は「一番新しい記録（配列の先頭）」の感情に合わせる
            const latestEmotion = entriesForDay[0].emotion;
            const emotionData = emotionsData[latestEmotion] || emotionsData.calm;
            cell.style.backgroundColor = emotionData.color;
            
            // 絵文字を表示するコンテナ
            const emojiContainer = document.createElement('div');
            emojiContainer.classList.add('cell-emojis');
            
            // 小さいマス目があふれないよう、最大4つまで絵文字を表示
            const maxDisplay = 4;
            for (let i = 0; i < Math.min(entriesForDay.length, maxDisplay); i++) {
                const em = entriesForDay[i].emotion;
                const emData = emotionsData[em] || emotionsData.calm;
                const emojiSpan = document.createElement('span');
                emojiSpan.textContent = emData.emoji;
                emojiContainer.appendChild(emojiSpan);
            }
            
            // もし5回以上記録があった場合は「+」などのしるしを追加
            if (entriesForDay.length > maxDisplay) {
                const plusSpan = document.createElement('span');
                plusSpan.textContent = '+';
                plusSpan.style.fontSize = '10px';
                emojiContainer.appendChild(plusSpan);
            }
            
            cell.appendChild(emojiContainer);
        }
        
        // セルをクリックしたときの処理（詳細を表示）
        cell.addEventListener('click', () => {
            currentlySelectedDate = dateStr;
            showDetailsForDate(dateStr, entriesForDay);
        });
        
        // 完成したセルをグリッドに追加
        calendarGrid.appendChild(cell);
    }
}

// 選択された日付の詳細（リスト形式）を下部に表示する関数
function showDetailsForDate(dateStr, entriesForDay) {
    // タイトルを選択された日付に書き換える
    selectedDateTitle.textContent = `${dateStr.replace(/-/g, '/')} の記録 / Records`;
    
    // リストの中身をクリアする
    dateJournalList.innerHTML = '';
    
    // 詳細パネルを表示状態にする
    selectedDateDetails.style.display = 'block';
    
    // 記録がない場合
    if (entriesForDay.length === 0) {
        dateJournalList.innerHTML = '<p class="empty-msg">記録がありません。(No records.)</p>';
        return;
    }
    
    // 記録がある場合は、今までと同じようにリスト風のアイテムを作成する
    entriesForDay.forEach(entry => {
        const emotionData = emotionsData[entry.emotion] || emotionsData.calm; 
        
        // 時間を「HH:MM」フォーマットで取得
        const dateObj = new Date(entry.date);
        const timeString = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

        const itemEl = document.createElement('div');
        itemEl.classList.add('journal-item');
        itemEl.style.backgroundColor = emotionData.color;

        const safeText = escapeHTML(entry.text);

        itemEl.innerHTML = `
            <div class="item-header">
                <span class="item-emoji" title="${emotionData.label}">${emotionData.emoji}</span>
                <span class="item-date">${dateStr.replace(/-/g, '/')} ${timeString}</span>
                <button class="delete-btn" data-id="${entry.id}" aria-label="Delete">🗑️</button>
            </div>
            <div class="item-text">${safeText}</div>
        `;

        // 個別削除ボタンのイベント
        const deleteBtn = itemEl.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            const confirmDel = confirm('この記録を削除しますか？ / Delete this record?');
            if (confirmDel) {
                // 配列から該当するものを削除して上書き
                journalEntries = journalEntries.filter(e => e.id !== entry.id);
                saveData();
                
                // カレンダーを再描画（マスの色や絵文字の数が変わるか空になるため）
                renderCalendar();
                
                // 同じ日付の詳細画面も再更新する
                const updatedEntries = getEntriesForDate(dateStr);
                showDetailsForDate(dateStr, updatedEntries);
            }
        });

        dateJournalList.appendChild(itemEl);
    });
}
