# 大業 AI 繪圖社期末成果展

校內遊戲成果展展示網站，用來瀏覽學生本學期完成的 AI 視覺與遊戲創作。前台只顯示作品代號與作品內容，不公開學生姓名、班級、座號或學號。

公開網址：

https://kirinmok.github.io/daye-ai-exhibition/

## 網站功能

- 活動首頁：成果展介紹、投票規則、抽獎與獎勵資訊。
- 活動說明：社團與參與方式。
- 作品瀏覽：搜尋、分類、排序與作品卡片。
- 作品詳情：封面、簡介、遊玩連結、QR code、投票入口、建議回饋。
- 投票結果：總票數、排行榜、分類統計、五維度雷達圖。
- 管理後台：靜態原型後台，供老師本機試改作品資料。

## 投票系統

正式投票採兩份 Google Forms：

- Form A「匿名投票」：需登入學校 Google 帳號，每人限填一次，不收集 Email，只記作品代號、五項評分與建議。
- Form B「抽獎登記」：收集抽獎聯絡資料，與投票內容脫鉤。

建立表單請使用：

```txt
forms/create_voting_system.gs
forms/voting_system_setup.md
```

Form A 回覆試算表發布為 CSV 後，填入 `site-config.js`：

```js
results: {
  csvUrl: "貼上 Form A 回覆試算表 CSV URL",
  refreshSeconds: 60,
  publicRankingsOpen: false,
  useMockVotes: false
}
```

投票期間建議維持 `publicRankingsOpen: false`，只顯示總投票狀態；截止並檢查資料後再改成 `true` 公開排行與雷達圖。

## 管理後台限制

`#admin` 是 GitHub Pages 靜態網站上的本機管理原型。它可以讓老師快速試改作品名稱、封面、文案、類型、標籤與連結，但修改只存在目前瀏覽器的 `localStorage`。

正式公開資料仍建議由 `works.js`、Google Sheets、Supabase 或 Firebase 管理。不要把學生個資、抽獎名單、API key 或任何密碼提交到 GitHub。

## 隱私原則

- 前台不顯示學生真實身份。
- Form A 投票 CSV 不可包含姓名、Email、班級、座號、學號。
- Form B 抽獎資料不可發布為公開 CSV。
- 留言送出前提醒觀眾不要填入個資。
