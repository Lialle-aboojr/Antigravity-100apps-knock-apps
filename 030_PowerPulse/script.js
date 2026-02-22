/**
 * Power Pulse - Premium Logic
 * 機能: Battery Status APIの監視、CSS変数の動的更新によるテーマ変更
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素
    const root = document.documentElement; // CSS変数を操作するためにルート要素を取得
    const batteryLevelEl = document.querySelector('.battery-level');
    const levelTextEl = document.getElementById('level-text');
    const statusTextEl = document.getElementById('status-text');
    const timeTextEl = document.getElementById('time-text');
    const connectionStatusEl = document.getElementById('connection-status');
    const notSupportedEl = document.getElementById('not-supported');
    const faviconEl = document.getElementById('favicon');

    // カラーパレット (Neon Colors)
    const COLORS = {
        charging: '#00f260', // Neon Green
        high: '#00f260',     // Neon Green
        medium: '#ffee00',   // Neon Yellow
        low: '#ff0055',      // Neon Red
        chargingShadow: 'rgba(0, 242, 96, 0.6)',
        highShadow: 'rgba(0, 242, 96, 0.6)',
        mediumShadow: 'rgba(255, 238, 0, 0.6)',
        lowShadow: 'rgba(255, 0, 85, 0.6)'
    };

    // Browser Support Check
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            updateUI(battery);

            // イベントリスナー
            battery.addEventListener('chargingchange', () => updateUI(battery));
            battery.addEventListener('levelchange', () => updateUI(battery));
            battery.addEventListener('chargingtimechange', () => updateUI(battery));
            battery.addEventListener('dischargingtimechange', () => updateUI(battery));
        }).catch(err => {
            console.error(err);
            showError();
        });
    } else {
        showError();
    }

    /**
     * UI更新のメイン関数
     */
    function updateUI(battery) {
        const level = Math.floor(battery.level * 100);
        const isCharging = battery.charging;

        // 1. テキスト更新
        levelTextEl.textContent = `${level}%`;

        // 2. バッテリー液面の幅
        batteryLevelEl.style.width = `${level}%`;

        // 3. テーマカラーの決定と適用 (CSS変数)
        let themeColor, themeShadow;

        if (isCharging) {
            themeColor = COLORS.charging;
            themeShadow = COLORS.chargingShadow;
        } else if (level <= 20) {
            themeColor = COLORS.low;
            themeShadow = COLORS.lowShadow;
        } else if (level <= 50) {
            themeColor = COLORS.medium;
            themeShadow = COLORS.mediumShadow;
        } else {
            themeColor = COLORS.high;
            themeShadow = COLORS.highShadow;
        }

        // CSS変数を更新 -> 画面全体の光の色が変わる
        root.style.setProperty('--theme-color', themeColor);
        root.style.setProperty('--theme-shadow', themeShadow);

        // 4. ステータス表示
        if (isCharging) {
            statusTextEl.textContent = "Charging / 充電中 ⚡";
            connectionStatusEl.textContent = "Power Connected";
            connectionStatusEl.style.color = themeColor;
        } else {
            statusTextEl.textContent = "Discharging / 放電中";
            connectionStatusEl.textContent = "On Battery";
            connectionStatusEl.style.color = "#ffffff";
        }

        // 5. 時間予測
        updateTime(battery);

        // 6. ファビコン更新
        updateFavicon(isCharging, level, themeColor);
    }

    /**
     * 時間表示の更新ロジック
     */
    function updateTime(battery) {
        if (battery.charging) {
            if (battery.chargingTime === Infinity) {
                timeTextEl.textContent = "Calculating...";
            } else if (battery.chargingTime === 0) {
                timeTextEl.textContent = "Fully Charged";
            } else {
                const min = Math.floor(battery.chargingTime / 60);
                timeTextEl.textContent = `${min} min to full`;
            }
        } else {
            if (battery.dischargingTime === Infinity) {
                timeTextEl.textContent = "---";
            } else {
                const hour = Math.floor(battery.dischargingTime / 3600);
                const min = Math.floor((battery.dischargingTime % 3600) / 60);
                timeTextEl.textContent = `${hour}h ${min}m remaining`;
            }
        }
    }

    /**
     * ファビコンの動的生成
     */
    function updateFavicon(isCharging, level, color) {
        let emoji = '🔋';
        if (isCharging) emoji = '⚡';
        else if (level <= 20) emoji = '🪫';

        // SVG内のtext fill色もテーマカラーに合わせる
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="none"/>
                <text y=".9em" font-size="90" fill="${color}">${emoji}</text>
            </svg>
        `.trim();

        faviconEl.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }

    function showError() {
        notSupportedEl.classList.remove('hidden');
        levelTextEl.textContent = "--";
        statusTextEl.textContent = "Unknown";
    }
});
