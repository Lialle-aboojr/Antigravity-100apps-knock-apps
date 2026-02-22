/**
 * Power Pulse - Main Script
 * 機能: Battery Status APIを使用してバッテリー情報を取得し、UIとファビコンを更新する
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const batteryLevelEl = document.getElementById('battery-level');
    const levelTextEl = document.getElementById('level-text');
    const statusTextEl = document.getElementById('status-text');
    const timeTextEl = document.getElementById('time-text');
    const notSupportedEl = document.getElementById('not-supported');
    const faviconEl = document.getElementById('favicon');

    // Battery Status API のサポート確認
    if ('getBattery' in navigator) {
        // バッテリーマネージャーの取得
        navigator.getBattery().then(battery => {
            // 初回のUI更新
            updateBatteryUI(battery);

            // イベントリスナーの追加（バッテリー状態の変化を監視）

            // 1. 充電状態が変化した時
            battery.addEventListener('chargingchange', () => {
                updateBatteryUI(battery);
            });

            // 2. 残量が変化した時
            battery.addEventListener('levelchange', () => {
                updateBatteryUI(battery);
            });

            // 3. 充電完了までの時間が変化した時
            battery.addEventListener('chargingtimechange', () => {
                updateBatteryUI(battery);
            });

            // 4. 放電完了（バッテリー切れ）までの時間が変化した時
            battery.addEventListener('dischargingtimechange', () => {
                updateBatteryUI(battery);
            });

        }).catch(error => {
            console.error('Battery Status API Error:', error);
            showError();
        });
    } else {
        // API非対応ブラウザの場合
        showError();
    }

    /**
     * UIとファビコンを一括更新する関数
     * @param {BatteryManager} battery - バッテリーオブジェクト
     */
    function updateBatteryUI(battery) {
        // 1. レベル表示の更新 (0.0 - 1.0 を % に変換)
        const level = Math.floor(battery.level * 100);
        levelTextEl.textContent = `${level}%`;

        // CSSの幅を更新して液面の高さを表現
        batteryLevelEl.style.width = `${level}%`;

        // 2. 色の更新
        updateColor(battery.charging, level);

        // 3. ステータス表示の更新
        updateStatusText(battery.charging);

        // 4. 残り時間/充電時間の更新
        updateTimeText(battery);

        // 5. ファビコンの更新
        updateFavicon(battery.charging, level);
    }

    /**
     * バッテリーの状態に応じて色を変更する関数
     * @param {boolean} isCharging - 充電中かどうか
     * @param {number} level - バッテリー残量 (%)
     */
    function updateColor(isCharging, level) {
        // CSS変数の値を取得してもよいが、ここでは直接クラスやスタイルを操作するか、
        // 色定数を使用する。今回はstyle.cssで定義した変数に合わせるため、
        // 直接backgroundColorを操作します。

        let color;

        if (isCharging) {
            color = '#007aff'; // 充電中: 青
        } else if (level <= 20) {
            color = '#ff3b30'; // 20%以下: 赤
        } else if (level <= 50) {
            color = '#ffcc00'; // 50%以下: 黄色
        } else {
            color = '#34c759'; // それ以外: 緑
        }

        batteryLevelEl.style.backgroundColor = color;
    }

    /**
     * 充電状態のテキスト更新
     * @param {boolean} isCharging 
     */
    function updateStatusText(isCharging) {
        if (isCharging) {
            statusTextEl.textContent = "充電中 / Charging ⚡️";
        } else {
            statusTextEl.textContent = "放電中 / Discharging";
        }
    }

    /**
     * 時間表示の更新
     * @param {BatteryManager} battery 
     */
    function updateTimeText(battery) {
        if (battery.charging) {
            // 充電中: 満充電までの時間
            if (battery.chargingTime === Infinity) {
                timeTextEl.textContent = "計算中 / Calculating...";
            } else if (battery.chargingTime === 0) {
                timeTextEl.textContent = "充電完了 / Fully Charged";
            } else {
                const minutes = Math.floor(battery.chargingTime / 60);
                timeTextEl.textContent = `あと ${minutes} 分 / ${minutes} min to full`;
            }
        } else {
            // 放電中: 使用可能時間
            if (battery.dischargingTime === Infinity) {
                timeTextEl.textContent = "---"; // 情報なし
            } else {
                // 秒数を 時間:分 に変換
                const hours = Math.floor(battery.dischargingTime / 3600);
                const minutes = Math.floor((battery.dischargingTime % 3600) / 60);
                timeTextEl.textContent = `残り ${hours}時間 ${minutes}分 / ${hours}h ${minutes}m left`;
            }
        }
    }

    /**
     * ファビコンを動的に生成して更新する関数
     * SVGをData URIとして埋め込むことで、外部画像なしで実現
     * @param {boolean} isCharging 
     * @param {number} level 
     */
    function updateFavicon(isCharging, level) {
        // 状態に応じた絵文字の選択
        let emoji = '🔋';
        if (isCharging) {
            emoji = '⚡️';
        } else if (level <= 20) {
            emoji = '🪫';
        }

        // SVG文字列の作成
        // 絵文字を中心に配置
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <text y=".9em" font-size="90">${emoji}</text>
            </svg>
        `.trim();

        // SVGをData URIに変換してhrefに設定
        faviconEl.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }

    /**
     * エラーメッセージを表示する関数
     */
    function showError() {
        notSupportedEl.classList.remove('hidden');
        levelTextEl.textContent = "--%";
        statusTextEl.textContent = "Unknown";
        timeTextEl.textContent = "Unknown";
    }
});
