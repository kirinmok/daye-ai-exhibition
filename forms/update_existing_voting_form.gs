/**
 * 大業 AI 繪圖社期末成果展 - 更新既有投票表單
 *
 * 目標：
 * 1. 將既有 Google Form 改成正式「匿名投票」表單。
 * 2. 另外建立「抽獎登記」表單，收 Email / 班級座號，和投票內容脫鉤。
 *
 * 使用方式：
 * 1. 到 https://script.google.com/ 建立或開啟 Apps Script 專案。
 * 2. 貼上本檔內容。
 * 3. 確認 TARGET_VOTING_FORM_ID 是你的投票表單 ID。
 * 4. 執行 rebuildExistingVotingFormAndCreateLotteryForm()。
 * 5. 到「執行紀錄」複製投票表單、投票 Sheet、抽獎表單網址。
 *
 * 注意：
 * - 此函式會刪除既有表單題目並重建題目。
 * - 請在正式收票前執行；若已經有正式回覆，先不要執行。
 */

const TARGET_VOTING_FORM_ID = '1xn0abYP7l1_DxAGoxYy5XkQJIz76re5bx3HxVsu-CIc';
const VOTING_PERIOD_TEXT = '即日起至主辦老師公告截止時間';
const VOTING_METHOD_TEXT = '先進入成果展網站試玩作品，再回到投票表單選擇作品代號並完成評分。';

const PROJECT_CHOICES = [
  'G01 - REACT.X',
  'G02 - 風味抉擇：漢堡帝國',
  'G03 - 八掌溪跑酷',
  'G04 - 嘉義美食大亨',
  'G05 - 深海設施射擊戰',
  'G07 - 八掌溪環保爭霸戰',
  'G08 - 深淵騎士',
  'G09 - 拯救永續島',
  "G10 - ECO Defender's Bizarre Adventure",
  'G21 - 霓虹星際突擊',
  'G22 - 貪婪之星：乘數與炸彈',
  'K01 - 瘋狂大賽車'
];

function rebuildExistingVotingFormAndCreateLotteryForm() {
  const votingForm = FormApp.openById(TARGET_VOTING_FORM_ID);
  const votingSheet = SpreadsheetApp.create('大業 AI 繪圖社期末成果展投票回覆');
  const lotterySheet = SpreadsheetApp.create('大業 AI 繪圖社期末成果展抽獎登記');
  const lotteryForm = createLotteryForm_(lotterySheet);

  configureVotingForm_(votingForm, lotteryForm.getPublishedUrl());
  clearFormItems_(votingForm);
  addVotingItems_(votingForm);
  votingForm.setDestination(FormApp.DestinationType.SPREADSHEET, votingSheet.getId());

  Logger.log('投票表單編輯網址：' + votingForm.getEditUrl());
  Logger.log('投票表單填答網址：' + votingForm.getPublishedUrl());
  Logger.log('投票回覆試算表：' + votingSheet.getUrl());
  Logger.log('抽獎表單編輯網址：' + lotteryForm.getEditUrl());
  Logger.log('抽獎表單填答網址：' + lotteryForm.getPublishedUrl());
  Logger.log('抽獎回覆試算表：' + lotterySheet.getUrl());
  Logger.log('下一步：將投票回覆試算表發布為 CSV，貼回網站 results.csvUrl。');
}

function configureVotingForm_(form, lotteryUrl) {
  form.setTitle('大業 AI 繪圖社期末成果展｜匿名投票');
  form.setDescription([
    '請先試玩作品，再填寫這份匿名投票與玩家體驗回饋表。',
    '',
    '【投票時間】',
    VOTING_PERIOD_TEXT,
    '',
    '【投票方式】',
    '1. 進入成果展網站瀏覽作品。',
    '2. 選一件作品試玩。',
    '3. 回到本表單，選擇作品代號。',
    '4. 給予五項 1-5 分評分，並留下具體建議。',
    '',
    '【投票規則】',
    '每位觀眾限投 1 件最想支持的作品。',
    '本表單需要 Google 帳號登入並限制填答 1 次，但不收集 Email，投票內容不會公開個人身份。',
    '',
    '【抽獎說明】',
    '完成匿名投票後，若要參加抽獎，請另外填寫抽獎登記表單。',
    '抽獎登記會收 Email / 班級座號供聯絡使用，但不詢問你投給哪件作品。',
    lotteryUrl ? '抽獎登記表單：' + lotteryUrl : '',
    '',
    '【隱私提醒】',
    '請勿在文字回饋中填入姓名、班級、座號、學號或聯絡方式。'
  ].filter(Boolean).join('\n'));
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
    '感謝你的投票與建議。若要參加抽獎，請另外填寫抽獎登記表單：' + lotteryUrl
  );
}

function addVotingItems_(form) {
  form.addSectionHeaderItem()
    .setTitle('投票前請確認')
    .setHelpText('請先試玩作品，再投給你最想支持的 1 件作品。');

  form.addListItem()
    .setTitle('作品代號')
    .setHelpText('請選擇你最想支持的作品。')
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

  form.addMultipleChoiceItem()
    .setTitle('你願意推薦別人試玩這款遊戲嗎？')
    .setChoiceValues(['非常願意', '願意', '普通', '不太願意', '不願意'])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('最喜歡的地方')
    .setHelpText('請寫具體一點，例如美術、操作、關卡、故事、音效或遊戲節奏。請勿填個資。')
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle('建議改進')
    .setHelpText('請給創作者可以行動的建議，例如哪裡看不懂、卡住、太難、太簡單或操作不順。請勿填個資。')
    .setRequired(false);
}

function createLotteryForm_(sheet) {
  const form = FormApp.create('大業 AI 繪圖社期末成果展｜抽獎登記');
  form.setDescription([
    '這份表單只用於抽獎聯絡與領獎確認，與匿名投票表單分開。',
    '',
    '請使用可聯絡到你的 Google 帳號填寫。',
    '本表單不詢問你投給哪件作品，避免破壞匿名投票。'
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
    .setHelpText('此表單只用於抽獎聯絡，不會公開個人資料。');

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

function clearFormItems_(form) {
  const items = form.getItems();
  for (let index = items.length - 1; index >= 0; index -= 1) {
    form.deleteItem(items[index]);
  }
}
