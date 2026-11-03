/* 大業 AI 繪圖社成果展｜離線快取 Service Worker
 * 目的：戶外用手機熱點時，就算訊號不穩，已開過一次的頁面與遊戲仍能載入。
 * 策略：
 *   - 頁面（HTML）：先網路、5 秒沒回應或離線就用快取（確保更新能進來，但斷線也能開）
 *   - 本站靜態檔（js/css/圖/音效）：先快取、背景更新
 *   - 外部 CDN（unpkg、cdnjs、tailwind、gstatic、esm.sh、Google Fonts）：先快取、沒有才抓網路
 *   - 其他（Google 表單、投票 API、非 GET）：不碰
 * 改版時把 VERSION 改掉，舊快取會自動清除；index.html 裡的 ?v= 參數也一起改，靜態檔才會重新抓。
 */
const VERSION = "daye-exh-2026-11-03f";
const CACHE = `${VERSION}`;
const SCOPE_PATH = new URL(self.registration.scope).pathname; // e.g. /daye-ai-exhibition/

// 展前「預熱」會把這些先抓進來（在 install 階段，逐一嘗試，失敗不影響安裝）
const CORE = [
  "index.html", "app.js", "works.js", "site-config.js", "styles.css",
  "assets/daye-ai-art-club-logo.png", "assets/hero/hero-2026.jpg", "assets/hero/about-2026.jpg", "assets/hero/awards-2026.jpg",
  // 作品封面（瀏覽頁離線也看得到）
  "assets/games/bazhang-eco-battle/cover-2x3.jpg",
  "assets/games/bazhang-eco-battle/cover-4x3.jpg",
  "assets/games/bazhang-parkour/cover-16x9.jpg",
  "assets/games/bazhang-parkour/cover-2x3.jpg",
  "assets/games/burger-empire/cover-16x9.jpg",
  "assets/games/burger-empire/cover-2x3.jpg",
  "assets/games/chiayi-food-tycoon/cover-16x9.jpg",
  "assets/games/chiayi-food-tycoon/cover-2x3.jpg",
  "assets/games/dark-cell/cover-16x9.jpg",
  "assets/games/dark-cell/cover-2x3.jpg",
  "assets/games/eco-defenders/cover-16x9.jpg",
  "assets/games/greedy-star/cover-16x9.jpg",
  "assets/games/gunfight/cover-16x9.jpg",
  "assets/games/happy-house-3d/cover-4x3.jpg",
  "assets/games/kirin-racing/cover-16x9.jpg",
  "assets/games/kirin-racing/cover-2x3.jpg",
  "assets/games/micro-dead-zone/cover-4x3.jpg",
  "assets/games/neon-star-assault/cover-16x9.jpg",
  "assets/games/neon-star-rebirth-30/cover-16x9.jpg",
  "assets/games/neon-star-rebirth-30/cover-2x3.jpg",
  "assets/games/sdg-fps/cover-16x9.jpg",
  "assets/games/sdg-fps/cover-2x3.jpg",
  "assets/games/sdg/cover-16x9.jpg",
  "assets/games/survival-arena/cover-16x9.jpg",
  "assets/games/survival-arena/cover-2x3.jpg",
];
// 📱 平板可玩的 7 款（iPad 展示主力）＋ 其餘上架作品
const GAME_PAGES = [
  "games/701-04/index.html", "games/801-01/index.html", "games/804-14/index.html", "games/sdg/index.html",
  "games/neon-star-assault/index.html", "games/neon-star-rebirth-30/index.html", "games/greedy-star/index.html",
  "games/701-016/index.html", "games/804-02/index.html", "games/904-07/index.html", "games/eco-defenders/index.html",
  "games/micro-dead-zone/index.html", "games/901-05/index.html", "games/survival-arena/index.html",
  "games/kirin-racing/index.html", "games/kirin-racing/joystick.js",
];
// 7 款平板遊戲用到的外部套件（固定版本，可長期快取）
const CDN_PRECACHE = [
  "https://cdn.tailwindcss.com",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/lucide-react@0.468.0/dist/umd/lucide-react.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js",
  "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js",
];
const CDN_HOSTS = ["cdn.tailwindcss.com", "unpkg.com", "cdnjs.cloudflare.com", "cdn.jsdelivr.net", "www.gstatic.com", "esm.sh", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const urls = [...CORE, ...GAME_PAGES].map((p) => SCOPE_PATH + p).concat(CDN_PRECACHE);
    await Promise.all(urls.map(async (url) => {
      try {
        const req = new Request(url, { mode: url.startsWith("http") && !url.startsWith(self.location.origin) ? "cors" : "same-origin", cache: "reload" });
        let res = await fetch(req).catch(() => null);
        if (!res || (!res.ok && res.type !== "opaque")) {
          // 有些 CDN 不給 CORS，就用 no-cors 存 opaque 版本
          res = await fetch(new Request(url, { mode: "no-cors", cache: "reload" })).catch(() => null);
        }
        if (res && (res.ok || res.type === "opaque")) await cache.put(url, res);
      } catch (_) { /* 單一檔案失敗不影響安裝 */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("daye-exh-") && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isCacheable(res) { return !!res && (res.ok || res.type === "opaque"); }

async function networkFirst(req, timeoutMs) {
  const cache = await caches.open(CACHE);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), timeoutMs)),
    ]);
    if (isCacheable(res)) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (_) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    // 導航失敗且沒快取：退回首頁快取（至少有畫面）
    if (req.mode === "navigate") { const home = await cache.match(SCOPE_PATH + "index.html"); if (home) return home; }
    throw _;
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  // 精確比對（含 ?v= 參數）：改版時只要換版本參數就一定抓新檔，不會吐舊快取
  const hit = await cache.match(req);
  const fetching = fetch(req).then((res) => { if (isCacheable(res)) cache.put(req, res.clone()).catch(() => {}); return res; }).catch(() => null);
  return hit || (await fetching) || Response.error();
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreSearch: false });
  if (hit) return hit;
  const res = await fetch(req).catch(() => null);
  if (isCacheable(res)) cache.put(req, res.clone()).catch(() => {});
  return res || Response.error();
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.headers.has("range")) return; // 音訊 range 請求交給瀏覽器
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && !url.pathname.startsWith(SCOPE_PATH)) return;

  if (req.mode === "navigate") { event.respondWith(networkFirst(req, 5000)); return; }
  if (sameOrigin) { event.respondWith(staleWhileRevalidate(req)); return; }
  if (CDN_HOSTS.includes(url.hostname)) { event.respondWith(cacheFirst(req)); return; }
  // 其他跨網域（Google 表單、投票 API 等）不攔
});

// 讓頁面能問快取狀態（檢查清單用）
self.addEventListener("message", (event) => {
  if (event.data === "daye:status") {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE); const keys = await cache.keys();
      event.source && event.source.postMessage({ type: "daye:status", version: VERSION, cached: keys.length });
    })());
  }
});
