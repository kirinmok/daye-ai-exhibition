/**
 * 大業 AI 繪圖社｜🎮 觀眾投票表單建構（30 秒簡易版）
 *
 * 設計：給校外觀眾、家長、其他班學生填，30 秒搞定
 * 防灌票：Gmail 限制 + Google 登入必填
 *
 * 安裝步驟：
 * 1. https://script.google.com → 新增專案
 * 2. 整份貼上（覆蓋 myFunction）
 * 3. 上方下拉選 buildAudienceForm → ▶ 執行
 * 4. 看「執行記錄」拿三個 URL
 */

const FORM_TITLE = '🎮 大業 AI 繪圖社｜2026 學期末成果展｜觀眾投票';
const FORM_DESC = '⏱ 預估填寫時間：30 秒\n\n' +
  '🎯 用一票讓你最愛的作品被看見！\n\n' +
  '📅 投票期：6/15（一）~ 6/19（五）23:59\n' +
  '📊 結果公布：6/20（六）早上 9:00\n\n' +
  '⚠️ 規則：\n' +
  '  • 一個 Gmail 只能投一次（防灌票）\n' +
  '  • 投票期間不公開排行，避免從眾\n' +
  '  • 主辦單位保留刪除異常票權利\n\n' +
  '🛡️ 隱私：填寫的「一句話」會經主辦審核才上精選好評牆，負評不公開';

// K01 是教師示範作品，不參賽
const PROJECTS = [
  'G01 歡樂時光屋',
  'G02 風味抉擇：漢堡帝國',
  'G03 八掌溪跑酷',
  'G04 嘉義美食大亨',
  'G05 槍戰',
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
    '🎉 感謝你的一票！\n\n' +
    '✨ 6/20（六）早上 9:00 公布結果\n' +
    '預測對的話我們會用 IG 限動感謝你 ❤️\n\n' +
    '⚠ 投票期間我們不公開即時排行，但相信你的眼光！'
  );

  // ===== 第 1 題：你最愛的作品（必填）=====
  form.addListItem()
    .setTitle('🏆 你最愛的作品是？')
    .setHelpText('一票投給最打動你的作品。每人限投一次！')
    .setChoiceValues(PROJECTS)
    .setRequired(true);

  // ===== 第 2 題：一句話為什麼（選填）=====
  form.addParagraphTextItem()
    .setTitle('💬 一句話告訴我們為什麼選它（選填）')
    .setHelpText('例：好玩、畫面好看、有梗、想再玩一次。\n你的好評有機會被選上「精選好評牆」！\n（負面評論不公開，會送內部給作者改進用）')
    .setRequired(false);

  // ===== 第 3 題：預測人氣金獎（選填，A 版互動）=====
  form.addListItem()
    .setTitle('🔮 你猜誰會得「人氣金獎」？（選填）')
    .setHelpText('猜對的話 6/20 公布時你會被看見哦 ✨')
    .setChoiceValues(PROJECTS)
    .setRequired(false);

  // ===== 第 4 題：你是？（選填）=====
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
  Logger.log('✅ 觀眾投票 Form 建好了！4 題 30 秒版');
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
