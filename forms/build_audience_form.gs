/**
 * 大業 AI 繪圖社｜🎮 觀眾投票表單建構（6 題 1 分鐘版）
 *
 * 設計：3 票決定 3 個獎位（人氣金獎 + 觀眾畫面獎 + 觀眾玩法獎）
 * 公平性：Google 帳號限制 + 登入必填
 *
 * 安裝步驟：
 * 1. https://script.google.com → 新增專案
 * 2. 整份貼上（覆蓋 myFunction）
 * 3. 上方下拉選 buildAudienceForm → ▶ 執行
 * 4. 看「執行記錄」拿三個 URL
 */

const FORM_TITLE = '🎮 大業 AI 繪圖社｜2026 學期末成果展｜觀眾投票';
const FORM_DESC = '⏱ 預估填寫時間：1 分鐘\n\n' +
  '🎯 你的 3 票會決定 3 個獎位 —\n' +
  '   🥇 人氣金獎\n' +
  '   🎨 觀眾畫面獎\n' +
  '   🕹️ 觀眾玩法獎\n\n' +
  '📅 投票期：6/15（一）~ 6/26（五）23:59\n' +
  '📊 結果公布：6/29（一）早上 8:00\n\n' +
  '⚠️ 規則：\n' +
  '  • 一個 Google 帳號只能投一次\n' +
  '  • 投票期間不公開排行，避免從眾\n' +
  '  • 主辦單位保留刪除異常票權利\n\n' +
  '🛡️ 隱私：填寫的「一句話」會經主辦審核才上精選好評牆，負評不公開';

// K01 是教師示範作品，不參賽
const PROJECTS = [
  'G01 歡樂時光屋',
  'G02 風味抉擇：漢堡帝國',
  'G03 八掌溪跑酷',
  'G04 嘉義美食大亨',
  'G05 第三次世界大戰',
  'G06 八掌溪環保爭霸戰',
  'G07 深淵騎士',
  'G08 拯救永續島',
  "G09 ECO Defender's Bizarre Adventure",
  'G10 微型死域',
  'G11 霓虹星際突擊',
  'G12 Chiayi Tycoon：永續大作戰',
  'G13 ZONE X：極限孤島大逃殺',
  'G14 NEON STAR：REBIRTH 30',
  'G15 貪婪之星：乘數與炸彈'
];

function buildAudienceForm() {
  const form = FormApp.create(FORM_TITLE);
  form.setDescription(FORM_DESC);
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage(
    '🎉 感謝你的 3 票！\n\n' +
    '✨ 6/29（一）早上 8:00 公布結果\n' +
    '預測對的話我們會用 IG 限動感謝你 ❤️\n\n' +
    '⚠ 投票期間我們不公開即時排行，但相信你的眼光！'
  );

  // ===== 第 1 題：人氣金獎（必填）=====
  form.addListItem()
    .setTitle('🥇 你最愛的作品是？（人氣金獎）')
    .setHelpText('最打動你、最想推薦給朋友玩的那一件。')
    .setChoiceValues(PROJECTS)
    .setRequired(true);

  // ===== 第 2 題：觀眾畫面獎（必填）=====
  form.addListItem()
    .setTitle('🎨 畫面最讚的作品是？（觀眾畫面獎）')
    .setHelpText('視覺風格、美術設計、畫面表現最吸引你的那一件。\n可以跟第 1 題不同，也可以一樣。')
    .setChoiceValues(PROJECTS)
    .setRequired(true);

  // ===== 第 3 題：觀眾玩法獎（必填）=====
  form.addListItem()
    .setTitle('🕹️ 玩法最有趣的作品是？（觀眾玩法獎）')
    .setHelpText('操作最順手、機制最有趣、最想再玩一次的那一件。\n可以跟前兩題不同，也可以一樣。')
    .setChoiceValues(PROJECTS)
    .setRequired(true);

  // ===== 第 4 題：一句話為什麼（選填）=====
  form.addParagraphTextItem()
    .setTitle('💬 一句話告訴我們，為什麼這幾件作品打動你？（選填）')
    .setHelpText('例：「G02 的漢堡帝國畫面超有梗」「G08 拯救永續島玩起來最爽」。\n你的好評有機會被選上「精選好評牆」！\n（負面評論不公開，會送內部給作者改進用）')
    .setRequired(false);

  // ===== 第 5 題：預測人氣金獎（選填，抽獎用）=====
  form.addListItem()
    .setTitle('🔮 你猜誰會得「人氣金獎」？（選填，抽獎用）')
    .setHelpText('猜對的話 6/29 公布時你自動進入抽獎池 ✨')
    .setChoiceValues(PROJECTS)
    .setRequired(false);

  // ===== 第 6 題：你是？（選填）=====
  form.addMultipleChoiceItem()
    .setTitle('🙋 你是？（選填）')
    .setHelpText('讓我們知道是誰來看了我們的作品')
    .setChoiceValues(['學生', '家長', '老師', '校友', '其他'])
    .setRequired(false);

  // ===== 建試算表 =====
  const sheetName = '大業AI繪圖社_觀眾投票_' +
    new Date().toLocaleDateString('zh-TW').replace(/\//g, '-');
  const sheet = SpreadsheetApp.create(sheetName);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  Logger.log('========================================');
  Logger.log('✅ 觀眾投票 Form 建好了！6 題 1 分鐘版');
  Logger.log('✨ 3 票決定 3 個獎位：人氣金 + 觀眾畫面 + 觀眾玩法');
  Logger.log('');
  Logger.log('📝 觀眾填這個（要貼進 site-config.js）:');
  Logger.log(form.getPublishedUrl());
  Logger.log('');
  Logger.log('🔧 你編輯這個:');
  Logger.log(form.getEditUrl());
  Logger.log('');
  Logger.log('📊 票會記到這個試算表:');
  Logger.log(sheet.getUrl());
  Logger.log('========================================');
  Logger.log('');
  Logger.log('⚠️ 拿到公開網址後傳給小可，幫你更新 site-config.js');

  return {
    publishedUrl: form.getPublishedUrl(),
    editUrl: form.getEditUrl(),
    sheetUrl: sheet.getUrl()
  };
}
