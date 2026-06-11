/**
 * 大業 AI 繪圖社｜內部評鑑回饋彙總工具 v3
 *
 * v3 改版（按 KIRIN sample 表格格式）：
 * 三欄表格：
 *   A 作品名稱 (代號)
 *   B 核心問題與優化建議 — 每條 * 原文 (學號)
 *   C 建議人（學號/代號）— 去重列表
 *
 * 安裝步驟：
 * 1. 打開試算表 → 擴充功能 → Apps Script
 * 2. 整份貼上覆蓋舊版
 * 3. 💾 儲存 → 回試算表 F5
 * 4. 點「📋 回饋工具 → 🚀 整理問題清單」
 */

const SUMMARY_SHEET_NAME = '📋 問題清單';
const AWARDS_SHEET_NAME = '🏆 單項獎統計';
const PERSON_SHEET_NAME = '👥 社員回饋密度';

const PROJECTS = [
  { code: 'G01', title: '歡樂時光屋' },
  { code: 'G02', title: '風味抉擇：漢堡帝國' },
  { code: 'G03', title: '八掌溪跑酷' },
  { code: 'G04', title: '嘉義美食大亨' },
  { code: 'G05', title: '槍戰' },
  { code: 'G06', title: '八掌溪環保爭霸戰' },
  { code: 'G07', title: '深淵騎士' },
  { code: 'G08', title: '拯救永續島' },
  { code: 'G09', title: "ECO Defender's Bizarre Adventure" },
  { code: 'G10', title: '微型死域' },
  { code: 'G11', title: '霓虹星際突擊' },
  { code: 'G12', title: 'Chiayi Tycoon：永續大作戰' },
  { code: 'G13', title: 'ZONE X：極限孤島大逃殺' },
  { code: 'G14', title: 'NEON STAR：REBIRTH 30' },
  { code: 'G15', title: '貪婪之星：乘數與炸彈' },
  { code: 'K01', title: '瘋狂大賽車' }
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📋 回饋工具')
    .addItem('🚀 整理問題清單（按作品）', 'generateSummary')
    .addItem('🏆 統計單項獎得票', 'generateAwards')
    .addItem('👥 社員回饋密度評分', 'generatePersonScores')
    .addSeparator()
    .addItem('🗑 清空問題清單', 'clearSummary')
    .addItem('🗑 清空單項獎統計', 'clearAwards')
    .addItem('🗑 清空社員密度評分', 'clearPersonScores')
    .addToUi();
}

function findResponsesSheet(ss) {
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const n = sheets[i].getName();
    if (n.indexOf('表單回應') >= 0 || n.indexOf('Form Responses') >= 0 || n.indexOf('Form responses') >= 0) {
      return sheets[i];
    }
  }
  for (let i = 0; i < sheets.length; i++) {
    const n = sheets[i].getName();
    if (n !== SUMMARY_SHEET_NAME && n !== AWARDS_SHEET_NAME && n !== PERSON_SHEET_NAME) {
      return sheets[i];
    }
  }
  return null;
}

function findIdentityCols(headers) {
  let nameCol = -1, classCol = -1;
  headers.forEach((h, idx) => {
    const s = String(h);
    if (nameCol < 0 && (s.indexOf('你的姓名') >= 0 || s === '姓名')) nameCol = idx;
    if (classCol < 0 && (s.indexOf('班級') >= 0 || s.indexOf('座號') >= 0 || s.indexOf('學號') >= 0)) classCol = idx;
  });
  return { nameCol, classCol };
}

// ====================================================
// 🚀 主功能：問題清單（KIRIN 要的格式）
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

  // 找每件作品欄位
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

  let sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (sheet) sheet.clear();
  else sheet = ss.insertSheet(SUMMARY_SHEET_NAME);

  let r = 1;

  // 大標題
  sheet.getRange(r, 1).setValue('🎮 大業 AI 繪圖社｜學期末作品問題清單');
  sheet.getRange(r, 1, 1, 3).merge()
    .setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center')
    .setBackground('#4a86e8').setFontColor('#ffffff');
  r++;
  sheet.getRange(r, 1).setValue(
    '總回饋人數：' + rows.length + ' 人　|　產出時間：' + new Date().toLocaleString('zh-TW')
  );
  sheet.getRange(r, 1, 1, 3).merge().setHorizontalAlignment('center')
    .setFontStyle('italic').setFontColor('#666');
  r++;

  // 表頭（A / B / C）
  sheet.getRange(r, 1).setValue('作品名稱 / 代號');
  sheet.getRange(r, 2).setValue('核心問題與優化建議（做中學落地調整）');
  sheet.getRange(r, 3).setValue('建議人（學號/代號）');
  sheet.getRange(r, 1, 1, 3)
    .setBackground('#cfe2f3').setFontWeight('bold').setHorizontalAlignment('center');
  r++;

  // 對每件作品
  PROJECTS.forEach((p, projectIdx) => {
    const cols = projectCols[p.code];
    const issues = [];          // 該作品「想說的話」所有原文 + 提出者
    const respondentSet = {};   // 留任一回饋的人去重

    rows.forEach(row => {
      // 識別碼優先用「班級/座號/學號」，沒有則退用姓名
      let studentId = '';
      if (classCol >= 0) studentId = String(row[classCol] || '').trim();
      if (!studentId && nameCol >= 0) studentId = String(row[nameCol] || '').trim();
      if (!studentId) studentId = '匿名';

      const impression = cols.impression >= 0 ? String(row[cols.impression] || '').trim() : '';
      const suggestion = cols.suggestion >= 0 ? String(row[cols.suggestion] || '').trim() : '';
      const scoreRaw = cols.score >= 0 ? row[cols.score] : '';
      const hasScore = scoreRaw !== '' && scoreRaw !== null && !isNaN(scoreRaw);

      if (impression || suggestion || hasScore) respondentSet[studentId] = true;
      if (suggestion) issues.push({ text: suggestion, source: studentId });
    });

    // A 欄：作品名稱 (代號)
    sheet.getRange(r, 1).setValue(p.title + ' (' + p.code + ')')
      .setFontWeight('bold').setVerticalAlignment('middle');

    // B 欄：問題列表（每條 * + 原文 + (學號)，空一行分隔）
    const issuesText = issues.length === 0
      ? '（暫無建議）'
      : issues.map(i => '* ' + i.text + ' (' + i.source + ')').join('\n\n');
    sheet.getRange(r, 2).setValue(issuesText)
      .setWrap(true).setVerticalAlignment('top');

    // C 欄：建議人列表（去重，「、」分隔）
    const respondentsText = Object.keys(respondentSet).join('、') || '（無）';
    sheet.getRange(r, 3).setValue(respondentsText)
      .setWrap(true).setVerticalAlignment('top');

    // 隔行底色（不和標題撞色）
    if (projectIdx % 2 === 1) {
      sheet.getRange(r, 1, 1, 3).setBackground('#f9f9f9');
    }

    r++;
  });

  // 欄寬
  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 700);
  sheet.setColumnWidth(3, 280);
  sheet.setFrozenRows(3);

  SpreadsheetApp.getUi().alert(
    '✅ 完成！\n\n格式：\n' +
    'A 作品名稱(代號) | B 問題清單(每條標學號) | C 建議人去重\n\n' +
    '請看「' + SUMMARY_SHEET_NAME + '」分頁'
  );
}

// ====================================================
// 🏆 單項獎得票
// ====================================================
function generateAwards() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responsesSheet = findResponsesSheet(ss);
  if (!responsesSheet) { SpreadsheetApp.getUi().alert('❌ 找不到回應分頁'); return; }
  const data = responsesSheet.getDataRange().getValues();
  if (data.length < 2) { SpreadsheetApp.getUi().alert('⚠ 還沒有回饋資料'); return; }
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
  if (awardCols.length === 0) { SpreadsheetApp.getUi().alert('❌ 找不到單項獎欄位'); return; }

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
      if (i === 0) sheet.getRange(r, 1, 1, 3).setBackground('#fce5cd').setFontWeight('bold');
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
// 👥 社員回饋密度評分
// ====================================================
function generatePersonScores() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const responsesSheet = findResponsesSheet(ss);
  if (!responsesSheet) { SpreadsheetApp.getUi().alert('❌ 找不到回應分頁'); return; }
  const data = responsesSheet.getDataRange().getValues();
  if (data.length < 2) { SpreadsheetApp.getUi().alert('⚠ 還沒有回饋資料'); return; }
  const headers = data[0];
  const rows = data.slice(1);
  const { nameCol, classCol } = findIdentityCols(headers);

  const projectCols = {};
  PROJECTS.forEach(p => { projectCols[p.code] = { impression: -1, suggestion: -1, score: -1 }; });
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

  const personStats = rows.map(row => {
    const name = nameCol >= 0 ? String(row[nameCol] || '').trim() : '（匿名）';
    const cls = classCol >= 0 ? String(row[classCol] || '').trim() : '';
    let worksReviewed = 0, totalTextChars = 0, textEntries = 0;

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

  ['排名', '姓名', '班級座號', '評了幾件', '文字筆數', '平均字數', '密度分']
    .forEach((h, i) => sheet.getRange(r, i + 1).setValue(h));
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

    if (i === 0) sheet.getRange(r, 1, 1, 7).setBackground('#fff2cc').setFontWeight('bold');
    else if (i === 1) sheet.getRange(r, 1, 1, 7).setBackground('#efefef');
    else if (i === 2) sheet.getRange(r, 1, 1, 7).setBackground('#fce5cd');
    if (p.densityScore < 30) sheet.getRange(r, 7).setFontColor('#cc0000').setFontWeight('bold');
    r++;
  });

  sheet.setColumnWidths(1, 7, 100);
  sheet.setColumnWidth(2, 120);
  sheet.setFrozenRows(3);

  SpreadsheetApp.getUi().alert('✅ 密度評分完成！低於 30 分會標紅，可能是敷衍填寫');
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
  if (s) { ss.deleteSheet(s); SpreadsheetApp.getUi().alert('已清空問題清單'); }
  else SpreadsheetApp.getUi().alert('沒有問題清單可清');
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
