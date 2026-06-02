const gallery = document.querySelector("#gallery");
const heroCover = document.querySelector("#heroCover");
const heroShelf = document.querySelector("#heroShelf");
const heroLetters = document.querySelector("#heroLetters");
const heroMeta = document.querySelector("#heroMeta");
const heroTitle = document.querySelector("#heroTitle");
const heroTagline = document.querySelector("#heroTagline");
const heroDescription = document.querySelector("#heroDescription");
const heroLaunch = document.querySelector("#heroLaunch");
const totalCount = document.querySelector("#totalCount");
const playableCount = document.querySelector("#playableCount");
const clubLogoLink = document.querySelector("#clubLogoLink");
const clubLogo = document.querySelector("#clubLogo");
const clubName = document.querySelector("#clubName");

let works = WORKS;
let selectedIndex = 0;

const CATEGORY_ORDER = ["動作與反應", "經營策略", "射擊與戰鬥", "永續環境"];
const CATEGORY_COPY = {
  動作與反應: "短局高張力，最適合現場一玩就上手。",
  經營策略: "把選擇變成資源，把直覺變成勝負。",
  射擊與戰鬥: "音效、瞄準與臨場壓力一起上桌。",
  永續環境: "用遊戲做決策，看見環境與城市的取捨。",
};

function cleanDisplayTitle(title, fallback = "未命名遊戲") {
  const cleaned = String(title || "")
    .replace(/^\s*\d{3}-\d{1,3}\s*/u, "")
    .replace(/原創遊戲/gu, "")
    .trim();
  return cleaned || fallback;
}

function getCategory(work) {
  return work.category || work.genre || "其他作品";
}

function initSiteBranding() {
  const config = window.SITE_CONFIG || {};
  const logoSrc = config.clubLogoSrc || "./assets/daye-ai-art-club-logo.jpg";
  const logoHref = config.clubLogoHref || "./";
  const logoAlt = config.clubLogoAlt || config.clubName || "大業 AI 繪圖社";

  clubName.textContent = config.clubName || "DAYE AI EXHIBITION";
  clubLogo.alt = logoAlt;
  clubLogo.src = logoSrc;
  clubLogoLink.href = logoHref;
  clubLogoLink.title = `${logoAlt} - 開啟連結`;

  clubLogo.addEventListener("error", () => {
    clubLogoLink.classList.add("is-missing");
    clubLogo.removeAttribute("src");
  });
}

function setSelected(index, shouldFocus = false) {
  selectedIndex = (index + works.length) % works.length;
  const work = works[selectedIndex];

  heroCover.className = `hero-cover ${work.coverTone}`;
  heroCover.style.backgroundImage = work.coverWideUrl ? `url("${work.coverWideUrl}")` : "";
  heroCover.classList.toggle("has-image", Boolean(work.coverWideUrl));
  heroShelf.textContent = work.statusLabel;
  heroLetters.textContent = work.coverLetters;
  heroLetters.hidden = Boolean(work.coverWideUrl);
  heroMeta.textContent = `${work.genre} · ${work.statusLabel}`;
  heroTitle.textContent = cleanDisplayTitle(work.title);
  heroTagline.textContent = work.hook || work.tagline;
  heroDescription.textContent = work.description;
  heroLaunch.textContent = work.launchUrl ? "開始" : "準備中";
  heroLaunch.classList.toggle("is-disabled", !work.launchUrl);
  if (work.launchUrl) {
    heroLaunch.href = work.launchUrl;
  } else {
    heroLaunch.removeAttribute("href");
  }

  document.querySelectorAll(".game-tile").forEach((tile, tileIndex) => {
    tile.classList.toggle("is-selected", tileIndex === selectedIndex);
    tile.setAttribute("aria-selected", String(tileIndex === selectedIndex));
  });

  if (shouldFocus) {
    document.querySelectorAll(".game-tile")[selectedIndex]?.focus();
  }
}

function renderGames() {
  totalCount.textContent = works.length;
  playableCount.textContent = works.filter((work) => work.launchUrl).length;

  gallery.innerHTML = "";
  const groups = new Map();
  works.forEach((work, index) => {
    const category = getCategory(work);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push({ work, index });
  });

  const orderedCategories = [
    ...CATEGORY_ORDER.filter((category) => groups.has(category)),
    ...Array.from(groups.keys()).filter((category) => !CATEGORY_ORDER.includes(category)),
  ];

  orderedCategories.forEach((category) => {
    const section = document.createElement("section");
    section.className = `category-section ${getCategoryClass(category)}`;
    section.innerHTML = `
      <div class="category-heading">
        <h3>${category}</h3>
        <p>${CATEGORY_COPY[category] || "探索不同玩法，找到你想投票支持的作品。"}</p>
      </div>
      <div class="category-grid"></div>
    `;

    const categoryGrid = section.querySelector(".category-grid");
    groups.get(category).forEach(({ work, index }) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = `game-tile ${work.coverTone}`;
      tile.style.backgroundImage = work.coverWideUrl ? `url("${work.coverWideUrl}")` : "";
      tile.classList.toggle("has-image", Boolean(work.coverWideUrl));
      tile.setAttribute("aria-selected", "false");
      tile.innerHTML = `
        <span>${work.statusLabel}</span>
        <strong>${cleanDisplayTitle(work.title)}</strong>
        <em>${work.hook || work.tagline || work.genre}</em>
      `;
      tile.addEventListener("click", () => setSelected(index));
      if (work.launchUrl) {
        tile.addEventListener("dblclick", () => {
          window.location.href = work.launchUrl;
        });
      }
      categoryGrid.appendChild(tile);
    });
    gallery.appendChild(section);
  });

  setSelected(0);
}

function getCategoryClass(category) {
  return {
    動作與反應: "category-action",
    經營策略: "category-strategy",
    射擊與戰鬥: "category-combat",
    永續環境: "category-eco",
  }[category] || "category-other";
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    event.preventDefault();
    setSelected(selectedIndex + 1, true);
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    setSelected(selectedIndex - 1, true);
  }
  if (event.key === "Enter") {
    const launchUrl = works[selectedIndex].launchUrl;
    if (launchUrl) window.location.href = launchUrl;
  }
});

async function loadSubmittedWorks() {
  try {
    const response = await fetch("./data/submissions.json", { cache: "no-store" });
    if (!response.ok) return;
    const submissions = await response.json();
    if (!Array.isArray(submissions) || submissions.length === 0) return;

    const byCode = new Map(WORKS.map((work) => [work.code, work]));
    submissions.forEach((submission) => {
      if (!submission || !submission.code) return;
      const existing = byCode.get(submission.code) || {};
      const title = cleanDisplayTitle(submission.title || existing.title || submission.code);
      byCode.set(submission.code, {
        ...existing,
        ...submission,
        title,
        category: submission.category || existing.category || "其他作品",
        hook: submission.hook || existing.hook || submission.tagline || existing.tagline,
        status: submission.status || existing.status || "published",
        statusLabel: submission.statusLabel || existing.statusLabel || "上架中",
        shelfLabel: submission.shelfLabel || existing.shelfLabel || "PLAY",
        coverLetters: submission.coverLetters || existing.coverLetters || title,
        coverTone: submission.coverTone || existing.coverTone || "tone-sky",
      });
    });
    works = Array.from(byCode.values());
  } catch (error) {
    console.warn("No submitted works loaded.", error);
  }
}

initSiteBranding();
loadSubmittedWorks().finally(renderGames);
