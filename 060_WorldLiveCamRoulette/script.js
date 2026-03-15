/**
 * World Live Cam Roulette - Main Logic
 * Handles standard YouTube Player API initialization and fallback failsafes
 */

// 安全なDOM挿入のためのユーティリティ (XSS対策)
function sanitizeText(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==========================================
// 📺 ライブカメラデータ
// ==========================================
const cameraList = [
  { id: 'LXb3EKWsInQ', country: 'コスタリカ / Costa Rica', location: '大自然 / Nature (4K)', timeZone: 'America/Costa_Rica' },
  { id: 'b6KT9ImNwzk', country: 'アメリカ / USA', location: 'タイムズスクエア / Times Square', timeZone: 'America/New_York' },
  { id: 'M7lc1UVf-VE', country: 'テスト用 / Test', location: 'YouTube開発者公式 / YT Official', timeZone: 'America/Los_Angeles' },
  { id: 'qU69nyfy2XQ', country: 'コスタリカ / Costa Rica', location: '熱帯雨林 / Rainforest', timeZone: 'America/Costa_Rica' },
  { id: 'F109TZt3nRc', country: 'テスト用 / Test', location: 'YouTubeデモ / YT Demo', timeZone: 'America/Los_Angeles' }
];

// ==========================================
// 状態管理
// ==========================================
let player = null;
let currentCamIndex = -1;
let clockInterval = null;
let isTransitioning = false;
let currentThemeClass = 'theme-window';
let apiLoadTimeout = null; // APIロードフリーズ対策用タイマー

// DOM Elements
const body = document.body;
const themeSelect = document.getElementById('themeSelect');
const nextBtn = document.getElementById('nextBtn');
const infoCountry = document.getElementById('infoCountry');
const infoLocation = document.getElementById('infoLocation');
const infoTime = document.getElementById('infoTime');
const transitionLayer = document.getElementById('transition-layer');
const fallbackMessage = document.getElementById('fallback-message');

// ==========================================
// 初期化・スクリプト動的読み込み
// ==========================================
function initApp() {
    pickRandomCamera(); // 最初のカメラを選択
    
    // 【フェイルセーフ】3秒経ってもAPIが読み込めない場合は、フリーズを防ぐためにローディング状態を解除
    apiLoadTimeout = setTimeout(() => {
        console.warn("YouTube API load timeout. Forcing UI enable.");
        updateInfoDisplay();
        fallbackMessage.classList.add('show');
        nextBtn.disabled = false;
    }, 3000);

    // Youtube IFrame APIをロード
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// ----------------------------------------------------
// YouTube API 準備完了
// ----------------------------------------------------
window.onYouTubeIframeAPIReady = function() {
    // APIが無事にロードされたのでタイムアウトを解除
    if (apiLoadTimeout) clearTimeout(apiLoadTimeout);
    
    // UIを初期情報で更新
    updateInfoDisplay();
    
    // 最も標準的な `new YT.Player` を用いてdivを自動でiframeに置換する
    player = new YT.Player('youtube-player', {
        videoId: cameraList[currentCamIndex].id,
        playerVars: {
            'autoplay': 1,      
            'mute': 1,          
            'controls': 1,      
            'playsinline': 1,
            'rel': 0,
            'modestbranding': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
};

function onPlayerReady(event) {
    nextBtn.disabled = false;
    event.target.playVideo();
}

function onPlayerStateChange(event) {
    // 動画の再生が始まったらフォールバックメッセージを消し、トランジションを外す
    if (event.data === YT.PlayerState.PLAYING) {
        fallbackMessage.classList.remove('show');
        endTransitionIfStillTransitioning();
    }
}

// ----------------------------------------------------
// エラー対応 (自動スキップの廃止と手動操作の維持)
// ----------------------------------------------------
function onPlayerError(event) {
    console.warn("YouTube Player Error (Playback Restricted):", event.data);
    
    // 自動スキップループは完全に停止し、プレビュー制限のメッセージを表示する
    fallbackMessage.classList.add('show');
    
    // トランジションで画面が隠れたままにならないよう強制的に解除し、UIを操作可能にする
    endTransitionIfStillTransitioning();
    nextBtn.disabled = false;
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
    
    // UIのテキスト情報（国名、時刻など）はAPIの状態に関係なく100%確実に更新する
    updateInfoDisplay();
    
    // 動画をロードする前に一端フォールバックメッセージを消す
    fallbackMessage.classList.remove('show');

    if (player && typeof player.loadVideoById === "function") {
        player.loadVideoById({
            videoId: cameraList[currentCamIndex].id
        });
    } else {
        // 万が一playerオブジェクトの初期化に失敗している場合
        fallbackMessage.classList.add('show');
    }
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
        
        // 【フェイルセーフ】最大1.5秒待って再生が始まらなければ、トランジションを強制解除する
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
    infoCountry.textContent = cam.country;
    infoLocation.textContent = cam.location;
    
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
