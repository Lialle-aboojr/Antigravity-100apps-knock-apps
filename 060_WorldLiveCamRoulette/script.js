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
        id: '1-iS7Lmh5BM', 
        country: { ja: '日本', en: 'Japan' }, 
        location: { ja: '渋谷スクランブル交差点', en: 'Shibuya Scramble Crossing' }, 
        tz: 'Asia/Tokyo' 
    },
    { 
        id: 'mRe-514tGLs', 
        country: { ja: 'アメリカ', en: 'USA' }, 
        location: { ja: 'ニューヨーク タイムズスクエア', en: 'New York Times Square' }, 
        tz: 'America/New_York' 
    },
    { 
        id: '2HjQ1Q7XwKE', 
        country: { ja: '宇宙', en: 'Space' }, 
        location: { ja: 'ISS 国際宇宙ステーション', en: 'ISS Live Stream' }, 
        tz: 'UTC' // ISSは標準時を採用
    },
    { 
        id: '1eFWIAzK8aA', 
        country: { ja: '南アフリカ', en: 'South Africa' }, 
        location: { ja: 'テンベ・エレファント・パーク', en: 'Tembe Elephant Park' }, 
        tz: 'Africa/Johannesburg' 
    },
    { 
        id: '1-GvjH-O6L4', 
        country: { ja: 'イギリス', en: 'UK' }, 
        location: { ja: 'ロンドン アビイ・ロード', en: 'London Abbey Road' }, 
        tz: 'Europe/London' 
    },
    { 
        id: 'g3i1wimk8hE', 
        country: { ja: 'イタリア', en: 'Italy' }, 
        location: { ja: 'ヴェネツィア リアルト橋', en: 'Venice Rialto Bridge' }, 
        tz: 'Europe/Rome' 
    },
    { 
        id: 'WjK64wGclbE', 
        country: { ja: 'アメリカ', en: 'USA' }, 
        location: { ja: 'ハワイ ワイキキビーチ', en: 'Hawaii Waikiki Beach' }, 
        tz: 'Pacific/Honolulu' 
    },
    { 
        id: 'tTZB01p9fJ4', 
        country: { ja: 'オーストラリア', en: 'Australia' }, 
        location: { ja: 'シドニー オペラハウス', en: 'Sydney Opera House' }, 
        tz: 'Australia/Sydney' 
    },
    { 
        id: 'r_vI_q1s-9E', 
        country: { ja: 'ブラジル', en: 'Brazil' }, 
        location: { ja: 'リオデジャネイロ コパカバーナ', en: 'Rio de Janeiro Copacabana' }, 
        tz: 'America/Sao_Paulo' 
    },
    { 
        id: 'pZMDv03I3lA', 
        country: { ja: 'フランス', en: 'France' }, 
        location: { ja: 'パリ エッフェル塔', en: 'Paris Eiffel Tower' }, 
        tz: 'Europe/Paris' 
    },
    { 
        id: 'E1B2qN55mXU', 
        country: { ja: 'カナダ', en: 'Canada' }, 
        location: { ja: 'ナイアガラの滝', en: 'Niagara Falls' }, 
        tz: 'America/Toronto' 
    },
    { 
        id: '8vEwO1LioP8', 
        country: { ja: 'アイスランド', en: 'Iceland' }, 
        location: { ja: 'レイキャビク 街並み', en: 'Reykjavík City View' }, 
        tz: 'Atlantic/Reykjavik' 
    },
    { 
        id: '49Kk3_5mH-8', 
        country: { ja: 'スイス', en: 'Switzerland' }, 
        location: { ja: 'ツェルマット マッターホルン', en: 'Zermatt Matterhorn' }, 
        tz: 'Europe/Zurich' 
    },
    { 
        id: '3j-XgGkwwlY', 
        country: { ja: 'エジプト', en: 'Egypt' }, 
        location: { ja: 'ギザのピラミッド', en: 'Pyramids of Giza' }, 
        tz: 'Africa/Cairo' 
    },
    { 
        id: 'qE-uA3A1_C4', 
        country: { ja: 'タイ', en: 'Thailand' }, 
        location: { ja: 'パタヤ ウォーキングストリート', en: 'Pattaya Walking Street' }, 
        tz: 'Asia/Bangkok' 
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

// DOM Elements
const body = document.body;
const themeSelect = document.getElementById('themeSelect');
const nextBtn = document.getElementById('nextBtn');
const infoCountry = document.getElementById('infoCountry');
const infoLocation = document.getElementById('infoLocation');
const infoTime = document.getElementById('infoTime');
const transitionLayer = document.getElementById('transition-layer');

// YouTube IFrame API の準備完了時に呼ばれるグローバル関数
window.onYouTubeIframeAPIReady = function() {
    pickRandomCamera(); // 最初のカメラを選択
    
    player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: CAMERAS[currentCamIndex].id,
        playerVars: {
            'autoplay': 1,
            'mute': 1,          // ブラウザの自動再生ポリシー対策でミュート必須
            'controls': 0,      // コントロールバー非表示
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
    startClock();
}

function onPlayerStateChange(event) {
    // YT.PlayerState.PLAYING == 1
    if (event.data === YT.PlayerState.PLAYING) {
        if (isTransitioning) {
            endTransition();
        }
    }
}

// API・動画読み込みエラー時のフォールバック処理
function onPlayerError(event) {
    console.warn("YouTube Player Error:", event.data, "- Skipping to next camera.");
    // UIを壊さずに次のカメラへスキップする
    loadNextCameraUnsafe();
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

function loadNextCameraUnsafe() {
    pickRandomCamera();
    if (player && player.loadVideoById) {
        player.loadVideoById({
            videoId: CAMERAS[currentCamIndex].id
        });
        updateInfoDisplay();
    }
}

function loadNextCameraWithTransition() {
    if (isTransitioning || !player) return;
    
    isTransitioning = true;
    nextBtn.disabled = true;

    // 現在のテーマに応じたトランジションクラスを付与
    const transClass = `is-transitioning-${currentThemeClass.split('-')[1]}`;
    body.classList.add(transClass);

    // CSSアニメーションの画面が覆われるタイミング（例：0.5秒後）で動画を切り替える
    setTimeout(() => {
        loadNextCameraUnsafe();
    }, 500);
}

function endTransition() {
    // 動画の再生が始まったらトランジションクラスを外して画面を見せる
    const transClass = `is-transitioning-${currentThemeClass.split('-')[1]}`;
    body.classList.remove(transClass);
    
    // アニメーション完了を待ってからボタンを有効化 (余裕を見て0.8秒)
    setTimeout(() => {
        isTransitioning = false;
        nextBtn.disabled = false;
    }, 800);
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
