# 投票與抽獎表單建立流程

本流程會建立兩份 Google Forms：

- Form A「匿名投票」：作品代號、五項評分、喜歡的地方、建議。
- Form B「抽獎登記」：Email、班級座號、抽獎確認；與投票內容脫鉤。

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
- 題目欄位名稱保留英文：
  - `projectId`
  - `creativity`
  - `art`
  - `gameplay`
  - `smoothness`
  - `completeness`
  - `likedMost`
  - `suggestion`

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
- 目前採「每人投 1 件最愛」為預設；若 KIRIN 改成每人評全部作品，需要重做表單結構。
