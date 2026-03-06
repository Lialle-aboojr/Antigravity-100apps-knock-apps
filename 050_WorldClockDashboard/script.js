// ========================================
// 世界時計ダッシュボード / World Clock Dashboard
// メインスクリプト
// ========================================

// --- 都市データの定義 ---
// 各都市の日本語名、英語名、IANAタイムゾーン名を管理する
const CITY_DATA = {
    // 初期表示都市
    tokyo: { nameJa: '東京', nameEn: 'Tokyo', timezone: 'Asia/Tokyo' },
    london: { nameJa: 'ロンドン', nameEn: 'London', timezone: 'Europe/London' },
    newyork: { nameJa: 'ニューヨーク', nameEn: 'New York', timezone: 'America/New_York' },

    // 追加可能な都市
    paris: { nameJa: 'パリ', nameEn: 'Paris', timezone: 'Europe/Paris' },
    sydney: { nameJa: 'シドニー', nameEn: 'Sydney', timezone: 'Australia/Sydney' },
    losangeles: { nameJa: 'ロサンゼルス', nameEn: 'Los Angeles', timezone: 'America/Los_Angeles' },
    dubai: { nameJa: 'ドバイ', nameEn: 'Dubai', timezone: 'Asia/Dubai' },
    shanghai: { nameJa: '上海', nameEn: 'Shanghai', timezone: 'Asia/Shanghai' },
    bangkok: { nameJa: 'バンコク', nameEn: 'Bangkok', timezone: 'Asia/Bangkok' },
    singapore: { nameJa: 'シンガポール', nameEn: 'Singapore', timezone: 'Asia/Singapore' },
    berlin: { nameJa: 'ベルリン', nameEn: 'Berlin', timezone: 'Europe/Berlin' },
    saopaulo: { nameJa: 'サンパウロ', nameEn: 'São Paulo', timezone: 'America/Sao_Paulo' },
    cairo: { nameJa: 'カイロ', nameEn: 'Cairo', timezone: 'Africa/Cairo' },
    mumbai: { nameJa: 'ムンバイ', nameEn: 'Mumbai', timezone: 'Asia/Kolkata' },
    toronto: { nameJa: 'トロント', nameEn: 'Toronto', timezone: 'America/Toronto' },
    moscow: { nameJa: 'モスクワ', nameEn: 'Moscow', timezone: 'Europe/Moscow' },
    seoul: { nameJa: 'ソウル', nameEn: 'Seoul', timezone: 'Asia/Seoul' },
    honolulu: { nameJa: 'ホノルル', nameEn: 'Honolulu', timezone: 'Pacific/Honolulu' },
    auckland: { nameJa: 'オークランド', nameEn: 'Auckland', timezone: 'Pacific/Auckland' },
};

// --- 初期表示する都市のキー ---
const DEFAULT_CITIES = ['tokyo', 'london', 'newyork'];

// --- 現在ダッシュボードに表示中の都市キーを管理する配列 ---
let activeCities = [];

// --- DOM要素の参照 ---
const clockGrid = document.getElementById('clock-grid');
const citySelect = document.getElementById('city-select');
const addCityBtn = document.getElementById('add-city-btn');

// ========================================
// 初期化処理
// ========================================
function init() {
    // プルダウンリストの選択肢を生成する
    populateCitySelect();

    // 初期都市をダッシュボードに追加する
    DEFAULT_CITIES.forEach(cityKey => {
        addCityToBoard(cityKey);
    });

    // 追加ボタンのイベントリスナーを設定する
    addCityBtn.addEventListener('click', handleAddCity);

    // 1秒ごとにすべての時計を更新するタイマーを開始する
    updateAllClocks();
    setInterval(updateAllClocks, 1000);
}

// ========================================
// プルダウンリストの選択肢を生成する
// ========================================
function populateCitySelect() {
    // 既存のオプション（デフォルトの「都市を選択」以外）を削除する
    while (citySelect.options.length > 1) {
        citySelect.remove(1);
    }

    // 都市データからプルダウンの選択肢を動的に生成する
    Object.keys(CITY_DATA).forEach(key => {
        // 既にダッシュボードに追加済みの都市はスキップする
        if (activeCities.includes(key)) return;

        const city = CITY_DATA[key];
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${city.nameJa} / ${city.nameEn}`;
        citySelect.appendChild(option);
    });

    // 選択肢がなくなったらプルダウンを無効化する
    if (citySelect.options.length <= 1) {
        citySelect.disabled = true;
        addCityBtn.disabled = true;
        addCityBtn.style.opacity = '0.5';
        addCityBtn.style.cursor = 'not-allowed';
    } else {
        citySelect.disabled = false;
        addCityBtn.disabled = false;
        addCityBtn.style.opacity = '1';
        addCityBtn.style.cursor = 'pointer';
    }

    // プルダウンをデフォルト状態にリセットする
    citySelect.selectedIndex = 0;
}

// ========================================
// 都市追加ボタンのクリックハンドラ
// ========================================
function handleAddCity() {
    const selectedKey = citySelect.value;

    // 都市が選択されていない場合は何もしない
    if (!selectedKey) return;

    // ダッシュボードに都市を追加する
    addCityToBoard(selectedKey);

    // プルダウンリストを更新する（追加済み都市を非表示にする）
    populateCitySelect();
}

// ========================================
// ダッシュボードに時計カードを追加する
// ========================================
function addCityToBoard(cityKey) {
    // 既に追加済みの場合はスキップする
    if (activeCities.includes(cityKey)) return;

    // アクティブ都市リストに追加する
    activeCities.push(cityKey);

    const city = CITY_DATA[cityKey];

    // カード要素を生成する
    const card = document.createElement('div');
    card.className = 'clock-card';
    card.id = `card-${cityKey}`;
    card.dataset.cityKey = cityKey;

    // カードのHTML構造を組み立てる
    card.innerHTML = `
    <button class="remove-btn" onclick="removeCity('${cityKey}')" aria-label="削除 / Remove" title="削除 / Remove">✕</button>
    <div class="card-header">
      <div class="city-info">
        <span class="city-name-ja">${city.nameJa}</span>
        <span class="city-name-en">${city.nameEn}</span>
      </div>
      <div class="daynight-icon" id="icon-${cityKey}"></div>
    </div>
    <div class="time-display">
      <span class="time-value" id="time-${cityKey}">--:--</span>
      <span class="time-seconds" id="seconds-${cityKey}">--</span>
    </div>
    <div class="date-display">
      <span class="date-value" id="date-${cityKey}">----/--/--</span>
    </div>
    <div class="timezone-info">
      <span class="timezone-label" id="tz-${cityKey}">${city.timezone}</span>
      <span class="timezone-label" id="utc-${cityKey}">UTC---</span>
    </div>
  `;

    // グリッドにカードを追加する
    clockGrid.appendChild(card);

    // 追加直後に時刻を更新する（1秒待たずに即時反映）
    updateClock(cityKey);
}

// ========================================
// ダッシュボードから都市カードを削除する
// ========================================
function removeCity(cityKey) {
    const card = document.getElementById(`card-${cityKey}`);
    if (!card) return;

    // 削除アニメーションを適用する
    card.classList.add('removing');

    // アニメーション完了後にDOM要素を削除する
    card.addEventListener('animationend', () => {
        card.remove();

        // アクティブ都市リストからも削除する
        activeCities = activeCities.filter(key => key !== cityKey);

        // プルダウンリストを更新する（削除した都市を再び選択可能にする）
        populateCitySelect();
    });
}

// ========================================
// すべてのアクティブな時計を更新する
// ========================================
function updateAllClocks() {
    activeCities.forEach(cityKey => {
        updateClock(cityKey);
    });
}

// ========================================
// 個別の時計を更新する
// ========================================
function updateClock(cityKey) {
    const city = CITY_DATA[cityKey];
    if (!city) return;

    // 現在のDateオブジェクトを基に、指定タイムゾーンの日時情報を取得する
    const now = new Date();

    // --- 時刻を取得する（Intl.DateTimeFormatを使用） ---
    const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
        timeZone: city.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const secondsFormatter = new Intl.DateTimeFormat('ja-JP', {
        timeZone: city.timezone,
        second: '2-digit',
    });

    // --- 時・分を個別に取得する（昼夜判定に使用） ---
    const hourFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: city.timezone,
        hour: 'numeric',
        hour12: false,
    });

    const hour = parseInt(hourFormatter.format(now), 10);

    // --- 日付を取得する ---
    const dateFormatterJa = new Intl.DateTimeFormat('ja-JP', {
        timeZone: city.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
    });

    // --- UTCオフセットを計算する ---
    const utcOffset = getUTCOffset(city.timezone, now);

    // --- DOM要素を更新する ---
    const timeEl = document.getElementById(`time-${cityKey}`);
    const secondsEl = document.getElementById(`seconds-${cityKey}`);
    const dateEl = document.getElementById(`date-${cityKey}`);
    const iconEl = document.getElementById(`icon-${cityKey}`);
    const utcEl = document.getElementById(`utc-${cityKey}`);
    const card = document.getElementById(`card-${cityKey}`);

    if (timeEl) timeEl.textContent = timeFormatter.format(now);
    // 秒表示をゼロパディングして常に2桁にする
    const secondsRaw = secondsFormatter.format(now).replace(/\D/g, '');
    if (secondsEl) secondsEl.textContent = ':' + secondsRaw.padStart(2, '0');
    if (dateEl) dateEl.textContent = dateFormatterJa.format(now);
    if (utcEl) utcEl.textContent = utcOffset;

    // --- 昼/夜の判定とカードスタイルの切り替え ---
    // 昼: 6:00〜17:59、夜: 18:00〜5:59
    const isDay = hour >= 6 && hour <= 17;

    if (card) {
        card.classList.remove('day', 'night');
        card.classList.add(isDay ? 'day' : 'night');
    }

    // 昼/夜アイコンを切り替える
    if (iconEl) {
        iconEl.textContent = isDay ? '☀️' : '🌙';
    }
}

// ========================================
// UTCオフセットを文字列として取得する
// ========================================
function getUTCOffset(timezone, date) {
    // 指定タイムゾーンとUTCの差分を計算する
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));

    // 差分を分単位で取得する
    const diffMinutes = (tzDate - utcDate) / (1000 * 60);

    // 時間と分に分解する
    const sign = diffMinutes >= 0 ? '+' : '-';
    const absDiff = Math.abs(diffMinutes);
    const hours = Math.floor(absDiff / 60);
    const minutes = absDiff % 60;

    // UTCオフセット文字列を返す（例: UTC+9:00）
    if (minutes === 0) {
        return `UTC${sign}${hours}`;
    }
    return `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

// ========================================
// DOMContentLoaded 後に初期化を実行する
// ========================================
document.addEventListener('DOMContentLoaded', init);
