
document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const baseServingsInput = document.getElementById('base-servings');
    const targetServingsInput = document.getElementById('target-servings');
    const scalingFactorDisplay = document.getElementById('scaling-factor-display');
    const ingredientsList = document.getElementById('ingredients-list');
    const addRowBtn = document.getElementById('add-row-btn');
    const recalcBtn = document.getElementById('recalc-btn');
    const unitToggle = document.getElementById('unit-toggle');

    // データモデル
    let ingredients = [
        { name: '', baseQty: null, unit: 'g' },
        { name: '', baseQty: null, unit: 'ml' },
        { name: '', baseQty: null, unit: '大さじ' }
    ];

    const units = ['g', 'ml', '個', '枚', '大さじ', '小さじ', 'カップ', '適量'];

    // 初期化
    const init = () => {
        renderIngredients();
        updateScalingFactor();

        // イベントリスナー
        baseServingsInput.addEventListener('input', updateScalingFactor);
        targetServingsInput.addEventListener('input', updateScalingFactor);

        addRowBtn.addEventListener('click', () => {
            addIngredientRow();
        });

        recalcBtn.addEventListener('click', () => {
            // 再計算ボタンは視覚的なフィードバックのみ（入力時に自動計算されるが、
            // ユーザーが明示的に押したい場合のためにアニメーションなどを入れると良い）
            recalcAll();

            // ボタンを一時的にアクティブ色にするなどの演出
            const originalText = recalcBtn.textContent;
            recalcBtn.textContent = "計算完了！";
            setTimeout(() => {
                recalcBtn.textContent = originalText;
            }, 1000);
        });

        unitToggle.addEventListener('change', () => {
            recalcAll();
        });
    };

    // 倍率計算と表示更新
    const updateScalingFactor = () => {
        const base = parseFloat(baseServingsInput.value);
        const target = parseFloat(targetServingsInput.value);

        if (base > 0 && target > 0) {
            const factor = target / base;
            // 小数点第2位まで表示（必要に応じて切り捨て/四捨五入）
            scalingFactorDisplay.textContent = Math.round(factor * 100) / 100;
            recalcAll();
        } else {
            scalingFactorDisplay.textContent = '---';
        }
    };

    // 全ての行を再計算して値を更新
    const recalcAll = () => {
        const base = parseFloat(baseServingsInput.value);
        const target = parseFloat(targetServingsInput.value);
        if (base <= 0 || target <= 0) return;

        const factor = target / base;
        const isMlMode = unitToggle.checked;

        // Note: DOMから直接値を読み取って更新する方式にする
        // （state管理を完全に行うと入力中のフォーカス外れなどが面倒なので、
        //  今回はDOM中心で管理しつつ、計算結果を入力欄に書き込むアプローチをとる。
        //  ただし、ユーザーが「元の分量」を入力しているつもりで、
        //  計算結果が上書きされると困るため、
        //  「元の分量(baseQty)」を保持しておくデータ属性が必要かもしくは
        //  UI的に「元の量」と「計算後の量」を分けるのがベストだが、
        //  要件定義では『分量を再計算...計算し直して表示』とある。
        //  
        //  一番シンプルなのは：
        //  ユーザーは「1人分のレシピ」を見ながら入力する → 自動的に「N人分」に変換されて表示される？
        //  いいえ、入力欄は「元の分量」であるべきです。
        //  しかし、出力欄が別途ないと「結果」が見えません。
        //  
        //  要件: 『入力すると自動で「倍率（例：1.5倍）」を計算して画面に表示する。』
        //  『「分量を再計算」ボタン: 設定した倍率に合わせて、全ての材料の数値を計算し直して表示する。』
        //  
        //  この「表示する」が「入力値を書き換える」のか「横に結果を表示する」のか。
        //  通常、リサイザーアプリでは「入力値（Base）」はずっと保持しておきたい（後で人数を変えるため）。
        //  したがって、各行に「入力（元の量）」と「結果（計算後の量）」を表示するか、
        //  あるいは「計算モード」に入ると表示が切り替わるか。
        //  
        //  ここでは、シンプルに INPUT は「元の量」を保持し続け、
        //  表示用に INPUT の値を書き換えるのではなく、
        //  別途「計算結果テキスト」を表示するか、あるいは
        //  「今表示されているのが計算後の値そのもの」にしてしまうと元の値が失われる。
        //  
        //  今回は **「分量入力欄」はあくまで元のレシピの入力用** とし、
        //  **計算結果はインプットの横（あるいは下、太字）に表示する** 形が親切でしょう。
        //  しかし「材料リスト管理エリア」の欄数が限られている。
        //  
        //  あえて、INPUT の値を書き換える仕様にする場合（破壊的変更）、
        //  元に戻せなくなるのでUXが悪い。
        //  
        //  **解決策**: 
        //  各行に hidden または data 属性で baseValue を持つ。
        //  ユーザーが値を変更したら baseValue を更新。
        //  計算時は baseValue * factor を表示用エリア（またはinput）に出す。
        //  
        //  ここでは見た目を綺麗にするため、
        //  Input (Base) -> Text (Result) のように並べるか、
        //  Input自体に結果を表示してしまうと編集したいときに困る。
        //  
        //  今回は **「Quantity Input」は常に「計算結果」を表示する** 方式だと編集が難しいので、
        //  **Quantity Input (編集可能・Base値)** の横に **「➔ 結果」** を表示するスタイルにします。
        //  それなら「再計算ボタン」の意味は？ -> リアルタイム更新で良いが、明示的なボタンも設置。

        const rows = document.querySelectorAll('.ingredient-row');
        rows.forEach(row => {
            const qtyInput = row.querySelector('.qty-input');
            const unitSelect = row.querySelector('.unit-select');
            const resultDisplay = row.querySelector('.calculated-result');

            let baseQty = parseFloat(qtyInput.value);
            if (isNaN(baseQty)) {
                resultDisplay.textContent = '-';
                return;
            }

            // 単位取得
            let unit = unitSelect.value;
            let calculatedQty = baseQty * factor;

            // ml変換モード
            if (isMlMode) {
                // 変換ロジック
                if (unit === '大さじ') {
                    calculatedQty = baseQty * 15 * factor;
                    unit = 'ml';
                } else if (unit === '小さじ') {
                    calculatedQty = baseQty * 5 * factor;
                    unit = 'ml';
                } else if (unit === 'カップ') {
                    calculatedQty = baseQty * 200 * factor;
                    unit = 'ml';
                }
            }

            // 表示の整形（小数が見にくい場合など）
            // 小数点第1位くらいまで、ただし整数なら.0はつけない
            const formatQty = parseFloat(calculatedQty.toFixed(1));

            resultDisplay.textContent = `${formatQty} ${unit}`;
        });
    };

    // 行を追加
    const addIngredientRow = (data = { name: '', baseQty: '', unit: 'g' }) => {
        const div = document.createElement('div');
        div.className = 'ingredient-row';
        div.innerHTML = `
            <input type="text" placeholder="材料名" class="name-input" value="${data.name}">
            <input type="number" placeholder="分量" class="qty-input" value="${data.baseQty}" step="0.1">
            <select class="unit-select">
                ${units.map(u => `<option value="${u}" ${u === data.unit ? 'selected' : ''}>${u}</option>`).join('')}
            </select>
            <button class="delete-btn" aria-label="削除">×</button>
            <div class="result-area" style="grid-column: 1 / -1; text-align: right; color: var(--accent-brown); font-size: 0.9em; margin-top: -5px;">
                計算結果: <span class="calculated-result" style="font-weight: bold; font-size: 1.1em;">-</span>
            </div>
        `;

        // 削除ボタン
        div.querySelector('.delete-btn').addEventListener('click', () => {
            div.remove();
            // 行がなくなったら困るので最低1行...は要件にないが、全部消せても追加ボタンがあるからOK
        });

        // 入力変更時に再計算
        const inputs = div.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', recalcAll);
        });

        ingredientsList.appendChild(div);
    };

    // リスト描画（初期データ）
    const renderIngredients = () => {
        ingredientsList.innerHTML = '';
        ingredients.forEach(ing => {
            addIngredientRow({ name: ing.name, baseQty: ing.baseQty, unit: ing.unit });
        });
        // 初期計算
        recalcAll();
    };

    // 実行
    init();
});
