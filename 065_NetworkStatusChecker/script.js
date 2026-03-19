/**
 * Network Status Checker
 * ネット接続状況チェッカー (Retro RPG Style)
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM要素の取得 ---
  const hpBar = document.getElementById('hpBar');
  const messageBox = document.getElementById('messageBox');
  const heroIcon = document.getElementById('heroIcon');
  const logList = document.getElementById('logList');
  
  const statDownlink = document.getElementById('statDownlink');
  const statType = document.getElementById('statType');
  const statRtt = document.getElementById('statRtt');
  const apiNote = document.getElementById('apiNote');

  // ファビコンのフォールバック処理 (SVG Data URI)
  const fallbackFavicon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🛡️</text></svg>';
  const favicon = document.getElementById('favicon');
  favicon.addEventListener('error', () => {
    favicon.href = fallbackFavicon;
  });

  // --- 状態の定義 ---
  const STATES = {
    FAST: {
      hpWidth: '100%',
      hpColor: 'var(--hp-green)',
      icon: '🛡️',
      msgJp: '勇者は 元気いっぱいだ！',
      msgEn: 'The hero is full of energy!'
    },
    SLOW: {
      hpWidth: '50%',
      hpColor: 'var(--hp-yellow)',
      icon: '😓',
      msgJp: '勇者は 少し 疲れているようだ…',
      msgEn: 'The hero looks a bit tired...'
    },
    OFFLINE: {
      hpWidth: '0%',
      hpColor: 'var(--hp-red)',
      icon: '🪦',
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
      rtt = connection.rtt !== undefined ? `${connection.rtt} ms` : 'Unknown';

      // 速度による判定 (3g以下、または1Mbps以下ならSLOW)
      if (type === 'slow-2g' || type === '2g' || type === '3g' || (connection.downlink !== undefined && connection.downlink < 1.0)) {
        newStateKey = 'SLOW';
      }
    } else {
      // API非対応だがオンラインの場合
      apiNote.textContent = '※詳細なつよさ(Network API)は測定不能です / Network API unsupported';
      newStateKey = 'FAST'; // 基本的にFASTとする
    }

    // --- DOMの更新 ---
    const state = STATES[newStateKey];
    
    // HPゲージとアイコン
    hpBar.style.width = state.hpWidth;
    hpBar.style.backgroundColor = state.hpColor;
    heroIcon.textContent = state.icon;

    // メッセージ生成（XSS対策として DOM API を使用）
    messageBox.innerHTML = ''; // 既存の要素をクリア (安全なリセット)
    
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

    // 状態が変化した時だけログを記録 (初回のみログを出すか出さないかはお好みだが、初期状態も記録しておく)
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
    msgSpan.textContent = logMsg;

    li.appendChild(timeSpan);
    li.appendChild(msgSpan);

    // 最新のログを上に追加する
    logList.insertBefore(li, logList.firstChild);
  }

  // --- イベントリスナーの登録 ---
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    // ネットワーク状況(速度など)が変わった時のイベント
    connection.addEventListener('change', updateNetworkStatus);
  }

  // 初期化：最初の状態を取得して表示
  updateNetworkStatus();
});
