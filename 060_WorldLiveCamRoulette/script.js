/**
 * World Live Cam Roulette - Main Logic
 * Manages standard HTML5 <video> with rich CSS theme transitions.
 */

function sanitizeText(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// 📺 テスト用MP4動画データ (Google公式サンプル)
const cameraList = [
    { src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', country: 'テスト国A', location: 'ウサギの森', timeZone: 'America/New_York' },
    { src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', country: 'テスト国B', location: '機械の街', timeZone: 'Europe/London' },
    { src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', country: 'テスト国C', location: '海岸沿い', timeZone: 'Asia/Tokyo' },
    { src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', country: 'テスト国D', location: 'SF研究所', timeZone: 'Australia/Sydney' }
];

// 状態管理
let currentCamIndex = -1;
let clockInterval = null;
let isTransitioning = false;
let currentThemeClass = 'theme-window';

// DOM Elements
const body = document.body;
const themeSelect = document.getElementById('themeSelect');
const nextBtn = document.getElementById('nextBtn');
const infoCountry = document.getElementById('infoCountry');
const infoLocation = document.getElementById('infoLocation');
const infoTime = document.getElementById('infoTime');
const mainVideo = document.getElementById('main-video');

// ==========================================
// 初期化
// ==========================================
function initApp() {
    pickRandomCamera();
    updateInfoDisplay();
    
    // 設定して再生
    mainVideo.src = cameraList[currentCamIndex].src;
    mainVideo.play().catch(e => console.error(e));
}

// ==========================================
// ロジックとトランジション制御
// ==========================================
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

    // 飛行機モードのみアニメーションを4秒に延長（半分で動画切り替え、残り半分で開く）
    if (currentThemeClass === 'theme-airplane') {
        midPointDelay = 2000;
        endDelay = 2000;
    }

    setTimeout(() => {
        // 次のカメラをピック
        pickRandomCamera();
        
        // 動画のソースとUIを更新
        mainVideo.src = cameraList[currentCamIndex].src;
        mainVideo.play().catch(e => console.error(e));
        
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
