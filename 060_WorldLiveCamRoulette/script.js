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
// 📺 ライブカメラデータ (最低15個のバリアント)
// ==========================================
// id: YouTubeのVideo ID (URLの ?v=XXX の部分)
// country: 国名 (日/英)
// location: 場所の詳細 (日/英)
// tz: タイムゾーン識別子 (IANA Time Zone Database)
const CAMERAS = [
    { 
        id: 'LXb3EKWsInQ', // [テスト用] Costa Rica 4K等の確実な風景動画
        country: { ja: '日本', en: 'Japan' }, 
        location: { ja: '東京 (デモ映像)', en: 'Tokyo (Demo Video)' }, 
        tz: 'Asia/Tokyo' 
    },
    { 
        id: 'aqz-KE-bpKQ', // [テスト用] Big Buck Bunny
        country: { ja: 'アメリカ', en: 'USA' }, 
        location: { ja: 'ニューヨーク (デモ映像)', en: 'New York (Demo Video)' }, 
        tz: 'America/New_York' 
    },
    { 
        id: 'LXb3EKWsInQ', 
        country: { ja: '宇宙', en: 'Space' }, 
        location: { ja: 'ISS (デモ映像)', en: 'ISS (Demo Video)' }, 
        tz: 'UTC'
    },
    { 
        id: 'aqz-KE-bpKQ', 
        country: { ja: '南アフリカ', en: 'South Africa' }, 
        location: { ja: 'サバンナ (デモ映像)', en: 'Savanna (Demo Video)' }, 
        tz: 'Africa/Johannesburg' 
    },
    { 
        id: 'LXb3EKWsInQ', 
        country: { ja: 'イタリア', en: 'Italy' }, 
        location: { ja: 'ヴェネツィア (デモ映像)', en: 'Venice (Demo Video)' }, 
        tz: 'Europe/Rome' 
    },
    { 
        id: 'aqz-KE-bpKQ', 
        country: { ja: 'アメリカ', en: 'USA' }, 
        location: { ja: 'ハワイ (デモ映像)', en: 'Hawaii (Demo Video)' }, 
        tz: 'Pacific/Honolulu' 
    },
    { 
        id: 'LXb3EKWsInQ', 
        country: { ja: 'オーストラリア', en: 'Australia' }, 
        location: { ja: 'シドニー (デモ映像)', en: 'Sydney (Demo Video)' }, 
        tz: 'Australia/Sydney' 
    },
    { 
        id: 'aqz-KE-bpKQ', 
        country: { ja: 'ブラジル', en: 'Brazil' }, 
        location: { ja: 'リオデジャネイロ (デモ映像)', en: 'Rio (Demo Video)' }, 
        tz: 'America/Sao_Paulo' 
    },
    { 
        id: 'LXb3EKWsInQ', 
        country: { ja: 'フランス', en: 'France' }, 
        location: { ja: 'パリ (デモ映像)', en: 'Paris (Demo Video)' }, 
        tz: 'Europe/Paris' 
    },
    { 
        id: 'aqz-KE-bpKQ', 
        country: { ja: 'カナダ', en: 'Canada' }, 
        location: { ja: 'ナイアガラ (デモ映像)', en: 'Niagara (Demo Video)' }, 
        tz: 'America/Toronto' 
    },
    { 
        id: 'LXb3EKWsInQ', 
        country: { ja: 'アイスランド', en: 'Iceland' }, 
        location: { ja: 'レイキャビク (デモ映像)', en: 'Reykjavík (Demo Video)' }, 
        tz: 'Atlantic/Reykjavik' 
    },
    { 
        id: 'aqz-KE-bpKQ', 
        country: { ja: 'スイス', en: 'Switzerland' }, 
        location: { ja: 'アルプス (デモ映像)', en: 'Alps (Demo Video)' }, 
        tz: 'Europe/Zurich' 
    },
    { 
        id: 'LXb3EKWsInQ', 
        country: { ja: 'エジプト', en: 'Egypt' }, 
        location: { ja: 'ピラミッド (デモ映像)', en: 'Pyramids (Demo Video)' }, 
        tz: 'Africa/Cairo' 
    },
    { 
        id: 'aqz-KE-bpKQ', 
        country: { ja: 'タイ', en: 'Thailand' }, 
        location: { ja: 'バンコク (デモ映像)', en: 'Bangkok (Demo Video)' }, 
        tz: 'Asia/Bangkok' 
    },
    { 
        id: 'LXb3EKWsInQ', 
        country: { ja: 'UAE', en: 'UAE' }, 
        location: { ja: 'ドバイ (デモ映像)', en: 'Dubai (Demo Video)' }, 
        tz: 'Asia/Dubai' 
    }
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
        videoId: CAMERAS[currentCamIndex].id,
        playerVars: {
            'autoplay': 1,      // 自動再生フラグ
            'mute': 1,          // ブラウザ自動再生ポリシー対応（必須）
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

// 【ルーレットが回り続けるバグ修正】
// API・動画読み込みエラー時のフォールバック処理を安全に
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
    if (CAMERAS.length <= 1) {
        newIndex = 0;
    } else {
        do {
            newIndex = Math.floor(Math.random() * CAMERAS.length);
        } while (newIndex === currentCamIndex); // 同じものが連続しないように
    }
    currentCamIndex = newIndex;
}

// 無条件で次のカメラの動画を読み込む部分（エラー・切り替え用）
function loadNextCameraUnsafe() {
    pickRandomCamera();
    if (player && player.loadVideoById) {
        player.loadVideoById({
            videoId: CAMERAS[currentCamIndex].id
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
    const cam = CAMERAS[currentCamIndex];
    if (!cam) return;

    // textContent を使って安全に文字を挿入 (XSS対策)
    infoCountry.textContent = `${cam.country.ja} / ${cam.country.en}`;
    infoLocation.textContent = `${cam.location.ja} / ${cam.location.en}`;
    
    startClock(); // タイムゾーンが変わるのでクロック再始動
}

// 現地時計のループ
function startClock() {
    if (clockInterval) {
        clearInterval(clockInterval);
    }
    
    const cam = CAMERAS[currentCamIndex];
    if (!cam) return;

    const tz = cam.tz;
    
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
