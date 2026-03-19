/**
 * Network Status Checker
 * ネット接続状況チェッカー (Retro RPG Style)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM要素の取得 ---
  const hpBar = document.getElementById('hpBar');
  const messageBox = document.getElementById('messageBox');
  const heroIconImg = document.getElementById('heroIconImg');
  const logList = document.getElementById('logList');
  
  const statDownlink = document.getElementById('statDownlink');
  const statType = document.getElementById('statType');
  const statRtt = document.getElementById('statRtt');
  const apiNote = document.getElementById('apiNote');
  const refreshBtn = document.getElementById('refreshBtn');

  // 新しいファビコンのフォールバック処理 (RPG風絵文字 ⚔️ を Data URI変換)
  const fallbackFavicon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚔️</text></svg>';
  const favicon = document.getElementById('favicon');
  favicon.addEventListener('error', () => {
    favicon.href = fallbackFavicon;
  });

  // --- 状態の定義 ---
  const STATES = {
    FAST: {
      hpWidth: '100%',
      hpColor: 'var(--hp-green)',
      heroClass: '', // 通常
      msgJp: '勇者は 元気いっぱいだ！',
      msgEn: 'The hero is full of energy!'
    },
    SLOW: {
      hpWidth: '50%',
      hpColor: 'var(--hp-yellow)',
      heroClass: 'hero-tired', // 少し疲れているエフェクト
      msgJp: '勇者は 少し 疲れているようだ…',
      msgEn: 'The hero looks a bit tired...'
    },
    OFFLINE: {
      hpWidth: '0%',
      hpColor: 'var(--hp-red)',
      heroClass: 'hero-dead', // モノクロエフェクト
      msgJp: 'おお ゆうしゃよ！ ネットが しんでしまうとは なにごとだ！',
      msgEn: 'Oh Hero! How could the network die!'
    }
  };

  let currentState = null;

  // --- メイン更新関数 ---
  function updateNetworkStatus() {
    const isOnline = navigator.onLine;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    let newStateKey = 'FAST';
    let type = 'Unknown';
    let downlink = 'Unknown';
    let rtt = 'Unknown';

    if (!isOnline) {
      newStateKey = 'OFFLINE';
    } else if (connection) {
      // APIが利用可能な場合、詳細情報を取得
      type = connection.effectiveType || 'Unknown';
      downlink = connection.downlink !== undefined ? `${connection.downlink} Mbps` : 'Unknown';
      rtt = connection.rtt !== undefined ? `${connection.rtt} ms` : 'Unknown ms';

      // 速度による状況判定 (3g以下、または1Mbps以下ならSLOW)
      if (type === 'slow-2g' || type === '2g' || type === '3g' || (connection.downlink !== undefined && connection.downlink < 1.0)) {
        newStateKey = 'SLOW';
      }
    } else {
      // API非対応だがオンラインの場合
      apiNote.textContent = '※詳細なつよさ(Network API)は測定不能です / Network API unsupported';
      newStateKey = 'FAST';
    }

    // --- DOMの更新 ---
    const state = STATES[newStateKey];
    
    // HPゲージ
    hpBar.style.width = state.hpWidth;
    hpBar.style.backgroundColor = state.hpColor;
    
    // アイコンのクラス切り替え（エフェクト用）
    heroIconImg.className = 'hero-icon-img ' + state.heroClass;

    // メッセージ生成（XSS対策として textContent と DOMツリーの構築を利用）
    messageBox.innerHTML = ''; // 既存の中身を安全にクリア
    
    const jpSpan = document.createElement('span');
    jpSpan.className = 'message-jp';
    jpSpan.textContent = state.msgJp;
    
    const enSpan = document.createElement('span');
    enSpan.className = 'message-en';
    enSpan.textContent = state.msgEn;
    
    messageBox.appendChild(jpSpan);
    messageBox.appendChild(enSpan);

    // ステータス(つよさ)の更新
    statType.textContent = type;
    statDownlink.textContent = downlink;
    statRtt.textContent = rtt;

    // 状態が変化した時だけログを記録 (初期読み込みも含む)
    if (currentState !== newStateKey) {
      addLogEntry(newStateKey, currentState === null);
      currentState = newStateKey;
    }
  }

  // --- ログ追加関数 (XSS対策済み) ---
  function addLogEntry(stateKey, isInitial) {
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    let logMsg = '';
    let msgClass = '';

    if (stateKey === 'OFFLINE') {
      logMsg = '通信が とぎれた！ (Offline)';
      msgClass = 'log-msg-offline';
    } else if (stateKey === 'SLOW') {
      logMsg = '通信が おそくなったようだ… (Slow)';
      msgClass = 'log-msg-slow';
    } else {
      if (isInitial) {
        logMsg = 'ぼうけんが はじまった！ (System Ready)';
      } else {
        logMsg = 'つうしんが あんていした！ (Online / Fast)';
      }
      msgClass = 'log-msg-online';
    }

    const li = document.createElement('li');
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = timeString;

    const msgSpan = document.createElement('span');
    msgSpan.className = msgClass;
    msgSpan.textContent = logMsg; // textContent を使用して安全にテキストを挿入

    li.appendChild(timeSpan);
    li.appendChild(msgSpan);

    // 最新のログを上に追加する
    logList.insertBefore(li, logList.firstChild);
  }

  // --- ボタンクリックによる再調査イベント ---
  refreshBtn.addEventListener('click', () => {
    // 手動ボタンクリック時、再取得ログを出すかはお好みですが、状態更新関数を呼び出す
    addManualRefreshLog();
    updateNetworkStatus();
  });

  // 手動リフレッシュ用のログ
  function addManualRefreshLog() {
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const li = document.createElement('li');
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = timeString;
    const msgSpan = document.createElement('span');
    msgSpan.className = 'log-msg-online';
    msgSpan.style.color = '#add8e6'; // Refresh用の特別色（薄い青）
    msgSpan.textContent = 'じょうたい を さいちょうさ した (Refreshed)';

    li.appendChild(timeSpan);
    li.appendChild(msgSpan);
    logList.insertBefore(li, logList.firstChild);
  }

  // --- イベントリスナーの登録 ---
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    // ネットワーク状況が変わった時のイベント
    connection.addEventListener('change', updateNetworkStatus);
  }

  // 初期化：最初の状態を取得して表示
  updateNetworkStatus();
});
