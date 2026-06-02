const gallery = document.querySelector("#gallery");
const heroCover = document.querySelector("#heroCover");
const heroShelf = document.querySelector("#heroShelf");
const heroLetters = document.querySelector("#heroLetters");
const heroMeta = document.querySelector("#heroMeta");
const heroTitle = document.querySelector("#heroTitle");
const heroTagline = document.querySelector("#heroTagline");
const heroDescription = document.querySelector("#heroDescription");
const heroLaunch = document.querySelector("#heroLaunch");
const heroPreview = document.querySelector("#heroPreview");
const dialog = document.querySelector("#previewDialog");
const frame = document.querySelector("#previewFrame");
const closePreview = document.querySelector("#closePreview");
const previewTitle = document.querySelector("#previewTitle");
const previewOwner = document.querySelector("#previewOwner");
const previewOpen = document.querySelector("#previewOpen");
const totalCount = document.querySelector("#totalCount");
const playableCount = document.querySelector("#playableCount");
const clubLogoLink = document.querySelector("#clubLogoLink");
const clubLogo = document.querySelector("#clubLogo");
const clubName = document.querySelector("#clubName");

let works = WORKS;
let selectedIndex = 0;

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
  heroShelf.textContent = work.shelfLabel;
  heroLetters.textContent = work.coverLetters;
  heroLetters.hidden = Boolean(work.coverWideUrl);
  heroMeta.textContent = `${work.code} · ${work.genre} · ${work.statusLabel}`;
  heroTitle.textContent = work.title;
  heroTagline.textContent = work.tagline;
  heroDescription.textContent = work.description;
  heroLaunch.textContent = work.launchUrl ? "開始" : "準備中";
  heroLaunch.classList.toggle("is-disabled", !work.launchUrl);
  if (work.launchUrl) {
    heroLaunch.href = work.launchUrl;
  } else {
    heroLaunch.removeAttribute("href");
  }
  heroPreview.onclick = () => openPreview(work);
  heroPreview.disabled = !work.launchUrl;

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
  works.forEach((work, index) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = `game-tile ${work.coverTone}`;
    tile.style.backgroundImage = work.coverWideUrl ? `url("${work.coverWideUrl}")` : "";
    tile.classList.toggle("has-image", Boolean(work.coverWideUrl));
    tile.setAttribute("aria-selected", "false");
    tile.innerHTML = `
      <span>${work.shelfLabel}</span>
      <strong ${work.coverWideUrl ? "hidden" : ""}>${work.coverLetters}</strong>
      <em>${work.title}</em>
    `;
    tile.addEventListener("click", () => setSelected(index));
    if (work.launchUrl) {
      tile.addEventListener("dblclick", () => {
        window.location.href = work.launchUrl;
      });
    }
    gallery.appendChild(tile);
  });

  setSelected(0);
}

function openPreview(work) {
  previewTitle.textContent = work.title;
  previewOwner.textContent = work.genre;
  previewOpen.href = work.launchUrl;
  frame.src = work.launchUrl;
  dialog.showModal();
}

function hidePreview() {
  frame.src = "about:blank";
  dialog.close();
}

window.addEventListener("keydown", (event) => {
  if (dialog.open) return;
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

closePreview.addEventListener("click", hidePreview);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) hidePreview();
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
      byCode.set(submission.code, {
        ...existing,
        ...submission,
        status: submission.status || existing.status || "published",
        statusLabel: submission.statusLabel || existing.statusLabel || "上架中",
        shelfLabel: submission.shelfLabel || existing.shelfLabel || "PLAY",
        coverLetters: submission.coverLetters || existing.coverLetters || submission.code,
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
