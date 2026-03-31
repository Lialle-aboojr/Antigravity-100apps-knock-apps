/* =========================================================================
   アプリの状態（データ）を管理する変数
   各材料ごとのID、名前、価格、購入量、使用量を配列で管理します。
========================================================================= */
let ingredients = [
  // 初期データとして空の項目を1つ用意しておく
  { id: Date.now(), name: "", price: null, totalQty: null, usedQty: null }
];

/* =========================================================================
   ユーティリティ関数（便利な道具）
========================================================================= */

// 1. XSS（クロスサイトスクリプティング）対策関数
// ユーザーが入力した文字を画面にそのまま表示すると危険な場合があるため、
// 特殊記号を安全な文字（HTMLエンティティ）に変換します。
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, function(match) {
    const escape = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return escape[match];
  });
}

// 2. 金額をカンマ区切り（例：1,000）で表示するためのフォーマット関数
function formatCurrency(number) {
  // 小数点は切り捨てて、日本円の形式（¥）で表示します
  return '¥' + Math.floor(number).toLocaleString('ja-JP');
}

/* =========================================================================
   メインの計算・更新ロジック
========================================================================= */

// 原価計算を実行し、画面下の合計表示などを更新する関数
function calculateTotals() {
  const servingsInput = document.getElementById('servings');
  let servings = parseFloat(servingsInput.value);
  
  // スマホ等で間違えて空欄にしたり、0が入力された場合の安全対策
  if (isNaN(servings) || servings <= 0) {
    servings = 1;
  }

  let totalCost = 0;

  // 各材料をループ処理して原価計算を行います
  ingredients.forEach(item => {
    const price = parseFloat(item.price);
    const totalQty = parseFloat(item.totalQty);
    const usedQty = parseFloat(item.usedQty);

    // 金額、購入量、使用量がすべて正しく数字で入力されており、
    // かつ 0 で割るエラー（ゼロ除算）を防止できている場合のみ計算
    if (!isNaN(price) && !isNaN(totalQty) && !isNaN(usedQty) && totalQty > 0) {
      
      // 単価計算ロジック: (購入価格 / 購入した量) × 今回使った量 = その材料の原価
      const itemCost = (price / totalQty) * usedQty;
      totalCost += itemCost;
      
      // その材料カード内の「材料の原価」表示を更新
      const costDisplay = document.getElementById(`cost-${item.id}`);
      if (costDisplay) {
        costDisplay.innerHTML = `<span class="result-label" style="font-size:0.85rem; margin-right:8px; color:#666; font-weight:normal;">この材料の原価 / Cost:</span>${formatCurrency(itemCost)}`;
      }
    } else {
      // まだ入力が不十分な場合などは ¥0 と表示しておく
      const costDisplay = document.getElementById(`cost-${item.id}`);
      if (costDisplay) {
        costDisplay.innerHTML = `<span class="result-label" style="font-size:0.85rem; margin-right:8px; color:#666; font-weight:normal;">この材料の原価 / Cost:</span>¥0`;
      }
    }
  });

  // 全体の合計原価を画面に反映
  document.getElementById('total-cost').textContent = formatCurrency(totalCost);
  
  // 1人前あたりの原価を計算して画面に反映
  const costPerServing = totalCost / servings;
  document.getElementById('cost-per-serving').textContent = formatCurrency(costPerServing);
}

// データに基づいて画面上にHTMLの材料リストを作り直す関数
function renderIngredients() {
  const container = document.getElementById('ingredients-container');
  container.innerHTML = ''; // まずは中身を空っぽにする

  // ingredients配列の中身を一つずつHTMLに変換していく
  ingredients.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    
    // テンプレートリテラル（バッククォート ` `）を使ってHTML文字列を作る
    // 注：ユーザー入力が関わる item.name は必ず escapeHTML を通すこと！
    row.innerHTML = `
      <div class="ingredient-cost" id="cost-${item.id}">
         <span class="result-label" style="font-size:0.85rem; margin-right:8px; color:#666; font-weight:normal;">この材料の原価 / Cost:</span>¥0
      </div>
      
      <!-- 上段：材料名 -->
      <div class="ingredient-grid top-row">
        <div class="input-group">
          <label>材料名 / Ingredient Name</label>
          <input type="text" 
                 placeholder="例: じゃがいも / Potato" 
                 value="${escapeHTML(item.name || '')}" 
                 oninput="updateIngredient(${item.id}, 'name', this.value)">
        </div>
      </div>
      
      <!-- 下段：数値入力と削除ボタン -->
      <div class="ingredient-grid bottom-row">
        <div class="input-group">
          <label>購入価格 / Price (¥)</label>
          <input type="number" min="0" 
                 placeholder="例: 200" 
                 value="${item.price !== null ? escapeHTML(String(item.price)) : ''}" 
                 oninput="updateIngredient(${item.id}, 'price', this.value)">
        </div>
        <div class="input-group">
          <label>購入量 / Total Qty</label>
          <input type="number" min="0" step="0.1" 
                 placeholder="例: 500" 
                 value="${item.totalQty !== null ? escapeHTML(String(item.totalQty)) : ''}" 
                 oninput="updateIngredient(${item.id}, 'totalQty', this.value)">
        </div>
        <div class="input-group">
          <label>使った量 / Used Qty</label>
          <input type="number" min="0" step="0.1"
                 placeholder="例: 100" 
                 value="${item.usedQty !== null ? escapeHTML(String(item.usedQty)) : ''}" 
                 oninput="updateIngredient(${item.id}, 'usedQty', this.value)">
        </div>
        
        <div class="delete-container">
          <!-- 要素が1つしかない場合は削除ボタンを押せないように（opacityで半透明に） -->
          <button class="btn btn-delete" 
                  onclick="removeIngredient(${item.id})"
                  ${ingredients.length === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            🗑️ 削除
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(row);
  });

  // 全て作り終えたら、金額計算を呼び出して最新の金額にする
  calculateTotals();
}

/* =========================================================================
   イベント（ユーザーの操作）に関する処理
========================================================================= */

// 【更新】文字や数字が入力されるたびに呼ばれる処理
window.updateIngredient = function(id, field, value) {
  // 変更された項目と同じIDを持つデータを配列から探す
  const item = ingredients.find(i => i.id === id);
  if (item) {
    item[field] = value; // データを上書き
    // 入力の途中でフォーカスが外れるのを防ぐため、画面の再描画（renderIngredients）はせずに
    // 合計金額の計算（calculateTotals）だけを実行する
    calculateTotals();
  }
};

// 【追加】「材料を追加」ボタンが押された時の処理
document.getElementById('add-btn').addEventListener('click', () => {
  // 配列の中に新しい空のデータを追加する
  ingredients.push({
    id: Date.now(), // 識別するための被らないID（現在の時刻）
    name: "",
    price: null,
    totalQty: null,
    usedQty: null
  });
  renderIngredients(); // 新しいデータを入れて画面を作り直す
});

// 【削除】「削除」ボタンが押された時の処理
window.removeIngredient = function(id) {
  // 万が一最後の1つだったら削除させない（安全対策）
  if (ingredients.length <= 1) return;
  
  // filterを使って、削除したいID『以外』のものを集めた新しい配列にする
  ingredients = ingredients.filter(i => i.id !== id);
  renderIngredients(); // 減ったデータで画面を作り直す
};

// 「何人前」や「料理名」などの基本情報が変更された時は、すぐに計算し直す
document.getElementById('servings').addEventListener('input', calculateTotals);

// アプリ起動時に最初の1回だけ画面を描画する
renderIngredients();
