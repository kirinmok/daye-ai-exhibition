/**
 * 大業 AI 繪圖社成果展｜人氣點閱計數器（Google Apps Script 網頁應用程式）
 *
 * 功能：
 *   POST ?id=G04        → 該作品點閱數 +1（網站按「開始遊玩」時呼叫）
 *   GET                 → 回傳所有作品的點閱數 JSON，例如 {"G01":12,"G04":57}
 *   GET ?id=G04         → 只回傳該作品 {"G04":57}
 *
 * 資料存在綁定的試算表「hits」工作表：A 欄作品代號、B 欄次數、C 欄最後更新時間。
 * 想歸零或手動調整，直接改試算表即可。
 *
 * 部署步驟見 forms/hit_counter_setup.md
 */

const HITS_SHEET = "hits";
const ID_PATTERN = /^[GK]\d{2}$/;

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(HITS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(HITS_SHEET);
    sh.appendRow(["作品代號", "點閱數", "最後更新"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function readAll_() {
  const sh = getSheet_();
  const last = sh.getLastRow();
  const counts = {};
  if (last < 2) return counts;
  sh.getRange(2, 1, last - 1, 2).getValues().forEach((r) => {
    const id = String(r[0] || "").trim();
    if (ID_PATTERN.test(id)) counts[id] = Number(r[1]) || 0;
  });
  return counts;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const id = e && e.parameter && String(e.parameter.id || "").trim();
  const counts = readAll_();
  if (id && ID_PATTERN.test(id)) return json_({ [id]: counts[id] || 0 });
  return json_(counts);
}

function doPost(e) {
  const id = e && e.parameter && String(e.parameter.id || "").trim();
  if (!ID_PATTERN.test(id)) return json_({ ok: false, error: "bad id" });
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(8000);
    const sh = getSheet_();
    const last = sh.getLastRow();
    let row = 0;
    if (last >= 2) {
      const ids = sh.getRange(2, 1, last - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]).trim() === id) { row = i + 2; break; }
      }
    }
    let count;
    if (row) {
      count = (Number(sh.getRange(row, 2).getValue()) || 0) + 1;
      sh.getRange(row, 2, 1, 2).setValues([[count, new Date()]]);
    } else {
      count = 1;
      sh.appendRow([id, 1, new Date()]);
    }
    return json_({ ok: true, id, count });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/** 在編輯器手動執行一次，確認工作表建立成功 */
function setupHitsSheet() {
  getSheet_();
  Logger.log("hits 工作表就緒");
}
