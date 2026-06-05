# 踩坑紀錄：後台雙封面上傳無法儲存

日期：2026-06-05  
專案：大業 AI 繪圖社期末成果展  
事件範圍：Admin 後台、作品封面、GitHub Pages 部署

## 結論

這次真正的問題不是單純「儲存按鈕壞掉」，而是靜態 GitHub Pages 後台本來就不能直接寫回網站檔案。後台原型只能把修改暫存在目前瀏覽器的 `localStorage`，當一次上傳 16:9 與 2:3 兩張高解析 PNG 時，圖片會被轉成很大的 base64 字串，容易超過瀏覽器本機儲存容量，造成按下儲存後沒有成功。

最後採用兩層修法：

- 後台上傳圖片前先壓縮成適合網頁顯示的 JPEG，再存進 `localStorage`，並加入明確錯誤訊息。
- 對於要正式公開給全校看的作品封面，不走後台暫存，而是直接放進 repo 的 `assets/games/<作品代號或短名>/`，更新 `works.js`，改 cache version，commit/push 到 GitHub Pages。

## 事情始末

1. 已先完成網站支援雙封面：橫式 16:9 與直式 2:3。
2. 使用者在後台上傳兩張圖後，按「儲存修改」無法完成。
3. 初步判斷原因是瀏覽器本機儲存爆量，因為原本程式會直接用 `FileReader.readAsDataURL()` 把原圖轉 base64 存進 `localStorage`。
4. 修正後台邏輯：上傳前用 `Image + canvas` 壓縮尺寸與品質。
5. 測試時發現另一個干擾因素：管理碼設定前後曾變動，造成登入測試誤判；最後依最新決定維持中性管理碼，不在文件中記錄私人密碼。
6. 使用者提供 G02「風味抉擇：漢堡帝國」兩張正式封面，決定不走後台，而是直接上架到網站資產。
7. 新增檔案：
   - `assets/games/burger-empire/cover-16x9.png`
   - `assets/games/burger-empire/cover-2x3.png`
8. 更新 `works.js`，讓 G02 讀取這兩張正式封面。
9. 更新 `index.html` cache version，避免瀏覽器繼續吃舊版 JS / 作品資料。
10. 第一次 `git push` 出現 HTTP 408，遠端沒有更新。
11. 第二次 `git push` 等待較久後成功。
12. 用公開網址驗證：
   - GitHub Pages 首頁已讀到新 cache version。
   - 公開 `works.js` 已含 `burger-empire` 封面路徑。
   - 兩張封面圖片 URL 都回 `HTTP 200`。

## 根本原因

### 1. 靜態網站後台不能真正寫檔

GitHub Pages 是靜態網站，前端 JavaScript 不能安全地直接寫回 GitHub repo 或伺服器檔案。因此目前 Admin 後台只能做「本機預覽修改」，資料存在老師當下那台瀏覽器。

這代表：

- 老師在後台改圖，別人不會自動看到。
- 換電腦或清除瀏覽器資料，後台修改可能消失。
- 要正式上架公開版，仍需更新 repo 檔案並部署。

### 2. base64 圖片比原圖更占空間

原本後台直接把圖片轉成 base64 存入 `localStorage`。base64 通常會比原始二進位圖片更大，兩張高解析 PNG 很容易超過瀏覽器限制。

### 3. 錯誤沒有被明確顯示

儲存失敗時，使用者只看到「不能存」，但不知道是容量爆掉、圖片讀取失敗，還是程式錯誤。這會讓排查方向變模糊。

### 4. cache version 沒更新會造成「其實修了但畫面還舊」

GitHub Pages 與瀏覽器會快取 JS/CSS。如果 `index.html` 引用的 `app.js?v=...`、`works.js?v=...` 沒換版本，使用者可能繼續看到舊程式。

### 5. Git push 顯示訊息容易誤導

第一次 push 出現 `HTTP 408`，同時又出現 `Everything up-to-date`，但實際查遠端 main 後，GitHub 並沒有收到新 commit。以後不能只看最後一句，要用 `git ls-remote` 或公開頁內容驗證。

### 6. 把 16:9 與 2:3 同時放在詳情頁，是展示邏輯錯誤

後續檢查發現，詳情頁曾把橫式封面與盒裝封面並排顯示。這是錯的，因為使用者進作品詳情時期待看到一張正式主視覺，不是看到素材規格比對。

更糟的是，原本 `.detail-cover` 使用固定高度加 `background-size: cover`，即使圖片本身是 16:9，也會因為容器比例不準而裁切圖片文字。

修正原則：

- Browse 卡片：可用縮圖式 `cover`，重點是瀏覽效率。
- Detail 頁：只顯示 16:9 主視覺。
- 2:3 盒裝圖：保留在資料與後台中，不放在 Detail 主視覺旁邊。
- Detail 主視覺容器固定 `aspect-ratio: 16 / 9`。
- Detail 有封面圖時用 `background-size: contain`，避免圖片文字被裁掉。

## 已完成修正

### 後台上傳修正

位置：`site/app.js` 與 public repo `app.js`

修正方向：

- 儲存前顯示「正在處理圖片...」。
- 儲存中停用 submit button，避免連點。
- 16:9 封面壓到最多 `1280x720`。
- 2:3 盒裝封面壓到最多 `900x1350`。
- 用 JPEG 品質參數減少 localStorage 壓力。
- 捕捉 `QuotaExceededError`，顯示本機儲存空間已滿的提示。

### G02 正式封面上架

位置：

- `assets/games/burger-empire/cover-16x9.png`
- `assets/games/burger-empire/cover-2x3.png`
- `works.js`

公開頁已驗證：

- G02 卡片使用橫式封面。
- G02 資料保留橫式封面與直式盒裝封面。
- GitHub Pages 已部署到 commit `41a7477`。

### 詳情頁封面比例修正

位置：

- `app.js`
- `styles.css`
- `index.html`

修正方向：

- 移除 Detail 頁的 `boxCover` 並排展示。
- Detail 頁主封面固定 16:9。
- Detail 頁主封面使用 `background-size: contain`，避免圖中文字被裁掉。
- 更新 cache version，避免瀏覽器繼續讀舊版雙圖版面。

驗證方式：

- G02 / G07 / G08 / G10 的 Detail 頁都只剩一張主封面。
- `.box-cover` 數量為 `0`。
- `.detail-cover` 顯示比例約為 `1.778`，符合 16:9。

## 未來避免方式

### 老師要正式上架封面時

不要依賴 Admin 後台直接改公開網站。正式流程應該是：

1. 建立作品資產資料夾：
   - `assets/games/<game-slug>/`
2. 放入：
   - `cover-16x9.png`
   - `cover-2x3.png`
3. 更新 `works.js`：
   - `cover`
   - `boxCover`
4. 更新 `index.html` cache version。
5. 本機檢查 Browse 與 Detail，Detail 頁只應出現一張 16:9 主封面。
6. commit。
7. push。
8. 用公開 URL 驗證。

### Admin 後台適合做什麼

適合：

- 臨時預覽作品名稱、介紹、分類。
- 測試封面大概效果。
- 匯出修改資料，交給維護者正式寫入 repo。

不適合：

- 當成正式資料庫。
- 當成真正可同步的後台。
- 儲存大量高解析原圖。

### 封面檔案建議

學生繳交規格：

- 橫式封面：16:9，建議 `1920x1080`。
- 盒裝封面：2:3，建議 `1200x1800`。

正式上架時建議：

- 若圖片超過 3MB，先壓縮。
- 網站卡片圖可壓到 `1280x720` 或 `1600x900`。
- 盒裝圖可壓到 `900x1350` 或 `1200x1800`。
- 檔名使用英文、數字、短橫線，避免中文檔名與空白。

### 每次部署後的驗證清單

- [ ] `node --check app.js`
- [ ] `git diff --check`
- [ ] `git status --short` 確認沒有漏檔。
- [ ] 本機 Browse 能看到新封面。
- [ ] 本機 Detail 能看到橫式與直式封面。
- [ ] `git push` 後用 `git ls-remote origin refs/heads/main` 確認遠端 commit。
- [ ] 公開 `index.html` 已含新 cache version。
- [ ] 公開 `works.js` 已含新作品資料。
- [ ] 公開圖片網址回 `HTTP 200`。

## 決策紀錄

- 後台仍保留，但定位為「靜態後台原型」與「本機預覽工具」。
- 正式公開的封面與作品資料，仍以 repo 內檔案為準。
- 不在文件中記錄私人密碼或學生個資。
- 對外展示頁不顯示班級、座號、學生姓名，只顯示作品代號與作品內容。

## 下次遇到相同狀況時先問的三個問題

1. 這次修改是「本機預覽」還是「要正式公開」？
2. 圖片是要暫存在後台，還是要放入 repo 資產資料夾？
3. 公開頁看不到更新時，是資料沒改、沒有 push、GitHub Pages 還沒部署，還是 cache version 沒換？
