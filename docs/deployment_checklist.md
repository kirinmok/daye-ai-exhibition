# GitHub Pages 部署檢查清單

## GitHub Pages

- [ ] Repository 是 public，或 GitHub Pages 設定允許公開。
- [ ] Pages source 指向 `main` branch。
- [ ] 網站可開啟：https://kirinmok.github.io/daye-ai-exhibition/
- [ ] 手機版 Home、Browse、Detail、Results、About、Admin 都可正常瀏覽。

## Google Forms

- [ ] 投票表單設定「需登入 Google 帳號」。
- [ ] 表單設定「限制每人填寫一次」。
- [ ] Forms 嵌入網址使用 `?embedded=true`。
- [ ] 抽獎聯絡資料使用獨立表單。
- [ ] 投票統計公開 CSV 不含姓名、Email、班級、座號、學號。

## Google Sheet CSV

- [ ] Sheet 已發布到網路。
- [ ] CSV URL 可在無登入狀態讀取。
- [ ] `site/site-config.js` 已填入 `results.csvUrl`。
- [ ] 投票期間 `publicRankingsOpen` 設為 `false`。
- [ ] 截止後再改為 `true` 公開排行。

## 網站分享

- [ ] 加上 favicon。
- [ ] 加上 Open Graph title、description、image。
- [ ] LINE / Facebook 分享預覽正常。
- [ ] QR code 可掃描進站。

## 安全與隱私

- [ ] GitHub repo 內沒有學生真名清單。
- [ ] repo 內沒有 API key、token、Firebase admin credential。
- [ ] 公開頁不顯示班級、座號、姓名、Email。
- [ ] 留言區提醒不要填個資。
- [ ] 企劃公告包含未成年與家長知情同意提醒。
