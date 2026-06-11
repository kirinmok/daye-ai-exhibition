/**
 * 大業 AI 繪圖社期末成果展 - 投票與抽獎表單建立器
 *
 * 建立兩份表單：
 * Form A「投票」：匿名，只收作品代號、人氣票、評分、建議。
 * Form B「抽獎登記」：收聯絡資料，與投票內容脫鉤。
 *
 * 使用方式：
 * 1. 到 https://script.google.com/ 建立 Apps Script 專案。
 * 2. 貼上本檔內容。
 * 3. 執行 createVotingSystem() 並授權。
 * 4. 到執行紀錄複製 Form / Sheet URL。
 */

const PROJECT_CHOICES = [
  'G01 - 歡樂時光屋',
  'G02 - 風味抉擇：漢堡帝國',
  'G03 - 八掌溪跑酷',
  'G04 - 嘉義美食大亨',
  'G05 - 槍戰',
  'G07 - 八掌溪環保爭霸戰',
  'G08 - 深淵騎士',
  'G09 - 拯救永續島',
  "G10 - ECO Defender's Bizarre Adventure",
  'G21 - 霓虹星際突擊',
  'G23 - Chiayi Tycoon：永續大作戰',
  'G24 - ZONE X：極限孤島大逃殺',
  'G25 - NEON STAR：REBIRTH 30',
  'G26 - 貪婪之星：乘數與炸彈',
  'K01 - 瘋狂大賽車'
];

const SCORE_CHOICES = ['1', '2', '3', '4', '5'];

function createVotingSystem() {
  const votingSheet = SpreadsheetApp.create('大業 AI 繪圖社期末成果展投票回覆');
  const lotterySheet = SpreadsheetApp.create('大業 AI 繪圖社期末成果展抽獎登記');
  const votingForm = createVotingForm_(votingSheet);
  const lotteryForm = createLotteryForm_(lotterySheet);

  PropertiesService.getScriptProperties().setProperties({
    VOTING_FORM_ID: votingForm.getId(),
    VOTING_SPREADSHEET_ID: votingSheet.getId(),
    LOTTERY_FORM_ID: lotteryForm.getId(),
    LOTTERY_SPREADSHEET_ID: lotterySheet.getId()
  });

  Logger.log('Form A 投票表單編輯網址：' + votingForm.getEditUrl());
  Logger.log('Form A 投票表單填答網址：' + votingForm.getPublishedUrl());
  Logger.log('Form A 回覆試算表：' + votingSheet.getUrl());
  Logger.log('Form B 抽獎登記編輯網址：' + lotteryForm.getEditUrl());
  Logger.log('Form B 抽獎登記填答網址：' + lotteryForm.getPublishedUrl());
  Logger.log('Form B 回覆試算表：' + lotterySheet.getUrl());
  Logger.log('下一步：將 Form A 回覆試算表發布為 CSV，貼到 site-config.js 的 results.csvUrl。');
  Logger.log('網站 voting.formUrl 請填：' + votingForm.getPublishedUrl());
}

function createVotingForm_(sheet) {
  const form = FormApp.create('大業 AI 繪圖社期末成果展｜匿名投票');
  form.setDescription([
    '這份表單用於成果展匿名投票與作品回饋。',
    '',
    '請登入學校 Google 帳號後填寫。表單不收集 Email，不公開個人資料。',
    '請勿在文字回饋中填入姓名、班級、座號、學號或聯絡方式。',
    '',
    '每位觀眾限投 1 件最想支持的作品。',
    '投票期間網站只公開總投票人次，截止後才公布作品排行。'
  ].join('\n'));
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(true);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  try {
    form.setRequireLogin(true);
  } catch (error) {
    Logger.log('此帳號環境可能不支援 setRequireLogin(true)：' + error);
  }
  form.setConfirmationMessage(
    '感謝你的投票與建議。若要參加抽獎，請另外填寫抽獎登記表單；抽獎資料不會與投票內容連結。'
  );
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  form.addSectionHeaderItem()
    .setTitle('匿名投票')
    .setHelpText('請選出你最想支持的作品，並給予 1 到 5 分評分。');

  form.addListItem()
    .setTitle('作品代號')
    .setHelpText('請選擇你最想支持的作品。每人限投 1 件。')
    .setChoiceValues(PROJECT_CHOICES)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('人氣票')
    .setHelpText('確認你要把本次人氣票投給上方選擇的作品。')
    .setChoiceValues(['我把人氣票投給這件作品'])
    .setRequired(true);

  addScoreItem_(form, '創意');
  addScoreItem_(form, '美術風格');
  addScoreItem_(form, '遊戲性');
  addScoreItem_(form, '操作流暢度');
  addScoreItem_(form, '完成度');

  form.addParagraphTextItem()
    .setTitle('最喜歡的地方')
    .setHelpText('最喜歡的地方。請勿填個資。')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('建議改進')
    .setHelpText('建議改進。請勿填個資。')
    .setRequired(false);

  return form;
}

function createLotteryForm_(sheet) {
  const form = FormApp.create('大業 AI 繪圖社期末成果展｜抽獎登記');
  form.setDescription([
    '這份表單只用於抽獎聯絡與領獎確認，與匿名投票表單分開。',
    '',
    '請依主辦單位公告填寫可聯絡到你的資料。'
  ].join('\n'));
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);
  form.setAllowResponseEdits(true);
  form.setShowLinkToRespondAgain(false);
  try {
    form.setRequireLogin(true);
  } catch (error) {
    Logger.log('此帳號環境可能不支援 setRequireLogin(true)：' + error);
  }
  form.setConfirmationMessage('已收到抽獎登記。得獎與領獎方式依主辦單位公告為準。');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  form.addSectionHeaderItem()
    .setTitle('抽獎登記')
    .setHelpText('此表單不詢問你投給哪件作品。');

  form.addTextItem()
    .setTitle('班級座號')
    .setHelpText('例如 80101。僅供抽獎與領獎聯絡。')
    .setRequired(true);

  form.addTextItem()
    .setTitle('暱稱或稱呼')
    .setHelpText('領獎通知使用，可填暱稱。')
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle('我已完成匿名投票')
    .setChoiceValues(['是'])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('我了解抽獎資料只供本次活動聯絡使用')
    .setChoiceValues(['是'])
    .setRequired(true);

  return form;
}

function addScoreItem_(form, label) {
  form.addScaleItem()
    .setTitle(label)
    .setHelpText(label + '：1 分最低，5 分最高。')
    .setBounds(1, 5)
    .setLabels('1', '5')
    .setRequired(true);
}
