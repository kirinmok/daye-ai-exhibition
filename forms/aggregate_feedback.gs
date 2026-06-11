/**
 * 大業 AI 繪圖社｜內部評鑑回饋彙總工具 v2
 *
 * 改版重點（v2）：
 * 從「按題目類別分組」改成「按人分組」
 * 對每件作品 → 列出所有評論過的社員 → 每人一行顯示他的印象/建議/評分
 * 老師一眼就看到：誰提了這個 bug、誰給了高分、誰寫得仔細、誰敷衍
 *
 * 安裝步驟：
 * 1. 打開「大業AI繪圖社_學期末評鑑回饋_YYYY-MM-DD」試算表
 * 2. 上方選單「擴充功能 → Apps Script」
 * 3. 貼這整份程式碼，蓋掉預設的 myFunction
 * 4. 💾 儲存（⌘+S）
 * 5. 回試算表按 F5 重新整理
 * 6. 上方會出現「📋 回饋工具」選單
 * 7. 點「🚀 整理彙總報告」第一次跑會跳授權，照走
 */

const SUMMARY_SHEET_NAME = '📋 彙總報告';
const AWARDS_SHEET_NAME = '🏆 單項獎統計';
const PERSON_SHEET_NAME = '👥 社員回饋密度';

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
// 自動掛載選單
// ====================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📋 回饋工具')
    .addItem('🚀 整理彙總報告（按作品×按人）', 'generateSummary')
    .addItem('🏆 統計單項獎得票', 'generateAwards')
    .addItem('👥 社員回饋密度評分', 'generatePersonScores')
    .addSeparator()
    .addItem('🗑 清空彙總報告', 'clearSummary')
    .addItem('🗑 清空單項獎統計', 'clearAwards')
    .addItem('🗑 清空社員密度評分', 'clearPersonScores')
    .addToUi();
}

// ====================================================
// 找出表單回應分頁
// ====================================================
function findResponsesSheet(ss) {
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const name = sheets[i].getName();
    if (
      name.indexOf('表單回應') >= 0 ||
      name.indexOf('Form Responses') >= 0 ||
      name.indexOf('Form responses') >= 0
    ) {
      return sheets[i];
    }
  }
  // 沒找到就回第一個非彙總類分頁
  for (let i = 0; i < sheets.length; i++) {
    const name = sheets[i].getName();
    if (
      name !== SUMMARY_SHEET_NAME &&
      name !== AWARDS_SHEET_NAME &&
      name !== PERSON_SHEET_NAME
    ) {
      return sheets[i];
    }
  }
  return null;
}

// ====================================================
// 找姓名 / 班級欄位
// ====================================================
function findIdentityCols(headers) {
  let nameCol = -1, classCol = -1;
  headers.forEach((h, idx) => {
    const headerStr = String(h);
    if (nameCol < 0 && (headerStr.indexOf('你的姓名') >= 0 || headerStr === '姓名')) {
      nameCol = idx;
    }
    if (classCol < 0 && (headerStr.indexOf('班級') >= 0 || headerStr.indexOf('座號') >= 0)) {
      classCol = idx;
    }
  });
  return { nameCol, classCol };
}

// ====================================================
// 主功能：按作品 × 按人 彙整
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
    SpreadsheetApp.getUi().alert('⚠ 還沒有任何回饋資料');
    return;
  }

  const headers = data[0];
  const rows = data.slice(1);
  const { nameCol, classCol } = findIdentityCols(headers);

  // 找出每件作品的欄位
  const projectCols = {};
  PROJECTS.forEach(p => {
    projectCols[p.code] = { impression: -1, suggestion: -1, score: -1 };
  });
  headers.forEach((h, idx) => {
    const s = String(h);
    PROJECTS.forEach(p => {
      const prefix = p.code + '｜';
      if (s.indexOf(prefix) === 0) {
        if (s.indexOf('印象最深') > 0) projectCols[p.code].impression = idx;
        else if (s.indexOf('想說的話') > 0) projectCols[p.code].suggestion = idx;
        else if (s.indexOf('評分') > 0) projectCols[p.code].score = idx;
      }
    });
  });

  // 建立或清空 summary sheet
  let sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (sheet) sheet.clear();
  else sheet = ss.insertSheet(SUMMARY_SHEET_NAME);

  let r = 1;

  // 大標題
  sheet.getRange(r, 1).setValue('🎮 大業 AI 繪圖社｜學期末作品評鑑彙總（按作品 × 按人）');
  sheet.getRange(r, 1, 1, 4).merge()
    .setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center')
    .setBackground('#4a86e8').setFontColor('#ffffff');
  r++;
  sheet.getRange(r, 1).setValue(
    '總回饋人數：' + rows.length + ' 人　|　產出時間：' + new Date().toLocaleString('zh-TW')
  );
  sheet.getRange(r, 1, 1, 4).merge().setHorizontalAlignment('center')
    .setFontStyle('italic').setFontColor('#666');
  r += 2;

  // 對每件作品
  PROJECTS.forEach(p => {
    const cols = projectCols[p.code];

    // 蒐集所有有對該作品給回饋的人
    const peopleFeedback = [];
    const scoresOnly = [];

    rows.forEach(row => {
      const name = nameCol >= 0 ? String(row[nameCol] || '').trim() : '（匿名）';
      const cls = classCol >= 0 ? String(row[classCol] || '').trim() : '';
      const impression = cols.impression >= 0 ? String(row[cols.impression] || '').trim() : '';
      const suggestion = cols.suggestion >= 0 ? String(row[cols.suggestion] || '').trim() : '';
      const scoreRaw = cols.score >= 0 ? row[cols.score] : '';
      const hasScore = scoreRaw !== '' && scoreRaw !== null && !isNaN(scoreRaw);
      const score = hasScore ? Number(scoreRaw) : null;

      // 只要有任一項回饋就列入
      if (impression || suggestion || hasScore) {
        peopleFeedback.push({ name, cls, impression, suggestion, score });
      }
      if (hasScore) scoresOnly.push(score);
    });

    const avgScore = scoresOnly.length
      ? scoresOnly.reduce((a, b) => a + b, 0) / scoresOnly.length
      : 0;
    const median = scoresOnly.length ? medianOf(scoresOnly) : 0;

    // 作品大標題
    sheet.getRange(r, 1).setValue('📌 ' + p.code + '｜' + p.title);
    sheet.getRange(r, 1, 1, 4).merge()
      .setBackground('#fff2cc').setFontWeight('bold').setFontSize(14);
    r++;

    // 整體統計
    sheet.getRange(r, 1).setValue(
      '📊 整體：平均 ' + avgScore.toFixed(2) +
      ' / 10　|　中位數 ' + median +
      '　|　' + scoresOnly.length + ' 人評分' +
      '　|　' + peopleFeedback.length + ' 人留下回饋'
    );
    sheet.getRange(r, 1, 1, 4).merge()
      .setBackground('#fce5cd').setFontStyle('italic');
    r++;

    // 表頭
    sheet.getRange(r, 1).setValue('評論者');
    sheet.getRange(r, 2).setValue('💡 印象最深');
    sheet.getRange(r, 3).setValue('🛠 建議 / Bug / 改進');
    sheet.getRange(r, 4).setValue('⭐ 評分');
    sheet.getRange(r, 1, 1, 4)
      .setBackground('#d9ead3').setFontWeight('bold').setHorizontalAlignment('center');
    r++;

    if (peopleFeedback.length === 0) {
      sheet.getRange(r, 1).setValue('（這件作品還沒有人留下任何回饋）');
      sheet.getRange(r, 1, 1, 4).merge().setFontColor('#999').setFontStyle('italic');
      r++;
    } else {
      peopleFeedback.forEach(fb => {
        const label = fb.cls ? (fb.name + '（' + fb.cls + '）') : fb.name;
        sheet.getRange(r, 1).setValue(label).setFontWeight('bold');
        sheet.getRange(r, 2).setValue(fb.impression || '—').setWrap(true).setVerticalAlignment('top');
        sheet.getRange(r, 3).setValue(fb.suggestion || '—').setWrap(true).setVerticalAlignment('top');
        sheet.getRange(r, 4).setValue(fb.score !== null ? fb.score : '—')
          .setHorizontalAlignment('center').setVerticalAlignment('top');

        // 隔行底色
        if (peopleFeedback.indexOf(fb) % 2 === 1) {
          sheet.getRange(r, 1, 1, 4).setBackground('#f9f9f9');
        }
        r++;
      });
    }

    r += 2;  // 區塊間空兩行
  });

  // 欄寬
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 350);
  sheet.setColumnWidth(3, 350);
  sheet.setColumnWidth(4, 80);

  // 凍結前 2 列
  sheet.setFrozenRows(2);

  SpreadsheetApp.getUi().alert(
    '✅ 彙總完成！\n\n總回饋：' + rows.length + ' 人\n' +
    '請看「' + SUMMARY_SHEET_NAME + '」分頁\n\n' +
    '每件作品下面會列出所有評論過的社員，\n誰提了什麼問題一目瞭然 ❤️'
  );
}

// ====================================================
// 單項獎統計
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

  const awardCols = [];
  headers.forEach((h, idx) => {
    const s = String(h);
    if (
      s.indexOf('最佳美術獎') >= 0 || s.indexOf('最佳玩法獎') >= 0 ||
      s.indexOf('最佳 AI 創意獎') >= 0 || s.indexOf('最具潛力獎') >= 0 ||
      s.indexOf('最佳團隊合作獎') >= 0
    ) {
      awardCols.push({ name: s, idx: idx });
    }
  });

  if (awardCols.length === 0) {
    SpreadsheetApp.getUi().alert('❌ 找不到單項獎欄位');
    return;
  }

  let sheet = ss.getSheetByName(AWARDS_SHEET_NAME);
  if (sheet) sheet.clear();
  else sheet = ss.insertSheet(AWARDS_SHEET_NAME);

  let r = 1;
  sheet.getRange(r, 1).setValue('🏆 單項獎得票統計');
  sheet.getRange(r, 1, 1, 3).merge()
    .setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center')
    .setBackground('#ff9900').setFontColor('#ffffff');
  r += 2;

  awardCols.forEach(award => {
    const counts = {};
    rows.forEach(row => {
      const v = String(row[award.idx] || '').trim();
      if (v) counts[v] = (counts[v] || 0) + 1;
    });
    const sorted = Object.keys(counts)
      .map(k => ({ name: k, count: counts[k] }))
      .sort((a, b) => b.count - a.count);

    sheet.getRange(r, 1).setValue(award.name);
    sheet.getRange(r, 1, 1, 3).merge()
      .setBackground('#fff2cc').setFontWeight('bold').setFontSize(13);
    r++;

    sheet.getRange(r, 1).setValue('排名');
    sheet.getRange(r, 2).setValue('作品');
    sheet.getRange(r, 3).setValue('得票數');
    sheet.getRange(r, 1, 1, 3).setBackground('#d9ead3').setFontWeight('bold');
    r++;

    sorted.forEach((item, i) => {
      sheet.getRange(r, 1).setValue('#' + (i + 1));
      sheet.getRange(r, 2).setValue(item.name);
      sheet.getRange(r, 3).setValue(item.count + ' 票');
      if (i === 0) {
        sheet.getRange(r, 1, 1, 3).setBackground('#fce5cd').setFontWeight('bold');
      }
      r++;
    });
    r += 2;
  });

  sheet.setColumnWidth(1, 60);
  sheet.setColumnWidth(2, 400);
  sheet.setColumnWidth(3, 100);

  SpreadsheetApp.getUi().alert('✅ 完成！請看「' + AWARDS_SHEET_NAME + '」分頁');
}

// ====================================================
// 社員回饋密度評分（給 KIRIN 打成績用）
// ====================================================
function generatePersonScores() {
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
  const { nameCol, classCol } = findIdentityCols(headers);

  // 找所有作品的回饋欄
  const projectCols = {};
  PROJECTS.forEach(p => {
    projectCols[p.code] = { impression: -1, suggestion: -1, score: -1 };
  });
  headers.forEach((h, idx) => {
    const s = String(h);
    PROJECTS.forEach(p => {
      if (s.indexOf(p.code + '｜') === 0) {
        if (s.indexOf('印象最深') > 0) projectCols[p.code].impression = idx;
        else if (s.indexOf('想說的話') > 0) projectCols[p.code].suggestion = idx;
        else if (s.indexOf('評分') > 0) projectCols[p.code].score = idx;
      }
    });
  });

  // 對每位社員算密度分
  const personStats = rows.map(row => {
    const name = nameCol >= 0 ? String(row[nameCol] || '').trim() : '（匿名）';
    const cls = classCol >= 0 ? String(row[classCol] || '').trim() : '';
    let worksReviewed = 0;       // 評了幾件
    let totalTextChars = 0;       // 文字總字數
    let textEntries = 0;          // 文字回饋筆數

    PROJECTS.forEach(p => {
      const cols = projectCols[p.code];
      const imp = cols.impression >= 0 ? String(row[cols.impression] || '').trim() : '';
      const sug = cols.suggestion >= 0 ? String(row[cols.suggestion] || '').trim() : '';
      const score = cols.score >= 0 ? row[cols.score] : '';
      const hasScore = score !== '' && score !== null && !isNaN(score);

      if (imp || sug || hasScore) worksReviewed++;
      if (imp) { totalTextChars += imp.length; textEntries++; }
      if (sug) { totalTextChars += sug.length; textEntries++; }
    });

    const avgChars = textEntries ? Math.round(totalTextChars / textEntries) : 0;
    // 密度分 = 評了幾件 × 5 + 平均字數（最多上限 100）
    const densityScore = Math.min(100, worksReviewed * 5 + Math.min(50, avgChars));

    return { name, cls, worksReviewed, textEntries, totalTextChars, avgChars, densityScore };
  });

  personStats.sort((a, b) => b.densityScore - a.densityScore);

  let sheet = ss.getSheetByName(PERSON_SHEET_NAME);
  if (sheet) sheet.clear();
  else sheet = ss.insertSheet(PERSON_SHEET_NAME);

  let r = 1;
  sheet.getRange(r, 1).setValue('👥 社員回饋密度評分（給 KIRIN 打成績用）');
  sheet.getRange(r, 1, 1, 7).merge()
    .setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center')
    .setBackground('#674ea7').setFontColor('#ffffff');
  r++;
  sheet.getRange(r, 1).setValue('密度分公式：評了幾件 × 5 + 平均每筆字數（上限 100 分）');
  sheet.getRange(r, 1, 1, 7).merge().setFontStyle('italic').setFontColor('#666');
  r += 2;

  const tableHeaders = ['排名', '姓名', '班級座號', '評了幾件', '文字筆數', '平均字數', '密度分'];
  tableHeaders.forEach((h, i) => sheet.getRange(r, i + 1).setValue(h));
  sheet.getRange(r, 1, 1, 7).setBackground('#d9ead3').setFontWeight('bold');
  r++;

  personStats.forEach((p, i) => {
    sheet.getRange(r, 1).setValue('#' + (i + 1));
    sheet.getRange(r, 2).setValue(p.name);
    sheet.getRange(r, 3).setValue(p.cls);
    sheet.getRange(r, 4).setValue(p.worksReviewed + ' 件');
    sheet.getRange(r, 5).setValue(p.textEntries + ' 筆');
    sheet.getRange(r, 6).setValue(p.avgChars + ' 字');
    sheet.getRange(r, 7).setValue(p.densityScore + ' 分');

    // 前三名標金/銀/銅
    if (i === 0) sheet.getRange(r, 1, 1, 7).setBackground('#fff2cc').setFontWeight('bold');
    else if (i === 1) sheet.getRange(r, 1, 1, 7).setBackground('#efefef');
    else if (i === 2) sheet.getRange(r, 1, 1, 7).setBackground('#fce5cd');

    // 低於 30 分標紅
    if (p.densityScore < 30) sheet.getRange(r, 7).setFontColor('#cc0000').setFontWeight('bold');

    r++;
  });

  sheet.setColumnWidths(1, 7, 100);
  sheet.setColumnWidth(2, 120);
  sheet.setFrozenRows(3);

  SpreadsheetApp.getUi().alert(
    '✅ 密度評分完成！\n\n' +
    '看「' + PERSON_SHEET_NAME + '」分頁\n' +
    '低於 30 分會標紅，可能是敷衍填寫'
  );
}

// ====================================================
// 工具
// ====================================================
function medianOf(arr) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function clearSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const s = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (s) { ss.deleteSheet(s); SpreadsheetApp.getUi().alert('已清空彙總報告'); }
  else SpreadsheetApp.getUi().alert('沒有彙總報告可清');
}

function clearAwards() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const s = ss.getSheetByName(AWARDS_SHEET_NAME);
  if (s) { ss.deleteSheet(s); SpreadsheetApp.getUi().alert('已清空單項獎統計'); }
  else SpreadsheetApp.getUi().alert('沒有單項獎統計可清');
}

function clearPersonScores() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const s = ss.getSheetByName(PERSON_SHEET_NAME);
  if (s) { ss.deleteSheet(s); SpreadsheetApp.getUi().alert('已清空社員密度評分'); }
  else SpreadsheetApp.getUi().alert('沒有社員密度評分可清');
}
