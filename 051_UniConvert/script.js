/* ============================================
   UniConvert — 単位変換ツール / Unit Converter
   メインスクリプト (script.js)
   ============================================ */

// ===== DOMの読み込み完了後に初期化 =====
document.addEventListener('DOMContentLoaded', () => {
    // --- 要素の取得 ---

    // タブボタンをすべて取得
    const tabButtons = document.querySelectorAll('.tab-btn');

    // 変換カードをすべて取得
    const converterCards = document.querySelectorAll('.converter-card');

    // 長さの入力欄
    const inputCm = document.getElementById('input-cm');
    const inputInch = document.getElementById('input-inch');

    // 重さの入力欄
    const inputKg = document.getElementById('input-kg');
    const inputLb = document.getElementById('input-lb');

    // 温度の入力欄
    const inputCelsius = document.getElementById('input-celsius');
    const inputFahrenheit = document.getElementById('input-fahrenheit');

    // ===== 変換定数 =====
    // 1cm = 0.393701 インチ
    const CM_TO_INCH = 0.393701;
    // 1インチ = 2.54 cm
    const INCH_TO_CM = 2.54;
    // 1kg = 2.20462 ポンド
    const KG_TO_LB = 2.20462;
    // 1ポンド = 0.453592 kg
    const LB_TO_KG = 0.453592;

    // ===== タブ切り替え機能 =====
    /**
     * タブの切り替えを行う関数
     * @param {string} category - 表示するカテゴリ名（'length', 'weight', 'temperature'）
     */
    function switchTab(category) {
        // すべてのタブボタンからアクティブ状態を外す
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });

        // すべての変換カードを非表示にする
        converterCards.forEach(card => {
            card.classList.remove('active');
        });

        // クリックされたタブをアクティブにする
        const targetTab = document.querySelector(`.tab-btn[data-category="${category}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
            targetTab.setAttribute('aria-selected', 'true');
        }

        // 対応する変換カードを表示する
        const targetCard = document.getElementById(`card-${category}`);
        if (targetCard) {
            targetCard.classList.add('active');
        }
    }

    // 各タブボタンにクリックイベントを設定
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // data-category属性からカテゴリ名を取得
            const category = btn.getAttribute('data-category');
            switchTab(category);
        });
    });

    // ===== 変換ロジック =====

    /**
     * 数値を指定した桁数で丸める関数
     * @param {number} value - 丸める数値
     * @param {number} decimals - 小数点以下の桁数
     * @returns {number} 丸めた数値
     */
    function roundTo(value, decimals) {
        // toFixedで文字列にしてからNumberで数値に戻す
        return Number(value.toFixed(decimals));
    }

    // ----- 長さ変換（cm ⇔ inch） -----

    // cmの入力欄にイベントリスナーを設定
    inputCm.addEventListener('input', () => {
        // 入力値を取得
        const cmValue = inputCm.value;

        // 入力欄が空の場合、もう一方も空にする
        if (cmValue === '' || cmValue === null) {
            inputInch.value = '';
            return;
        }

        // 数値に変換
        const cm = parseFloat(cmValue);

        // 数値として無効な場合は何もしない
        if (isNaN(cm)) {
            return;
        }

        // cm → inch の変換を実行し、結果を表示
        inputInch.value = roundTo(cm * CM_TO_INCH, 6);
    });

    // inchの入力欄にイベントリスナーを設定
    inputInch.addEventListener('input', () => {
        const inchValue = inputInch.value;

        if (inchValue === '' || inchValue === null) {
            inputCm.value = '';
            return;
        }

        const inch = parseFloat(inchValue);

        if (isNaN(inch)) {
            return;
        }

        // inch → cm の変換を実行し、結果を表示
        inputCm.value = roundTo(inch * INCH_TO_CM, 6);
    });

    // ----- 重さ変換（kg ⇔ lb） -----

    // kgの入力欄にイベントリスナーを設定
    inputKg.addEventListener('input', () => {
        const kgValue = inputKg.value;

        if (kgValue === '' || kgValue === null) {
            inputLb.value = '';
            return;
        }

        const kg = parseFloat(kgValue);

        if (isNaN(kg)) {
            return;
        }

        // kg → lb の変換を実行し、結果を表示
        inputLb.value = roundTo(kg * KG_TO_LB, 6);
    });

    // lbの入力欄にイベントリスナーを設定
    inputLb.addEventListener('input', () => {
        const lbValue = inputLb.value;

        if (lbValue === '' || lbValue === null) {
            inputKg.value = '';
            return;
        }

        const lb = parseFloat(lbValue);

        if (isNaN(lb)) {
            return;
        }

        // lb → kg の変換を実行し、結果を表示
        inputKg.value = roundTo(lb * LB_TO_KG, 6);
    });

    // ----- 温度変換（℃ ⇔ ℉） -----

    // 摂氏の入力欄にイベントリスナーを設定
    inputCelsius.addEventListener('input', () => {
        const celsiusValue = inputCelsius.value;

        if (celsiusValue === '' || celsiusValue === null) {
            inputFahrenheit.value = '';
            return;
        }

        const celsius = parseFloat(celsiusValue);

        if (isNaN(celsius)) {
            return;
        }

        // ℃ → ℉ の変換: ℉ = ℃ × 9/5 + 32
        inputFahrenheit.value = roundTo(celsius * 9 / 5 + 32, 4);
    });

    // 華氏の入力欄にイベントリスナーを設定
    inputFahrenheit.addEventListener('input', () => {
        const fahrenheitValue = inputFahrenheit.value;

        if (fahrenheitValue === '' || fahrenheitValue === null) {
            inputCelsius.value = '';
            return;
        }

        const fahrenheit = parseFloat(fahrenheitValue);

        if (isNaN(fahrenheit)) {
            return;
        }

        // ℉ → ℃ の変換: ℃ = (℉ − 32) × 5/9
        inputCelsius.value = roundTo((fahrenheit - 32) * 5 / 9, 4);
    });

    // ===== 初期状態の設定 =====
    // ページ読み込み時は「長さ」タブをアクティブにする
    switchTab('length');
});
