/* =============================================
   推し活貯金箱 / Oshi Savings Box - スクリプト
   ============================================= */

// ---- LocalStorageのキー定数 ----
const STORAGE_KEY_SETTINGS = 'oshi_savings_settings'; // 推し設定用
const STORAGE_KEY_RECORDS = 'oshi_savings_records';   // 貯金記録用

// ---- DOM要素の取得 ----
const elOshiName = document.getElementById('oshi-name');
const elOshiColor = document.getElementById('oshi-color');
const elColorPreview = document.getElementById('color-preview');
const elTargetAmount = document.getElementById('target-amount');
const elBtnSaveSettings = document.getElementById('btn-save-settings');
const elSavingAmount = document.getElementById('saving-amount');
const elSavingReason = document.getElementById('saving-reason');
const elReasonList = document.getElementById('reason-list');
const elBtnAddSaving = document.getElementById('btn-add-saving');
const elTotalAmount = document.getElementById('total-amount');
const elTotalOshiName = document.getElementById('total-oshi-name');
const elHistoryList = document.getElementById('history-list');
const elHistoryEmpty = document.getElementById('history-empty');
const elToast = document.getElementById('toast');

// =============================================
// 推しカラーをCSS変数に反映する関数
// =============================================
function applyOshiColor(hexColor) {
  const root = document.documentElement;
  root.style.setProperty('--oshi-color', hexColor);

  // RGB値を取得
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // ライトカラー（元の色を明るく）
  const lightR = Math.min(255, r + 60);
  const lightG = Math.min(255, g + 60);
  const lightB = Math.min(255, b + 60);
  const lightHex = '#' +
    lightR.toString(16).padStart(2, '0') +
    lightG.toString(16).padStart(2, '0') +
    lightB.toString(16).padStart(2, '0');

  // 各CSS変数を更新（背景グラデーション用も含む）
  root.style.setProperty('--oshi-color-light', lightHex);
  root.style.setProperty('--oshi-color-pale', 'rgba(' + r + ', ' + g + ', ' + b + ', 0.12)');
  root.style.setProperty('--oshi-color-glow', 'rgba(' + r + ', ' + g + ', ' + b + ', 0.25)');
  root.style.setProperty('--oshi-color-bg-top', 'rgba(' + r + ', ' + g + ', ' + b + ', 0.18)');
  root.style.setProperty('--oshi-color-bg-bottom', 'rgba(' + r + ', ' + g + ', ' + b + ', 0.06)');
}

// =============================================
// カラーピッカーのプレビュー更新
// =============================================
elOshiColor.addEventListener('input', function () {
  elColorPreview.textContent = this.value;
});

// =============================================
// 推し設定の保存
// =============================================
function saveSettings() {
  var name = elOshiName.value.trim();
  var color = elOshiColor.value;
  var target = elTargetAmount.value ? parseInt(elTargetAmount.value, 10) : 0;

  // 設定をLocalStorageに保存（目標額も含む）
  var settings = { name: name, color: color, target: target };
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));

  // 推しカラーを即時反映
  applyOshiColor(color);

  // 推し名＋目標額を合計表示エリアに反映
  updateOshiNameDisplay(name, target);

  // トースト通知で保存完了を表示
  showToast('✅ 設定を保存しました / Settings saved!');
}

// =============================================
// 推し設定の読み込み（ページ起動時）
// =============================================
function loadSettings() {
  var stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
  if (stored) {
    var settings = JSON.parse(stored);
    // フォームに値を復元
    elOshiName.value = settings.name || '';
    elOshiColor.value = settings.color || '#e91e8c';
    elColorPreview.textContent = settings.color || '#e91e8c';
    elTargetAmount.value = settings.target || '';

    // CSS変数に推しカラーを反映
    applyOshiColor(settings.color || '#e91e8c');

    // 推し名＋目標額を合計表示エリアに反映
    updateOshiNameDisplay(settings.name, settings.target);
  }
}

// =============================================
// 推し名＋目標額の表示を動的に更新
// =============================================
function updateOshiNameDisplay(name, target) {
  var hasName = name && name.length > 0;
  var hasTarget = target && target > 0;

  // 状態に応じてメッセージを分岐
  if (hasName && hasTarget) {
    // 推し名＋目標額がある場合
    elTotalOshiName.textContent = name + ' のために ' + target.toLocaleString() + '円 まで貯金中！💪';
  } else if (hasName) {
    // 推し名のみある場合
    elTotalOshiName.textContent = name + ' のために貯金中！💪';
  } else if (hasTarget) {
    // 目標額のみある場合
    elTotalOshiName.textContent = target.toLocaleString() + '円 まで貯金中！💪';
  } else {
    // どちらも未設定の場合
    elTotalOshiName.textContent = '推しのために貯金中！💪';
  }
}

// =============================================
// 貯金記録の取得
// =============================================
function getRecords() {
  var stored = localStorage.getItem(STORAGE_KEY_RECORDS);
  return stored ? JSON.parse(stored) : [];
}

// =============================================
// 貯金記録の保存
// =============================================
function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
}

// =============================================
// 貯金を追加する
// =============================================
function addSaving() {
  var amount = parseInt(elSavingAmount.value, 10);
  var reason = elSavingReason.value.trim();

  // バリデーション: 金額チェック
  if (!amount || amount <= 0) {
    showToast('⚠️ 金額を正しく入力してください / Please enter a valid amount');
    elSavingAmount.focus();
    return;
  }

  // 新しい記録オブジェクトを作成
  var record = {
    id: Date.now(),                        // ユニークID
    amount: amount,                        // 金額
    reason: reason || '理由なし / No reason', // 理由（空の場合はデフォルト文言）
    date: new Date().toISOString()         // ISO形式の日付
  };

  // 既存の記録に追加して保存
  var records = getRecords();
  records.push(record);
  saveRecords(records);

  // UIを更新
  renderHistory(records);
  updateTotal(records);
  updateReasonDatalist(records);

  // 入力欄をクリア
  elSavingAmount.value = '';
  elSavingReason.value = '';

  // トースト通知
  showToast('🎉 ¥' + amount.toLocaleString() + ' 貯金しました！ / Saved!');
}

// =============================================
// 貯金記録を削除する
// =============================================
function deleteSaving(id) {
  var records = getRecords();
  records = records.filter(function (record) {
    return record.id !== id;
  });
  saveRecords(records);

  // UIを更新
  renderHistory(records);
  updateTotal(records);
  updateReasonDatalist(records);

  showToast('🗑️ 記録を削除しました / Record deleted');
}

// =============================================
// 合計金額を計算して表示
// =============================================
function updateTotal(records) {
  var total = records.reduce(function (sum, record) {
    return sum + record.amount;
  }, 0);
  elTotalAmount.textContent = '¥' + total.toLocaleString();
}

// =============================================
// 貯金履歴を描画（降順 = 新しいものが上）
// =============================================
function renderHistory(records) {
  // 空メッセージの表示切替
  if (records.length === 0) {
    elHistoryEmpty.style.display = 'block';
    // 空メッセージ以外を消す
    var items = elHistoryList.querySelectorAll('.history-item');
    items.forEach(function (item) {
      item.remove();
    });
    return;
  }

  elHistoryEmpty.style.display = 'none';

  // 降順にソートしてHTMLを生成
  var sorted = records.slice().sort(function (a, b) {
    return b.id - a.id; // 新しいものが上
  });

  // 履歴リストの中身をクリア（空メッセージは残す）
  var existingItems = elHistoryList.querySelectorAll('.history-item');
  existingItems.forEach(function (item) {
    item.remove();
  });

  // 各記録をHTMLとして追加
  sorted.forEach(function (record) {
    var dateObj = new Date(record.date);
    // 日付フォーマット: YYYY/MM/DD HH:MM
    var dateStr =
      dateObj.getFullYear() + '/' +
      String(dateObj.getMonth() + 1).padStart(2, '0') + '/' +
      String(dateObj.getDate()).padStart(2, '0') + ' ' +
      String(dateObj.getHours()).padStart(2, '0') + ':' +
      String(dateObj.getMinutes()).padStart(2, '0');

    // 履歴アイテムのHTMLを作成
    var itemDiv = document.createElement('div');
    itemDiv.className = 'history-item';
    itemDiv.innerHTML =
      '<div class="history-item-header">' +
      '<span class="history-item-amount">¥' + record.amount.toLocaleString() + '</span>' +
      '<span>' +
      '<span class="history-item-date">' + dateStr + '</span>' +
      '<button class="history-item-delete" data-id="' + record.id + '" title="削除 / Delete">✕</button>' +
      '</span>' +
      '</div>' +
      '<p class="history-item-reason">' + escapeHtml(record.reason) + '</p>';

    elHistoryList.appendChild(itemDiv);
  });
}

// =============================================
// HTMLエスケープ（XSS対策）
// =============================================
function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// =============================================
// 理由のサジェスト用datalistを更新
// =============================================
function updateReasonDatalist(records) {
  // 過去の理由を重複なしで取得
  var reasons = [];
  records.forEach(function (record) {
    if (record.reason && record.reason !== '理由なし / No reason') {
      if (reasons.indexOf(record.reason) === -1) {
        reasons.push(record.reason);
      }
    }
  });

  // datalistの中身をクリアして再構築
  elReasonList.innerHTML = '';
  reasons.forEach(function (reason) {
    var option = document.createElement('option');
    option.value = reason;
    elReasonList.appendChild(option);
  });
}

// =============================================
// トースト通知を表示
// =============================================
function showToast(message) {
  elToast.textContent = message;
  elToast.classList.add('show');

  // 2.5秒後に非表示
  setTimeout(function () {
    elToast.classList.remove('show');
  }, 2500);
}

// =============================================
// イベントリスナーの登録
// =============================================

// 設定保存ボタン
elBtnSaveSettings.addEventListener('click', saveSettings);

// 貯金追加ボタン
elBtnAddSaving.addEventListener('click', addSaving);

// --- IME対応：全角入力中のEnterキー誤爆を防止 ---
// isComposing が true の場合（IME変換中）はEnterを無視する
elSavingAmount.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.isComposing) {
    e.preventDefault(); // フォーム送信を抑制
    addSaving();
  }
});

elSavingReason.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.isComposing) {
    e.preventDefault(); // フォーム送信を抑制
    addSaving();
  }
});

// 履歴リスト内の削除ボタン（イベント委譲）
elHistoryList.addEventListener('click', function (e) {
  if (e.target.classList.contains('history-item-delete')) {
    var id = parseInt(e.target.getAttribute('data-id'), 10);
    if (confirm('この記録を削除しますか？ / Delete this record?')) {
      deleteSaving(id);
    }
  }
});

// =============================================
// 初期化処理（ページ読み込み時に実行）
// =============================================
function init() {
  // 推し設定を読み込む
  loadSettings();

  // 貯金記録を読み込んで表示
  var records = getRecords();
  renderHistory(records);
  updateTotal(records);
  updateReasonDatalist(records);
}

// DOMの準備完了後に初期化を実行
init();
