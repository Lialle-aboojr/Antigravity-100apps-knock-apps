// HTMLの読み込みが完了してから実行します
document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. 状態管理（State）とデータの読み込み
    // ==========================================
    let currentDate = new Date(); // 現在表示しているカレンダーの月
    let selectedDate = null;      // モーダルで現在開いている日付(YYYY-MM-DD形式)

    // LocalStorageからデータを復元。なければ初期データを作成
    // habits: 習慣のリスト [{ id: 'xx', emoji: '🏃', name: 'ランニング' }, ...]
    let habits = JSON.parse(localStorage.getItem('habits')) || [
        { id: generateId(), emoji: '💪', name: '筋トレ / Workout' },
        { id: generateId(), emoji: '📖', name: '読書 / Reading' }
    ];
    
    // records: 日付ごとの達成記録 { '2023-10-01': ['id_1', 'id_2'], ... }
    let records = JSON.parse(localStorage.getItem('records')) || {};

    // ==========================================
    // 2. DOM要素の取得
    // ==========================================
    // カレンダー関連
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const currentMonthYear = document.getElementById('current-month-year');
    const calendarGrid = document.getElementById('calendar-grid');

    // 習慣追加フォーム関連
    const habitEmojiInput = document.getElementById('habit-emoji-input');
    const habitNameInput = document.getElementById('habit-name-input');
    const addHabitBtn = document.getElementById('add-habit-btn');
    const habitList = document.getElementById('habit-list');

    // モーダル（記録画面）関連
    const modal = document.getElementById('stamp-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const saveCloseBtn = document.getElementById('save-close-btn'); // 追加：決定して閉じるボタン
    const modalDateTitle = document.getElementById('modal-date-title');
    const modalHabitsContainer = document.getElementById('modal-habits-container');

    // ==========================================
    // 3. 初期化処理
    // ==========================================
    renderCalendar(); // カレンダーを描画
    renderHabits();   // 習慣リストを描画

    // ==========================================
    // 4. イベントリスナー（ボタン押下時の動作定義）
    // ==========================================
    // 月移動ボタン
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // 習慣追加ボタン
    addHabitBtn.addEventListener('click', () => {
        const emoji = habitEmojiInput.value.trim();
        const name = habitNameInput.value.trim();
        
        // 入力チェック
        if (!name) {
            alert('習慣の名前を入力してください。 / Please enter a habit name.');
            return;
        }

        const fallbackEmoji = emoji ? emoji : '✨'; // 絵文字が空の場合はデフォルト（✨）を使用

        // データを追加
        habits.push({ id: generateId(), emoji: fallbackEmoji, name: name });
        saveData();       // LocalStorageへ保存
        renderHabits();   // リストを再描画
        
        // 入力欄をクリア
        habitEmojiInput.value = '';
        habitNameInput.value = '';
    });

    // モーダルを閉じるボタン、Save & Closeボタン、および背景クリック
    closeModalBtn.addEventListener('click', closeModal);
    saveCloseBtn.addEventListener('click', closeModal); // 決定して閉じるボタンの動作
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(); // 背景要素自体がクリックされたら閉じる
    });

    // ==========================================
    // 5. 関数定義
    // ==========================================

    /**
     * ランダムなIDを生成する関数（習慣ごとの一意な識別用）
     */
    function generateId() {
        return Math.random().toString(36).substring(2, 9);
    }

    /**
     * データを LocalStorage に保存する関数
     */
    function saveData() {
        // オブジェクトを文字列(JSON)に変換して保存します
        localStorage.setItem('habits', JSON.stringify(habits));
        localStorage.setItem('records', JSON.stringify(records));
    }

    /**
     * 日付オブジェクトを "YYYY-MM-DD" の文字列に変換する関数
     */
    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * カレンダー本体を描画する関数
     */
    function renderCalendar() {
        // 中身をリセット
        calendarGrid.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // ヘッダーの年月テキストを更新
        currentMonthYear.textContent = `${year}年 ${month + 1}月`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // カレンダーの開始日（前月の余白部分を描画するため、日曜始まりまでさかのぼる）
        const startDayOfWeek = firstDay.getDay(); // 0: 日, 1: 月...
        const startDate = new Date(year, month, 1 - startDayOfWeek);

        // カレンダーの描画マス数（6週間 = 42マスで固定レイアウトにするとガタつかない）
        const totalCells = 42;
        
        const today = new Date();
        const todayStr = formatDate(today);

        // 各マス（日付）を生成して追加
        for (let i = 0; i < totalCells; i++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);
            
            const dateStr = formatDate(cellDate);
            
            // 重要：XSS対策として `innerHTML` は極力使わず、`createElement` で要素を作り
            // テキストの設定には安全な `textContent` を使用します。
            const cellEl = document.createElement('div');
            cellEl.classList.add('calendar-cell');
            
            // クラスの付与（薄く表示する当月以外の日、今日ハイライト）
            if (cellDate.getMonth() !== month) {
                cellEl.classList.add('other-month');
            }
            if (dateStr === todayStr) {
                cellEl.classList.add('today');
            }

            // 日付の数字を左上に表示
            const dateNumEl = document.createElement('span');
            dateNumEl.classList.add('date-num');
            dateNumEl.textContent = cellDate.getDate();
            cellEl.appendChild(dateNumEl);

            // 達成済みのスタンプ（絵文字）を表示する領域
            const stampsContainer = document.createElement('div');
            stampsContainer.classList.add('stamps-container');
            
            const todaysRecords = records[dateStr] || [];
            todaysRecords.forEach(habitId => {
                // 記録に存在する習慣IDをもとに、絵文字を探して表示
                const habit = habits.find(h => h.id === habitId);
                if (habit) {
                    const stampEl = document.createElement('span');
                    stampEl.textContent = habit.emoji;
                    stampsContainer.appendChild(stampEl);
                }
            });
            cellEl.appendChild(stampsContainer);

            // このマスをクリックしたら、記録（スタンプ）用モーダルを開く
            cellEl.addEventListener('click', () => {
                openModal(dateStr, cellDate);
            });

            // 完成したマスをカレンダーグリッドに追加
            calendarGrid.appendChild(cellEl);
        }
    }

    /**
     * 登録済みの習慣リスト（画面下部）を描画する関数
     */
    function renderHabits() {
        habitList.innerHTML = '';
        
        if (habits.length === 0) {
            const emptyMsg = document.createElement('li');
            emptyMsg.textContent = '習慣が登録されていません。 / No habits registered yet.';
            emptyMsg.style.color = '#999';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.padding = '10px';
            habitList.appendChild(emptyMsg);
            return;
        }

        habits.forEach(habit => {
            const li = document.createElement('li');
            li.classList.add('habit-item');

            const infoDiv = document.createElement('div');
            infoDiv.classList.add('habit-info');
            
            // XSS対策で textContent を使用
            const emojiSpan = document.createElement('span');
            emojiSpan.textContent = habit.emoji;
            const nameSpan = document.createElement('span');
            nameSpan.textContent = habit.name;

            infoDiv.appendChild(emojiSpan);
            infoDiv.appendChild(nameSpan);

            // 削除ボタン
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.innerHTML = '&times;'; // ここは固定文字なので安全
            deleteBtn.title = '削除 / Delete';
            
            deleteBtn.addEventListener('click', () => {
                // セキュリティ上、habit.name はダイアログ内の文字列としても安全に処理される
                if(confirm(`「${habit.name}」を削除しますか？\nAre you sure you want to delete this habit?`)) {
                    deleteHabit(habit.id);
                }
            });

            li.appendChild(infoDiv);
            li.appendChild(deleteBtn);
            habitList.appendChild(li);
        });
    }

    /**
     * 特定の習慣を削除する関数
     */
    function deleteHabit(habitId) {
        // 対象のIDを除外した配列で上書き
        habits = habits.filter(h => h.id !== habitId);
        
        // データの保存と再描画
        saveData();
        renderHabits();
        renderCalendar();
    }

    /**
     * 特定の日付のスタンプをつけるためのモーダルを開く関数
     */
    function openModal(dateStr, dateObj) {
        selectedDate = dateStr;
        
        // モーダルのタイトルをその日の日付に変更
        const y = dateObj.getFullYear();
        const m = dateObj.getMonth() + 1;
        const d = dateObj.getDate();
        modalDateTitle.textContent = `${y}年${m}月${d}日`;

        // 中身をリセット
        modalHabitsContainer.innerHTML = '';
        
        if (habits.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.textContent = '先に習慣をリストに登録してください！ / Please add a habit to the list first!';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.color = '#999';
            emptyMsg.style.padding = '20px';
            modalHabitsContainer.appendChild(emptyMsg);
        } else {
            const todaysRecords = records[dateStr] || [];

            // すべての登録済み習慣をボタンとして並べる
            habits.forEach(habit => {
                const isStamped = todaysRecords.includes(habit.id); // 既にスタンプが押されているかどうか
                
                const itemEl = document.createElement('div');
                itemEl.classList.add('modal-habit-item');
                // 達成済みなら専用クラス（背景色などが変わる）をつける
                if (isStamped) itemEl.classList.add('stamped');

                // 安全なDOM生成
                const nameDiv = document.createElement('div');
                nameDiv.textContent = habit.name;

                const stampDiv = document.createElement('div');
                stampDiv.classList.add('stamp-indicator');
                stampDiv.textContent = habit.emoji;

                itemEl.appendChild(nameDiv);
                itemEl.appendChild(stampDiv);

                // タップした時の動作（ON/OFFの切り替え）
                itemEl.addEventListener('click', () => {
                    toggleRecord(dateStr, habit.id);
                    // 見た目もすぐに切り替える
                    itemEl.classList.toggle('stamped');
                });

                modalHabitsContainer.appendChild(itemEl);
            });
        }

        // hiddenクラスを外して表示
        modal.classList.remove('hidden');
    }

    /**
     * モーダルを閉じて、カレンダーに最新の結果を反映させる関数
     */
    function closeModal() {
        modal.classList.add('hidden');
        selectedDate = null;
        renderCalendar(); // ここでカレンダーのマスにスタンプが描画される
    }

    /**
     * 特定の日付・特定の習慣の記録（スタンプ）を ON/OFF する関数
     */
    function toggleRecord(dateStr, habitId) {
        // その日の記録配列がなければ作成
        if (!records[dateStr]) {
            records[dateStr] = [];
        }

        const index = records[dateStr].indexOf(habitId);
        if (index > -1) {
            // すでに記録がある場合は削除（スタンプを消す）
            records[dateStr].splice(index, 1);
            // 配列が空になったら不要なキーごと削除（容量節約）
            if (records[dateStr].length === 0) {
                delete records[dateStr];
            }
        } else {
            // 記録がない場合は追加（スタンプをつける）
            records[dateStr].push(habitId);
        }
        
        // 変更をLocalStorageへ永続化
        saveData();
    }
});
