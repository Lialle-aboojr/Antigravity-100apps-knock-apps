/**
 * エンタメ割り勘電卓 (PayTilt & Roulette)
 * 割り勘ロジック、おみくじ機能、アニメーションの制御
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM要素の取得 ---
    
    // 入力フォーム関連
    const splitModes = document.querySelectorAll('input[name="splitMode"]');
    const totalAmountInput = document.getElementById('totalAmount');
    
    // グループ表示切り替え関連
    const groupAContainer = document.getElementById('groupAContainer');
    const groupBContainer = document.getElementById('groupBContainer');
    const ratioContainer = document.getElementById('ratioContainer');
    const badgeA = document.getElementById('badgeA');
    const labelAJa = document.getElementById('labelAJa');
    const labelAEn = document.getElementById('labelAEn');

    const groupAPeopleInput = document.getElementById('groupAPeople');
    const groupBPeopleInput = document.getElementById('groupBPeople');
    
    const ratioSlider = document.getElementById('ratioSlider');
    const ratioLabelA = document.getElementById('ratioLabelA');
    const ratioLabelB = document.getElementById('ratioLabelB');
    
    const roundingSelect = document.getElementById('roundingSelect');
    
    const omikujiToggle = document.getElementById('omikujiToggle');
    const animationToggle = document.getElementById('animationToggle');
    
    const calculateBtn = document.getElementById('calculateBtn');
    const errorMessage = document.getElementById('errorMessage');

    // 結果表示エリア関連
    const resultArea = document.getElementById('resultArea');
    const omikujiResultArea = document.getElementById('omikujiResultArea');
    const omikujiText = document.getElementById('omikujiText');
    
    const resultBSection = document.querySelector('.result-b');
    const headerAJa = document.querySelector('.result-a .result-group-header .ja');
    const headerAEn = document.querySelector('.result-a .result-group-header .en');
    const badgeAElem = document.querySelector('.result-a .badge-a');
    
    const specialPersonArea = document.getElementById('specialPersonArea');
    const specialPersonLabelJa = document.getElementById('specialPersonLabelJa');
    const specialPersonLabelEn = document.getElementById('specialPersonLabelEn');
    
    const resultAmountA = document.getElementById('resultAmountA');
    const resultSubA = document.getElementById('resultSubA');
    
    const resultAmountB = document.getElementById('resultAmountB');
    const resultSubB = document.getElementById('resultSubB');
    
    const resultAmountSpecial = document.getElementById('resultAmountSpecial');
    
    const totalCollectedVal = document.getElementById('totalCollectedVal');
    const balanceVal = document.getElementById('balanceVal');
    
    const resetBtn = document.getElementById('resetBtn');

    // 全角数字を半角に変換するユーティリティ関数
    function toHalfWidthNum(val) {
        if (!val) return val;
        // 全角数字を半角数字に変換
        const halfVal = val.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
        // 数字以外の文字を除外
        return halfVal.replace(/[^0-9]/g, '');
    }

    // 数値を日本語の通貨フォーマット（カンマ区切り）にするユーティリティ
    function formatCurrency(num) {
        return num.toLocaleString('ja-JP');
    }

    // エラー表示の切り替え
    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = '';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }


    // --- 2. ユーザーインターフェースの設定とイベント ---

    // 割り勘モードの切り替えイベント
    splitModes.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'normal') {
                // 通常割り勘：Bグループ要素を完全に非表示
                groupBContainer.style.display = 'none';
                ratioContainer.style.display = 'none';
                badgeA.style.display = 'none';
                labelAJa.textContent = "人数";
                labelAEn.textContent = "People";
                groupBPeopleInput.value = ""; // リセットしておく
            } else {
                // グループ・傾斜割り勘：Bグループ要素を表示
                groupBContainer.style.display = '';
                ratioContainer.style.display = '';
                badgeA.style.display = '';
                labelAJa.textContent = "グループA 人数";
                labelAEn.textContent = "Group A People";
            }
        });
    });

    // スライダー連動（割合の表示更新）
    ratioSlider.addEventListener('input', (e) => {
        const valA = parseInt(e.target.value, 10);
        const valB = 10 - valA;
        ratioLabelA.textContent = valA;
        ratioLabelB.textContent = valB;
    });

    // リセットボタンの動作
    resetBtn.addEventListener('click', () => {
        resultArea.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });


    // --- 3. メインの計算ロジック ---
    calculateBtn.addEventListener('click', () => {
        hideError();

        // 全角入力を考慮して値を取得・変換
        const splitMode = document.querySelector('input[name="splitMode"]:checked').value;
        const totalAmountStr = toHalfWidthNum(totalAmountInput.value);
        const groupAPeopleStr = toHalfWidthNum(groupAPeopleInput.value);
        const groupBPeopleStr = toHalfWidthNum(groupBPeopleInput.value);
        
        const totalAmount = parseInt(totalAmountStr, 10);
        const numA = parseInt(groupAPeopleStr, 10) || 0;
        const numB = (splitMode === 'group') ? (parseInt(groupBPeopleStr, 10) || 0) : 0;
        
        const ratioA = parseInt(ratioSlider.value, 10);
        const ratioB = 10 - ratioA;
        const roundingUnit = parseInt(roundingSelect.value, 10);
        
        let isOmikuji = omikujiToggle.checked;
        const isAnimation = animationToggle.checked;

        // 入力チェック（バリデーション）
        if (isNaN(totalAmount) || totalAmount <= 0) {
            showError("正しい支払総額を入力してください。 / Please enter a valid total amount.");
            return;
        }

        const totalPeople = numA + numB;
        if (totalPeople <= 0) {
            showError("参加人数を1人以上入力してください。 / Please enter at least 1 person.");
            return;
        }

        if (splitMode === 'group' && (numA === 0 || numB === 0)) {
            showError("グループ割り勘の場合、AとB両方の人数を入力してください。 / Please enter people for both groups.");
            return;
        }

        // --- おみくじ機能の抽選と特別ルールの適用 ---
        let omikujiResult = null;
        let specialPersonPay = 0; // 当選者の支払い額（タダ=0、ゴチ＝多め）
        
        // 当選者が存在するかどうかを管理する実人数
        let normalNumA = numA;
        let normalNumB = numB;
        
        // おみくじはONで、かつ複数人いる場合のみ発動
        if (isOmikuji && totalPeople > 1) {
            // おみくじの種類をランダム決定 (0: TADA, 1: GOCHI)
            const type = Math.random() < 0.5 ? 'TADA' : 'GOCHI';
            // もし通常モードなら全員の中で1人だけ選ぶが、ここでは「Aグループの1人」として扱う
            const group = (splitMode === 'group') ? (Math.random() < 0.5 ? 'A' : 'B') : 'A';
            
            omikujiResult = {
                type: type,
                group: group,
                labelJa: type === 'TADA' ? '無料(タダ)' : 'ゴチ(多め)',
            };
            
            // 当選者を通常の人数のカウントから1人外す
            if (group === 'A') {
                normalNumA -= 1;
            } else {
                normalNumB -= 1;
            }
        } else {
            isOmikuji = false;
            omikujiResult = null;
        }

        // --- 金額の算出（傾斜計算） ---
        let payA = 0;
        let payB = 0;
        let totalWeight = 0;
        let unitPrice = 0; // 1重みあたりの基本金額

        // 残りの支払総額（TADAの時は全体額を残り人数で割る。GOCHIの時はまずGOCHI額を引き、残りを割る）
        let remainingAmount = totalAmount;

        if (omikujiResult) {
            if (omikujiResult.type === 'GOCHI') {
                // ゴチ（多めに払う）の金額設定ロジック：
                // 総額の一定割合（例：20%〜40%）または「通常より少し多め」など
                // 今回はシンプルに、全体の (1 / 総人数) * 1.5 〜 2倍 などを目安にする
                const avgPay = totalAmount / totalPeople;
                let gochiBase = avgPay * 2; 
                // もしGOCHIの額が総額を超えてしまったら総額にする
                if (gochiBase >= totalAmount) {
                    gochiBase = totalAmount * 0.8; // 最低でも他者が少しは払うように
                }
                // 端数処理
                specialPersonPay = Math.ceil(gochiBase / roundingUnit) * roundingUnit;
                remainingAmount -= specialPersonPay;
            } else {
                // TADAの場合は当選者は 0円
                specialPersonPay = 0;
            }
        }

        // 残りの人達で remainingAmount を割る
        if (splitMode === 'normal') {
            // 通常割り勘：均等割り
            if (normalNumA > 0) {
                payA = Math.ceil((remainingAmount / normalNumA) / roundingUnit) * roundingUnit;
            }
        } else {
            // グループ割り勘：比率に基づく傾斜計算
            // Aグループ全体の重み: ratioA * normalNumA
            // Bグループ全体の重み: ratioB * normalNumB
            totalWeight = (ratioA * normalNumA) + (ratioB * normalNumB);
            
            if (totalWeight > 0) {
                unitPrice = remainingAmount / totalWeight;
                payA = Math.ceil((unitPrice * ratioA) / roundingUnit) * roundingUnit;
                payB = Math.ceil((unitPrice * ratioB) / roundingUnit) * roundingUnit;
            }
        }

        // 誰も払わないケースのフェイルセーフ (異常系)
        if (payA === 0 && payB === 0 && specialPersonPay === 0) {
            payA = Math.ceil((totalAmount / numA) / roundingUnit) * roundingUnit;
        }

        // --- UIの表示更新準備 ---
        prepareResultUI(splitMode === 'normal', normalNumA, normalNumB, omikujiResult);

        resultArea.style.display = 'block';
        // 結果エリアへスクロール
        setTimeout(() => {
            resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        // --- アニメーション表示の実行 ---
        if (isAnimation) {
            runRouletteAnimation(splitMode === 'normal', payA, payB, specialPersonPay, omikujiResult);
        } else {
            // アニメーションOFFの場合は即座に表示
            showFinalResults(splitMode === 'normal', payA, payB, specialPersonPay, omikujiResult);
            calculateTotals(payA, normalNumA, payB, normalNumB, specialPersonPay, omikujiResult, totalAmount);
        }
    });


    // --- 4. 関数定義 ---

    // UI要素の表示/非表示やラベルの切り替えを行う関数
    function prepareResultUI(isNormalMode, normalNumA, normalNumB, omikujiResult) {
        
        // 通常モードとグループモードでの表示切替
        if (isNormalMode) {
            resultBSection.style.display = 'none';
            headerAJa.textContent = "1人あたり";
            headerAEn.textContent = "Per Person";
            badgeAElem.style.display = 'none';
            document.querySelector('.result-a').style.opacity = normalNumA > 0 ? "1" : "0.5";
        } else {
            resultBSection.style.display = '';
            resultSubB.textContent = `（${normalNumB}名）`;
            document.querySelector('.result-b').style.opacity = normalNumB > 0 ? "1" : "0.5";
            
            headerAJa.textContent = "グループ A";
            headerAEn.textContent = "Group A";
            badgeAElem.style.display = '';
            document.querySelector('.result-a').style.opacity = normalNumA > 0 ? "1" : "0.5";
        }

        resultSubA.textContent = `（${normalNumA}名）`;

        // おみくじ表示の切り替え（ONで対象者がいれば表示、いなければ完全に隠す）
        if (omikujiResult) {
            omikujiResultArea.style.display = '';
            specialPersonArea.style.display = '';

            let groupName = omikujiResult.group === 'A' ? 'グループA' : 'グループB';
            if (isNormalMode) {
                groupName = '参加者';
            }
            const typeJa = omikujiResult.type === 'TADA' ? '無料（タダ）！' : 'ゴチ（多め）！';
            
            omikujiText.textContent = `大当たり！${groupName}の1名様が ${typeJa}`;
            specialPersonLabelJa.textContent = `${groupName}の1名 ${omikujiResult.labelJa}`;
            specialPersonLabelEn.textContent = `Special 1 in ${isNormalMode ? 'Members' : groupName}`;
        } else {
            omikujiResultArea.style.display = 'none';
            specialPersonArea.style.display = 'none';
        }

        // 初期状態で数値を "0" にしておく
        resultAmountA.textContent = "0";
        resultAmountB.textContent = "0";
        resultAmountSpecial.textContent = "0";
        
        // 一時的に合計を隠す
        totalCollectedVal.textContent = "計算中...";
        balanceVal.textContent = "計算中...";

        // キラキラエフェクトのクラスを削除しておく
        resultAmountA.classList.remove('anim-bling');
        resultAmountB.classList.remove('anim-bling');
        resultAmountSpecial.classList.remove('anim-bling');
    }

    // 仕様に忠実な鑑定団風ルーレットアニメーション
    function runRouletteAnimation(isNormalMode, payA, payB, paySpecial, omikujiResult) {
        
        // アニメーション対象のDOM要素と最終目標値のペア
        const targets = [];
        targets.push({ elem: resultAmountA, finalValue: payA });
        
        if (!isNormalMode) {
            targets.push({ elem: resultAmountB, finalValue: payB });
        }
        
        if (omikujiResult) {
            targets.push({ elem: resultAmountSpecial, finalValue: paySpecial });
        }

        // 各ターゲットごとにアニメーションを設定し、最大時間を取得
        let maxAnimTime = 0;
        targets.forEach(target => {
            const time = animateStrictRoulette(target.elem, target.finalValue);
            if (time > maxAnimTime) maxAnimTime = time;
        });

        // 全てのアニメーションが終わるであろう頃に、合計金額を表示する
        setTimeout(() => {
            const numA = parseInt(toHalfWidthNum(groupAPeopleInput.value), 10) || 0;
            const numB = isNormalMode ? 0 : (parseInt(toHalfWidthNum(groupBPeopleInput.value), 10) || 0);
            
            let normalNumA = numA;
            let normalNumB = numB;
            if (omikujiResult) {
                if(omikujiResult.group === 'A') normalNumA--;
                else normalNumB--;
            }
            
            const totalAmountStr = toHalfWidthNum(totalAmountInput.value);
            const totalAmount = parseInt(totalAmountStr, 10);
            
            calculateTotals(payA, normalNumA, payB, normalNumB, paySpecial, omikujiResult, totalAmount);
        }, maxAnimTime + 200);
    }

    // 仕様に忠実なルーレットアニメーション（1文字ずつspanで制御）
    function animateStrictRoulette(elem, finalValue) {
        // エフェクトを一旦リセット
        elem.classList.remove('anim-bling');
        
        if (finalValue === 0) {
            elem.innerHTML = `<span>0</span>`;
            elem.classList.add('anim-bling');
            return 0; // すぐ終わる
        }

        const formattedStr = formatCurrency(finalValue); // 例: "16,667"
        elem.innerHTML = '';
        
        // spanを生成してDOMに挿入し、管理用配列に保持
        const spanElements = [];
        
        for (let i = 0; i < formattedStr.length; i++) {
            const char = formattedStr[i];
            const span = document.createElement('span');
            
            if (char === ',') {
                // カンマはアニメーションさせずそのまま表示
                span.textContent = ',';
                elem.appendChild(span);
                spanElements.push({ isDigit: false, span: span, correctChar: ',' });
            } else {
                // 初期値はランダムな数字
                span.textContent = Math.floor(Math.random() * 10).toString();
                elem.appendChild(span);
                spanElements.push({ isDigit: true, span: span, correctChar: char });
            }
        }
        
        // 数値のspanだけを抽出 (右側=下の桁 から順番に処理するため reverse する)
        const digitSpans = [...spanElements].filter(item => item.isDigit).reverse();
        
        // 全桁に対して一斉にくるくる回す setInterval を開始 (約30ms間隔)
        digitSpans.forEach(item => {
            item.intervalId = setInterval(() => {
                item.span.textContent = Math.floor(Math.random() * 10).toString();
            }, 30);
        });

        let currentDelay = 800; // 最初の桁（1の位）のストップ時間
        let lastDelay = 0;

        digitSpans.forEach((item, index) => {
            // ストップ時間を算出
            if (index === 0) {
                // 1の位：800ms
                // そのまま
            } else if (index === digitSpans.length - 1) {
                // 一番上の桁（最後の桁）：直前の桁 + 1200ms
                currentDelay += 1200;
            } else {
                // その他の中間の桁：直前の桁 + 500ms
                currentDelay += 500;
            }

            setTimeout(() => {
                clearInterval(item.intervalId);
                item.span.textContent = item.correctChar;
                
                // 最後の桁が止まったらコンテナ全体に完了演出 (anim-bling クラス付与)
                if (index === digitSpans.length - 1) {
                    elem.classList.add('anim-bling');
                }
            }, currentDelay);
            
            lastDelay = currentDelay;
        });

        // 完走までの時間を返す
        return lastDelay;
    }

    // アニメーションなしですぐに結果を表示する
    function showFinalResults(isNormalMode, payA, payB, paySpecial, omikujiResult) {
        resultAmountA.textContent = formatCurrency(payA);
        if (!isNormalMode) {
            resultAmountB.textContent = formatCurrency(payB);
        }
        if (omikujiResult) {
            resultAmountSpecial.textContent = formatCurrency(paySpecial);
        }
    }

    // 各支払額から合計集金額とお釣りを計算し、表示する
    function calculateTotals(payA, normalNumA, payB, normalNumB, paySpecial, omikujiResult, totalTarget) {
        let collectedA = payA * normalNumA;
        let collectedB = payB * normalNumB;
        let collectedSpecial = omikujiResult ? paySpecial : 0;
        
        const totalCollected = collectedA + collectedB + collectedSpecial;
        const balance = totalCollected - totalTarget;
        
        totalCollectedVal.textContent = `¥${formatCurrency(totalCollected)}`;
        
        if (balance > 0) {
            balanceVal.textContent = `+ ¥${formatCurrency(balance)}`;
            balanceVal.style.color = "var(--primary-red)";
        } else if (balance < 0) {
            balanceVal.textContent = `- ¥${formatCurrency(Math.abs(balance))} (不足!)`;
            balanceVal.style.color = "blue";
        } else {
            balanceVal.textContent = "¥0 (ピッタリ!)";
            balanceVal.style.color = "var(--text-main)";
        }
    }
});
