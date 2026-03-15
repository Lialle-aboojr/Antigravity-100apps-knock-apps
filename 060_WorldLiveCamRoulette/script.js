/**
 * World Live Cam Roulette - Main Logic
 * Manages YouTube IFrame Player API, live camera list, timezone clocks, and theme transitions.
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
// id: YouTubeのVideo ID (URLの ?v=XXX の部分)
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

// エラー連鎖による無限ループストッパー
let consecutiveErrors = 0;
let errorTimer = null;
let transitionFailsafe = null;

// DOM Elements
const body = document.body;
const themeSelect = document.getElementById('themeSelect');
const nextBtn = document.getElementById('nextBtn');
const infoCountry = document.getElementById('infoCountry');
const infoLocation = document.getElementById('infoLocation');
const infoTime = document.getElementById('infoTime');
const transitionLayer = document.getElementById('transition-layer');

// ==========================================
// 初期化・スクリプト動的読み込み
// ==========================================
function initApp() {
    pickRandomCamera(); // 最初のカメラを選択
    
    // Youtube IFrame APIを動的にロードする（HTMLに直書きするよりも確実）
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// YouTube IFrame API の準備完了時に呼ばれるグローバル関数
window.onYouTubeIframeAPIReady = function() {
    // プレイヤーの生成
    player = new YT.Player('youtube-player', {
        videoId: cameraList[currentCamIndex].id,
        playerVars: {
            'autoplay': 1,      // ブラウザ自動再生に対応
            'mute': 1,          // ブラウザの自動再生ポリシー対策でミュート必須
            'controls': 1,      // ユーザーが操作できるようにコントロールを表示
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
    updateInfoDisplay();
    // 確実に再生を試みる
    event.target.playVideo();
}

function onPlayerStateChange(event) {
    // 動画の再生が始まったらエラーカウントをリセットし、トランジションを外す
    if (event.data === YT.PlayerState.PLAYING) {
        consecutiveErrors = 0; 
        endTransitionIfStillTransitioning();
    }
}

// ==========================================
// API・動画読み込みエラー時のフォールバック処理
// ==========================================
function onPlayerError(event) {
    console.warn("YouTube Player Error:", event.data, "- Waiting 3 seconds before next camera.");
    consecutiveErrors++;
    
    // 3回連続でエラーになった場合は自動スキップを停止し、処理を止める
    if (consecutiveErrors >= 3) {
        console.error("3回連続で動画の読み込みに失敗しました。自動スキップ機能を停止します。");
        endTransitionIfStillTransitioning();
        return;
    }
    
    // 3秒（3000ms）待機してから次の動画へ切り替える (無限ループ防止)
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
        loadNextCameraUnsafe();
    }, 3000);
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
        } while (newIndex === currentCamIndex); // 同じものが連続しないように
    }
    currentCamIndex = newIndex;
}

// 無条件で次のカメラの動画を読み込む部分（エラー・切り替え用）
function loadNextCameraUnsafe() {
    pickRandomCamera();
    if (player && player.loadVideoById) {
        player.loadVideoById({
            videoId: cameraList[currentCamIndex].id
        });
        updateInfoDisplay();
    }
}

// Nextボタンを押したときの処理（アニメーションを伴う）
function loadNextCameraWithTransition() {
    if (isTransitioning || !player) return;
    
    isTransitioning = true;
    nextBtn.disabled = true;

    // 現在のテーマに応じたトランジションクラスを付与
    const themeName = currentThemeClass.split('-')[1];
    body.classList.add(`is-transitioning-${themeName}`);

    // CSSアニメーションの画面が覆われるタイミング（例：0.4秒後）で動画を切り替える
    setTimeout(() => {
        loadNextCameraUnsafe();
        
        // 【シンプルモード＆エラー時のフェールセーフ】
        // 最大3.5秒待ってもPLAYINGにならなければ、強制的にトランジションを外す
        if (transitionFailsafe) clearTimeout(transitionFailsafe);
        transitionFailsafe = setTimeout(() => {
            endTransitionIfStillTransitioning();
        }, 3500);

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

    // textContent を使って安全に文字を挿入 (XSS対策)
    infoCountry.textContent = cam.country;
    infoLocation.textContent = cam.location;
    
    startClock(); // タイムゾーンが変わるのでクロック再始動
}

// 現地時計のループ
function startClock() {
    if (clockInterval) {
        clearInterval(clockInterval);
    }
    
    const cam = cameraList[currentCamIndex];
    if (!cam) return;

    const tz = cam.timeZone;
    
    // 最初の1秒を待たずに即時実行するためにラップする
    const tick = () => {
        try {
            const now = new Date();
            // 指定されたタイムゾーンでの時刻文字列を生成
            const timeString = now.toLocaleTimeString('en-US', {
                timeZone: tz,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            infoTime.textContent = timeString;
        } catch (e) {
            // 万が一未知のタイムゾーン等のエラーがあった場合
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
    // 古いテーマのクラスを除去
    body.classList.remove(currentThemeClass);
    // 新しいテーマのクラスを付与
    currentThemeClass = e.target.value;
    body.classList.add(currentThemeClass);
});

// アプリの開始
initApp();
