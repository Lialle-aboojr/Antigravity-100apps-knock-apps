/* =========================================================================
   アプリの状態（データ）を管理する変数
   初期状態は空配列（まだ何も追加されていない状態）とします。
========================================================================= */
let ingredients = [];

/* =========================================================================
   ユーティリティ関数（便利な道具）
========================================================================= */

// 1. XSS（クロスサイトスクリプティング）対策関数
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
  // parseInt を使って小数点以下の入力を無視し、整数のみとして処理します。
  let servings = parseInt(servingsInput.value, 10);
  
  // スマホ等で間違えて空欄にしたり、0や負の値が入力された場合の安全対策
  if (isNaN(servings) || servings <= 0) {
    servings = 1;
  }

  let totalCost = 0;

  // 各材料をループ処理して原価計算を行います
  ingredients.forEach(item => {
    const price = parseFloat(item.price);
    const totalQty = parseFloat(item.totalQty);
    const usedQty = parseFloat(item.usedQty);

    // 全て数値として正しく、ゼロ除算しない場合のみ計算
    if (!isNaN(price) && !isNaN(totalQty) && !isNaN(usedQty) && totalQty > 0) {
      // (購入価格 / 購入した量) × 今回使った量 = その材料の原価
      const itemCost = (price / totalQty) * usedQty;
      totalCost += itemCost;
      
      const costDisplay = document.getElementById(`cost-${item.id}`);
      if (costDisplay) {
        costDisplay.innerHTML = `<span class="result-label" style="font-size:0.85rem; margin-right:8px; color:#666; font-weight:normal;">この材料の原価 / Cost:</span>${formatCurrency(itemCost)}`;
      }
    } else {
      const costDisplay = document.getElementById(`cost-${item.id}`);
      if (costDisplay) {
        costDisplay.innerHTML = `<span class="result-label" style="font-size:0.85rem; margin-right:8px; color:#666; font-weight:normal;">この材料の原価 / Cost:</span>¥0`;
      }
    }
  });

  // 全体の合計原価を画面に反映
  document.getElementById('total-cost').textContent = formatCurrency(totalCost);
  
  // 1人前あたりの原価計算
  const costPerServing = totalCost / servings;
  document.getElementById('cost-per-serving').textContent = formatCurrency(costPerServing);
}

// データに基づいて「追加済み材料リスト」を画面上に作り直す関数
function renderIngredients() {
  const container = document.getElementById('ingredients-container');
  container.innerHTML = ''; // まずは中身を空っぽにする

  // まだ追加されていない場合の案内メッセージ
  if (ingredients.length === 0) {
    container.innerHTML = `<p style="text-align:center; color:#999; padding: 20px 0;">まだ追加されていません / No ingredients yet</p>`;
    calculateTotals();
    return;
  }

  // ingredients配列の中身を一つずつHTMLに変換していく
  ingredients.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    
    // リスト内でも数値を編集できるように input 要素を配置しています。
    row.innerHTML = `
      <div class="ingredient-cost" id="cost-${item.id}">
         <span class="result-label" style="font-size:0.85rem; margin-right:8px; color:#666; font-weight:normal;">この材料の原価 / Cost:</span>¥0
      </div>
      
      <div class="ingredient-grid top-row">
        <div class="input-group">
          <label>材料名 / Ingredient Name</label>
          <input type="text" 
                 placeholder="例: じゃがいも / Potato" 
                 value="${escapeHTML(item.name || '')}" 
                 oninput="updateIngredient(${item.id}, 'name', this.value)">
        </div>
      </div>
      
      <div class="ingredient-grid bottom-row">
        <div class="input-group">
          <label>購入価格 / Price (¥)</label>
          <input type="number" min="0" 
                 placeholder="例: 200" 
                 value="${item.price !== null ? escapeHTML(String(item.price)) : ''}" 
                 oninput="updateIngredient(${item.id}, 'price', this.value)">
          <span class="input-helper">※数字のみ / Numbers only</span>
        </div>
        <div class="input-group">
          <label>購入量 / Total Qty</label>
          <input type="number" min="0" step="0.1" 
                 placeholder="例: 500" 
                 value="${item.totalQty !== null ? escapeHTML(String(item.totalQty)) : ''}" 
                 oninput="updateIngredient(${item.id}, 'totalQty', this.value)">
          <span class="input-helper">※単位不要(数字のみ) / Numbers only, no units</span>
        </div>
        <div class="input-group">
          <label>使った量 / Used Qty</label>
          <input type="number" min="0" step="0.1"
                 placeholder="例: 100" 
                 value="${item.usedQty !== null ? escapeHTML(String(item.usedQty)) : ''}" 
                 oninput="updateIngredient(${item.id}, 'usedQty', this.value)">
          <span class="input-helper">※単位不要(数字のみ) / Numbers only, no units</span>
        </div>
        
        <div class="delete-container">
          <button class="btn btn-delete" onclick="removeIngredient(${item.id})">
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

// 【追加】「＋追加 / Add」ボタンが押された時の処理（固定フォームからのデータ取得）
document.getElementById('add-btn').addEventListener('click', () => {
  const nameInput = document.getElementById('new-name');
  const priceInput = document.getElementById('new-price');
  const totalQtyInput = document.getElementById('new-totalQty');
  const usedQtyInput = document.getElementById('new-usedQty');

  // 入力値を取得（前後の空白を削除）
  const name = nameInput.value.trim();
  const price = priceInput.value ? parseFloat(priceInput.value) : null;
  const totalQty = totalQtyInput.value ? parseFloat(totalQtyInput.value) : null;
  const usedQty = usedQtyInput.value ? parseFloat(usedQtyInput.value) : null;

  // すべて空の場合は追加しない（簡易的な入力チェック）
  if (!name && price === null && totalQty === null && usedQty === null) {
    alert("材料名や金額などを入力してください。\nPlease enter ingredient details.");
    return;
  }

  // 配列の中に新しいデータを追加する
  ingredients.push({
    id: Date.now(), // 現在時刻を被らないIDとして使用
    name: name,
    price: price,
    totalQty: totalQty,
    usedQty: usedQty
  });

  // 追加が終わったら、上の入力フォームの中身を空に戻す
  nameInput.value = '';
  priceInput.value = '';
  totalQtyInput.value = '';
  usedQtyInput.value = '';

  // 新しいデータを含めて画面を作り直す
  renderIngredients();
  
  // スマホ等で連続入力しやすいように名前にフォーカスを戻す
  nameInput.focus();
});

// 【リスト内の更新】文字や数字が入力修正されるたびに呼ばれる処理
window.updateIngredient = function(id, field, value) {
  const item = ingredients.find(i => i.id === id);
  if (item) {
    item[field] = value; // データを上書き
    // 入力の途中でフォーカスが外れるのを防ぐため、画面の再描画はせずに金額計算だけを実行する
    calculateTotals();
  }
};

// 【削除】リスト内の「削除」ボタンが押された時の処理
window.removeIngredient = function(id) {
  // filterを使って、削除したいID『以外』のものを集めた新しい配列にする
  ingredients = ingredients.filter(i => i.id !== id);
  renderIngredients(); // 減ったデータで画面を作り直す
};

// 「何人前」の基本情報が変更された時は、すぐに計算し直す
document.getElementById('servings').addEventListener('input', calculateTotals);

// アプリ起動時に最初の1回だけ画面を描画する
renderIngredients();
