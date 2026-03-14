/**
 * エンタメ割り勘電卓 (PayTilt & Roulette)
 * ロジック・アニメーション管理
 */

//=========================================================
// DOM要素の取得
//=========================================================
// 割り勘モード切り替え
const splitModes = document.querySelectorAll('input[name="splitMode"]');
const groupBContainer = document.getElementById('groupBContainer');
const ratioContainer = document.getElementById('ratioContainer');
const badgeA = document.getElementById('badgeA');
const labelAJa = document.getElementById('labelAJa');
const labelAEn = document.getElementById('labelAEn');

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

// 割り勘モードの切り替えによってUI操作
splitModes.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'normal') {
            // 通常割り勘
            groupBContainer.hidden = true;
            ratioContainer.hidden = true;
            badgeA.hidden = true;
            labelAJa.textContent = "人数";
            labelAEn.textContent = "People";
            groupBPeopleInput.value = ""; // リセットしておく
        } else {
            // グループ・傾斜割り勘
            groupBContainer.hidden = false;
            ratioContainer.hidden = false;
            badgeA.hidden = false;
            labelAJa.textContent = "グループA 人数";
            labelAEn.textContent = "Group A People";
        }
    });
});

// スライダーを動かした時にAとBの比率をUIに即座に反映する
ratioSlider.addEventListener('input', (e) => {
    const valA = parseInt(e.target.value, 10);
    const valB = 10 - valA;
    // セキュリティ対策: textContentを用いてDOMに安全に挿入
    ratioLabelA.textContent = valA;
    ratioLabelB.textContent = valB;
});

// 全角半角変換（数字のみ）の補助関数
const toHalfWidthNum = (val) => {
    if (!val && val !== 0) return 0;
    // 全角数字を半角数字に変換
    const str = String(val).replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
    // 半角数字以外を除去（ハイフンなども防御）
    const numPart = str.replace(/[^0-9]/g, '');
    return parseInt(numPart, 10) || 0;
};

// 計算ボタンが押された時の処理
calculateBtn.addEventListener('click', () => {
    hideError();
    
    // 現在のモードを取得
    const isNormalMode = document.querySelector('input[name="splitMode"]:checked').value === 'normal';
    
    // 1. 入力値の取得とバリデーション (全角入力からの変換を挟む)
    const total = toHalfWidthNum(totalAmountInput.value);
    const numA = toHalfWidthNum(groupAPeopleInput.value);
    const numB = isNormalMode ? 0 : toHalfWidthNum(groupBPeopleInput.value);
    
    const ratioA = parseInt(ratioSlider.value, 10);
    const ratioB = 10 - ratioA;
    const roundStep = parseInt(roundingSelect.value, 10);
    let isOmikuji = omikujiToggle.checked;
    const doAnimation = animationToggle.checked;

    const totalPeople = numA + numB;

    if (total <= 0) {
        showError("支払総額を正しく入力してください。");
        return;
    }
    if (totalPeople === 0) {
        showError(isNormalMode ? "人数を入力してください。" : "グループAかB、少なくとも1人以上の人数を入力してください。");
        return;
    }

    // 2. おみくじモードの抽選処理
    let omikujiResult = null;
    let effNumA = numA; // 計算上の重み考慮用人数
    let effNumB = numB;

    // おみくじモードがONで、かつ参加者が2名以上いる場合のみ抽選
    if (isOmikuji && totalPeople > 1) {
        const options = [];
        if (numA > 0) { options.push('A_TADA', 'A_GOCHI'); }
        if (numB > 0) { options.push('B_TADA', 'B_GOCHI'); }
        
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
    } else {
        // 例えトグルがONでも処理条件を満たさなければOFFに
        isOmikuji = false;
        omikujiResult = null;
    }

    // 3. 傾斜計算の実行
    const weightA = isNormalMode ? effNumA : effNumA * ratioA;
    const weightB = isNormalMode ? 0 : effNumB * ratioB;
    const totalWeight = weightA + weightB;

    let basePayA = 0;
    let basePayB = 0;

    if (totalWeight > 0) {
        // 1重みあたりの金額
        const unitRate = total / totalWeight;
        basePayA = isNormalMode ? unitRate : unitRate * ratioA;
        basePayB = isNormalMode ? 0 : unitRate * ratioB;
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
    prepareResultUI(isNormalMode, normalNumA, normalNumB, omikujiResult, totalCollected, balance);

    // 6. 結果の表示とアニメーションの実行
    resultArea.hidden = false;
    // 少しスクロール
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'end' });

    if (doAnimation) {
        // 鑑定団風ルーレットアニメーション
        runRouletteAnimation(isNormalMode, payA, payB, paySpecial, omikujiResult);
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
function prepareResultUI(isNormalMode, normalNumA, normalNumB, omikujiResult, totalCollected, balance) {
    const resultBSection = document.querySelector('.result-b');
    const headerAJa = document.querySelector('.result-a .result-group-header .ja');
    const headerAEn = document.querySelector('.result-a .result-group-header .en');
    const badgeAElem = document.querySelector('.result-a .group-badge');
    
    // サブ情報の更新（人数表記）
    resultSubA.textContent = `（${normalNumA}名）`;

    // 通常モードとグループモードでの表示切替
    if (isNormalMode) {
        resultBSection.hidden = true;
        
        headerAJa.textContent = "1人あたり";
        headerAEn.textContent = "Per Person";
        badgeAElem.hidden = true;
        
        document.querySelector('.result-a').style.opacity = normalNumA > 0 ? "1" : "0.5";
    } else {
        resultBSection.hidden = false;
        resultSubB.textContent = `（${normalNumB}名）`;
        document.querySelector('.result-b').style.opacity = normalNumB > 0 ? "1" : "0.5";
        
        headerAJa.textContent = "グループ A";
        headerAEn.textContent = "Group A";
        badgeAElem.hidden = false;
        
        document.querySelector('.result-a').style.opacity = normalNumA > 0 ? "1" : "0.5";
    }

    // 集金合計金額と過不足の表示
    totalCollectedVal.textContent = `¥ ${totalCollected.toLocaleString()}`;
    balanceVal.textContent = `¥ ${balance.toLocaleString()}`;
    
    // マイナス（不足）の赤文字対応
    if(balance < 0) {
        balanceVal.style.color = "red";
    } else {
        balanceVal.style.color = "var(--primary-red)";
    }

    // おみくじ表示の切り替え（ONで対象者がいれば表示、いなければ完全に隠す）
    if (omikujiResult) {
        omikujiResultArea.hidden = false;
        specialPersonArea.hidden = false;

        let groupName = omikujiResult.group === 'A' ? 'グループA' : 'グループB';
        if (isNormalMode) {
            groupName = '参加者';
        }
        const typeJa = omikujiResult.type === 'TADA' ? '無料（タダ）！' : 'ゴチ（多め）！';
        
        omikujiText.textContent = `大当たり！${groupName}の1名様が ${typeJa}`;
        specialPersonLabelJa.textContent = `${groupName}の1名 ${omikujiResult.labelJa}`;
        specialPersonLabelEn.textContent = `Special 1 in ${isNormalMode ? 'Members' : groupName}`;
    } else {
        omikujiResultArea.hidden = true;
        specialPersonArea.hidden = true;
    }
    
    // アニメーション用にいったん表示を 0 にリセットしておく
    resultAmountA.textContent = "0";
    resultAmountB.textContent = "0";
    resultAmountSpecial.textContent = "0";
}

//=========================================================
// 鑑定団風・ルーレットアニメーション関数
//=========================================================
// 1の位から順番に「ピタッ、ピタッ」と止まり、最後の桁が最も長く回ってからシャキーンと確定する
function runRouletteAnimation(isNormalMode, payA, payB, paySpecial, omikujiResult) {
    const targets = [];
    targets.push({ element: resultAmountA, finalValue: payA, finalStr: payA.toString() });
    
    if (!isNormalMode) {
        targets.push({ element: resultAmountB, finalValue: payB, finalStr: payB.toString() });
    }

    if (omikujiResult) {
        targets.push({ element: resultAmountSpecial, finalValue: paySpecial, finalStr: paySpecial.toString() });
    }

    const TOTAL_DURATION = 2500; // 2.5秒
    const INTERVAL = 50;         // 50msごとに数字を更新
    const startTime = Date.now();
    
    // すべての目的値の中で最大の桁数を調べる
    let maxDigits = 0;
    targets.forEach(t => {
        t.element.classList.remove('anim-bling');
        maxDigits = Math.max(maxDigits, t.finalStr.length);
    });

    // 右（ゼロの位）から何桁目までが確定するか、その時間（ms）のしきい値を計算する
    // ex) 4桁の場合: 0桁=0ms, 1桁=500ms, 2桁=1000ms, 3桁=1500ms, 最後4桁は2500ms(ここだけタメる)
    const lockTimes = [0];
    for (let i = 0; i < maxDigits; i++) {
        if (i === maxDigits - 1) {
            lockTimes.push(TOTAL_DURATION); // 最後は全体の終了時間まで粘る
        } else {
            lockTimes.push((TOTAL_DURATION * 0.6) / Math.max(1, maxDigits - 1) * (i + 1));
        }
    }

    const timerId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        // 現時点で何桁目までロック（確定）されたか
        let globalLockedDigits = 0;
        for(let i = 1; i <= maxDigits; i++) {
            if (elapsed >= lockTimes[i]) {
                globalLockedDigits = i;
            }
        }
        
        // 指定の時間が経過したら全体終了
        const allFinished = elapsed >= TOTAL_DURATION;

        targets.forEach(t => {
            const strLen = t.finalStr.length;
            let displayStr = "";
            let lockedForThisTarget = Math.min(globalLockedDigits, strLen);
            
            // 全て完了したらそのまま確定値を入れて終了
            if (allFinished) {
                 t.element.textContent = parseInt(t.finalStr, 10).toLocaleString();
                 return;
            }

            // 1文字ずつ文字列を組み立てる
            for (let i = 0; i < strLen; i++) {
                const digitFromRight = strLen - i; // 1-indexed (右端が1)
                
                if (digitFromRight <= lockedForThisTarget) {
                    // 確定した桁
                    displayStr += t.finalStr[i];
                } else {
                    // まだくるくる回る桁
                    if (i === 0) {
                        displayStr += Math.floor(Math.random() * 9 + 1).toString(); // 一番最初の桁は0にしない
                    } else {
                        displayStr += Math.floor(Math.random() * 10).toString();
                    }
                }
            }
            
            // カンマ区切りの文字列にしてDOMにセット
            let valWithComma = parseInt(displayStr, 10).toLocaleString();
            if (t.element.textContent !== valWithComma) {
                t.element.textContent = valWithComma;
            }
        });

        // 終了後、シャキーンエフェクトを付与
        if (allFinished) {
            clearInterval(timerId);
            targets.forEach(t => {
                t.element.classList.add('anim-bling');
            });
        }
    }, INTERVAL);
}
