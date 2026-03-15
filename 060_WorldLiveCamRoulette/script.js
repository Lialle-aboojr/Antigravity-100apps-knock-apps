/**
 * World Live Cam Roulette - Main Logic
 * Integrates YouTube Iframe API (4K Scenic Videos) with rich CSS theme transitions.
 */

function sanitizeText(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// 🌍 YouTube 4K風景動画データリスト
const cameraList = [
    { id: 'LXb3EKWsInQ', country: 'コスタリカ / Costa Rica', location: '熱帯雨林の絶景 / Tropical Rainforest 4K', timeZone: 'America/Costa_Rica' },
    { id: 'FzcfZyEhOoI', country: 'スイス / Switzerland', location: 'アルプスと鉄道 / Swiss Alps 4K', timeZone: 'Europe/Zurich' },
    { id: 'b6KT9ImNwzk', country: 'アメリカ / USA', location: 'タイムズスクエア / Times Square 4K', timeZone: 'America/New_York' },
    { id: '9QeS3o6QXEU', country: '日本 / Japan', location: '渋谷スクランブル交差点 / Shibuya 4K', timeZone: 'Asia/Tokyo' },
    { id: 'Vg1mpD1BICI', country: 'イタリア / Italy', location: 'ヴェネツィア / Venice 4K', timeZone: 'Europe/Rome' },
    { id: 'sY-8HGaGv1M', country: 'フランス / France', location: 'エッフェル塔周辺 / Paris 4K', timeZone: 'Europe/Paris' },
    { id: 'HvdK_3x1Otc', country: 'ケニア / Kenya', location: 'サバンナの野生動物 / African Safari 4K', timeZone: 'Africa/Nairobi' },
    { id: '2R2gb0MKJlo', country: 'イギリス / UK', location: 'ロンドン市街地 / London Walk 4K', timeZone: 'Europe/London' }
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
    
    // YouTube APIの動的読み込み
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
            'rel': 0,
            'loop': 1,
            'disablekb': 1,
            'modestbranding': 1,
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
    // エラーハンドリング: 自動スキップはせず、ユーザーの操作を待つ（無限ループ防止）
    console.warn('YouTube Player Error:', event.data);
    infoCountry.textContent = "Error";
    infoLocation.textContent = "動画を再生できません。Nextを押してください";
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
    // playerの機能がまだ準備できていない場合は無視
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
        
        // YouTube APIで新しい動画を読み込んで再生
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
