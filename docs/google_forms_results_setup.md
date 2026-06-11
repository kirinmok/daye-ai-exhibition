# Google Forms 投票結果串接網站說明

## 已定案的表單策略

採用兩份表單：

- Form A「投票」：匿名，只記作品代號、評分與建議。
- Form B「抽獎登記」：可留 email、班級座號或領獎聯絡資料，與投票表單脫鉤。

Form A 不收集 Email，不公開個資。Form B 的資料不發布為 CSV，也不放進 GitHub。

## 推薦流程

1. 使用 `forms/create_voting_system.gs` 建立投票表單。
2. Forms 回應綁定 Google Sheet。
3. Google Sheet 只保留公開統計需要欄位，不放姓名、Email、班級、座號等個資。
4. Sheet 選擇「檔案」→「共用」→「發布到網路」。
5. 發布格式選 CSV。
6. 複製 CSV URL。
7. 貼到 `site/site-config.js` 的 `results.csvUrl`。

## 網站端設定

```js
window.SITE_CONFIG = {
  results: {
    csvUrl: "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv",
    refreshSeconds: 60,
    publicRankingsOpen: false,
    columns: {
      projectId: "projectId",
      likedMost: "likedMost",
      suggestion: "suggestion",
      creativity: "creativity",
      art: "art",
      gameplay: "gameplay",
      smoothness: "smoothness",
      completeness: "completeness",
      createdAt: "createdAt"
    }
  }
};
```

`publicRankingsOpen` 建議規則：

- `false`：投票期間只顯示總票數。
- `true`：投票截止後才顯示作品排行、雷達圖與分類統計。

## Google Form 欄位建議

Form A 投票表單必設：

- 需登入學校 Google Workspace 帳號。
- 每人限填一次。
- 不收集回覆者 Email。
- 作品代號下拉選單需依目前公開作品清單同步更新。

表單欄位可用英文欄名，網站最容易對接：

- `projectId`
- `likedMost`
- `suggestion`
- `creativity`
- `art`
- `gameplay`
- `smoothness`
- `completeness`
- `createdAt`

如果 Google Form 題目使用中文，網站也已支援下列常見別名：

- 作品代號 / 遊戲代號
- 最喜歡的地方
- 建議改進
- 創意
- 美術風格
- 遊戲性
- 操作流暢度
- 完成度
- 時間戳記

## Chart.js 長條圖 Demo

目前網站的 dashboard 已用原生 SVG 雷達圖與 HTML 統計卡呈現，不一定需要 Chart.js。若要另做 `result.html` 長條圖，可用：

```html
<canvas id="voteChart"></canvas>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
async function loadVotes() {
  const csvUrl = "PASTE_PUBLISHED_CSV_URL";
  const csv = await fetch(csvUrl, { cache: "no-store" }).then((res) => res.text());
  const rows = csv.trim().split("\n").slice(1).map((line) => line.split(","));
  const counts = {};
  rows.forEach((row) => {
    const projectId = row[0];
    counts[projectId] = (counts[projectId] || 0) + 1;
  });
  new Chart(document.getElementById("voteChart"), {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [{ label: "票數", data: Object.values(counts) }]
    }
  });
}
loadVotes();
</script>
```

正式版仍建議投票期間不要公開各作品票數，只公開總票數。

## 風險

- 發布 CSV 等於公開該試算表輸出，不可包含個資。
- 抽獎若需姓名或聯絡方式，請使用獨立表單，不要跟公開統計資料混在一起。
- 若要真正防作弊，Forms 要開啟「需登入 Google 帳號」與「限制每人填寫一次」。
- 「一人可投幾件作品」尚待 KIRIN 最終定案；定案前不要鎖死表單結構。
