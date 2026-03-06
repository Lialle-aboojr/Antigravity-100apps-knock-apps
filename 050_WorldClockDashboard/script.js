// ========================================
// 世界時計ダッシュボード / World Clock Dashboard
// メインスクリプト
// ========================================

// --- 都市データの定義 ---
const CITY_DATA = {
    tokyo: { nameJa: '東京', nameEn: 'Tokyo', timezone: 'Asia/Tokyo' },
    london: { nameJa: 'ロンドン', nameEn: 'London', timezone: 'Europe/London' },
    newyork: { nameJa: 'ニューヨーク', nameEn: 'New York', timezone: 'America/New_York' },
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
const modeCheckbox = document.getElementById('mode-checkbox');
const labelAnalog = document.getElementById('label-analog');
const labelDigital = document.getElementById('label-digital');

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

    // モード切替トグルのイベントリスナーを設定する
    modeCheckbox.addEventListener('change', handleModeToggle);

    // 1秒ごとにすべての時計を更新するタイマーを開始する
    updateAllClocks();
    setInterval(updateAllClocks, 1000);
}

// ========================================
// 表示モード切替ハンドラ
// ========================================
function handleModeToggle() {
    const isDigital = modeCheckbox.checked;
    const main = document.getElementById('main');

    if (isDigital) {
        // デジタルモードに切り替える
        main.classList.add('mode-digital');
        labelAnalog.classList.remove('active');
        labelDigital.classList.add('active');
    } else {
        // アナログモードに切り替える
        main.classList.remove('mode-digital');
        labelAnalog.classList.add('active');
        labelDigital.classList.remove('active');
    }
}

// ========================================
// プルダウンリストの選択肢を生成する
// ========================================
function populateCitySelect() {
    while (citySelect.options.length > 1) {
        citySelect.remove(1);
    }

    Object.keys(CITY_DATA).forEach(key => {
        if (activeCities.includes(key)) return;
        const city = CITY_DATA[key];
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${city.nameJa} / ${city.nameEn}`;
        citySelect.appendChild(option);
    });

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
    citySelect.selectedIndex = 0;
}

// ========================================
// 都市追加ボタンのクリックハンドラ
// ========================================
function handleAddCity() {
    const selectedKey = citySelect.value;
    if (!selectedKey) return;
    addCityToBoard(selectedKey);
    populateCitySelect();
}

// ========================================
// アナログ時計の文字盤HTML（60目盛り＋数字＋針＋キャップ）を生成する
// ========================================
function createClockFaceHTML(cityKey) {
    let ticksHTML = '';

    // 60本の目盛りを生成する（1分刻み）
    for (let i = 0; i < 60; i++) {
        const angle = i * 6; // 各目盛りは6度間隔
        let tickClass;

        if (i % 15 === 0) {
            // 12, 3, 6, 9時の位置は太い目盛り
            tickClass = 'tick tick-quarter';
        } else if (i % 5 === 0) {
            // 5分刻みの位置はやや太い目盛り
            tickClass = 'tick tick-five';
        } else {
            // その他は細い1分目盛り
            tickClass = 'tick tick-minute';
        }

        ticksHTML += `<div class="${tickClass}" style="transform: rotate(${angle}deg);"></div>`;
    }

    // 文字盤の数字（12, 3, 6, 9）
    const numbersHTML = `
        <span class="clock-number clock-number-12">12</span>
        <span class="clock-number clock-number-3">3</span>
        <span class="clock-number clock-number-6">6</span>
        <span class="clock-number clock-number-9">9</span>
    `;

    // 剣型の針とメタリックキャップ
    const handsHTML = `
        <div class="hand-hour" id="hand-hour-${cityKey}"></div>
        <div class="hand-minute" id="hand-minute-${cityKey}"></div>
        <div class="hand-second" id="hand-second-${cityKey}"></div>
        <div class="hand-second-tail" id="hand-second-tail-${cityKey}"></div>
        <div class="hand-second-weight" id="hand-second-weight-${cityKey}"></div>
        <div class="clock-center-cap"></div>
    `;

    return ticksHTML + numbersHTML + handsHTML;
}

// ========================================
// ダッシュボードに時計カードを追加する
// ========================================
function addCityToBoard(cityKey) {
    if (activeCities.includes(cityKey)) return;
    activeCities.push(cityKey);

    const city = CITY_DATA[cityKey];
    const card = document.createElement('div');
    card.className = 'clock-card';
    card.id = `card-${cityKey}`;
    card.dataset.cityKey = cityKey;

    const clockFaceHTML = createClockFaceHTML(cityKey);

    // カードHTML：アナログ表示とデジタル表示の両方を含む
    card.innerHTML = `
    <button class="remove-btn" onclick="removeCity('${cityKey}')" aria-label="削除 / Remove" title="削除 / Remove">✕</button>
    <div class="card-header">
      <div class="city-info">
        <span class="city-name-ja">${city.nameJa}</span>
        <span class="city-name-en">${city.nameEn}</span>
      </div>
      <div class="daynight-icon" id="icon-${cityKey}"></div>
    </div>
    <div class="analog-clock-wrapper">
      <div class="analog-clock" id="clock-face-${cityKey}">
        ${clockFaceHTML}
      </div>
    </div>
    <div class="digital-time-sub" id="digital-time-sub-${cityKey}">--:--:--</div>
    <div class="digital-display" id="digital-display-${cityKey}">
      <span class="digital-time-large" id="digital-time-large-${cityKey}">--:--</span>
      <span class="digital-seconds-large" id="digital-seconds-large-${cityKey}">:--</span>
    </div>
    <div class="date-display">
      <span class="date-value" id="date-${cityKey}">----/--/--</span>
    </div>
    <div class="timezone-info">
      <span class="timezone-label" id="tz-${cityKey}">${city.timezone}</span>
      <span class="timezone-label" id="utc-${cityKey}">UTC---</span>
    </div>
  `;

    // ドラッグ＆ドロップ機能を有効化する
    card.setAttribute('draggable', 'true');
    setupDragEvents(card);

    clockGrid.appendChild(card);
    updateClock(cityKey);
}

// ========================================
// ダッシュボードから都市カードを削除する
// ========================================
function removeCity(cityKey) {
    const card = document.getElementById(`card-${cityKey}`);
    if (!card) return;

    card.classList.add('removing');
    card.addEventListener('animationend', () => {
        card.remove();
        activeCities = activeCities.filter(key => key !== cityKey);
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

    const now = new Date();

    // --- Intl.DateTimeFormat で時・分・秒を取得する ---
    const hour24 = parseInt(new Intl.DateTimeFormat('en-US', {
        timeZone: city.timezone, hour: 'numeric', hour12: false
    }).format(now), 10);

    const minute = parseInt(new Intl.DateTimeFormat('en-US', {
        timeZone: city.timezone, minute: 'numeric'
    }).format(now), 10);

    const second = parseInt(new Intl.DateTimeFormat('en-US', {
        timeZone: city.timezone, second: 'numeric'
    }).format(now), 10);

    // --- アナログ時計の針の角度を計算する ---
    const hour12 = hour24 % 12;
    const hourAngle = (hour12 * 30) + (minute * 0.5);
    const minuteAngle = (minute * 6) + (second * 0.1);
    const secondAngle = second * 6;

    // --- アナログ針のDOM更新 ---
    const handHour = document.getElementById(`hand-hour-${cityKey}`);
    const handMinute = document.getElementById(`hand-minute-${cityKey}`);
    const handSecond = document.getElementById(`hand-second-${cityKey}`);
    const handSecondTail = document.getElementById(`hand-second-tail-${cityKey}`);
    const handSecondWeight = document.getElementById(`hand-second-weight-${cityKey}`);

    if (handHour) handHour.style.transform = `rotate(${hourAngle}deg)`;
    if (handMinute) handMinute.style.transform = `rotate(${minuteAngle}deg)`;
    if (handSecond) handSecond.style.transform = `rotate(${secondAngle}deg)`;
    if (handSecondTail) handSecondTail.style.transform = `rotate(${secondAngle}deg)`;
    if (handSecondWeight) handSecondWeight.style.transform = `rotate(${secondAngle}deg)`;

    // --- デジタル時刻文字列を生成する ---
    const hh = String(hour24).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    const ss = String(second).padStart(2, '0');

    // アナログ下の小デジタル表示
    const digitalTimeSub = document.getElementById(`digital-time-sub-${cityKey}`);
    if (digitalTimeSub) digitalTimeSub.textContent = `${hh}:${mm}:${ss}`;

    // デジタルモードの大きな表示
    const digitalTimeLarge = document.getElementById(`digital-time-large-${cityKey}`);
    const digitalSecondsLarge = document.getElementById(`digital-seconds-large-${cityKey}`);
    if (digitalTimeLarge) digitalTimeLarge.textContent = `${hh}:${mm}`;
    if (digitalSecondsLarge) digitalSecondsLarge.textContent = `:${ss}`;

    // --- 日付を取得する ---
    const dateFormatterJa = new Intl.DateTimeFormat('ja-JP', {
        timeZone: city.timezone,
        year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
    });

    // --- UTCオフセットを計算する ---
    const utcOffset = getUTCOffset(city.timezone, now);

    // --- DOM要素を更新する ---
    const dateEl = document.getElementById(`date-${cityKey}`);
    const iconEl = document.getElementById(`icon-${cityKey}`);
    const utcEl = document.getElementById(`utc-${cityKey}`);
    const card = document.getElementById(`card-${cityKey}`);

    if (dateEl) dateEl.textContent = dateFormatterJa.format(now);
    if (utcEl) utcEl.textContent = utcOffset;

    // --- 昼/夜の判定（6:00〜17:59 が昼） ---
    const isDay = hour24 >= 6 && hour24 <= 17;

    if (card) {
        card.classList.remove('day', 'night');
        card.classList.add(isDay ? 'day' : 'night');
    }

    if (iconEl) {
        iconEl.textContent = isDay ? '☀️' : '🌙';
    }
}

// ========================================
// UTCオフセットを文字列として取得する
// ========================================
function getUTCOffset(timezone, date) {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const diffMinutes = (tzDate - utcDate) / (1000 * 60);

    const sign = diffMinutes >= 0 ? '+' : '-';
    const absDiff = Math.abs(diffMinutes);
    const hours = Math.floor(absDiff / 60);
    const minutes = absDiff % 60;

    if (minutes === 0) return `UTC${sign}${hours}`;
    return `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

// ========================================
// DOMContentLoaded 後に初期化を実行する
// ========================================
// ========================================
// ドラッグ＆ドロップによるカード並び替え
// ========================================

// 現在ドラッグ中のカード要素を保持する変数
let draggedCard = null;

// カードにドラッグイベントリスナーを設定する
function setupDragEvents(card) {
    // ドラッグ開始
    card.addEventListener('dragstart', handleDragStart);
    // ドラッグ終了
    card.addEventListener('dragend', handleDragEnd);
    // ドラッグ中の要素が上に来た時
    card.addEventListener('dragover', handleDragOver);
    // ドラッグ中の要素が入った時
    card.addEventListener('dragenter', handleDragEnter);
    // ドラッグ中の要素が出た時
    card.addEventListener('dragleave', handleDragLeave);
    // ドロップされた時
    card.addEventListener('drop', handleDrop);
}

// ドラッグ開始ハンドラ
function handleDragStart(e) {
    draggedCard = this;
    // ドラッグデータを設定する（必須）
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.cityKey);

    // 少し遅延させてドラッグ中スタイルを適用する（即時だとゴーストにも適用されるため）
    requestAnimationFrame(() => {
        this.classList.add('dragging');
        clockGrid.classList.add('drag-active');
    });
}

// ドラッグ終了ハンドラ
function handleDragEnd(e) {
    this.classList.remove('dragging');
    clockGrid.classList.remove('drag-active');

    // すべてのカードからドラッグ関連クラスを除去する
    document.querySelectorAll('.clock-card').forEach(card => {
        card.classList.remove('drag-over');
    });

    draggedCard = null;
}

// ドラッグオーバーハンドラ（ドロップを許可するために必須）
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

// ドラッグエンターハンドラ（ハイライト表示）
function handleDragEnter(e) {
    e.preventDefault();
    if (this !== draggedCard && this.classList.contains('clock-card')) {
        this.classList.add('drag-over');
    }
}

// ドラッグリーブハンドラ（ハイライト解除）
function handleDragLeave(e) {
    // relatedTarget がこのカードの子要素でない場合のみハイライトを解除する
    if (!this.contains(e.relatedTarget)) {
        this.classList.remove('drag-over');
    }
}

// ドロップハンドラ（カードの入れ替えを実行する）
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    this.classList.remove('drag-over');

    // 自分自身にドロップした場合は何もしない
    if (!draggedCard || draggedCard === this) return;

    // DOM上でカードの位置を入れ替える
    const allCards = Array.from(clockGrid.querySelectorAll('.clock-card'));
    const draggedIndex = allCards.indexOf(draggedCard);
    const droppedIndex = allCards.indexOf(this);

    if (draggedIndex < droppedIndex) {
        // ドラッグ元が前方、ドロップ先が後方の場合
        clockGrid.insertBefore(draggedCard, this.nextSibling);
    } else {
        // ドラッグ元が後方、ドロップ先が前方の場合
        clockGrid.insertBefore(draggedCard, this);
    }

    // activeCities配列の順序もDOMに合わせて更新する
    syncActiveCitiesOrder();
}

// DOMの並び順に合わせてactiveCities配列を同期する
function syncActiveCitiesOrder() {
    const cards = clockGrid.querySelectorAll('.clock-card');
    activeCities = Array.from(cards).map(card => card.dataset.cityKey);
}

// ========================================
// DOMContentLoaded 後に初期化を実行する
// ========================================
document.addEventListener('DOMContentLoaded', init);
