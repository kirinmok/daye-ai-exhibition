# 大業 AI 程式設計成果展

公開展示用 GitHub Pages 網站。內容只放成果展首頁、學生遊戲檔與公開展示素材。

學生作品展示以匿名作品代號呈現，不公開學生真名、班級、座號或學號。

## 管理後台

- 入口：`/#admin`
- 管理碼位於前端 `app.js`，僅適合校內臨時管理原型。
- 修改封面與文字會存在目前瀏覽器的 `localStorage`。
- 若要多人共用正式後台，需改接 Supabase / Firebase / Google Sheets Apps Script。

## 投票結果串接

- `site-config.js` 的 `results.csvUrl` 可填入 Google Sheet 發布後的 CSV URL。
- `results.publicRankingsOpen: false` 時，投票期間只顯示總票數。
- 截止後可改為 `true` 公開排行與雷達圖。
- 公開 CSV 不可含姓名、Email、班級、座號、學號。

更多企劃與部署文件在 `docs/`。
