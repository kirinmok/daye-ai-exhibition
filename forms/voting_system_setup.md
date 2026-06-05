# 投票與抽獎表單建立流程

本流程會建立兩份 Google Forms：

- Form A「匿名投票」：作品代號、人氣票、五項評分、喜歡的地方、建議。
- Form B「抽獎登記」：Email、班級座號、抽獎確認；與投票內容脫鉤。

目前採用「每位觀眾限投 1 件最想支持的作品」作為社團課測試版。

## 1. 建立表單

1. 開啟 https://script.google.com/
2. 建立新專案。
3. 貼上 `forms/create_voting_system.gs`。
4. 執行 `createVotingSystem()`。
5. 授權後，到「執行紀錄」複製：
   - Form A 投票表單編輯網址
   - Form A 投票表單填答網址
   - Form A 回覆試算表
   - Form B 抽獎登記填答網址

## 2. 檢查 Form A 投票設定

請到 Google Form 編輯畫面確認：

- 需登入 Google 帳號。
- 每人限填一次。
- 不收集回覆者 Email。
- 作品代號題目是 G01 至 G20 下拉選單。
- 題目欄位名稱如下：
  - `作品代號`
  - `人氣票`
  - `創意`
  - `美術風格`
  - `遊戲性`
  - `操作流暢度`
  - `完成度`
  - `最喜歡的地方`
  - `建議改進`

網站 CSV 解析已支援以上中文欄位。

## 3. 發布 Sheet CSV

1. 開啟 Form A 回覆試算表。
2. 確認試算表不要包含姓名、Email、班級、座號、學號。
3. 選「檔案」→「共用」→「發布到網路」。
4. 選目前回應工作表。
5. 格式選 CSV。
6. 複製 CSV URL。

## 4. 填入網站設定

打開 `site/site-config.js`：

```js
results: {
  csvUrl: "貼上 Form A 回覆試算表 CSV URL",
  refreshSeconds: 60,
  publicRankingsOpen: false
}
```

投票期間維持：

```js
publicRankingsOpen: false
```

投票截止、完成檢查後，改成：

```js
publicRankingsOpen: true
```

## 5. 連接投票按鈕

若要讓作品詳情頁按鈕開啟 Form A：

```js
voting: {
  enabled: true,
  formUrl: "貼上 Form A 填答網址",
  gameParamName: "",
  prototypeVotingEnabled: false
}
```

若沒有 Google Form 預填 entry id，`gameParamName` 先留空，讓學生在表單內自行選作品代號。

## 6. 注意

- Form A CSV 是公開資料，不可含個資。
- Form B 抽獎資料不可發布為 CSV，也不要 commit 到 GitHub。
- 目前採「每人投 1 件最愛」為預設；若 KIRIN 改成「每人每天 1 票」或「每人可評全部作品」，Google Forms 內建限制不夠用，需要改 Apps Script Web App / Firebase / Supabase。

## 7. 今天社團課測試建議

1. 老師先用自己的帳號建立兩份表單。
2. 先找 2-3 位學生試填 Form A。
3. 開 Form A 回覆試算表，確認沒有 Email、姓名、班級座號。
4. 發布 CSV 並貼回網站。
5. 網站投票期間保持 `publicRankingsOpen: false`。
6. 確認網站只顯示總投票人次，不公開排名。
