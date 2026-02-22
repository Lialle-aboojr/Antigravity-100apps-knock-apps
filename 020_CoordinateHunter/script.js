// HTML要素の取得
const latDisplay = document.getElementById('lat-display');
const lngDisplay = document.getElementById('lng-display');
const accDisplay = document.getElementById('acc-display');
const statusArea = document.getElementById('status-area');
const btnGetLocation = document.getElementById('btn-get-location');
const linkMap = document.getElementById('link-map');

// 状態メッセージを更新する関数
// type: 'standby' | 'loading' | 'success' | 'error'
function updateStatus(type, messageJa = '', messageEn = '') {
    // クラスをリセット
    statusArea.className = 'status-box';

    if (type === 'standby') {
        statusArea.innerHTML = `
            <p class="ja">システム待機中...</p>
            <p class="en">SYSTEM STANDBY...</p>
        `;
    } else if (type === 'loading') {
        statusArea.innerHTML = `
            <p class="ja">衛星・Wi-Fi信号をスキャン中...</p>
            <p class="en">SCANNING SATELLITES / WI-FI SIGNALS...</p>
        `;
        // 点滅アニメーションなどを入れたい場合はCSSクラスを追加してもよい
    } else if (type === 'success') {
        statusArea.classList.add('success');
        statusArea.innerHTML = `
            <p class="ja">位置情報の取得に成功</p>
            <p class="en">TARGET LOCKED. COORDINATES ACQUIRED.</p>
        `;
    } else if (type === 'error') {
        statusArea.innerHTML = `
            <p class="ja">エラー: ${messageJa}</p>
            <p class="en">ERROR: ${messageEn}</p>
        `;
    }
}

// 位置情報取得成功時の処理
function successCallback(position) {
    // 緯度・経度・精度を取得
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    // 画面表示を更新（小数点第6位まで表示）
    latDisplay.textContent = latitude.toFixed(6);
    lngDisplay.textContent = longitude.toFixed(6);
    accDisplay.textContent = `± ${Math.floor(accuracy)} m`;

    // Googleマップのリンクを生成
    // ズームレベル(z)は15くらいがちょうど良い
    const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;
    linkMap.href = mapUrl;

    // マップボタンを有効化（disabledクラスを削除）
    linkMap.classList.remove('disabled');

    // ステータス更新
    updateStatus('success');
}

// 位置情報取得失敗時の処理
function errorCallback(error) {
    let msgJa = '';
    let msgEn = '';

    switch (error.code) {
        case error.PERMISSION_DENIED:
            msgJa = '位置情報の利用が許可されませんでした。';
            msgEn = 'Permission Denied.';
            break;
        case error.POSITION_UNAVAILABLE:
            msgJa = '位置情報が利用できません（電波状況などを確認してください）。';
            msgEn = 'Position Unavailable.';
            break;
        case error.TIMEOUT:
            msgJa = 'タイムアウトしました。再試行してください。';
            msgEn = 'Request Timed Out.';
            break;
        default:
            msgJa = '不明なエラーが発生しました。';
            msgEn = 'Unknown Error.';
            break;
    }

    // エラー表示
    updateStatus('error', msgJa, msgEn);
}

// ボタンクリック時のイベントリスナー
btnGetLocation.addEventListener('click', () => {
    // ブラウザがGeolocation APIに対応しているか確認
    if (!navigator.geolocation) {
        updateStatus('error', 'このブラウザは位置情報に対応していません。', 'Geolocation Not Supported.');
        return;
    }

    // ステータスを読み込み中に変更
    updateStatus('loading');

    // 現在地を取得
    navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        {
            enableHighAccuracy: true, // 高精度モード（GPS優先など）
            timeout: 10000,           // 10秒でタイムアウト
            maximumAge: 0             // キャッシュを使わず常に最新を取得
        }
    );
});
