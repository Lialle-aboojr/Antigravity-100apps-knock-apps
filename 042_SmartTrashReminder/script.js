/* ========================================
   Smart Trash Reminder — メインスクリプト
   機能: ゴミ種類マスター管理・曜日×頻度スケジュール・
         第N曜日判定・LocalStorage・Googleカレンダー連携
   ======================================== */

// =============================================
// 定数定義
// =============================================

// --- 曜日データ（月曜始まり） ---
var DAYS = [
    { key: 'monday', ja: '月曜日', en: 'Monday' },
    { key: 'tuesday', ja: '火曜日', en: 'Tuesday' },
    { key: 'wednesday', ja: '水曜日', en: 'Wednesday' },
    { key: 'thursday', ja: '木曜日', en: 'Thursday' },
    { key: 'friday', ja: '金曜日', en: 'Friday' },
    { key: 'saturday', ja: '土曜日', en: 'Saturday' },
    { key: 'sunday', ja: '日曜日', en: 'Sunday' }
];

// --- 頻度の選択肢 ---
var FREQUENCIES = [
    { value: 'every', label: '毎週 / Every week' },
    { value: 'week1', label: '第1 / 1st week' },
    { value: 'week2', label: '第2 / 2nd week' },
    { value: 'week3', label: '第3 / 3rd week' },
    { value: 'week4', label: '第4 / 4th week' },
    { value: 'week5', label: '第5 / 5th week' },
    { value: 'week13', label: '第1・第3 / 1st & 3rd' },
    { value: 'week24', label: '第2・第4 / 2nd & 4th' }
];

// --- LocalStorageのキー名 ---
var STORAGE_KEY_TYPES = 'smartTrash_types';
var STORAGE_KEY_SCHEDULE = 'smartTrash_schedule';

// --- 初期プリセットのゴミの種類 ---
var DEFAULT_TYPES = [
    { id: 'type_1', name: '可燃ゴミ', color: '#dc2626' },
    { id: 'type_2', name: '不燃ゴミ', color: '#2563eb' },
    { id: 'type_3', name: '資源ゴミ', color: '#16a34a' },
    { id: 'type_4', name: 'プラスチック', color: '#ea580c' }
];

// --- 初期プリセットのスケジュール ---
var DEFAULT_SCHEDULE = {
    monday: [{ frequency: 'every', typeId: 'type_1' }],
    tuesday: [{ frequency: 'every', typeId: 'type_2' }],
    wednesday: [{ frequency: 'every', typeId: 'type_3' }],
    thursday: [{ frequency: 'every', typeId: 'type_1' }],
    friday: [{ frequency: 'every', typeId: 'type_4' }],
    saturday: [],
    sunday: []
};

// =============================================
// グローバル変数
// =============================================

// 現在のデータを保持する変数
var currentTypes = [];
var currentSchedule = {};
var typeIdCounter = 10; // 新規種類のID用カウンター

// =============================================
// DOM要素の取得
// =============================================

var todayDateEl = document.getElementById('today-date');
var todayTrashEl = document.getElementById('today-trash');
var tomorrowDateEl = document.getElementById('tomorrow-date');
var tomorrowTrashEl = document.getElementById('tomorrow-trash');
var trashTypesListEl = document.getElementById('trash-types-list');
var scheduleSettingsEl = document.getElementById('schedule-settings');
var saveBtnEl = document.getElementById('save-btn');
var saveToastEl = document.getElementById('save-toast');
var gcalBtnEl = document.getElementById('gcal-btn');
var addTypeBtnEl = document.getElementById('add-type-btn');

// =============================================
// 初期化処理
// =============================================

document.addEventListener('DOMContentLoaded', function () {
    // LocalStorageからデータを読み込み（なければデフォルト）
    loadData();

    // UIを構築
    renderTrashTypes();
    renderScheduleSettings();

    // 今日と明日の表示を更新
    updateTodayTomorrow();

    // イベントリスナーを設定
    saveBtnEl.addEventListener('click', saveAll);
    addTypeBtnEl.addEventListener('click', addNewType);
});

// =============================================
// データの読み込み・保存
// =============================================

// --- LocalStorageからデータを読み込む ---
function loadData() {
    // ゴミの種類を読み込み
    var savedTypes = localStorage.getItem(STORAGE_KEY_TYPES);
    if (savedTypes) {
        try {
            currentTypes = JSON.parse(savedTypes);
        } catch (e) {
            currentTypes = JSON.parse(JSON.stringify(DEFAULT_TYPES));
        }
    } else {
        currentTypes = JSON.parse(JSON.stringify(DEFAULT_TYPES));
    }

    // スケジュールを読み込み
    var savedSchedule = localStorage.getItem(STORAGE_KEY_SCHEDULE);
    if (savedSchedule) {
        try {
            currentSchedule = JSON.parse(savedSchedule);
        } catch (e) {
            currentSchedule = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
        }
    } else {
        currentSchedule = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
    }

    // IDカウンターを既存の最大値+1に設定（重複防止）
    currentTypes.forEach(function (t) {
        var num = parseInt(t.id.replace('type_', ''), 10);
        if (!isNaN(num) && num >= typeIdCounter) {
            typeIdCounter = num + 1;
        }
    });
}

// --- すべてのデータをLocalStorageに保存する ---
function saveAll() {
    // フォームからデータを収集
    collectTypesFromUI();
    collectScheduleFromUI();

    // LocalStorageに保存
    localStorage.setItem(STORAGE_KEY_TYPES, JSON.stringify(currentTypes));
    localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(currentSchedule));

    // 今日・明日の表示を更新
    updateTodayTomorrow();

    // スケジュールのプルダウンを最新の種類で更新
    renderScheduleSettings();

    // トースト表示
    showToast();
}

// --- 保存完了トーストの表示 ---
function showToast() {
    saveToastEl.classList.add('show');
    setTimeout(function () {
        saveToastEl.classList.remove('show');
    }, 2000);
}

// =============================================
// 【A】ゴミの種類設定のUI
// =============================================

// --- ゴミの種類リストを描画する ---
function renderTrashTypes() {
    trashTypesListEl.innerHTML = '';

    currentTypes.forEach(function (type, index) {
        var row = document.createElement('div');
        row.className = 'type-row';
        row.setAttribute('data-type-id', type.id);

        // カラーピッカー
        var colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.className = 'type-color-picker';
        colorInput.value = type.color;
        colorInput.title = '色を選択 / Pick color';

        // 種類名テキスト入力
        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'type-name-input';
        nameInput.value = type.name;
        nameInput.placeholder = '種類名 / Type name';

        // 削除ボタン
        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '✕';
        deleteBtn.title = '削除 / Delete';
        deleteBtn.addEventListener('click', function () {
            removeType(type.id);
        });

        row.appendChild(colorInput);
        row.appendChild(nameInput);
        row.appendChild(deleteBtn);
        trashTypesListEl.appendChild(row);
    });
}

// --- 新しいゴミの種類を追加する ---
function addNewType() {
    // UIから最新データを収集（入力中のデータを保持するため）
    collectTypesFromUI();

    var newId = 'type_' + typeIdCounter;
    typeIdCounter++;

    currentTypes.push({
        id: newId,
        name: '',
        color: '#6b7280'
    });

    renderTrashTypes();
}

// --- ゴミの種類を削除する ---
function removeType(typeId) {
    // UIから最新データを収集
    collectTypesFromUI();

    // 対象を除外
    currentTypes = currentTypes.filter(function (t) {
        return t.id !== typeId;
    });

    // スケジュールから該当typeIdの行も削除
    DAYS.forEach(function (day) {
        if (currentSchedule[day.key]) {
            currentSchedule[day.key] = currentSchedule[day.key].filter(function (entry) {
                return entry.typeId !== typeId;
            });
        }
    });

    renderTrashTypes();
    renderScheduleSettings();
}

// --- UIからゴミの種類データを収集する ---
function collectTypesFromUI() {
    var rows = trashTypesListEl.querySelectorAll('.type-row');
    var newTypes = [];

    rows.forEach(function (row) {
        var id = row.getAttribute('data-type-id');
        var colorInput = row.querySelector('.type-color-picker');
        var nameInput = row.querySelector('.type-name-input');

        newTypes.push({
            id: id,
            name: nameInput.value.trim(),
            color: colorInput.value
        });
    });

    currentTypes = newTypes;
}

// =============================================
// 【B】スケジュール設定のUI
// =============================================

// --- スケジュール設定エリアを描画する ---
function renderScheduleSettings() {
    // 描画前にUIからスケジュールデータを収集（入力中のデータを保持）
    // ただし初回描画時は要素がないのでスキップ
    if (scheduleSettingsEl.children.length > 0) {
        collectScheduleFromUI();
    }

    scheduleSettingsEl.innerHTML = '';

    DAYS.forEach(function (day) {
        var block = document.createElement('div');
        block.className = 'schedule-day-block';
        block.setAttribute('data-day-key', day.key);

        // 曜日ヘッダー
        var header = document.createElement('div');
        header.className = 'schedule-day-header';
        header.innerHTML = day.ja + ' <span class="schedule-day-header-en">' + day.en + '</span>';
        block.appendChild(header);

        // スケジュール行のコンテナ
        var rowsContainer = document.createElement('div');
        rowsContainer.className = 'schedule-rows';

        // 該当曜日のスケジュール行を描画
        var entries = currentSchedule[day.key] || [];

        if (entries.length === 0) {
            // 空状態のメッセージ
            var emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-schedule';
            emptyMsg.textContent = '予定なし / No schedule';
            rowsContainer.appendChild(emptyMsg);
        } else {
            entries.forEach(function (entry, entryIndex) {
                var row = createScheduleRow(day.key, entry, entryIndex);
                rowsContainer.appendChild(row);
            });
        }

        block.appendChild(rowsContainer);

        // 「＋ ○曜日の予定を追加」ボタン
        var addBtn = document.createElement('button');
        addBtn.className = 'add-schedule-btn';
        addBtn.textContent = '＋ ' + day.ja + 'の予定を追加 / Add to ' + day.en;
        addBtn.addEventListener('click', (function (dayKey) {
            return function () {
                addScheduleEntry(dayKey);
            };
        })(day.key));
        block.appendChild(addBtn);

        scheduleSettingsEl.appendChild(block);
    });
}

// --- スケジュール行の要素を作成する ---
function createScheduleRow(dayKey, entry, entryIndex) {
    var row = document.createElement('div');
    row.className = 'schedule-row';

    // 頻度プルダウン
    var freqSelect = document.createElement('select');
    freqSelect.className = 'freq-select';

    FREQUENCIES.forEach(function (freq) {
        var option = document.createElement('option');
        option.value = freq.value;
        option.textContent = freq.label;
        if (entry.frequency === freq.value) {
            option.selected = true;
        }
        freqSelect.appendChild(option);
    });

    // ゴミの種類プルダウン
    var typeSelect = document.createElement('select');
    typeSelect.className = 'type-select';

    // 「選択してください」オプション
    var defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- 種類を選択 / Select type --';
    typeSelect.appendChild(defaultOption);

    currentTypes.forEach(function (type) {
        var option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name || '(名前なし)';
        if (entry.typeId === type.id) {
            option.selected = true;
        }
        typeSelect.appendChild(option);
    });

    // 削除ボタン
    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.title = '削除 / Delete';
    deleteBtn.addEventListener('click', (function (dk, idx) {
        return function () {
            removeScheduleEntry(dk, idx);
        };
    })(dayKey, entryIndex));

    row.appendChild(freqSelect);
    row.appendChild(typeSelect);
    row.appendChild(deleteBtn);

    return row;
}

// --- スケジュール行を追加する ---
function addScheduleEntry(dayKey) {
    // UIから最新データを収集
    collectScheduleFromUI();

    if (!currentSchedule[dayKey]) {
        currentSchedule[dayKey] = [];
    }

    // デフォルトで「毎週」「最初の種類」を追加
    var defaultTypeId = currentTypes.length > 0 ? currentTypes[0].id : '';
    currentSchedule[dayKey].push({
        frequency: 'every',
        typeId: defaultTypeId
    });

    renderScheduleSettings();
}

// --- スケジュール行を削除する ---
function removeScheduleEntry(dayKey, entryIndex) {
    // UIから最新データを収集
    collectScheduleFromUI();

    if (currentSchedule[dayKey]) {
        currentSchedule[dayKey].splice(entryIndex, 1);
    }

    renderScheduleSettings();
}

// --- UIからスケジュールデータを収集する ---
function collectScheduleFromUI() {
    var blocks = scheduleSettingsEl.querySelectorAll('.schedule-day-block');

    blocks.forEach(function (block) {
        var dayKey = block.getAttribute('data-day-key');
        var rows = block.querySelectorAll('.schedule-row');
        var entries = [];

        rows.forEach(function (row) {
            var freqSelect = row.querySelector('.freq-select');
            var typeSelect = row.querySelector('.type-select');

            if (freqSelect && typeSelect) {
                entries.push({
                    frequency: freqSelect.value,
                    typeId: typeSelect.value
                });
            }
        });

        currentSchedule[dayKey] = entries;
    });
}

// =============================================
// 今日と明日の表示
// =============================================

// --- 今日と明日の表示を更新する ---
function updateTodayTomorrow() {
    var now = new Date();
    var tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 日付をフォーマットして表示
    todayDateEl.textContent = formatDate(now);
    tomorrowDateEl.textContent = formatDate(tomorrow);

    // 今日と明日に該当するゴミの種類を取得
    var todayItems = getTrashForDate(now);
    var tomorrowItems = getTrashForDate(tomorrow);

    // バッジを描画
    renderDayBadges(todayTrashEl, todayItems);
    renderDayBadges(tomorrowTrashEl, tomorrowItems);

    // Googleカレンダーボタンを更新
    updateGcalButton(todayItems, now);
}

// --- 指定日のゴミの種類リストを取得する ---
function getTrashForDate(date) {
    // 曜日キーを取得
    var dayKey = getDayKey(date.getDay());

    // その月の第何曜日かを計算
    var weekNumber = getNthWeekday(date);

    // 該当曜日のスケジュールを取得
    var entries = currentSchedule[dayKey] || [];

    // 条件に合うエントリをフィルタリング
    var matchedItems = [];

    entries.forEach(function (entry) {
        var matches = false;

        switch (entry.frequency) {
            case 'every':
                // 毎週 → 常にマッチ
                matches = true;
                break;
            case 'week1':
                matches = (weekNumber === 1);
                break;
            case 'week2':
                matches = (weekNumber === 2);
                break;
            case 'week3':
                matches = (weekNumber === 3);
                break;
            case 'week4':
                matches = (weekNumber === 4);
                break;
            case 'week5':
                matches = (weekNumber === 5);
                break;
            case 'week13':
                // 第1・第3
                matches = (weekNumber === 1 || weekNumber === 3);
                break;
            case 'week24':
                // 第2・第4
                matches = (weekNumber === 2 || weekNumber === 4);
                break;
        }

        if (matches && entry.typeId) {
            // ゴミの種類情報を検索
            var typeInfo = findTypeById(entry.typeId);
            if (typeInfo) {
                // 重複チェック（同じ種類が2回表示されないように）
                var alreadyAdded = matchedItems.some(function (item) {
                    return item.id === typeInfo.id;
                });
                if (!alreadyAdded) {
                    matchedItems.push(typeInfo);
                }
            }
        }
    });

    return matchedItems;
}

// --- ゴミの種類をIDで検索する ---
function findTypeById(typeId) {
    for (var i = 0; i < currentTypes.length; i++) {
        if (currentTypes[i].id === typeId) {
            return currentTypes[i];
        }
    }
    return null;
}

// --- その月の第何曜日かを計算する ---
// 例: 2月の第3月曜日 → weekNumber = 3
function getNthWeekday(date) {
    var dayOfMonth = date.getDate();
    return Math.ceil(dayOfMonth / 7);
}

// --- JavaScriptの曜日番号（0=日, 1=月, ...）をキー名に変換 ---
function getDayKey(dayIndex) {
    var map = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return map[dayIndex];
}

// --- 日付をフォーマットする関数 ---
function formatDate(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    var dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var dayName = dayNames[date.getDay()];
    var dayNameEn = dayNamesEn[date.getDay()];

    // 第何週かも表示
    var nth = getNthWeekday(date);

    return year + '/' + month + '/' + day + ' (' + dayName + ' / ' + dayNameEn + ') 第' + nth + '週';
}

// --- 今日/明日カードにバッジを描画する ---
function renderDayBadges(container, items) {
    container.innerHTML = '';

    if (items.length === 0) {
        // 未設定の場合
        var badge = document.createElement('span');
        badge.className = 'trash-badge badge-notset';
        badge.textContent = '未設定 / Not set';
        container.appendChild(badge);
        return;
    }

    items.forEach(function (item) {
        var badge = document.createElement('span');
        badge.className = 'trash-badge';

        // テーマカラーを使ったバッジスタイル
        // 背景色を薄くし、文字色を濃くする
        var bgColor = hexToRgba(item.color, 0.1);
        var borderColor = hexToRgba(item.color, 0.3);
        badge.style.backgroundColor = bgColor;
        badge.style.color = item.color;
        badge.style.border = '1px solid ' + borderColor;

        // 色ドット
        var dot = document.createElement('span');
        dot.className = 'badge-dot';
        dot.style.backgroundColor = item.color;

        badge.appendChild(dot);
        badge.appendChild(document.createTextNode(' ' + item.name));
        container.appendChild(badge);
    });
}

// --- HEXカラーをRGBA文字列に変換するヘルパー ---
function hexToRgba(hex, alpha) {
    // #rrggbb形式のHEXからR, G, Bを取り出す
    var r = parseInt(hex.substring(1, 3), 16);
    var g = parseInt(hex.substring(3, 5), 16);
    var b = parseInt(hex.substring(5, 7), 16);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
}

// =============================================
// Googleカレンダー連携
// =============================================

// --- Googleカレンダーボタンの状態を更新する ---
function updateGcalButton(todayItems, date) {
    if (todayItems.length === 0) {
        gcalBtnEl.disabled = true;
        gcalBtnEl.onclick = null;
        return;
    }

    gcalBtnEl.disabled = false;

    // 今日のゴミの種類名をカンマ区切りで結合
    var trashNames = todayItems.map(function (item) {
        return item.name;
    }).join('・');

    gcalBtnEl.onclick = function () {
        openGoogleCalendar(trashNames, date);
    };
}

// --- Googleカレンダーの予定作成画面を開く ---
function openGoogleCalendar(trashText, date) {
    var title = 'ゴミ出し：' + trashText;

    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    var dateStr = year + month + day;

    var url = 'https://calendar.google.com/calendar/render'
        + '?action=TEMPLATE'
        + '&text=' + encodeURIComponent(title)
        + '&dates=' + dateStr + '/' + dateStr
        + '&details=' + encodeURIComponent('Smart Trash Reminderから追加されたイベントです。')
        + '&sf=true'
        + '&output=xml';

    window.open(url, '_blank');
}
