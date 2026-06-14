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
  'G01 - 歡樂時光屋',
  'G02 - 風味抉擇：漢堡帝國',
  'G03 - 八掌溪跑酷',
  'G04 - 嘉義美食大亨',
  'G05 - 第三次世界大戰',
  'G06 - 八掌溪環保爭霸戰',
  'G07 - 深淵騎士',
  'G08 - 拯救永續島',
  "G09 - ECO Defender's Bizarre Adventure",
  'G10 - 微型死域',
  'G11 - 霓虹星際突擊',
  'G12 - Chiayi Tycoon：永續大作戰',
  'G13 - ZONE X：極限孤島大逃殺',
  'G14 - NEON STAR：REBIRTH 30',
  'G15 - 貪婪之星：乘數與炸彈'
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
    '🗳️ 投票歡迎所有人（含校外朋友）。',
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
    '本表單不收集 Email，不公開個人身份。',
    '',
    '【🎁 抽獎資格】',
    '抽獎限大業實驗中學「2025–2026 學年度在校學生」。',
    '✗ 老師、家長、畢業校友、校外朋友皆無抽獎資格。',
    '若你符合資格，請於投票完成後另外填寫抽獎登記表單。',
    lotteryUrl ? '抽獎登記表單：' + lotteryUrl : '',
    '',
    '【隱私提醒】',
    '請勿在文字回饋中填入姓名、班級、座號、學號或聯絡方式。'
  ].filter(Boolean).join('\n'));
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);  // 不要求登入 → 不能用此限制
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(true);
  // 校外路人也能投票，拿掉登入鎖
  try {
    form.setRequireLogin(false);
  } catch (error) {
    Logger.log('此帳號環境可能不支援 setRequireLogin(false)：' + error);
  }
  form.setConfirmationMessage(
    '感謝你的投票與建議！\n\n🎁 抽獎只限大業實驗中學「在校學生」。若你符合資格，請另外填寫抽獎登記表單：' + lotteryUrl
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
  const form = FormApp.create('大業 AI 繪圖社期末成果展｜抽獎登記（限在校學生）');
  form.setDescription([
    '⚠️ 抽獎資格限定：',
    '大業實驗中學「2025–2026 學年度在校學生」。',
    '',
    '✗ 老師、家長、校外朋友、已畢業校友皆無抽獎資格。',
    '（投票本身仍歡迎所有人，請至投票表單填寫。）',
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
  form.setConfirmationMessage('已收到抽獎登記。若身分不符（非在校學生），主辦單位有權取消抽獎資格。得獎與領獎方式依公告為準。');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  form.addSectionHeaderItem()
    .setTitle('身分聲明')
    .setHelpText('請誠實填寫。資料造假將取消抽獎資格。');

  form.addCheckboxItem()
    .setTitle('我聲明我目前是大業實驗中學「2025–2026 學年度在校學生」（非畢業校友、非家長、非校外朋友）')
    .setChoiceValues(['是'])
    .setRequired(true);

  form.addTextItem()
    .setTitle('班級（例：804）')
    .setHelpText('請填寫三位數班級代碼（5/6/7/8/9 開頭，例如 804、703、902）。')
    .setRequired(true);

  form.addTextItem()
    .setTitle('座號（例：23）')
    .setHelpText('請填寫純數字座號，1–40。')
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
    .setTitle('我了解抽獎資料只供本次活動聯絡使用，並承諾到校現場領獎')
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
