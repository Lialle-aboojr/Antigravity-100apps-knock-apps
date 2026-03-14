/**
 * エンタメ割り勘電卓 (PayTilt & Roulette)
 * ロジック・アニメーション管理
 */

//=========================================================
// DOM要素の取得
//=========================================================
// 入力要素
const totalAmountInput = document.getElementById('totalAmount');
const groupAPeopleInput = document.getElementById('groupAPeople');
const groupBPeopleInput = document.getElementById('groupBPeople');
const ratioSlider = document.getElementById('ratioSlider');
const ratioLabelA = document.getElementById('ratioLabelA');
const ratioLabelB = document.getElementById('ratioLabelB');
const roundingSelect = document.getElementById('roundingSelect');

// トグル
const omikujiToggle = document.getElementById('omikujiToggle');
const animationToggle = document.getElementById('animationToggle');

// ボタン・メッセージ
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const errorMessage = document.getElementById('errorMessage');

// 結果表示エリア
const resultArea = document.getElementById('resultArea');
const omikujiResultArea = document.getElementById('omikujiResultArea');
const omikujiText = document.getElementById('omikujiText');
const specialPersonArea = document.getElementById('specialPersonArea');
const resultAmountA = document.getElementById('resultAmountA');
const resultAmountB = document.getElementById('resultAmountB');
const resultAmountSpecial = document.getElementById('resultAmountSpecial');
const resultSubA = document.getElementById('resultSubA');
const resultSubB = document.getElementById('resultSubB');
const specialPersonLabelJa = document.getElementById('specialPersonLabelJa');
const specialPersonLabelEn = document.getElementById('specialPersonLabelEn');
const totalCollectedVal = document.getElementById('totalCollectedVal');
const balanceVal = document.getElementById('balanceVal');

//=========================================================
// イベントリスナーの設定
//=========================================================

// スライダーを動かした時にAとBの比率をUIに即座に反映する
ratioSlider.addEventListener('input', (e) => {
    const valA = parseInt(e.target.value, 10);
    const valB = 10 - valA;
    // セキュリティ対策: textContentを用いてDOMに安全に挿入
    ratioLabelA.textContent = valA;
    ratioLabelB.textContent = valB;
});

// 計算ボタンが押された時の処理
calculateBtn.addEventListener('click', () => {
    // 既存のエラーを隠す
    hideError();
    
    // 1. 入力値の取得とバリデーション (検証)
    const total = parseInt(totalAmountInput.value, 10);
    const numA = parseInt(groupAPeopleInput.value, 10) || 0;
    const numB = parseInt(groupBPeopleInput.value, 10) || 0;
    const ratioA = parseInt(ratioSlider.value, 10);
    const ratioB = 10 - ratioA;
    const roundStep = parseInt(roundingSelect.value, 10);
    let isOmikuji = omikujiToggle.checked;
    const doAnimation = animationToggle.checked;

    const totalPeople = numA + numB;

    if (isNaN(total) || total <= 0) {
        showError("支払総額を正しく入力してください。");
        return;
    }
    if (totalPeople === 0) {
        showError("グループAかB、少なくとも1人以上の人数を入力してください。");
        return;
    }

    // 2. おみくじモードの抽選処理
    let omikujiResult = null;
    let effNumA = numA; // 計算上の重み考慮用人数
    let effNumB = numB;

    if (isOmikuji && totalPeople > 1) {
        // 無料(TADA) か ゴチ(GOCHI) をランダム抽選。
        // TADA: その人の支払いは0円。
        // GOCHI: その人の支払いは、通常の同じグループの人の「2倍」の重みとする（エンタメ的な多め負担）。
        const options = [];
        if (numA > 0) { options.push('A_TADA', 'A_GOCHI'); }
        if (numB > 0) { options.push('B_TADA', 'B_GOCHI'); }
        
        // 当たりハズレをランダムに決定 (20%の確率で「何も起きない（NONE）」を含めるのもアリだが、エンタメ全振りのため必ず何か起きる仕様)
        const choice = options[Math.floor(Math.random() * options.length)];
        
        switch(choice) {
            case 'A_TADA':
                effNumA -= 1; // 1人分の重みを減らす
                omikujiResult = { group: 'A', type: 'TADA', labelJa: '無料(タダ)', labelEn: 'Free' };
                break;
            case 'B_TADA':
                effNumB -= 1;
                omikujiResult = { group: 'B', type: 'TADA', labelJa: '無料(タダ)', labelEn: 'Free' };
                break;
            case 'A_GOCHI':
                // その1人がAの比率2人分負担するという簡易的なゴチ計算
                effNumA += 1; // 1人分追加で重み付け
                omikujiResult = { group: 'A', type: 'GOCHI', labelJa: 'ゴチ(多め)', labelEn: 'Treat' };
                break;
            case 'B_GOCHI':
                effNumB += 1;
                omikujiResult = { group: 'B', type: 'GOCHI', labelJa: 'ゴチ(多め)', labelEn: 'Treat' };
                break;
        }
    } else if (isOmikuji && totalPeople <= 1) {
        // 1人しかいない時はおみくじ無効
        isOmikuji = false;
    }

    // 3. 傾斜計算の実行
    // 各グループのトータル重み
    const weightA = effNumA * ratioA;
    const weightB = effNumB * ratioB;
    const totalWeight = weightA + weightB;

    let basePayA = 0;
    let basePayB = 0;

    if (totalWeight > 0) {
        // 1重みあたりの金額
        const unitRate = total / totalWeight;
        basePayA = unitRate * ratioA;
        basePayB = unitRate * ratioB;
    }

    // 端数処理（切り上げ）
    const roundUp = (val, step) => Math.ceil(val / step) * step;
    
    let payA = numA > 0 ? roundUp(basePayA, roundStep) : 0;
    let payB = numB > 0 ? roundUp(basePayB, roundStep) : 0;
    let paySpecial = 0;

    // 特殊な人の支払い
    if (omikujiResult) {
        if (omikujiResult.type === 'TADA') {
            paySpecial = 0; // 無料
        } else if (omikujiResult.type === 'GOCHI') {
            // ゴチの人は自分の属するグループのベース単価×2 を払う（重み付けに対応）
            if (omikujiResult.group === 'A') paySpecial = roundUp(basePayA * 2, roundStep);
            if (omikujiResult.group === 'B') paySpecial = roundUp(basePayB * 2, roundStep);
        }
    }

    // 4. 集計（過不足金の計算）
    let normalNumA = numA;
    let normalNumB = numB;
    let specialNum = 0;

    if (omikujiResult) {
        if (omikujiResult.group === 'A') normalNumA -= 1;
        if (omikujiResult.group === 'B') normalNumB -= 1;
        specialNum = 1;
    }

    const totalCollected = (payA * normalNumA) + (payB * normalNumB) + (paySpecial * specialNum);
    const balance = totalCollected - total;

    // 5. 結果画面への描画準備
    prepareResultUI(numA, numB, normalNumA, normalNumB, payA, payB, paySpecial, omikujiResult, totalCollected, balance);

    // 6. 結果の表示とアニメーションの実行
    resultArea.hidden = false;
    // 少しスクロール
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'end' });

    if (doAnimation) {
        // 鑑定団風ルーレットアニメーション
        runRouletteAnimation(payA, payB, paySpecial, omikujiResult);
    } else {
        // アニメなしで即座に数値を表示
        resultAmountA.textContent = payA.toLocaleString();
        resultAmountB.textContent = payB.toLocaleString();
        if (omikujiResult) {
            resultAmountSpecial.textContent = paySpecial.toLocaleString();
        }
    }
});

// リセットボタン
resetBtn.addEventListener('click', () => {
    totalAmountInput.value = '';
    groupAPeopleInput.value = '';
    groupBPeopleInput.value = '';
    resultArea.hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
});


//=========================================================
// 補助関数群
//=========================================================

// エラーメッセージの表示
function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.hidden = false;
}

// エラーメッセージを隠す
function hideError() {
    errorMessage.hidden = true;
}

// UI要素の更新（数値を入れる前の準備）
function prepareResultUI(numA, numB, normalNumA, normalNumB, payA, payB, paySpecial, omikujiResult, totalCollected, balance) {
    // サブ情報の更新（人数表記）
    resultSubA.textContent = `（${normalNumA}名）`;
    resultSubB.textContent = `（${normalNumB}名）`;

    // 0人のグループは薄く表示などしたいため一応リセット
    document.querySelector('.result-a').style.opacity = normalNumA > 0 ? "1" : "0.5";
    document.querySelector('.result-b').style.opacity = normalNumB > 0 ? "1" : "0.5";

    // 集金合計金額と過不足の表示
    totalCollectedVal.textContent = `¥ ${totalCollected.toLocaleString()}`;
    balanceVal.textContent = `¥ ${balance.toLocaleString()}`;
    
    // 過不足金がマイナス（不足）の場合は赤色にするなどの処理（原則切り上げなので発生しないが念の為）
    if(balance < 0) {
        balanceVal.style.color = "red";
    } else {
        balanceVal.style.color = "var(--primary-red)";
    }

    // おみくじ表示の切り替え
    if (omikujiResult) {
        omikujiResultArea.hidden = false;
        specialPersonArea.hidden = false;

        const groupName = omikujiResult.group === 'A' ? 'グループA' : 'グループB';
        const typeJa = omikujiResult.type === 'TADA' ? '無料（タダ）！' : 'ゴチ（多め）！';
        
        omikujiText.textContent = `大当たり！${groupName}の1名様が ${typeJa}`;
        specialPersonLabelJa.textContent = `${groupName}の1名 ${omikujiResult.labelJa}`;
        specialPersonLabelEn.textContent = `Special 1 in ${groupName}`;
    } else {
        omikujiResultArea.hidden = true;
        specialPersonArea.hidden = true;
    }
    
    // アニメーション用にいったん表示を 0 等にリセットしておく
    resultAmountA.textContent = "0";
    resultAmountB.textContent = "0";
    resultAmountSpecial.textContent = "0";
}

//=========================================================
// 鑑定団風・ルーレットアニメーション関数
//=========================================================
// requestAnimationFrame または setInterval を利用して高速に数字を回す
function runRouletteAnimation(payA, payB, paySpecial, hasOmikuji) {
    // アニメーションを適用する対象要素と最終値のリスト
    const targets = [
        { element: resultAmountA, finalValue: payA },
        { element: resultAmountB, finalValue: payB }
    ];
    if (hasOmikuji) {
        targets.push({ element: resultAmountSpecial, finalValue: paySpecial });
    }

    // くるくる回すアニメーションの全体時間等
    const DURATION = 2000; // 約2秒
    const INTERVAL = 50;   // 50msごとに数字を更新
    const startTime = Date.now();

    // シャキーン演出のリセット
    targets.forEach(t => t.element.classList.remove('anim-bling'));

    const timerId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        targets.forEach((target, index) => {
            // 要素ごとに少しずつ確定タイミングをずらすと「ピタッ、ピタッ」という感じになる
            // 例: Aは1500ms後、Bは1700ms後、Specialは1900ms後
            const fixTime = DURATION - (targets.length - index - 1) * 300; 
            
            if (elapsed < fixTime) {
                // まだ確定前：ランダムな数字の文字列を作成して表示
                // 最終値の桁数＋αくらいのランダム数
                const randomVal = Math.floor(Math.random() * 90000) + 10000;
                target.element.textContent = randomVal.toLocaleString();
            } else {
                // 確定：最終値を入れてシャキーン効果を付与
                // ※ 重複してクラス付与やDOM更新しないようにチェック
                if (target.element.textContent !== target.finalValue.toLocaleString()) {
                    target.element.textContent = target.finalValue.toLocaleString();
                    target.element.classList.add('anim-bling');
                }
            }
        });

        // 全て確定したらタイマーを止める
        if (elapsed >= DURATION) {
            clearInterval(timerId);
            targets.forEach(t => t.element.textContent = t.finalValue.toLocaleString());
        }
    }, INTERVAL);
}
