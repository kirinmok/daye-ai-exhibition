/**
 * 大業 AI 繪圖社｜學期末作品評鑑與心得回饋（內部專用｜每件作品都可評版）
 * 一鍵建表單 + 自動連結試算表
 *
 * 設計：對【每一件作品】都給評鑑題組，包含自己。
 *      沒玩過或不熟的可留空（非必填），社員自選想深度回饋哪些作品。
 *      KIRIN 看回饋密度與質量打分。
 *
 * 使用：
 * 1. 打開 https://script.google.com → 新增專案
 * 2. 把這整份貼進去（覆蓋預設 myFunction）
 * 3. 上方下拉選 buildForm → 點 ▶️ 執行（第一次跳授權照走）
 * 4. 看「執行記錄」會印出表單網址、編輯網址、試算表網址
 */

const FORM_TITLE = '大業 AI 繪圖社｜學期末作品評鑑與心得回饋';
const FORM_DESC = '⏱ 預估填寫時間：15-25 分鐘\n✍ 規則：\n  • 每人填一次（綁 Google 帳號）\n  • 第 3 區【每件作品】都可給回饋，沒玩過的可留空\n  • 老師會評你的【回饋密度 + 品質】：用心寫具體建議的得高分\n  • 敷衍只寫「很棒」「加油」會被扣分';

// ★ 所有作品（依 works.js）— 學生會對每件給回饋
const PROJECTS = [
  { code: 'G01', title: '歡樂時光屋' },
  { code: 'G02', title: '風味抉擇：漢堡帝國' },
  { code: 'G03', title: '八掌溪跑酷' },
  { code: 'G04', title: '嘉義美食大亨' },
  { code: 'G05', title: '第三次世界大戰' },
  { code: 'G06', title: '八掌溪環保爭霸戰' },
  { code: 'G07', title: '深淵騎士' },
  { code: 'G08', title: '拯救永續島' },
  { code: 'G09', title: 'ECO Defender\'s Bizarre Adventure' },
  { code: 'G10', title: '微型死域' },
  { code: 'G11', title: '霓虹星際突擊' },
  { code: 'G12', title: 'Chiayi Tycoon：永續大作戰' },
  { code: 'G13', title: 'ZONE X：極限孤島大逃殺' },
  { code: 'G14', title: 'NEON STAR：REBIRTH 30' },
  { code: 'G15', title: '貪婪之星：乘數與炸彈' },
  { code: 'K01', title: '瘋狂大賽車' }
];

// 給單項獎下拉用（含「我沒有作品」）
const PROJECT_LABELS = PROJECTS.map(p => p.code + ' ' + p.title);

const ASPECT_HINT = '建議對應 8 大面向：\n🎨 美術視覺｜🕹️ 玩法機制｜🖱️ 操作介面 UX｜🐛 程式 Bug\n💡 創意概念｜📖 教學引導｜🎵 音效氛圍｜⚖ 平衡難度';

function buildForm() {
  const form = FormApp.create(FORM_TITLE);
  form.setDescription(FORM_DESC);
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage('感謝你！老師會仔細看每一筆回饋，下學期見 \u{1F44B}');

  // ===== 第 1 區：基本資訊 =====
  form.addSectionHeaderItem().setTitle('\u{1F4CB} 第 1 區｜基本資訊');

  form.addTextItem().setTitle('你的姓名').setRequired(true);
  form.addTextItem().setTitle('班級 / 座號（例：803-12）').setRequired(true);

  form.addListItem()
    .setTitle('你自己作品的代號')
    .setChoiceValues(PROJECT_LABELS.concat(['我沒有作品（純觀察員）']))
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('你在團隊中的主要角色（可複選）')
    .setChoiceValues(['程式', '美術', '企劃', 'AI 提示工程', '測試', '文案 / 故事', '其他'])
    .setRequired(true);

  // ===== 第 2 區：自評（簡化）=====
  form.addPageBreakItem().setTitle('\u{1FA9E} 第 2 區｜自我評鑑');

  form.addScaleItem().setTitle('我給自己作品的整體分數').setBounds(1, 10).setLabels('還很多要改', '已經能上架').setRequired(true);
  form.addScaleItem().setTitle('自評：我自己這學期的投入度').setBounds(1, 10).setLabels('打混摸魚', '全力以赴').setRequired(true);

  form.addParagraphTextItem().setTitle('製作這款遊戲時，我學到最重要的技術 / 工具').setRequired(true);
  form.addParagraphTextItem().setTitle('過程中遇到最大的困難？怎麼克服？').setRequired(true);
  form.addParagraphTextItem().setTitle('我對自己作品最滿意的一個細節').setRequired(true);
  form.addParagraphTextItem().setTitle('我下次想改進的部分').setRequired(true);

  // ===== 第 3 區：對【每件作品】的評鑑（包含自己） =====
  form.addPageBreakItem()
    .setTitle('\u{1F91D} 第 3 區｜每件作品的評鑑（包含自己）')
    .setHelpText('⚠ 規則：對【你玩過 / 熟悉】的作品給回饋。沒玩過的留空也 OK。\n⭐ 但老師會評你的回饋密度 + 質量：寫得越具體、評越多件、能舉例 = 越高分。\n敷衍只寫「很棒」「加油」會被扣分。\n\n' + ASPECT_HINT);

  // 對每件作品 3 題
  PROJECTS.forEach((p, idx) => {
    form.addSectionHeaderItem()
      .setTitle('\u{1F4CC} ' + p.code + '｜' + p.title)
      .setHelpText('沒玩過 / 不熟的話，下面三題都可以留空');

    form.addParagraphTextItem()
      .setTitle(p.code + '｜印象最深的一點（具體：哪個畫面 / 哪個機制 / 哪個瞬間）')
      .setHelpText('例：「BOSS 戰時音樂變快讓人緊張」「卡包開包動畫超爽」');

    form.addParagraphTextItem()
      .setTitle(p.code + '｜想說的話（建議改進 / Bug / 不合理之處）')
      .setHelpText('對應 8 大面向。例：「按 ESC 後再按 Enter 會卡死，可重現 3 次」「新手提示應該再清楚」');

    form.addScaleItem()
      .setTitle(p.code + '｜給這件作品的評分')
      .setBounds(1, 10)
      .setLabels('沒玩過 / 很糟', '神作');
  });

  // ===== 第 4 區：單項獎投票 =====
  form.addPageBreakItem().setTitle('\u{1F3C6} 第 4 區｜單項獎投票');

  [
    '\u{1F3A8} 最佳美術獎（畫面最讚）',
    '\u{1F3AE} 最佳玩法獎（玩起來最有趣）',
    '\u{1F916} 最佳 AI 創意獎（AI 用得最聰明）',
    '\u{1F680} 最具潛力獎（下學期最值得繼續做）',
    '\u{1F465} 最佳團隊合作獎（團隊配合最好）'
  ].forEach(title => {
    form.addListItem()
      .setTitle(title)
      .setChoiceValues(PROJECT_LABELS)
      .setRequired(true);
  });

  // ===== 第 5 區：對社團與自己的回饋 =====
  form.addPageBreakItem().setTitle('\u{1F4AC} 第 5 區｜對社團與自己的回饋');

  form.addParagraphTextItem().setTitle('這學期社團最讓我有收穫的一堂課 / 一個技術主題').setRequired(true);

  form.addCheckboxItem()
    .setTitle('下學期最希望多教 / 多練的內容（可複選）')
    .setChoiceValues([
      'AI 生成圖（Midjourney / SD / Nano Banana）',
      'AI 生成程式（Claude / ChatGPT 寫 code）',
      'Blender 3D 建模',
      '互動程式（HTML / JS / Canvas）',
      '遊戲企劃 / 故事設計',
      'Pixel Art 像素繪',
      '美術風格學（賽博龐克 / 蒸氣龐克 / 厚塗）',
      '團隊協作（Git / 分工 / 版本管理）',
      '聲音設計（BGM / SFX）',
      '其他'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('對社團活動 / 教學方式的建議（什麼想保留、什麼想改）')
    .setHelpText('例：「希望多有同學間互動」「希望課程節奏慢一點」「希望多 demo 業界作品」')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('想對指導老師說的話（匿名也可以、但建議署名）')
    .setHelpText('可吐槽可感謝、實話最有用');

  form.addParagraphTextItem()
    .setTitle('我整學期最大的成長 / 學到最重要的一件事')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('想對下學期的自己說的一句話')
    .setHelpText('給未來的你看的訊息');

  // ===== 建試算表 + 連結 =====
  const sheetName = '大業AI繪圖社_學期末評鑑回饋_' + new Date().toLocaleDateString('zh-TW').replace(/\//g, '-');
  const sheet = SpreadsheetApp.create(sheetName);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  // ===== 印出結果 =====
  Logger.log('========================================');
  Logger.log('✅ 表單建好了！題數約 ' + (4 + 6 + PROJECTS.length * 3 + 5 + 6) + ' 題');
  Logger.log('');
  Logger.log('\u{1F4DD} 學生填這個（給社員）:');
  Logger.log(form.getPublishedUrl());
  Logger.log('');
  Logger.log('\u{1F527} 你編輯這個（自己看 / 改題目）:');
  Logger.log(form.getEditUrl());
  Logger.log('');
  Logger.log('\u{1F4CA} 答案會收到這個試算表（你看結果）:');
  Logger.log(sheet.getUrl());
  Logger.log('========================================');

  return {
    publishedUrl: form.getPublishedUrl(),
    editUrl: form.getEditUrl(),
    sheetUrl: sheet.getUrl()
  };
}
