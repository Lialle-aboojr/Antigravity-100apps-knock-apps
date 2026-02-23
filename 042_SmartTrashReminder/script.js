/* ========================================
   Smart Trash Reminder — メインスクリプト
   機能: 曜日判定、LocalStorage保存、Googleカレンダー連携
   ======================================== */

// --- 曜日データの定義（月曜始まり） ---
// 各曜日の日本語名・英語名・キー名をまとめた配列
const DAYS = [
    { key: 'monday', ja: '月曜日', en: 'Monday' },
    { key: 'tuesday', ja: '火曜日', en: 'Tuesday' },
    { key: 'wednesday', ja: '水曜日', en: 'Wednesday' },
    { key: 'thursday', ja: '木曜日', en: 'Thursday' },
    { key: 'friday', ja: '金曜日', en: 'Friday' },
    { key: 'saturday', ja: '土曜日', en: 'Saturday' },
    { key: 'sunday', ja: '日曜日', en: 'Sunday' }
];

// --- 初期ダミーデータ（初回アクセス時のデフォルト値） ---
// 初回でも画面が寂しくないよう、一般的なゴミ出しスケジュールをセット
const DEFAULT_SCHEDULE = {
    monday: '可燃ゴミ',
    tuesday: '不燃ゴミ',
    wednesday: '資源ゴミ',
    thursday: '可燃ゴミ',
    friday: 'プラスチック',
    saturday: 'ペットボトル・びん・缶',
    sunday: ''
};

// --- LocalStorageのキー名 ---
const STORAGE_KEY = 'smartTrashReminder_schedule';

// --- ゴミの種類 → バッジCSSクラスのマッピング ---
// テキストの中にキーワードが含まれているかで判定する
const BADGE_MAP = [
    { keywords: ['可燃', 'burnable', '燃える', '燃やせる'], className: 'badge-burnable' },
    { keywords: ['不燃', 'nonburnable', '燃えない', '燃やせない'], className: 'badge-nonburnable' },
    { keywords: ['資源', 'recyclable', 'リサイクル'], className: 'badge-recyclable' },
    { keywords: ['プラ', 'plastic', 'プラスチック'], className: 'badge-plastic' },
    { keywords: ['ペット', 'びん', '缶', 'bottle', 'can', 'pet'], className: 'badge-bottles' },
    { keywords: ['粗大', 'oversized', '大型'], className: 'badge-oversized' }
];

// --- DOM要素の取得 ---
const todayDateEl = document.getElementById('today-date');
const todayTrashEl = document.getElementById('today-trash');
const tomorrowDateEl = document.getElementById('tomorrow-date');
const tomorrowTrashEl = document.getElementById('tomorrow-trash');
const scheduleFormEl = document.getElementById('schedule-form');
const saveBtnEl = document.getElementById('save-btn');
const saveToastEl = document.getElementById('save-toast');
const gcalBtnEl = document.getElementById('gcal-btn');

// --- 初期化処理 ---
document.addEventListener('DOMContentLoaded', function () {
    // スケジュールフォームを生成
    buildScheduleForm();

    // LocalStorageからデータを読み込み（なければデフォルト値を使用）
    loadSchedule();

    // 今日と明日の表示を更新
    updateTodayTomorrow();
});

// --- スケジュールフォームの動的生成 ---
function buildScheduleForm() {
    // 7つの曜日分の入力行を生成
    DAYS.forEach(function (day) {
        // 行の親要素を作成
        const row = document.createElement('div');
        row.className = 'schedule-row';

        // 曜日ラベル
        const label = document.createElement('label');
        label.className = 'day-label';
        label.setAttribute('for', 'input-' + day.key);
        label.innerHTML = day.ja + '<span class="day-label-en">' + day.en + '</span>';

        // テキスト入力欄
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'input-' + day.key;
        input.className = 'schedule-input';
        input.placeholder = 'ゴミの種類を入力 / Trash type';

        // 行に追加
        row.appendChild(label);
        row.appendChild(input);
        scheduleFormEl.appendChild(row);
    });
}

// --- LocalStorageからスケジュールを読み込む ---
function loadSchedule() {
    // LocalStorageに保存されたデータを取得
    const saved = localStorage.getItem(STORAGE_KEY);

    // 保存データがあればパース、なければデフォルト値を使用
    let schedule;
    if (saved) {
        try {
            schedule = JSON.parse(saved);
        } catch (e) {
            // パースエラーの場合はデフォルト値を使用
            schedule = DEFAULT_SCHEDULE;
        }
    } else {
        // 初回アクセス: デフォルトデータをセットしてLocalStorageにも保存
        schedule = DEFAULT_SCHEDULE;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
    }

    // フォームの入力欄にデータを反映
    DAYS.forEach(function (day) {
        const input = document.getElementById('input-' + day.key);
        if (input && schedule[day.key] !== undefined) {
            input.value = schedule[day.key];
        }
    });
}

// --- スケジュールをLocalStorageに保存する ---
function saveSchedule() {
    // 各入力欄から値を取得してオブジェクトにまとめる
    const schedule = {};
    DAYS.forEach(function (day) {
        const input = document.getElementById('input-' + day.key);
        schedule[day.key] = input ? input.value.trim() : '';
    });

    // LocalStorageに保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));

    // 今日・明日の表示を更新する
    updateTodayTomorrow();

    // 保存完了トーストを表示
    showToast();
}

// --- 保存完了トーストの表示 ---
function showToast() {
    saveToastEl.classList.add('show');
    // 2秒後に自動で非表示にする
    setTimeout(function () {
        saveToastEl.classList.remove('show');
    }, 2000);
}

// --- 保存ボタンのクリックイベント ---
saveBtnEl.addEventListener('click', saveSchedule);

// --- 今日と明日の表示を更新する ---
function updateTodayTomorrow() {
    // 現在の日付を取得
    const now = new Date();

    // 明日の日付を計算
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 保存されたスケジュールを取得
    const saved = localStorage.getItem(STORAGE_KEY);
    let schedule;
    try {
        schedule = saved ? JSON.parse(saved) : DEFAULT_SCHEDULE;
    } catch (e) {
        schedule = DEFAULT_SCHEDULE;
    }

    // 今日の曜日キーを取得（JavaScriptのgetDay()は日曜=0なので変換が必要）
    const todayKey = getDayKey(now.getDay());
    const tomorrowKey = getDayKey(tomorrow.getDay());

    // 今日のゴミの種類を取得
    const todayTrash = schedule[todayKey] || '';
    const tomorrowTrash = schedule[tomorrowKey] || '';

    // 日付テキストをフォーマット
    todayDateEl.textContent = formatDate(now);
    tomorrowDateEl.textContent = formatDate(tomorrow);

    // ゴミの種類をバッジとして表示
    renderTrashBadges(todayTrashEl, todayTrash);
    renderTrashBadges(tomorrowTrashEl, tomorrowTrash);

    // Googleカレンダーボタンの状態を更新
    updateGcalButton(todayTrash, now);
}

// --- JavaScriptの曜日番号（0=日, 1=月, ...）をキー名に変換 ---
function getDayKey(dayIndex) {
    const map = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return map[dayIndex];
}

// --- 日付をフォーマットする関数 ---
function formatDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 月は0始まりなので+1
    const day = date.getDate();

    // 曜日の日本語名を取得
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dayName = dayNames[date.getDay()];

    // 曜日の英語名を取得
    const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNameEn = dayNamesEn[date.getDay()];

    return year + '/' + month + '/' + day + ' (' + dayName + ' / ' + dayNameEn + ')';
}

// --- ゴミの種類をバッジとして描画する関数 ---
function renderTrashBadges(container, trashText) {
    // コンテナをクリア
    container.innerHTML = '';

    // 未設定の場合
    if (!trashText) {
        const badge = document.createElement('span');
        badge.className = 'trash-badge badge-notset';
        badge.textContent = '未設定 / Not set';
        container.appendChild(badge);
        return;
    }

    // テキストを「・」「,」「、」「/」で分割して複数のバッジに対応
    const items = trashText.split(/[・,、/]+/).map(function (s) { return s.trim(); }).filter(Boolean);

    items.forEach(function (item) {
        const badge = document.createElement('span');
        badge.className = 'trash-badge ' + getBadgeClass(item);
        badge.textContent = item;
        container.appendChild(badge);
    });
}

// --- テキストからバッジのCSSクラスを判定する関数 ---
function getBadgeClass(text) {
    const lowerText = text.toLowerCase();

    // キーワードリストを順にチェック
    for (let i = 0; i < BADGE_MAP.length; i++) {
        const entry = BADGE_MAP[i];
        for (let j = 0; j < entry.keywords.length; j++) {
            if (lowerText.indexOf(entry.keywords[j]) !== -1) {
                return entry.className;
            }
        }
    }

    // どのキーワードにもマッチしない場合はデフォルト
    return 'badge-default';
}

// --- Googleカレンダーボタンの状態を更新する ---
function updateGcalButton(trashText, date) {
    if (!trashText) {
        // 未設定の場合はボタンを非活性にする
        gcalBtnEl.disabled = true;
        gcalBtnEl.onclick = null;
        return;
    }

    // ボタンを有効化
    gcalBtnEl.disabled = false;

    // クリック時の処理を設定
    gcalBtnEl.onclick = function () {
        openGoogleCalendar(trashText, date);
    };
}

// --- Googleカレンダーの予定作成画面を開く ---
function openGoogleCalendar(trashText, date) {
    // タイトルを組み立て
    const title = 'ゴミ出し：' + trashText;

    // 日付をGoogleカレンダーのフォーマット（YYYYMMDD）に変換
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = year + month + day;

    // GoogleカレンダーのURLを組み立て
    // 終日イベントとして登録（dates=YYYYMMDD/YYYYMMDD 形式）
    const url = 'https://calendar.google.com/calendar/render'
        + '?action=TEMPLATE'
        + '&text=' + encodeURIComponent(title)
        + '&dates=' + dateStr + '/' + dateStr
        + '&details=' + encodeURIComponent('Smart Trash Reminderから追加されたイベントです。')
        + '&sf=true'
        + '&output=xml';

    // 別タブで開く
    window.open(url, '_blank');
}
