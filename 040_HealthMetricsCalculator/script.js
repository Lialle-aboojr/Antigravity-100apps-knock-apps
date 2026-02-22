/* =============================================
   Health Metrics Calculator - メインスクリプト
   健康指標計算機のロジック
   ============================================= */

// ===== DOM要素の取得 =====
// フォーム関連
const healthForm = document.getElementById('healthForm');
const heightInput = document.getElementById('height');
const weightInput = document.getElementById('weight');
const ageInput = document.getElementById('age');
const activitySelect = document.getElementById('activity');

// 結果表示関連
const resultsSection = document.getElementById('resultsSection');
const bmiValueEl = document.getElementById('bmiValue');
const bmiCategoryEl = document.getElementById('bmiCategory');
const bmiMarkerEl = document.getElementById('bmiMarker');
const idealWeightEl = document.getElementById('idealWeight');
const weightDiffEl = document.getElementById('weightDiff');
const bmrValueEl = document.getElementById('bmrValue');
const tdeeValueEl = document.getElementById('tdeeValue');
const goalLoseEl = document.getElementById('goalLose');
const goalMaintainEl = document.getElementById('goalMaintain');
const goalGainEl = document.getElementById('goalGain');


// =============================================
// スピンボタン操作時のデフォルト値セット処理
// 入力欄が空の状態でスピンボタン（▲▼）をクリックした場合、
// 0や1からではなく、現実的な数値からスタートさせる
// =============================================

/**
 * 空のinput欄にスピンボタン用のデフォルト値をセットする関数
 * mousedownイベントで「空ならデフォルト値を入れる」ことで、
 * ブラウザのスピンボタンの増減がそのデフォルト値を基準に動作する
 * @param {HTMLInputElement} inputElement - 対象のinput要素
 * @param {number} defaultValue - 空の時にセットするデフォルト値
 */
function setupSpinDefault(inputElement, defaultValue) {
    // mousedownイベント：スピンボタンをクリックした瞬間に発火する
    // このタイミングで空なら値をセットすることで、
    // ブラウザが値を増減する前にデフォルト値が入る
    inputElement.addEventListener('mousedown', function () {
        if (this.value === '') {
            this.value = defaultValue;
        }
    });

    // キーボードの上下矢印キーでも同じ動作にする
    inputElement.addEventListener('keydown', function (event) {
        if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && this.value === '') {
            this.value = defaultValue;
        }
    });
}

// 各入力欄にデフォルト値を設定
// 身長: 空の状態でスピン操作すると 170 からスタート
setupSpinDefault(heightInput, 170);
// 体重: 空の状態でスピン操作すると 60 からスタート
setupSpinDefault(weightInput, 60);
// 年齢: 空の状態でスピン操作すると 30 からスタート
setupSpinDefault(ageInput, 30);


// ===== フォーム送信時のイベントリスナー =====
healthForm.addEventListener('submit', function (event) {
    // フォームのデフォルト送信を防止
    event.preventDefault();

    // 入力値を取得
    const height = parseFloat(heightInput.value);
    const weight = parseFloat(weightInput.value);
    const age = parseInt(ageInput.value);
    const genderRadio = document.querySelector('input[name="gender"]:checked');
    const activityLevel = parseFloat(activitySelect.value);

    // ===== 入力バリデーション =====
    // エラーメッセージを格納する配列
    const errors = [];

    // 身長チェック
    if (!heightInput.value || isNaN(height) || height <= 0) {
        errors.push('身長を入力してください / Please enter your height');
    }

    // 体重チェック
    if (!weightInput.value || isNaN(weight) || weight <= 0) {
        errors.push('体重を入力してください / Please enter your weight');
    }

    // 年齢チェック
    if (!ageInput.value || isNaN(age) || age <= 0) {
        errors.push('年齢を入力してください / Please enter your age');
    }

    // 性別チェック
    if (!genderRadio) {
        errors.push('性別を選択してください / Please select your gender');
    }

    // 活動レベルチェック
    if (!activitySelect.value || isNaN(activityLevel)) {
        errors.push('活動レベルを選択してください / Please select your activity level');
    }

    // エラーがある場合はアラートを表示して処理を中断
    if (errors.length > 0) {
        alert('⚠️ 入力エラー / Input Error\n\n' + errors.join('\n'));
        return;
    }

    // ===== 計算の実行 =====
    const gender = genderRadio.value;
    const results = calculateHealthMetrics(height, weight, age, gender, activityLevel);

    // ===== 結果の表示 =====
    displayResults(results, weight);
});


/**
 * 健康指標を計算する関数
 * @param {number} height - 身長（cm）
 * @param {number} weight - 体重（kg）
 * @param {number} age - 年齢
 * @param {string} gender - 性別（'male' または 'female'）
 * @param {number} activityLevel - 活動レベル係数
 * @returns {object} 計算結果のオブジェクト
 */
function calculateHealthMetrics(height, weight, age, gender, activityLevel) {
    // 身長をcmからmに変換
    const heightInMeters = height / 100;

    // ----- BMI の計算 -----
    // BMI = 体重(kg) ÷ 身長(m)²
    const bmi = weight / (heightInMeters * heightInMeters);

    // ----- BMI判定 -----
    // 日本肥満学会の基準に基づく判定
    const bmiCategory = getBmiCategory(bmi);

    // ----- 適正体重の計算 -----
    // 適正体重 = 22（標準BMI）× 身長(m)²
    const idealWeight = 22 * heightInMeters * heightInMeters;

    // ----- 基礎代謝（BMR）の計算 -----
    // Mifflin-St Jeor式を使用
    // 男性: BMR = 10 × 体重(kg) + 6.25 × 身長(cm) - 5 × 年齢 + 5
    // 女性: BMR = 10 × 体重(kg) + 6.25 × 身長(cm) - 5 × 年齢 - 161
    let bmr;
    if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // ----- TDEE（1日の推定消費カロリー）の計算 -----
    // TDEE = BMR × 活動係数
    const tdee = bmr * activityLevel;

    // 計算結果をオブジェクトとして返す
    return {
        bmi: bmi,
        bmiCategory: bmiCategory,
        idealWeight: idealWeight,
        bmr: bmr,
        tdee: tdee
    };
}


/**
 * BMI値から判定カテゴリーを返す関数
 * 日本肥満学会の基準に基づく
 * @param {number} bmi - BMI値
 * @returns {object} カテゴリー名（日英）と色
 */
function getBmiCategory(bmi) {
    if (bmi < 18.5) {
        return {
            label: '痩せ（低体重）/ Underweight',
            color: '#4ECDC4',
            level: 'underweight'
        };
    } else if (bmi < 25) {
        return {
            label: '普通体重 / Normal Weight',
            color: '#2ECC71',
            level: 'normal'
        };
    } else if (bmi < 30) {
        return {
            label: '肥満（1度）/ Overweight',
            color: '#F1C40F',
            level: 'overweight'
        };
    } else if (bmi < 35) {
        return {
            label: '肥満（2度）/ Obese Class I',
            color: '#E67E22',
            level: 'obese1'
        };
    } else if (bmi < 40) {
        return {
            label: '肥満（3度）/ Obese Class II',
            color: '#E74C3C',
            level: 'obese2'
        };
    } else {
        return {
            label: '肥満（4度）/ Obese Class III',
            color: '#C0392B',
            level: 'obese3'
        };
    }
}


/**
 * 計算結果を画面に表示する関数
 * @param {object} results - calculateHealthMetrics()の戻り値
 * @param {number} currentWeight - 現在の体重（kg）
 */
function displayResults(results, currentWeight) {
    // ----- BMI値を表示 -----
    bmiValueEl.textContent = results.bmi.toFixed(1);

    // ----- BMI判定を表示 -----
    bmiCategoryEl.textContent = results.bmiCategory.label;
    bmiCategoryEl.style.backgroundColor = results.bmiCategory.color;

    // ----- BMIメーターのマーカー位置を計算・配置 -----
    updateBmiMarker(results.bmi);

    // ----- 適正体重を表示 -----
    idealWeightEl.textContent = results.idealWeight.toFixed(1) + ' kg';

    // 現在の体重との差を表示
    const diff = currentWeight - results.idealWeight;
    if (diff > 0) {
        // 適正体重より重い場合
        weightDiffEl.textContent = '適正体重より +' + diff.toFixed(1) + ' kg / ' + diff.toFixed(1) + ' kg above ideal';
        weightDiffEl.style.color = '#E67E22';
    } else if (diff < 0) {
        // 適正体重より軽い場合
        weightDiffEl.textContent = '適正体重より ' + diff.toFixed(1) + ' kg / ' + Math.abs(diff).toFixed(1) + ' kg below ideal';
        weightDiffEl.style.color = '#0EA5E9';
    } else {
        // ちょうど適正体重の場合
        weightDiffEl.textContent = '🎉 適正体重です！ / You are at ideal weight!';
        weightDiffEl.style.color = '#10B981';
    }

    // ----- BMR（基礎代謝）を表示 -----
    bmrValueEl.textContent = Math.round(results.bmr).toLocaleString() + ' kcal';

    // ----- TDEE（推定消費カロリー）を表示 -----
    tdeeValueEl.textContent = Math.round(results.tdee).toLocaleString() + ' kcal';

    // ----- 目的別カロリー目標を表示 -----
    // 減量: TDEE × 0.8（20%カロリーカット）
    goalLoseEl.textContent = Math.round(results.tdee * 0.8).toLocaleString() + ' kcal';
    // 維持: TDEE × 1.0（そのまま）
    goalMaintainEl.textContent = Math.round(results.tdee).toLocaleString() + ' kcal';
    // 増量: TDEE × 1.2（20%カロリー増量）
    goalGainEl.textContent = Math.round(results.tdee * 1.2).toLocaleString() + ' kcal';

    // ----- 結果セクションを表示（非表示を解除） -----
    resultsSection.classList.remove('hidden');

    // ----- 結果エリアまでスムーズスクロール -----
    // 少し遅延を入れてアニメーションを滑らかにする
    setTimeout(function () {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}


/**
 * BMIメーターのマーカー位置を更新する関数
 * BMI 15〜40の範囲でマーカーの位置を計算する
 * @param {number} bmi - 現在のBMI値
 */
function updateBmiMarker(bmi) {
    // メーターの表示範囲: BMI 15〜40
    const minBmi = 15;
    const maxBmi = 40;

    // BMI値をメーターの範囲内に制限（クランプ）
    const clampedBmi = Math.max(minBmi, Math.min(maxBmi, bmi));

    // パーセンテージに変換（0% = BMI 15, 100% = BMI 40）
    const percentage = ((clampedBmi - minBmi) / (maxBmi - minBmi)) * 100;

    // マーカーの位置をCSSのleftプロパティで設定
    bmiMarkerEl.style.left = percentage + '%';
}
