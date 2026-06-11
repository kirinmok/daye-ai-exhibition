/**
 * 大業 AI 繪圖社｜內部評鑑回饋彙總工具
 *
 * 用途：把「表單回應 1」分頁的散亂回饋，按【每件作品】彙整成一份老師看得懂的報告。
 *
 * 安裝步驟：
 * 1. 打開那份「大業AI繪圖社_學期末評鑑回饋_YYYY-MM-DD」試算表
 *    （buildForm 自動建出來那份）
 * 2. 上方選單「擴充功能 → Apps Script」
 * 3. 把這整份程式碼貼進去，蓋掉預設的 myFunction
 * 4. 按 💾 儲存（Ctrl+S 或 ⌘+S）
 * 5. 回到試算表，按 F5 重新整理一次
 * 6. 試算表上方會出現「📋 回饋工具」選單
 * 7. 點「📋 回饋工具 → 🚀 整理彙總報告」→ 第一次跑會跳授權，照走
 * 8. 跑完會在試算表新增一個「📋 彙總報告」分頁
 *
 * 每次想看最新狀態，再按一次「整理彙總報告」就會重算。
 */

const SUMMARY_SHEET_NAME = '📋 彙總報告';
const AWARDS_SHEET_NAME = '🏆 單項獎統計';

const PROJECTS = [
  { code: 'G01', title: '歡樂時光屋' },
  { code: 'G02', title: '風味抉擇：漢堡帝國' },
  { code: 'G03', title: '八掌溪跑酷' },
  { code: 'G04', title: '嘉義美食大亨' },
  { code: 'G05', title: '槍戰' },
  { code: 'G07', title: '八掌溪環保爭霸戰' },
  { code: 'G08', title: '深淵騎士' },
  { code: 'G09', title: '拯救永續島' },
  { code: 'G10', title: "ECO Defender's Bizarre Adventure" },
  { code: 'G21', title: '霓虹星際突擊' },
  { code: 'G23', title: 'Chiayi Tycoon：永續大作戰' },
  { code: 'G24', title: 'ZONE X：極限孤島大逃殺' },
  { code: 'G25', title: 'NEON STAR：REBIRTH 30' },
  { code: 'G26', title: '貪婪之星：乘數與炸彈' },
  { code: 'K01', title: '瘋狂大賽車' }
];

// ====================================================
// 自動掛載選單（試算表打開時跑）
// ====================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📋 回饋工具')
    .addItem('🚀 整理彙總報告', 'generateSummary')
    .addItem('🏆 統計單項獎得票', 'generateAwards')
    .addSeparator()
    .addItem('🗑 清空彙總報告', 'clearSummary')
    .addItem('🗑 清空單項獎統計', 'clearAwards')
    .addToUi();
}

// ====================================================
// 找出表單回應的分頁（不論中英文命名）
// ====================================================
function findResponsesSheet(ss) {
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const name = sheets[i].getName();
    if (
      name.indexOf('表單回應') >= 0 ||
      name.indexOf('Form Responses') >= 0 ||
      name.indexOf('Form responses') >= 0 ||
      (name.indexOf('回應') >= 0 && name !== SUMMARY_SHEET_NAME)
    ) {
      return sheets[i];
    }
  }
  // 沒找到就回傳第一個非彙總類的分頁
  for (let i = 0; i < sheets.length; i++) {
    const name = sheets[i].getName();
    if (name !== SUMMARY_SHEET_NAME && name !== AWARDS_SHEET_NAME) {
      return sheets[i];
    }
  }
  return null;
}

// ====================================================
// 主功能：彙總每件作品的回饋
// ====================================================
function generateSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responsesSheet = findResponsesSheet(ss);

  if (!responsesSheet) {
    SpreadsheetApp.getUi().alert('❌ 找不到回應分頁，請確認表單有連結到這份試算表');
    return;
  }

  const data = responsesSheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('⚠ 還沒有任何回饋資料，等社員填了再來');
    return;
  }

  const headers = data[0];
  const rows = data.slice(1);
  const totalResponses = rows.length;

  // 找出每件作品的欄位 index
  const projectCols = {};
  PROJECTS.forEach(p => {
    projectCols[p.code] = { impression: -1, suggestion: -1, score: -1 };
  });

  headers.forEach((h, idx) => {
    const headerStr = String(h);
    PROJECTS.forEach(p => {
      const prefix = p.code + '｜';
      if (headerStr.indexOf(prefix) === 0) {
        if (headerStr.indexOf('印象最深') > 0) projectCols[p.code].impression = idx;
        else if (headerStr.indexOf('想說的話') > 0) projectCols[p.code].suggestion = idx;
        else if (headerStr.indexOf('評分') > 0) projectCols[p.code].score = idx;
      }
    });
  });

  // 建立或清空 summary sheet
  let summarySheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (summarySheet) {
    summarySheet.clear();
  } else {
    summarySheet = ss.insertSheet(SUMMARY_SHEET_NAME);
  }

  let writeRow = 1;

  // 大標題
  summarySheet.getRange(writeRow, 1).setValue('🎮 大業 AI 繪圖社｜學期末作品評鑑彙總報告');
  summarySheet.getRange(writeRow, 1, 1, 4).merge()
    .setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center')
    .setBackground('#4a86e8').setFontColor('#ffffff');
  writeRow++;

  summarySheet.getRange(writeRow, 1).setValue(
    '總回饋人數：' + totalResponses + ' 人　|　產出時間：' + new Date().toLocaleString('zh-TW')
  );
  summarySheet.getRange(writeRow, 1, 1, 4).merge().setHorizontalAlignment('center')
    .setFontStyle('italic').setFontColor('#666666');
  writeRow += 2;

  // 對每件作品蒐集回饋
  PROJECTS.forEach(p => {
    const cols = projectCols[p.code];
    const impressions = [];
    const suggestions = [];
    const scores = [];
    const respondentSet = {};

    rows.forEach((row, rowIdx) => {
      if (cols.impression >= 0) {
        const v = (row[cols.impression] || '').toString().trim();
        if (v) {
          impressions.push(v);
          respondentSet[rowIdx] = true;
        }
      }
      if (cols.suggestion >= 0) {
        const v = (row[cols.suggestion] || '').toString().trim();
        if (v) {
          suggestions.push(v);
          respondentSet[rowIdx] = true;
        }
      }
      if (cols.score >= 0) {
        const v = row[cols.score];
        if (v !== '' && v !== null && !isNaN(v)) scores.push(Number(v));
      }
    });

    const respondentCount = Object.keys(respondentSet).length;
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const median = scores.length ? medianOf(scores) : 0;

    // 作品標題
    summarySheet.getRange(writeRow, 1).setValue('📌 ' + p.code + '｜' + p.title);
    summarySheet.getRange(writeRow, 1, 1, 4).merge()
      .setBackground('#fff2cc').setFontWeight('bold').setFontSize(14);
    writeRow++;

    // 統計行
    summarySheet.getRange(writeRow, 1).setValue(
      '⭐ 平均：' + avgScore.toFixed(2) +
      ' / 10　|　中位數：' + median +
      '　|　評分人數：' + scores.length +
      '　|　文字回饋人數：' + respondentCount
    );
    summarySheet.getRange(writeRow, 1, 1, 4).merge()
      .setBackground('#fce5cd').setFontStyle('italic');
    writeRow++;

    // 印象區
    summarySheet.getRange(writeRow, 1).setValue('💡 印象最深（' + impressions.length + ' 則）');
    summarySheet.getRange(writeRow, 1, 1, 4).merge()
      .setBackground('#d9ead3').setFontWeight('bold');
    writeRow++;

    if (impressions.length === 0) {
      summarySheet.getRange(writeRow, 1).setValue('（暫無回饋）').setFontColor('#999');
      summarySheet.getRange(writeRow, 1, 1, 4).merge();
      writeRow++;
    } else {
      impressions.forEach((s, i) => {
        summarySheet.getRange(writeRow, 1).setValue((i + 1) + '. ' + s);
        summarySheet.getRange(writeRow, 1, 1, 4).merge()
          .setWrap(true).setVerticalAlignment('top');
        writeRow++;
      });
    }

    // 建議區
    summarySheet.getRange(writeRow, 1).setValue('🛠 建議 / Bug / 改進（' + suggestions.length + ' 則）');
    summarySheet.getRange(writeRow, 1, 1, 4).merge()
      .setBackground('#cfe2f3').setFontWeight('bold');
    writeRow++;

    if (suggestions.length === 0) {
      summarySheet.getRange(writeRow, 1).setValue('（暫無回饋）').setFontColor('#999');
      summarySheet.getRange(writeRow, 1, 1, 4).merge();
      writeRow++;
    } else {
      suggestions.forEach((s, i) => {
        summarySheet.getRange(writeRow, 1).setValue((i + 1) + '. ' + s);
        summarySheet.getRange(writeRow, 1, 1, 4).merge()
          .setWrap(true).setVerticalAlignment('top');
        writeRow++;
      });
    }

    writeRow += 2;  // 區塊間空兩行
  });

  // 欄寬
  summarySheet.setColumnWidth(1, 900);

  SpreadsheetApp.getUi().alert(
    '✅ 彙總完成！\n\n總回饋：' + totalResponses + ' 人\n' +
    '請切到「' + SUMMARY_SHEET_NAME + '」分頁看結果'
  );
}

// ====================================================
// 額外功能：統計 5 個單項獎得票
// ====================================================
function generateAwards() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responsesSheet = findResponsesSheet(ss);

  if (!responsesSheet) {
    SpreadsheetApp.getUi().alert('❌ 找不到回應分頁');
    return;
  }

  const data = responsesSheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('⚠ 還沒有回饋資料');
    return;
  }

  const headers = data[0];
  const rows = data.slice(1);

  // 找單項獎欄位
  const awardCols = [];
  headers.forEach((h, idx) => {
    const headerStr = String(h);
    if (
      headerStr.indexOf('最佳美術獎') >= 0 ||
      headerStr.indexOf('最佳玩法獎') >= 0 ||
      headerStr.indexOf('最佳 AI 創意獎') >= 0 ||
      headerStr.indexOf('最具潛力獎') >= 0 ||
      headerStr.indexOf('最佳團隊合作獎') >= 0
    ) {
      awardCols.push({ name: headerStr, idx: idx });
    }
  });

  if (awardCols.length === 0) {
    SpreadsheetApp.getUi().alert('❌ 找不到單項獎欄位');
    return;
  }

  let awardsSheet = ss.getSheetByName(AWARDS_SHEET_NAME);
  if (awardsSheet) {
    awardsSheet.clear();
  } else {
    awardsSheet = ss.insertSheet(AWARDS_SHEET_NAME);
  }

  let writeRow = 1;
  awardsSheet.getRange(writeRow, 1).setValue('🏆 單項獎得票統計');
  awardsSheet.getRange(writeRow, 1, 1, 3).merge()
    .setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center')
    .setBackground('#ff9900').setFontColor('#ffffff');
  writeRow += 2;

  awardCols.forEach(award => {
    // 計票
    const counts = {};
    rows.forEach(row => {
      const v = (row[award.idx] || '').toString().trim();
      if (v) counts[v] = (counts[v] || 0) + 1;
    });

    const sorted = Object.keys(counts)
      .map(k => ({ name: k, count: counts[k] }))
      .sort((a, b) => b.count - a.count);

    // 獎項標題
    awardsSheet.getRange(writeRow, 1).setValue(award.name);
    awardsSheet.getRange(writeRow, 1, 1, 3).merge()
      .setBackground('#fff2cc').setFontWeight('bold').setFontSize(13);
    writeRow++;

    // 表頭
    awardsSheet.getRange(writeRow, 1).setValue('排名');
    awardsSheet.getRange(writeRow, 2).setValue('作品');
    awardsSheet.getRange(writeRow, 3).setValue('得票數');
    awardsSheet.getRange(writeRow, 1, 1, 3)
      .setBackground('#d9ead3').setFontWeight('bold');
    writeRow++;

    sorted.forEach((item, i) => {
      const rank = (i + 1).toString();
      awardsSheet.getRange(writeRow, 1).setValue('#' + rank);
      awardsSheet.getRange(writeRow, 2).setValue(item.name);
      awardsSheet.getRange(writeRow, 3).setValue(item.count + ' 票');
      if (i === 0) {
        awardsSheet.getRange(writeRow, 1, 1, 3)
          .setBackground('#fce5cd').setFontWeight('bold');
      }
      writeRow++;
    });

    writeRow += 2;
  });

  awardsSheet.setColumnWidth(1, 60);
  awardsSheet.setColumnWidth(2, 400);
  awardsSheet.setColumnWidth(3, 100);

  SpreadsheetApp.getUi().alert('✅ 單項獎統計完成！請看「' + AWARDS_SHEET_NAME + '」分頁');
}

// ====================================================
// 工具：中位數
// ====================================================
function medianOf(arr) {
  const sorted = arr.slice().sort(function(a, b) { return a - b; });
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// ====================================================
// 清空工具
// ====================================================
function clearSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (sheet) {
    ss.deleteSheet(sheet);
    SpreadsheetApp.getUi().alert('已清空彙總報告');
  } else {
    SpreadsheetApp.getUi().alert('沒有彙總報告分頁可清');
  }
}

function clearAwards() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(AWARDS_SHEET_NAME);
  if (sheet) {
    ss.deleteSheet(sheet);
    SpreadsheetApp.getUi().alert('已清空單項獎統計');
  } else {
    SpreadsheetApp.getUi().alert('沒有單項獎統計分頁可清');
  }
}
