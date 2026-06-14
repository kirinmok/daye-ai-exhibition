# Antigravity Hand-off · 嘉義水城重生局・水陸早餐車

> 給 Google Antigravity 接手：繼續做 v2 改造邏輯翻轉。
> v1 已完成 29 波改動，明天（2026-06-15）大業 AI 成果展展出。

## 一、檔案與線上連結

| 項目 | 路徑 / URL |
|---|---|
| 📁 主檔（單檔遊戲）| `games/kirin-racing/index.html`（4199 行）|
| 🎮 搖桿模組 | `games/kirin-racing/joystick.js`（217 行）|
| 💾 原始備份 | `games/kirin-racing/index.original.html` |
| 📜 v2 藍圖 | `games/kirin-racing/ROADMAP_v2_水城重構局.md` |
| 🐙 GitHub | https://github.com/kirinmok/daye-ai-exhibition |
| 🌐 線上版 | https://kirinmok.github.io/daye-ai-exhibition/games/kirin-racing/index.html |

## 二、技術棧

- **純 HTML + CSS + Vanilla JS**（無 build、無框架）
- **Three.js r128**（CDN 引入，3D 賽道 + 工坊預覽車）
- **Pico W WebSocket + PS2 手把整合**（KIRIN 自製韌體）
- 部署：GitHub Pages

## 三、v1 已完成（29 波）核心系統

| 系統 | 程式碼定位 |
|---|---|
| 開場 splash（七場景）| HTML `<div class="splash-scene">` × 7 |
| 五軸改裝工坊 | JS `GARAGE_AXES` 陣列 + `renderGarage()` |
| 3D 預覽車（Three.js）| JS `buildPreviewCar()` |
| 機構動畫（齒輪/輪子/電池）| JS `startGarageAnimate()` |
| 齒輪嚙合特寫（emoji+SVG）| HTML `#gearZoom` + JS `updateGearZoom()` |
| 對齊卡情境（卡內基領導）| JS `ALIGN_SCENARIOS` + `triggerAlignCard()` |
| 嘉義 8 地標賽道 | JS `SECTORS` + `updateSectorHud()` |
| 電力 SOH 鋰電池 | JS `drainBattery()` + `updateBatteryHud()` |
| 三軸結算 + 第一性原理對照 | JS `showResults()` + `buildFppSection()` |
| 「猜猜看」假設標記 | JS `showGuessModal()` + `garageGuess` |
| 預設車種 preset | JS `PRESETS` + `applyPreset()` |
| 車型寬窄高 / 輪子突出 | JS `bodyDims` + `wheelOuterOffsets` |
| 驅動方式 SVG 引擎圖解 | JS `GARAGE_AXES[2].options[*].figure` |

## 四、v2 待做：改造邏輯翻轉 ⭐⭐⭐

**KIRIN 核心反饋**：
> 「我覺得是遇到關卡，才升級配件，而非一開始就什麼東西都有。
> 這樣沒有改造的精神。我們應該是遇到困難時，出現一個畫面讓你選擇改造，
> 然後試試看材才知道。」

### v2 設計骨架

```
舊 v1：開場 → 工坊（全套五軸選擇）→ 賽道（一次跑完）
新 v2：開場 → 基本車 → 第一關（限定主題）→ 卡關 → 解鎖某軸改造 → 重試 → 過關
```

**關卡 × 解鎖配件**對應建議：
| 關卡 | 主題 | 卡關才解鎖的軸 |
|---|---|---|
| 1. 噴水池起跑 | 速度直線 | 🛞 輪胎類型（光頭 vs 越野）|
| 2. 文化路彎道 | 過彎 | 📏 軸距 + 車身比例 |
| 3. 秀泰地下道 | 淹水 | ⚙️ 驅動方式（FF/FR/AWD）|
| 4. 民生天橋 | 爬坡 | ⚡ 齒輪比 |
| 5. 終點馬拉松 | 續航 | 🔋 動力配置 + 鋰電池保養 |

### 關鍵 hook 點（給 Antigravity 找的）

1. `closeOpeningSplash()` → 改成不直接進工坊，而是進「徵召訓練第 1 關」
2. `showGarage()` → 改成 `showGarage(unlockedAxes)` 只顯示已解鎖軸
3. `garageChoice` 預設 → 從「全部中庸」改成「全部空 / 基礎款」
4. 新增：`unlockAxis(key)` + `localStorage` 存進度
5. 新增：每關結算頁加「💡 解鎖了一個改造軸」彈窗
6. `showResults()` 內加：若關卡未通過 → 提示去工坊改特定軸

## 五、git push 例外（重要）

CLAUDE.md 規定此 repo（`~/Documents/New project/daye-ai-exhibition-pages-public`）授權 push 到 main：
- ✅ 變動路徑：全 repo（含 `.github/`、`forms/`、`games/`、`assets/`、根目錄檔）
- ❌ 禁：`--force`、`--delete`、`--mirror`
- ✅ Push 前必跑：`git diff --check`、檢查未追蹤 > 5MB 大檔、確認 commit message 不為空

## 六、最後 10 個 commit（v1 收尾）

```
6a1f28a 第二十九波 — 右欄 2 欄 grid + 驅動方式 SVG 引擎圖解
32a519a 第二十八波 — 世界觀拉回 2026 現在進行式
6f15641 第二十七波 — 世界觀升級成水城重生局
c514cad 第二十六波 — 第一性原理「猜猜看」對照系統
666cde2 拿掉版面 max-width 黑邊
9b6516a 左欄卡片對齊修正 + 輪子突出內鑲變化
ecbd34b 拿掉車身招牌文字
da30bbf 車型差異誇張化
25b41c3 進場 reveal 動畫 + 配色升級成糕點誘人色
4717b9d 餐車甜點化女性友善（馬卡龍/草莓/巧克力）
```

---

**Antigravity 接手提示**：
1. `git clone https://github.com/kirinmok/daye-ai-exhibition`
2. 開 `games/kirin-racing/index.html` 在瀏覽器試玩 v1
3. 讀完本檔案的 v2 設計骨架
4. 從第四節「關鍵 hook 點」開始改

**KIRIN 真實需求**：「遇到困難才改造，試試看才知道」= 真正的 PBL + 第一性原理精神。
