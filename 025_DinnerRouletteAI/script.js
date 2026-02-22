// -------------------------------------------------------------
// Dinner Roulette AI - Main Logic
// -------------------------------------------------------------

// ============================================
// 1. Data Definition / データ定義
// ============================================

// 各ムード（気分）ごとの食材・調理法・味付けの候補リスト
const FOOD_DATA = {
    // ----------------------------
    // ガッツリ (Hearty)
    // ----------------------------
    hearty: {
        ingredients: [
            "豚バラ肉 (Pork Belly)", "牛ステーキ肉 (Beef Steak)", "ハンバーグ (Hamburger Steak)",
            "鶏もも肉 (Chicken Thigh)", "厚切りベーコン (Thick Bacon)", "カツレツ用豚肉 (Pork Cutlet)"
        ],
        methods: [
            "のガーリック炒め (Garlic Stir-fry)", "のチーズ焼き (Cheese Bake)",
            "の唐揚げ (Deep Fried)", "のスタミナ丼 (Stamina Bowl)",
            "の照り焼き (Teriyaki)", "の角煮風 (Kakuni Style)"
        ],
        flavors: [
            "ニンニク醤油味 (Garlic Soy)", "濃厚バター醤油 (Rich Butter Soy)",
            "こってり味噌 (Rich Miso)", "甘辛バーベキュー (Sweet Spicy BBQ)",
            "マヨネーズソース (Mayonnaise)", "ブラックペッパー (Black Pepper)"
        ]
    },
    // ----------------------------
    // ヘルシー (Healthy)
    // ----------------------------
    healthy: {
        ingredients: [
            "鶏ささみ (Chicken Breast)", "白身魚 (White Fish)", "豆腐 (Tofu)",
            "サーモン (Salmon)", "エビ (Shrimp)", "きのこ盛り合わせ (Mushrooms)"
        ],
        methods: [
            "の蒸し焼き (Steamed)", "のホイル焼き (Foil Grilled)",
            "のサラダ仕立て (Salad Style)", "のスープ煮 (Soup Boiled)",
            "のマリネ (Marinated)", "のおろしポン酢がけ (With Ponzu)"
        ],
        flavors: [
            "レモンハーブ (Lemon Herb)", "生姜醤油 (Ginger Soy)",
            "梅肉ソース (Plum Sauce)", "オリーブオイル塩 (Olive Oil & Salt)",
            "柚子胡椒 (Yuzu Kosho)", "ごまドレッシング (Sesame Dressing)"
        ]
    },
    // ----------------------------
    // 時短 (Quick)
    // ----------------------------
    quick: {
        ingredients: [
            "豚こま肉 (Sliced Pork)", "ツナ缶 & 卵 (Tuna & Egg)", "冷凍うどん (Frozen Udon)",
            "ソーセージ (Sausage)", "もやし & 挽肉 (Bean Sprouts & Minced Meat)", "ちくわ (Chikuwa)"
        ],
        methods: [
            "のレンジ蒸し (Microwave Steamed)", "の卵とじ (Egg Bound)",
            "のチャンプルー (Stir-fry)", "のワンパンパスタ (One Pan Pasta)",
            "の即席丼 (Instant Bowl)", "の野菜炒め (Veggie Stir-fry)"
        ],
        flavors: [
            "麺つゆバター (Noodle Soup & Butter)", "焼肉のたれ (BBQ Sauce)",
            "カレー粉炒め (Curry Powder)", "ケチャップ炒め (Ketchup)",
            "塩こしょう (Salt & Pepper)", "ポン酢 (Ponzu)"
        ]
    }
};

// ============================================
// 2. State & Elements / 状態と要素の取得
// ============================================

let currentMood = 'hearty'; // 初期ムード
let isSpinning = [false, false, false]; // 各スロットの回転状態
let timers = [null, null, null]; // アニメーション用タイマー
let finalResults = ["", "", ""]; // 最終的な結果

// DOM要素
const btnMoods = document.querySelectorAll('.btn-mood');
const btnSpinAll = document.getElementById('btn-spin-all');
const resultArea = document.getElementById('result-area');
const recipeSteps = document.getElementById('recipe-steps');
const menuNameEl = document.getElementById('menu-name');
const btnSearch = document.getElementById('btn-search');

// スロット要素 (Reel: 表示部, Btn: 個別リロールボタン)
const slots = [
    { reel: document.getElementById('reel-ingredient'), btn: document.getElementById('reroll-ingredient'), type: 'ingredients' },
    { reel: document.getElementById('reel-method'), btn: document.getElementById('reroll-method'), type: 'methods' },
    { reel: document.getElementById('reel-flavor'), btn: document.getElementById('reroll-flavor'), type: 'flavors' }
];

// ============================================
// 3. Logic Functions / ロジック関数
// ============================================

/**
 * 指定したムードのリストからランダムに1つ取得
 */
function getRandomItem(type) {
    const list = FOOD_DATA[currentMood][type];
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
}

/**
 * スロットを回転させる
 * @param {number} index スロット番号 (0-2)
 * @param {boolean} isManual 手動リロールかどうか
 */
function spinSlot(index, isManual = false) {
    if (isSpinning[index]) return; // 既に回転中なら無視

    isSpinning[index] = true;
    slots[index].reel.classList.add('rolling');
    slots[index].btn.disabled = true;

    // 手動リロールでない（全体スピンの）場合は、順番に止まるようにウェイトをかける
    // 手動リロールは短めに設定
    let duration = isManual ? 1000 : 1000 + (index * 500);

    // アニメーション：高速でテキストを切り替える
    timers[index] = setInterval(() => {
        slots[index].reel.querySelector('span').textContent = getRandomItem(slots[index].type);
    }, 100);

    // 一定時間後に停止
    setTimeout(() => {
        stopSlot(index);
    }, duration);
}

/**
 * スロットを停止する
 */
function stopSlot(index) {
    clearInterval(timers[index]);
    isSpinning[index] = false;
    slots[index].reel.classList.remove('rolling');

    // 最終決定
    const finalItem = getRandomItem(slots[index].type);
    slots[index].reel.querySelector('span').textContent = finalItem;
    finalResults[index] = finalItem; // 結果を保存

    // 個別リロールボタンを有効化
    slots[index].btn.disabled = false;

    // 全てのスロットが停止したら詳細を表示
    if (!isSpinning.some(state => state)) {
        showResult();
        btnSpinAll.disabled = false;
        btnSpinAll.textContent = "🎲 SPIN AGAIN / もう一度回す";
    }
}

/**
 * 結果を表示・レシピ生成
 */
function showResult() {
    const [ingredient, method, flavor] = finalResults;

    // 表示用に英語・カッコを取り除く（簡易的な処理）
    // 例: "豚バラ肉 (Pork)" -> "豚バラ肉"
    const simpleIng = ingredient.split('(')[0].trim();
    // methodは「の○○」となっているので、「の」を取り除く
    const simpleMethod = method.split('(')[0].replace(/^の/, '').trim();
    const simpleFlavor = flavor.split('(')[0].trim();

    // メニュー名作成
    const menuName = `${simpleFlavor}風味の${simpleIng}${simpleMethod}`;
    menuNameEl.textContent = menuName;

    // 材料リスト生成 & 表示
    const ingredientHtml = generateIngredients(simpleIng, simpleFlavor);
    document.getElementById('ingredient-list').innerHTML = ingredientHtml;

    // レシピテキスト生成
    const recipeText = generateRecipe(simpleIng, simpleMethod, simpleFlavor);
    recipeSteps.innerHTML = recipeText;

    // 検索ボタン更新
    btnSearch.href = `https://www.google.com/search?q=${encodeURIComponent(menuName + ' レシピ')}`;

    // エリア表示
    resultArea.classList.remove('hidden');
}

/**
 * 材料リスト生成ロジック (2人分)
 */
function generateIngredients(mainIng, flavor) {
    let list = [];

    // メイン食材の分量判定（簡易ロジック）
    // 肉類: 300g, 魚: 2切れ, その他: 適量
    if (mainIng.includes("肉") || mainIng.includes("ベーコン") || mainIng.includes("ソーセージ")) {
        list.push(`${mainIng}: 250g〜300g`);
    } else if (mainIng.includes("魚") || mainIng.includes("サーモン") || mainIng.includes("ぶり")) {
        list.push(`${mainIng}: 2切れ`);
    } else if (mainIng.includes("豆腐")) {
        list.push(`${mainIng}: 1丁`);
    } else if (mainIng.includes("うどん")) {
        list.push(`${mainIng}: 2玉`);
    } else if (mainIng.includes("卵")) {
        list.push(`${mainIng}: 3〜4個`);
    } else {
        list.push(`${mainIng}: 2人分`);
    }

    // 味付けに応じたサブ食材を追加
    if (flavor.includes("ニンニク") || flavor.includes("ガーリック")) {
        list.push("ニンニク: 1片 (みじん切り)");
    }
    if (flavor.includes("生姜")) {
        list.push("生姜: 1片 (すりおろし/千切り)");
    }
    if (flavor.includes("チーズ")) {
        list.push("ピザ用チーズ: 適量");
    }
    if (flavor.includes("ハーブ")) {
        list.push("お好みのハーブ (ローズマリー等): 少々");
    }
    if (flavor.includes("ポン酢")) {
        list.push("大根おろし/ネギ: お好みで");
    }

    // 共通の付け合わせ野菜（ランダムで1つ追加）
    const sideVeggies = ["玉ねぎ: 1/2個", "キャベツ: 1/8個", "ピーマン: 2個", "人参: 1/2本", "ブロッコリー: 1/2株"];
    const randomVeggie = sideVeggies[Math.floor(Math.random() * sideVeggies.length)];
    list.push(randomVeggie);

    // 調味料
    list.push(`${flavor}の調味料: 適量`);
    list.push("サラダ油/オリーブオイル: 大さじ1");

    // HTMLリスト化
    return list.map(item => `<li>${item}</li>`).join('');
}

/**
 * 簡易レシピ生成ロジック
 */
function generateRecipe(ing, method, flavor) {
    return `
        <p><strong>Step 1:</strong> ${ing}と野菜を食べやすい大きさに切ります。<br><span style="color:#666;font-size:0.8em;">(下準備があればここで行います)</span></p>
        <p><strong>Step 2:</strong> フライパン（または鍋・レンジ）を用意し、${flavor}で味付けをしながら加熱します。</p>
        <p><strong>Step 3:</strong> 全体に火が通ったら、${method}にして完成！<br>お好みで彩りを添えてください。</p>
    `;
}

// ============================================
// 4. Event Listeners / イベントリスナー
// ============================================

// ムード選択ボタン
btnMoods.forEach(btn => {
    btn.addEventListener('click', () => {
        // アクティブクラスの切り替え
        btnMoods.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // ムード更新
        currentMood = btn.dataset.mood;

        // UIリセット（スロットの内容は変えず、再スピンを促す）
        // オプション: ムードを変えた瞬間リセットしても良いが、ユーザー操作を待つ
    });
});

// 全体スピンボタン
btnSpinAll.addEventListener('click', () => {
    if (isSpinning.some(state => state)) return;

    resultArea.classList.add('hidden'); // 結果を隠す
    btnSpinAll.disabled = true;

    // 3つ全て回す
    spinSlot(0);
    spinSlot(1);
    spinSlot(2);
});

// 個別リロールボタン
slots.forEach((slot, index) => {
    slot.btn.addEventListener('click', () => {
        resultArea.classList.add('hidden'); // 結果隠し（不整合を防ぐため）
        spinSlot(index, true); // true = 手動 (Manual)
    });
});

// 初期ロード時
// 何も表示しない状態で待機、あるいは自動で1回回しても良いが、
// ユーザーに「SPIN」を押させる体験を優先する。
