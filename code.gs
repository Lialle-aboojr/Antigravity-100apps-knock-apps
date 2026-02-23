// =============================================
// 100 Challenge Kanban — GAS バックエンド (code.gs)
// パスワード認証付きバージョン
// =============================================

// ■ 管理者パスワード（後で自分で変更してください）
const ADMIN_PASSWORD = "lialle-admin";

// ■ スプレッドシートの設定
// ※ SpreadsheetApp.getActiveSpreadsheet() でバインドされたシート
//    または openById で指定してください
function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
}

// =============================================
// ■ doGet — 閲覧（誰でもアクセス可能）
// =============================================
function doGet(e) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0]; // 1行目がヘッダー
    const tasks = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] && !row[1]) continue; // 空行スキップ

      tasks.push({
        uuid:      row[0] || "",
        displayId: row[1] || "",
        appName:   row[2] || "",
        status:    row[3] || "",
        date:      row[4] || "",
        postDate:  row[5] || "",
        memo:      row[6] || "",
        demoUrl:   row[7] || "",
        githubUrl: row[8] || "",
        imageUrl:  row[9] || ""
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify(tasks))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =============================================
// ■ doOptions — プリフライトリクエスト対応
// =============================================
function doOptions(e) {
  return ContentService
    .createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

// =============================================
// ■ doPost — 編集操作（パスワード認証必須）
// =============================================
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    // --- パスワード検証 ---
    // GETは誰でも可能だが、POSTは管理者パスワード必須
    if (body.password !== ADMIN_PASSWORD) {
      return ContentService
        .createTextOutput(JSON.stringify({
          error: "401 Unauthorized: パスワードが正しくありません / Invalid password"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getSheet();
    let result = { success: false };

    switch (action) {
      case "create":
        result = createTask(sheet, body);
        break;
      case "start":
        result = updateTaskStatus(sheet, body.uuid, "作成中");
        break;
      case "retreat":
        result = updateTaskStatus(sheet, body.uuid, "未着手");
        break;
      case "complete":
        result = completeTask(sheet, body);
        break;
      case "update":
        result = updateTask(sheet, body);
        break;
      case "post":
        result = postTask(sheet, body);
        break;
      case "delete":
        result = deleteTask(sheet, body.uuid);
        break;
      default:
        result = { error: "Unknown action: " + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =============================================
// ■ アクション関数群
// =============================================

// --- 新規タスク作成 ---
function createTask(sheet, body) {
  const uuid = Utilities.getUuid();
  const lastRow = sheet.getLastRow();
  const displayId = lastRow; // ヘッダーを除いた行数 = 通し番号

  sheet.appendRow([
    uuid,
    displayId,
    body.appName || "",
    "未着手",     // 初期ステータス
    "",           // date
    "",           // postDate
    "",           // memo
    "",           // demoUrl
    "",           // githubUrl
    ""            // imageUrl
  ]);

  return { success: true, uuid: uuid, displayId: displayId };
}

// --- ステータス変更 ---
function updateTaskStatus(sheet, uuid, newStatus) {
  const row = findRowByUuid(sheet, uuid);
  if (!row) return { error: "Task not found: " + uuid };

  sheet.getRange(row, 4).setValue(newStatus); // D列 = status
  return { success: true };
}

// --- タスク完了 ---
function completeTask(sheet, body) {
  const row = findRowByUuid(sheet, body.uuid);
  if (!row) return { error: "Task not found: " + body.uuid };

  sheet.getRange(row, 4).setValue("完成");           // status
  sheet.getRange(row, 5).setValue(body.date || "");   // date
  if (body.memo)      sheet.getRange(row, 7).setValue(body.memo);
  if (body.demoUrl)   sheet.getRange(row, 8).setValue(body.demoUrl);
  if (body.githubUrl) sheet.getRange(row, 9).setValue(body.githubUrl);
  if (body.imageUrl)  sheet.getRange(row, 10).setValue(body.imageUrl);

  return { success: true };
}

// --- タスク更新（編集モーダルから） ---
function updateTask(sheet, body) {
  const row = findRowByUuid(sheet, body.uuid);
  if (!row) return { error: "Task not found: " + body.uuid };

  if (body.appName !== undefined && body.appName !== null)
    sheet.getRange(row, 3).setValue(body.appName);
  if (body.date !== undefined)
    sheet.getRange(row, 5).setValue(body.date);
  if (body.postDate !== undefined)
    sheet.getRange(row, 6).setValue(body.postDate);
  if (body.memo !== undefined)
    sheet.getRange(row, 7).setValue(body.memo);
  if (body.demoUrl !== undefined)
    sheet.getRange(row, 8).setValue(body.demoUrl);
  if (body.githubUrl !== undefined)
    sheet.getRange(row, 9).setValue(body.githubUrl);
  if (body.imageUrl !== undefined)
    sheet.getRange(row, 10).setValue(body.imageUrl);

  return { success: true };
}

// --- LinkedIn投稿済みにする ---
function postTask(sheet, body) {
  const row = findRowByUuid(sheet, body.uuid);
  if (!row) return { error: "Task not found: " + body.uuid };

  sheet.getRange(row, 4).setValue("LinkedIn投稿済");
  sheet.getRange(row, 6).setValue(body.postDate || "");

  return { success: true };
}

// --- タスク削除 ---
function deleteTask(sheet, uuid) {
  const row = findRowByUuid(sheet, uuid);
  if (!row) return { error: "Task not found: " + uuid };

  sheet.deleteRow(row);
  return { success: true };
}

// =============================================
// ■ ヘルパー関数
// =============================================

// --- UUIDから行番号を検索 ---
function findRowByUuid(sheet, uuid) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === uuid) {
      return i + 1; // シートの行番号は1始まり
    }
  }
  return null;
}
