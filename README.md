# 大業 AI 繪圖社期末成果展

公開展示用 GitHub Pages 網站。內容只放成果展首頁、學生遊戲檔、公開展示素材與不含個資的操作文件。

學生作品展示以匿名作品代號呈現，不公開學生真名、班級、座號或學號。

## 管理後台

- 入口：`/#admin`
- 管理碼位於前端 `app.js`，僅適合校內臨時管理原型。
- 修改封面與文字會存在目前瀏覽器的 `localStorage`。
- 若要多人共用正式後台，需改接 Supabase / Firebase / Google Sheets Apps Script。

## 表單決策

正式投票與抽獎採兩份表單：

- Form A「投票」：匿名，只記作品代號、評分與建議。
- Form B「抽獎登記」：收集抽獎聯絡資訊，與投票內容脫鉤。

投票表單應設定：

- 需登入學校 Google Workspace 帳號。
- 每人限填一次。
- 不收集回覆者 Email。
- 作品代號使用 G01 至 G20 下拉選單。

尚待 KIRIN 最終決定：一人只能投 1 件、可評全部作品，或選 3 件最愛。

## 投票結果串接

- `site-config.js` 的 `results.csvUrl` 可填入 Google Sheet 發布後的 CSV URL。
- `results.publicRankingsOpen: false` 時，投票期間只顯示總票數。
- 截止後可改為 `true` 公開排行與雷達圖。
- 公開 CSV 不可含姓名、Email、班級、座號、學號。

## 文件

- `docs/form_decisions.md`：表單固定決策清單。
- `docs/google_forms_results_setup.md`：Google Forms / Sheets CSV 串接說明。
- `docs/event_plan_template.md`：成果展企劃補完模板。
- `docs/deployment_checklist.md`：GitHub Pages 與表單部署檢查清單。
