window.SITE_CONFIG = {
  clubName: "大業 AI 繪圖社",
  voting: {
    enabled: true,
    // 正式公開版只導向 Google Form，不在網站按鈕先記票，避免未完成表單也被計入。
    apiUrl: "",
    // ✅ 觀眾投票表單（30 秒 4 題簡易版）— 2026-06-11 上線
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdqblGxiiy7UW7IIf3AdZto3Y3hdrxMYe356wz9tdtAHAZEaA/viewform",
    gameParamName: "entry.611798134",
    startDate: "2026-06-15",
    endDate: "2026-06-19",
    deadline: "6/19（五）23:59",
    publishDate: "2026-06-20T09:00:00+08:00",
    publishLabel: "6/20（六）早上 9:00",
    prizeSummary: "14 個獎位，通通有獎",
    prototypeVotingEnabled: false,
    // K01 是教師示範作品，不可投票
    nonVotableIds: ["K01"],
  },
  results: {
    // 投票期間不讀公開 CSV，避免誤公開個資。截止後請接上已清理欄位的 CSV。
    csvUrl: "",
    refreshSeconds: 60,
    publicRankingsOpen: false,
    useMockVotes: false,
    columns: {
      projectId: "您試玩的作品代號",
      likedMost: "您覺得這款遊戲最吸引人的地方是什麼？",
      suggestion: "若有機會改善，您建議開發者調整哪個部分？",
      creativity: "遊戲體驗評分 [AI 結合創意]",
      art: "遊戲體驗評分 [畫面精緻度]",
      gameplay: "遊戲體驗評分 [遊戲趣味性]",
      smoothness: "遊戲體驗評分 [操作流暢度]",
      completeness: "遊戲體驗評分 [整體體驗滿意度]",
      createdAt: "時間戳記",
    },
  },
  // ========================================
  // 🏆 獎項設計（截止後公布，winner 預設 null）
  // ========================================
  awards: {
    publishAt: "2026-06-20T09:00:00+08:00",
    publishLabel: "6/20（六）早上 9:00",
    purpose: "通通有獎機制：14 個獎位，讓每位作者都能被看見",
    list: [
      // A 組：觀眾票決定
      { id: "popular_gold", group: "A", source: "audience", icon: "🥇", name: "人氣金獎",
        desc: "觀眾用腳投出來的「最想再玩一次」", winner: null, winnerNote: "" },
      { id: "popular_silver", group: "A", source: "audience", icon: "🥈", name: "人氣銀獎",
        desc: "觀眾票第 2 名", winner: null, winnerNote: "" },
      { id: "popular_bronze", group: "A", source: "audience", icon: "🥉", name: "人氣銅獎",
        desc: "觀眾票第 3 名", winner: null, winnerNote: "" },
      // B 組：內部評鑑決定
      { id: "best_visual", group: "B", source: "internal", icon: "🎨", name: "最佳畫面設計獎",
        desc: "一打開「哇」一聲，美的記憶點最深", winner: null, winnerNote: "" },
      { id: "best_gameplay", group: "B", source: "internal", icon: "🕹️", name: "最佳玩法獎",
        desc: "機制最順、學會就上癮的遊戲性王者", winner: null, winnerNote: "" },
      { id: "best_creativity", group: "B", source: "internal", icon: "💡", name: "最佳創意概念獎",
        desc: "別人沒做過、有梗、讓人想截圖傳朋友", winner: null, winnerNote: "" },
      { id: "best_tech", group: "B", source: "internal", icon: "🛠️", name: "最佳技術獎",
        desc: "程式碼裡藏著真功夫（多人連線、3D、AI 整合）", winner: null, winnerNote: "" },
      { id: "best_theme", group: "B", source: "internal", icon: "🌍", name: "最佳主題深度獎",
        desc: "SDGs 主題真做進去，成熟落地", winner: null, winnerNote: "" },
      { id: "best_vibe", group: "B", source: "internal", icon: "🎵", name: "最佳氛圍獎",
        desc: "音效+美術讓人沉浸進世界，氣氛拉滿", winner: null, winnerNote: "" },
      { id: "most_potential", group: "B", source: "internal", icon: "🚀", name: "最具潛力獎",
        desc: "創新、契合 SDGs、有教育意義 — 不抄襲、不雷同市面遊戲，真心想做點什麼", winner: null, winnerNote: "" },
      { id: "best_teamwork", group: "B", source: "internal", icon: "🤝", name: "最佳團隊合作獎",
        desc: "分工最漂亮、作品看得到兩人以上的腦", winner: null, winnerNote: "" },
      { id: "best_cover", group: "B", source: "internal", icon: "🖼️", name: "最佳封面設計獎",
        desc: "縮圖獨立看就吸引人，讓人想點進去", winner: null, winnerNote: "" },
      // C 組：KIRIN 評審特別獎（兜底）
      { id: "judge_surprise", group: "C", source: "judge", icon: "💛", name: "評審驚喜獎",
        desc: "KIRIN 私心：第一次玩就笑出來", winner: null, winnerNote: "" },
      { id: "newbie_spirit", group: "C", source: "judge", icon: "🌟", name: "新手鼓勵獎",
        desc: "第一次做遊戲的學生，完成就是勝利", winner: null, winnerNote: "" },
    ],
  },
  // ========================================
  // 📜 投票規則（顯示在規則頁）
  // ========================================
  rules: {
    purpose: "讓親師生選出心目中最想支持的作品，並給創作者一份可以繼續改進的回饋。",
    period: "2026/6/15（一）~ 6/19（五）23:59",
    publishAt: "2026/6/20（六）早上 9:00",
    howToVote: [
      "在每件作品的詳情頁點「投這件當人氣王」",
      "進入 Google 表單後，選擇最想支持的作品並留下回饋",
      "需登入 Google 帳號，每個帳號限填一次",
    ],
    duringPeriod: "投票期間不公開即時排行與票數，避免從眾與拉票影響結果",
    privacy: [
      "投票回覆與建議由主辦整理後供作者學習使用",
      "公開頁只呈現作品代號、作品內容與整理後的統計結果",
      "請勿在回饋文字中填寫姓名、班級、座號、學號或聯絡方式",
    ],
    antiFraud: {
      title: "🛡️ 公平性規則",
      layers: [
        "Google 表單限制每個帳號只能填答一次",
        "投票期間不公開排行，降低跟風投票與拉票壓力",
        "截止後主辦會檢查異常回覆，必要時保留排除異常票的權利",
        "觀眾票只決定人氣類獎項，其他獎項由內部評鑑與評審決定",
      ],
    },
  },
};
