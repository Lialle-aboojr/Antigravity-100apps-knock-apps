/* =============================================
   推し活貯金箱 / Oshi Savings Box - スクリプト
   ============================================= */

// ---- LocalStorageのキー定数 ----
var STORAGE_KEY_SETTINGS = 'oshi_savings_settings'; // 推し設定用
var STORAGE_KEY_RECORDS = 'oshi_savings_records';   // 貯金記録用

// ---- DOM要素の取得 ----
var elOshiName = document.getElementById('oshi-name');
var elOshiColor = document.getElementById('oshi-color');
var elColorPreview = document.getElementById('color-preview');
var elTargetAmount = document.getElementById('target-amount');
var elBtnSaveSettings = document.getElementById('btn-save-settings');
var elSavingAmount = document.getElementById('saving-amount');
var elSavingReason = document.getElementById('saving-reason');
var elReasonList = document.getElementById('reason-list');
var elBtnAddSaving = document.getElementById('btn-add-saving');
var elTotalAmount = document.getElementById('total-amount');
var elTotalOshiName = document.getElementById('total-oshi-name');
var elHistoryList = document.getElementById('history-list');
var elHistoryEmpty = document.getElementById('history-empty');
var elToast = document.getElementById('toast');

// =============================================
// 【重要】Enterキーによる送信を完全に無効化
// すべてのinput要素でEnterキーを物理的にブロックする
// 保存は「貯金する」ボタンのclickイベントのみで発火
// =============================================
document.querySelectorAll('input').forEach(function (input) {
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      // IME変換中かどうかに関わらず、Enterキーを完全にブロック
      e.preventDefault();
    }
  });
});

// =============================================
// YIQ方式で推しカラーの明るさを判定し、
// 適切な文字色（黒 or 白）を返す関数
// =============================================
function getContrastTextColor(hexColor) {
  var r = parseInt(hexColor.slice(1, 3), 16);
  var g = parseInt(hexColor.slice(3, 5), 16);
  var b = parseInt(hexColor.slice(5, 7), 16);

  // YIQ計算式：人間の目の感度に基づいた明るさの指標
  var yiq = (r * 299 + g * 587 + b * 114) / 1000;

  // YIQが128以上なら明るい色 → 黒文字、128未満なら暗い色 → 白文字
  return yiq >= 128 ? '#2d2d3f' : '#ffffff';
}

// =============================================
// HEXカラーから薄い背景色を生成する関数
// 白を大量に混ぜて、テキストが読みやすい薄い色を作る
// =============================================
function getLightBgColor(hexColor) {
  var r = parseInt(hexColor.slice(1, 3), 16);
  var g = parseInt(hexColor.slice(3, 5), 16);
  var b = parseInt(hexColor.slice(5, 7), 16);

  // 白(255)と推しカラーを 90:10 の比率で混合 → 非常に薄い推しカラー
  var lightR = Math.round(255 * 0.90 + r * 0.10);
  var lightG = Math.round(255 * 0.90 + g * 0.10);
  var lightB = Math.round(255 * 0.90 + b * 0.10);

  return 'rgb(' + lightR + ', ' + lightG + ', ' + lightB + ')';
}

// =============================================
// 推しカラーをCSS変数に反映する関数
// =============================================
function applyOshiColor(hexColor) {
  var root = document.documentElement;
  root.style.setProperty('--oshi-color', hexColor);

  // RGB値を取得
  var r = parseInt(hexColor.slice(1, 3), 16);
  var g = parseInt(hexColor.slice(3, 5), 16);
  var b = parseInt(hexColor.slice(5, 7), 16);

  // ライトカラー（元の色を明るく）
  var lightR = Math.min(255, r + 60);
  var lightG = Math.min(255, g + 60);
  var lightB = Math.min(255, b + 60);
  var lightHex = '#' +
    lightR.toString(16).padStart(2, '0') +
    lightG.toString(16).padStart(2, '0') +
    lightB.toString(16).padStart(2, '0');

  // 各CSS変数を更新
  root.style.setProperty('--oshi-color-light', lightHex);
  root.style.setProperty('--oshi-color-pale', 'rgba(' + r + ', ' + g + ', ' + b + ', 0.12)');
  root.style.setProperty('--oshi-color-glow', 'rgba(' + r + ', ' + g + ', ' + b + ', 0.25)');

  // 薄い推しカラーの背景色をセット
  root.style.setProperty('--bg-color-light', getLightBgColor(hexColor));

  // ドット柄のドットカラーをセット
  root.style.setProperty('--dot-color', 'rgba(' + r + ', ' + g + ', ' + b + ', 0.10)');

  // YIQ方式で文字色の自動コントラストを計算してセット
  var textColor = getContrastTextColor(hexColor);
  root.style.setProperty('--text-color-dynamic', textColor);
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

  // 推し名＋目標額＋合計を表示エリアに反映
  var records = getRecords();
  var total = records.reduce(function (sum, record) {
    return sum + record.amount;
  }, 0);
  updateOshiNameDisplay(name, target, total);

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

    // 推し名＋目標額を返す（init関数でupdateOshiNameDisplayを呼ぶ）
    return settings;
  }
  // デフォルト色を適用
  applyOshiColor('#e91e8c');
  return null;
}

// =============================================
// 現在の設定を取得するヘルパー
// =============================================
function getCurrentSettings() {
  var stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
  if (stored) {
    return JSON.parse(stored);
  }
  return { name: '', color: '#e91e8c', target: 0 };
}

// =============================================
// 推し名＋目標額＋残り金額の表示を動的に更新
// =============================================
function updateOshiNameDisplay(name, target, totalSaved) {
  var hasName = name && name.length > 0;
  var hasTarget = target && target > 0;

  // 1行目: 推し名メッセージ
  var line1 = '';
  if (hasName) {
    line1 = name + ' のために貯金中！💪';
  } else {
    line1 = '推しのために貯金中！💪';
  }

  // 2行目: 目標額＋残り金額メッセージ（目標がある場合のみ）
  var line2 = '';
  if (hasTarget) {
    var remaining = target - totalSaved;
    if (remaining <= 0) {
      // 目標達成！
      line2 = '目標額: ' + target.toLocaleString() + '円 — 🎉 目標金額達成おめでとうございます！ 🎉';
    } else {
      line2 = '目標額: ' + target.toLocaleString() + '円（あと ' + remaining.toLocaleString() + '円）';
    }
  }

  // innerHTMLを使って<br>で改行を挿入
  if (line2) {
    elTotalOshiName.innerHTML = escapeHtml(line1) + '<br>' + escapeHtml(line2);
  } else {
    elTotalOshiName.textContent = line1;
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
  var amountValue = elSavingAmount.value;
  var amount = parseInt(amountValue, 10);
  var reason = elSavingReason.value.trim();

  // バリデーション: 空入力チェック
  if (!amountValue || amountValue === '') {
    showToast('⚠️ 金額を入力してください / Please enter an amount');
    elSavingAmount.focus();
    return;
  }

  // バリデーション: マイナスまたは0の金額を防止
  if (isNaN(amount) || amount <= 0) {
    showToast('⚠️ 1円以上の金額を入力してください / Amount must be at least ¥1');
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
// 合計金額を計算して表示（＋メッセージも更新）
// =============================================
function updateTotal(records) {
  var total = records.reduce(function (sum, record) {
    return sum + record.amount;
  }, 0);
  elTotalAmount.textContent = '¥' + total.toLocaleString();

  // 設定を読み込んでメッセージも更新する
  var settings = getCurrentSettings();
  updateOshiNameDisplay(settings.name, settings.target, total);
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

// 設定保存ボタン（clickのみ）
elBtnSaveSettings.addEventListener('click', saveSettings);

// 貯金追加ボタン（clickのみ — Enterキーでは絶対に発火しない）
elBtnAddSaving.addEventListener('click', addSaving);

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
  var settings = loadSettings();

  // 貯金記録を読み込んで表示
  var records = getRecords();
  renderHistory(records);
  updateTotal(records);
  updateReasonDatalist(records);
}

// DOMの準備完了後に初期化を実行
init();
