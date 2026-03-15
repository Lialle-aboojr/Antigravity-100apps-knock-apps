/**
 * World Live Cam Roulette - Main Logic
 * Uses standard HTML5 <video> for reliable preview testing.
 */

// 安全なDOM挿入のためのユーティリティ (XSS対策)
function sanitizeText(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==========================================
// 📺 テスト用MP4動画データ
// ==========================================
const cameraList = [
    { src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', country: 'テスト国A', location: 'ウサギの森', timeZone: 'America/New_York' },
    { src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', country: 'テスト国B', location: '機械の街', timeZone: 'Europe/London' },
    { src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', country: 'テスト国C', location: '海岸沿い', timeZone: 'Asia/Tokyo' },
    { src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', country: 'テスト国D', location: 'SF研究所', timeZone: 'Australia/Sydney' }
];

// ==========================================
// 状態管理
// ==========================================
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
    pickRandomCamera(); // 最初のカメラを選択
    
    // UIを初期情報で更新
    updateInfoDisplay();
    
    // 動画のソースを設定して再生
    mainVideo.src = cameraList[currentCamIndex].src;
    mainVideo.play().catch(e => console.error("Auto-play was prevented:", e));
}

// ==========================================
// アプリケーションロジック
// ==========================================

function pickRandomCamera() {
    let newIndex;
    if (cameraList.length <= 1) {
        newIndex = 0;
    } else {
        do {
            newIndex = Math.floor(Math.random() * cameraList.length);
        } while (newIndex === currentCamIndex); 
    }
    currentCamIndex = newIndex;
}

// 動画とUIの読み込み
function loadNextCameraUnsafe() {
    pickRandomCamera();
    
    // UIのテキスト情報を更新
    updateInfoDisplay();
    
    // 動画ソースを切り替えて再生
    mainVideo.src = cameraList[currentCamIndex].src;
    mainVideo.play().then(() => {
        // 再生が開始したらトランジションを外す
        endTransitionIfStillTransitioning();
    }).catch(e => {
        console.error("Video playback error:", e);
        endTransitionIfStillTransitioning();
    });
}

// Nextボタンを押したときの処理（アニメーションを伴う）
function loadNextCameraWithTransition() {
    if (isTransitioning) return;
    
    isTransitioning = true;
    nextBtn.disabled = true;

    // 現在のテーマに応じたトランジションクラスを付与
    const themeName = currentThemeClass.split('-')[1];
    body.classList.add(`is-transitioning-${themeName}`);

    // CSSアニメーションの画面が覆われるタイミング（0.4秒後）で動画を切り替える
    setTimeout(() => {
        loadNextCameraUnsafe();
        
        // 【フェイルセーフ】動画が再生状態にならなくてもトランジションを外す
        setTimeout(() => {
            endTransitionIfStillTransitioning();
        }, 1500);

    }, 400);
}

// トランジションを強制解除する処理
function endTransitionIfStillTransitioning() {
    if (!isTransitioning) return;
    
    body.classList.remove('is-transitioning-window', 'is-transitioning-tv', 'is-transitioning-airplane', 'is-transitioning-simple');
    isTransitioning = false;
    nextBtn.disabled = false;
}

// 情報エリアの更新
function updateInfoDisplay() {
    const cam = cameraList[currentCamIndex];
    if (!cam) return;

    // XSS対策でテキストを安全に挿入
    infoCountry.textContent = sanitizeText(cam.country);
    infoLocation.textContent = sanitizeText(cam.location);
    
    // タイムゾーンが変わるのでクロック再始動
    startClock(); 
}

// 現地時計のループ
function startClock() {
    if (clockInterval) {
        clearInterval(clockInterval);
    }
    
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

// Nextボタンクリック
nextBtn.addEventListener('click', () => {
    loadNextCameraWithTransition();
});

// テーマ変更
themeSelect.addEventListener('change', (e) => {
    body.classList.remove(currentThemeClass);
    currentThemeClass = e.target.value;
    body.classList.add(currentThemeClass);
});

// アプリの開始
initApp();
