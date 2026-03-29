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
const journalDateInput = document.getElementById('journal-date');    // 【追加】日付選択入力欄
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
let currentlySelectedDate = null; // 例: "2026-03-29"

// ==========================================
// 3. アプリ起動時の初期化処理
// ==========================================

// 【追加】画面を開いたとき、日付入力欄の「初期値」に今日の年月日を自動セットする関数
function setTodayAsDefault() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    // input type="date" は "YYYY-MM-DD" で受け取る仕様のため、その形に成形して入れる
    journalDateInput.value = `${yyyy}-${mm}-${dd}`;
}

setTodayAsDefault(); // 初期値として今日をセット
renderCalendar();    // カレンダーを描画する

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
    const dateValue = journalDateInput.value; // カレンダー入力欄の値を取得

    // 入力チェック
    if (!selectedEmotion) {
        alert('感情を選んでください。(Please select an emotion.)');
        return;
    }
    if (!dateValue) {
        alert('日付を選択してください。(Please select a date.)');
        return;
    }
    if (!text) {
        alert('今の気持ちを書いてください。(Please write how you feel.)');
        return;
    }

    // 【追加】選択された日付情報を安全な日時データにする処理
    // dateValue（YYYY-MM-DD）と現在の「時刻（時:分:秒）」をくっつけて保存する
    const now = new Date();
    const parts = dateValue.split('-'); // 1:年, 2:月, 3:日 に分解
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // getMonth用の仕様で-1する
    const day = parseInt(parts[2], 10);
    
    // 選んだ日付と現在時刻を持つ「完全な日時オブジェクト」を作り抜く
    const localDateObj = new Date(year, month, day, now.getHours(), now.getMinutes(), now.getSeconds());

    // 新しい記録のデータを作成
    const newEntry = {
        id: Date.now(), // 一意のID（識別用）
        emotion: selectedEmotion,
        text: text,
        date: localDateObj.toISOString() // 指定した日付の日時形式として保存 (ここを変更)
    };

    // 配列の先頭に追加して保存
    journalEntries.unshift(newEntry);
    saveData();
    
    // フォームをリセット
    journalText.value = '';
    selectedEmotion = null;
    emojiBtns.forEach(b => b.classList.remove('active'));
    setTodayAsDefault(); // 保存後はまた「今日の日付」に直しておく

    // 【変更】保存後は、ただの現在月ではなく『記録として保存した月』へカレンダーを移動させる
    currentViewDate = new Date(localDateObj);
    renderCalendar();
    
    // 詳細表示が開いていた場合は閉じて混乱を防ぐ
    selectedDateDetails.style.display = 'none';
    currentlySelectedDate = null;
});

// 4-3. カレンダーの月移動ボタン
prevMonthBtn.addEventListener('click', () => {
    currentViewDate.setMonth(currentViewDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentViewDate.setMonth(currentViewDate.getMonth() + 1);
    renderCalendar();
});

// 4-4. 絞り込み（フィルター）の変更
emotionFilter.addEventListener('change', () => {
    renderCalendar();
    
    // 詳細ページの中身も今のフィルターに合わせて更新する
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
        renderCalendar();
        selectedDateDetails.style.display = 'none';
        currentlySelectedDate = null;
    }
});

// ==========================================
// 5. 共通関数（何度も呼び出される便利な処理）
// ==========================================

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journalEntries));
}

// XSS対策：特殊文字を無害化する
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

function getFilteredEntries() {
    const currentFilter = emotionFilter.value;
    return currentFilter === 'all' 
        ? journalEntries 
        : journalEntries.filter(entry => entry.emotion === currentFilter);
}

function getEntriesForDate(dateStr) {
    const filteredEntries = getFilteredEntries();
    return filteredEntries.filter(entry => {
        const d = new Date(entry.date);
        const entryDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return entryDateStr === dateStr;
    });
}

// ==========================================
// 6. カレンダーとリストの描画処理
// ==========================================

function renderCalendar() {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth(); // 0(1月) 〜 11(12月)
    
    currentMonthDisplay.textContent = `${year}年 ${month + 1}月 / ${year}-${String(month + 1).padStart(2, '0')}`;
    calendarGrid.innerHTML = '';
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();    
    
    // 空白セルを埋める
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-cell', 'empty-cell');
        calendarGrid.appendChild(emptyCell);
    }
    
    // 日付のセルを作成する
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entriesForDay = getEntriesForDate(dateStr);
        
        const cell = document.createElement('div');
        cell.classList.add('calendar-cell');
        
        const dateNum = document.createElement('span');
        dateNum.classList.add('cell-date');
        dateNum.textContent = day;
        cell.appendChild(dateNum);
        
        if (entriesForDay.length > 0) {
            cell.classList.add('has-record');
            
            const latestEmotion = entriesForDay[0].emotion;
            const emotionData = emotionsData[latestEmotion] || emotionsData.calm;
            cell.style.backgroundColor = emotionData.color;
            
            const emojiContainer = document.createElement('div');
            emojiContainer.classList.add('cell-emojis');
            
            const maxDisplay = 4;
            for (let i = 0; i < Math.min(entriesForDay.length, maxDisplay); i++) {
                const em = entriesForDay[i].emotion;
                const emData = emotionsData[em] || emotionsData.calm;
                const emojiSpan = document.createElement('span');
                emojiSpan.textContent = emData.emoji;
                emojiContainer.appendChild(emojiSpan);
            }
            
            if (entriesForDay.length > maxDisplay) {
                const plusSpan = document.createElement('span');
                plusSpan.textContent = '+';
                plusSpan.style.fontSize = '10px';
                emojiContainer.appendChild(plusSpan);
            }
            
            cell.appendChild(emojiContainer);
        }
        
        cell.addEventListener('click', () => {
            currentlySelectedDate = dateStr;
            showDetailsForDate(dateStr, entriesForDay);
        });
        
        calendarGrid.appendChild(cell);
    }
}

function showDetailsForDate(dateStr, entriesForDay) {
    selectedDateTitle.textContent = `${dateStr.replace(/-/g, '/')} の記録 / Records`;
    dateJournalList.innerHTML = '';
    
    selectedDateDetails.style.display = 'block';
    
    if (entriesForDay.length === 0) {
        dateJournalList.innerHTML = '<p class="empty-msg">記録がありません。(No records.)</p>';
        return;
    }
    
    entriesForDay.forEach(entry => {
        const emotionData = emotionsData[entry.emotion] || emotionsData.calm; 
        
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

        const deleteBtn = itemEl.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            const confirmDel = confirm('この記録を削除しますか？ / Delete this record?');
            if (confirmDel) {
                journalEntries = journalEntries.filter(e => e.id !== entry.id);
                saveData();
                
                renderCalendar();
                const updatedEntries = getEntriesForDate(dateStr);
                showDetailsForDate(dateStr, updatedEntries);
            }
        });

        dateJournalList.appendChild(itemEl);
    });
}
