# 大業 AI 繪圖社期末成果展

校內遊戲成果展展示網站，用來瀏覽學生本學期完成的 AI 視覺與遊戲創作。前台只顯示作品代號與作品內容，不公開學生姓名、班級、座號或學號。

公開網址：

https://kirinmok.github.io/daye-ai-exhibition/

## 網站功能

- 活動首頁：成果展介紹、投票規則與獎勵資訊。
- 活動說明：社團與參與方式。
- 作品瀏覽：搜尋、分類、排序與作品卡片。
- 作品詳情：封面、簡介、遊玩連結、投票入口、建議回饋。
- 投票結果：投票期間不公開即時票數與排行，截止後接上清理後的統計資料再公布。
- 管理後台：靜態原型後台，供老師本機試改作品資料。

## 投票系統

正式公開投票採 Google Form：

- 觀眾投票表單：需登入 Google 帳號，每個帳號限填一次，記錄作品代號、五項評分與建議。
- 公開網站不讀取原始回覆 CSV；投票截止後，請先移除 Email、姓名、班級、座號、學號等欄位，再接上整理後的統計資料。

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

投票期間建議維持 `publicRankingsOpen: false`，且不要填公開 CSV。截止並檢查資料後，再接上已清理欄位的 CSV 並改成 `true` 公開排行。

## 管理後台限制

`#admin` 是 GitHub Pages 靜態網站上的本機管理原型。它可以讓老師快速試改作品名稱、封面、文案、類型、標籤與連結，但修改只存在目前瀏覽器的 `localStorage`。

正式公開資料仍建議由 `works.js`、Google Sheets、Supabase 或 Firebase 管理。不要把學生個資、抽獎名單、API key 或任何密碼提交到 GitHub。

## 隱私原則

- 前台不顯示學生真實身份。
- 投票 CSV 若要公開讀取，不可包含姓名、Email、班級、座號、學號。
- 抽獎或聯絡資料不可發布為公開 CSV。
- 留言送出前提醒觀眾不要填入個資。
