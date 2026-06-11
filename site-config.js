window.SITE_CONFIG = {
  clubName: "大業 AI 繪圖社",
  voting: {
    enabled: true,
    // 內部投票記票端點（保留，作為總票數計數）
    apiUrl: "https://script.google.com/macros/s/AKfycbxgCO77XBbXkPfdkc-boGKkES2MmPfifbcn5Dmo_7ByQKHcp5z9a9I6jeGjhv8VzBnVmQ/exec",
    // ⚠️ 觀眾投票表單 URL（KIRIN 跑完 buildAudienceForm 後換成新的）
    // 目前為內部評鑑 Form，會換成「觀眾簡易版」
    formUrl: "https://forms.gle/h2qQVxy3JyWyyh4x8",
    gameParamName: "",
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
    csvUrl: "https://docs.google.com/spreadsheets/d/1r61IuxeCxEE8VNvw_ArUzbsmusc2Vhf4_evi6NGZs_E/gviz/tq?tqx=out:csv&gid=731019646",
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
    purpose: "讓親師生用 30 秒選出心目中最棒的作品，幫每位作者收到一份「被看見」的禮物。",
    period: "2026/6/15（一）~ 6/19（五）23:59",
    publishAt: "2026/6/20（六）早上 9:00",
    howToVote: [
      "在每件作品的詳情頁點「投這件當人氣王」",
      "跳到 30 秒簡易表單 → 選最愛 + 一句話",
      "一個 Gmail 帳號只能投一次（防灌票）",
    ],
    duringPeriod: "投票期間只顯示已收到票數，不公開排行 — 避免從眾、避免拉票影響結果",
    privacy: [
      "學生填寫的優化建議僅內部供作者學習使用，不對外公開",
      "觀眾的「一句話」會經主辦審核才上「精選好評牆」",
      "任何負面評論不公開",
    ],
    antiFraud: {
      title: "🛡️ 五層防灌票",
      layers: [
        "Layer 1：localStorage + 裝置指紋 + Gmail 帳號鎖（三重）",
        "Layer 2：Form 強制 Google 登入，投完不顯示票數變化（灌完沒爽感）",
        "Layer 3：後端 logging（IP + UA + 時間戳）偵測異常",
        "Layer 4：截止後審計 — 主辦保留刪除異常票權利",
        "Layer 5：設計層 — 14 獎只有 3 個是觀眾票決定，灌爆也只能搶人氣獎",
      ],
    },
  },
};
