/**
 * World Live Cam Roulette - Main Logic
 * Integrates Windy Webcams Snapshots with rich CSS theme transitions.
 */

function sanitizeText(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// 🌍 Windy Webcams データリスト
const cameraList = [
  { id: '1341940811', country: 'アメリカ / USA', location: 'タイムズスクエア / Times Square', timeZone: 'America/New_York' },
  { id: '1555326274', country: 'フランス / France', location: 'エッフェル塔 / Eiffel Tower', timeZone: 'Europe/Paris' },
  { id: '1410979629', country: '日本 / Japan', location: '東京タワー / Tokyo Tower', timeZone: 'Asia/Tokyo' },
  { id: '1362211264', country: '日本 / Japan', location: '東京スカイツリー / Tokyo Skytree', timeZone: 'Asia/Tokyo' },
  { id: '1490712854', country: 'イギリス / UK', location: 'ビッグベン / Big Ben', timeZone: 'Europe/London' },
  { id: '1552065404', country: 'UAE / Dubai', location: 'ドバイ / Dubai Mall', timeZone: 'Asia/Dubai' },
  { id: '1279401088', country: 'イタリア / Italy', location: 'ヴェネツィア / Venice', timeZone: 'Europe/Rome' },
  { id: '1503353468', country: 'オーストラリア / Australia', location: 'シドニー港 / Sydney Harbour', timeZone: 'Australia/Sydney' },
  { id: '1240237991', country: 'カナダ / Canada', location: 'ナイアガラの滝 / Niagara Falls', timeZone: 'America/Toronto' },
  { id: '1237807604', country: 'スペイン / Spain', location: 'バルセロナ海岸 / Barcelona Beach', timeZone: 'Europe/Madrid' },
  { id: '1346107218', country: 'スペイン / Spain', location: 'ラス・ランブラス / Las Ramblas', timeZone: 'Europe/Madrid' }
];

// 状態管理
let currentCamIndex = -1;
let clockInterval = null;
let imageUpdateInterval = null;
let isTransitioning = false;
let currentThemeClass = 'theme-window';

// DOM Elements
const body = document.body;
const themeSelect = document.getElementById('themeSelect');
const nextBtn = document.getElementById('nextBtn');
const infoCountry = document.getElementById('infoCountry');
const infoLocation = document.getElementById('infoLocation');
const infoTime = document.getElementById('infoTime');
const camImage = document.getElementById('cam-image');

// ==========================================
// 初期化
// ==========================================
function initApp() {
    pickRandomCamera();
    updateInfoDisplay();
    updateImage();
    startImageAutoUpdate();
}

// ==========================================
// ロジックとトランジション制御
// ==========================================

// Windy特有の画像URLを生成するヘルパー関数
function getWindyImageUrl(id) {
    const tail = id.slice(-2);
    // キャッシュ回避のためにタイムスタンプを付与
    return `https://images-webcams.windy.com/${tail}/${id}/current/full/${id}.jpg?t=${new Date().getTime()}`;
}

// 画面の画像を更新する処理
function updateImage() {
    const cam = cameraList[currentCamIndex];
    if (cam && camImage) {
        camImage.src = getWindyImageUrl(cam.id);
    }
}

// 30秒ごとに自動で画像を再読み込みするタイマー
function startImageAutoUpdate() {
    if (imageUpdateInterval) {
        clearInterval(imageUpdateInterval);
    }
    imageUpdateInterval = setInterval(() => {
        updateImage();
    }, 30000);
}

function pickRandomCamera() {
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * cameraList.length);
    } while (newIndex === currentCamIndex);
    currentCamIndex = newIndex;
}

// Nextボタンを押したときの詳細なアニメーション連動処理
function processNextCamera() {
    if (isTransitioning) return;
    
    isTransitioning = true;
    nextBtn.disabled = true;

    // ① コンテナに `is-transitioning` クラスを付与してCSSアニメーション開始
    body.classList.add('is-transitioning');
    
    let midPointDelay = 900; 
    let endDelay = 800;

    // 飛行機モードのみアニメーションを3秒に延長
    if (currentThemeClass === 'theme-airplane') {
        midPointDelay = 1500;
        endDelay = 1500;
    }

    setTimeout(() => {
        // 次のカメラをピック
        pickRandomCamera();
        
        // 画像を切り替え、30秒自動更新タイマーをリセット
        updateImage();
        startImageAutoUpdate();
        
        updateInfoDisplay();
        
        // ③ さらに時間が経過したら、トランジションを外す
        setTimeout(() => {
            body.classList.remove('is-transitioning');
            isTransitioning = false;
            nextBtn.disabled = false;
        }, endDelay);
        
    }, midPointDelay);
}


function updateInfoDisplay() {
    const cam = cameraList[currentCamIndex];
    if (!cam) return;

    infoCountry.textContent = sanitizeText(cam.country);
    infoLocation.textContent = sanitizeText(cam.location);
    
    startClock(); 
}

function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    
    const cam = cameraList[currentCamIndex];
    if (!cam) return;

    const tz = cam.timeZone;
    
    const tick = () => {
        try {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                timeZone: tz,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            infoTime.textContent = timeString;
        } catch (e) {
            infoTime.textContent = "--:--:--";
        }
    };
    
    tick();
    clockInterval = setInterval(tick, 1000);
}

// ==========================================
// イベントリスナー
// ==========================================
nextBtn.addEventListener('click', () => {
    processNextCamera();
});

themeSelect.addEventListener('change', (e) => {
    body.classList.remove(currentThemeClass);
    currentThemeClass = e.target.value;
    body.classList.add(currentThemeClass);
});

// 実行
initApp();
