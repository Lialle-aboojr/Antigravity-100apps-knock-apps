/**
 * World Live Cam Roulette - Main Logic
 * Integrates YouTube Iframe API with rich CSS theme transitions.
 */

function sanitizeText(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// 🌍 ライブカメラ＆風景動画データリスト (YouTube ID表記)
const cameraList = [
    { id: 'LXb3EKWsInQ', country: 'コスタリカ / Costa Rica', location: '大自然の野鳥 / Nature Birds', timeZone: 'America/Costa_Rica' },
    { id: 'b6KT9ImNwzk', country: 'アメリカ / USA', location: 'タイムズスクエア / Times Square', timeZone: 'America/New_York' },
    { id: 'OWXEGjX0Cng', country: '日本 / Japan', location: '渋谷スクランブル交差点 / Shibuya Crossing', timeZone: 'Asia/Tokyo' },
    { id: 'HpdO5Kq3o7Y', country: '宇宙 / Space', location: '国際宇宙ステーション / ISS LIVE', timeZone: 'UTC' },
    { id: '1-iS7Lmh5EE', country: 'イタリア / Italy', location: 'ヴェネツィア / Venice', timeZone: 'Europe/Rome' },
    { id: 'ydYDnHxsB74', country: '南アフリカ / South Africa', location: 'サバンナの水飲み場 / Kruger Safari', timeZone: 'Africa/Johannesburg' },
    { id: 'aJTosX_2sO8', country: 'スイス / Switzerland', location: 'ベルニーナ急行 / Bernina Express', timeZone: 'Europe/Zurich' },
    { id: 'h7U6-N1M4P0', country: 'アメリカ / USA', location: 'ジャクソンホール / Jackson Hole', timeZone: 'America/Boise' },
    { id: 'w1A2I8p6a8M', country: '日本 / Japan', location: '草津温泉 / Kusatsu Onsen', timeZone: 'Asia/Tokyo' },
    { id: 'uI1rV4nJz8I', country: 'イギリス / UK', location: 'アビーロード / Abbey Road', timeZone: 'Europe/London' },
    { id: 'Pz2U6O-X2uA', country: 'オーストリア / Austria', location: 'ザルツブルク / Salzburg', timeZone: 'Europe/Vienna' },
    { id: 'JqOIt7X0m6I', country: 'オーストラリア / Australia', location: 'シドニー港 / Sydney Harbour', timeZone: 'Australia/Sydney' },
    { id: '5E2t3e8uN7w', country: 'カナダ / Canada', location: 'バンフ国立公園 / Banff National Park', timeZone: 'America/Edmonton' },
    { id: 'ZVQm6g_v2Sg', country: 'フランス / France', location: 'モンブラン / Mont Blanc', timeZone: 'Europe/Paris' },
    { id: '-71tW0m3G1M', country: 'ノルウェー / Norway', location: 'オーロラ / Northern Lights', timeZone: 'Europe/Oslo' }
];

// 状態管理
let currentCamIndex = -1;
let clockInterval = null;
let isTransitioning = false;
let currentThemeClass = 'theme-window';
let player = null;

// DOM Elements
const body = document.body;
const themeSelect = document.getElementById('themeSelect');
const nextBtn = document.getElementById('nextBtn');
const infoCountry = document.getElementById('infoCountry');
const infoLocation = document.getElementById('infoLocation');
const infoTime = document.getElementById('infoTime');


// ==========================================
// 初期化・YouTube Iframe API
// ==========================================
function initApp() {
    pickRandomCamera();
    updateInfoDisplay();
    
    // YouTube APIの読み込み
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// YT APIが準備完了した際に呼ばれるグローバル関数
window.onYouTubeIframeAPIReady = function() {
    const cam = cameraList[currentCamIndex];
    player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: cam.id,
        playerVars: {
            'autoplay': 1,
            'mute': 1,
            'controls': 0,
            'disablekb': 1,
            'modestbranding': 1,
            'rel': 0,
            'playsinline': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
};

function onPlayerReady(event) {
    // API読み込み完了したらボタンを活性化
    nextBtn.disabled = false;
    event.target.playVideo();
}

function onPlayerStateChange(event) {
    // 動画の再生が終了したら最初からループ再生
    if (event.data === YT.PlayerState.ENDED) {
        player.playVideo();
    }
}

function onPlayerError(event) {
    // エラーハンドリング: 自動スキップはせず、ユーザーの操作を待つ
    console.warn('YouTube Player Error:', event.data);
    infoCountry.textContent = "Error";
    infoLocation.textContent = "動画を再生できません。Nextを押してください";
    // ボタンの無効化を解除して次へ行けるようにする
    nextBtn.disabled = false;
    isTransitioning = false;
    body.classList.remove('is-transitioning');
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
    if (isTransitioning || !player || typeof player.loadVideoById !== 'function') return;
    
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
        
        // YouTube APIで動画を切り替え
        player.loadVideoById(cameraList[currentCamIndex].id);
        
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
