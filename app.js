const app = document.querySelector("#app");
const VOTE_STORE_KEY = "daye-ai-exhibition-votes";
const VOTED_STORE_KEY = "daye-ai-exhibition-voted-projects";
const ADMIN_OVERRIDE_KEY = "daye-ai-exhibition-project-overrides";
const ADMIN_SESSION_KEY = "daye-ai-exhibition-admin-session-v2";
const ADMIN_PASSCODE_HASH = "0361f4d39a4c3021d8110a9ab8441be4f0f2028b51089cd626970bed260a06f0";
const SCORE_FIELDS = [
  ["creativity", "AI 結合創意"],
  ["art", "畫面精緻度"],
  ["gameplay", "遊戲趣味性"],
  ["smoothness", "操作流暢度"],
  ["completeness", "整體體驗滿意度"],
];

// ====== 投票按鈕系統（Apps Script API + 本機鎖）======
const VOTE_LOCK_KEY = "daye-vote-lock-v1";
const VOTE_TAG_PRESET = ["畫面好看", "玩法有趣", "創意特別", "想推薦朋友", "期待後續更新"];
let voteModalProject = null;

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value || ""));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function isValidAdminPasscode(passcode) {
  if (!globalThis.crypto?.subtle) return false;
  return (await sha256Hex(passcode)) === ADMIN_PASSCODE_HASH;
}

function getVoteApiUrl() {
  const cfg = (typeof window !== "undefined" && window.SITE_CONFIG && window.SITE_CONFIG.voting) || {};
  return cfg.apiUrl || "";
}

function deviceFingerprint() {
  try {
    const raw = [
      navigator.userAgent,
      navigator.language,
      `${screen.width}x${screen.height}`,
      new Date().getTimezoneOffset(),
    ].join("|");
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
    }
    return `fp_${Math.abs(hash).toString(36)}`;
  } catch (err) {
    return "fp_unknown";
  }
}

function getVoteLockMap() {
  try { return JSON.parse(localStorage.getItem(VOTE_LOCK_KEY) || "{}"); }
  catch (err) { return {}; }
}

function hasVotedLocal(projectId) {
  return !!getVoteLockMap()[projectId];
}

function markVotedLocal(projectId) {
  const map = getVoteLockMap();
  map[projectId] = Date.now();
  try { localStorage.setItem(VOTE_LOCK_KEY, JSON.stringify(map)); } catch (err) {}
}

async function submitVoteApi(projectId, { comment = "", tags = "" } = {}) {
  const url = getVoteApiUrl();
  if (!url) return false;
  const body = new URLSearchParams({
    id: projectId,
    comment,
    tags,
    fp: deviceFingerprint(),
  }).toString();
  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    return true;
  } catch (err) {
    return false;
  }
}

async function fetchVoteCounts() {
  const url = getVoteApiUrl();
  if (!url) return {};
  try {
    const r = await fetch(url, { method: "GET" });
    const data = await r.json();
    const cleaned = {};
    Object.entries(data || {}).forEach(([k, v]) => {
      if (/^[GK]\d{2}$/.test(k)) cleaned[k] = Number(v) || 0;
    });
    return cleaned;
  } catch (err) {
    return {};
  }
}

function apiVoteCountOf(projectId) {
  return (state.apiVoteCounts && state.apiVoteCounts[projectId]) || 0;
}

function refreshVoteCountDisplays(projectId) {
  const count = apiVoteCountOf(projectId);
  document.querySelectorAll(`[data-vote-count-for="${projectId}"]`).forEach((el) => {
    el.textContent = `${count} 票`;
  });
}

function refreshVoteButtonStates(projectId) {
  const voted = hasVotedLocal(projectId);
  document.querySelectorAll(`[data-action="vote"][data-project="${projectId}"]`).forEach((btn) => {
    btn.disabled = voted;
    btn.textContent = voted ? "✓ 已投" : "👍 投票";
  });
}

async function handleVoteClick(btn) {
  const id = btn.dataset.project;
  if (!id || hasVotedLocal(id)) return;
  // 1. 本機鎖 + 樂觀 UI
  markVotedLocal(id);
  if (!state.apiVoteCounts) state.apiVoteCounts = {};
  state.apiVoteCounts[id] = (state.apiVoteCounts[id] || 0) + 1;
  refreshVoteCountDisplays(id);
  refreshVoteButtonStates(id);
  // 2. 非同步寫進試算表（記票）
  submitVoteApi(id);
  // 3. 直接跳到 Google Form（讓觀眾填深度回饋），不再彈 modal
  const cfg = (typeof window !== "undefined" && window.SITE_CONFIG && window.SITE_CONFIG.voting) || {};
  if (cfg.formUrl) {
    const url = new URL(cfg.formUrl, window.location.href);
    if (cfg.gameParamName) url.searchParams.set(cfg.gameParamName, id);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }
}

function openVoteFeedbackModal(projectId) {
  const project = findProject(projectId);
  if (!project) return;
  voteModalProject = projectId;
  const overlay = document.createElement("div");
  overlay.className = "vote-modal-overlay";
  overlay.id = "voteModalOverlay";
  overlay.innerHTML = `
    <div class="vote-modal" role="dialog" aria-modal="true">
      <h2>✓ 已投給 ${escapeHtml(project.id)} ${escapeHtml(project.title)}！</h2>
      <p class="notice">想再多說兩句？選填，可直接跳過。</p>
      <div class="tag-cloud">
        ${VOTE_TAG_PRESET.map((t) => `
          <label class="tag-chip">
            <input type="checkbox" value="${escapeAttr(t)}">
            <span>${escapeHtml(t)}</span>
          </label>
        `).join("")}
      </div>
      <label class="field">
        <span class="sr-only">自由留言</span>
        <textarea id="voteFeedbackComment" rows="3" placeholder="自由留言（給作者看，可不填）"></textarea>
      </label>
      <div class="modal-actions">
        <button class="btn primary" type="button" data-action="vote-submit-feedback">送出建議</button>
        <button class="btn ghost" type="button" data-action="vote-skip-feedback">跳過</button>
      </div>
    </div>
  `;
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeVoteModal(false);
  });
  document.body.appendChild(overlay);
}

async function closeVoteModal(withFeedback) {
  const overlay = document.getElementById("voteModalOverlay");
  const projectId = voteModalProject;
  voteModalProject = null;
  if (!projectId) {
    if (overlay) overlay.remove();
    return;
  }
  let comment = "", tags = "";
  if (withFeedback && overlay) {
    const checked = Array.from(overlay.querySelectorAll('input[type="checkbox"]:checked'));
    tags = checked.map((c) => c.value).join(",");
    const ta = overlay.querySelector("#voteFeedbackComment");
    comment = (ta && ta.value || "").trim();
  }
  if (overlay) overlay.remove();
  // 實際送進試算表（這是真正寫入的時刻，無論有沒有 feedback 都會 +1 票）
  await submitVoteApi(projectId, { comment, tags });
}

// 全域 click + ESC 委派
document.addEventListener("click", (event) => {
  const voteBtn = event.target.closest('[data-action="vote"]');
  if (voteBtn) {
    event.preventDefault();
    event.stopPropagation();
    return handleVoteClick(voteBtn);
  }
  if (event.target.closest('[data-action="vote-submit-feedback"]')) return closeVoteModal(true);
  if (event.target.closest('[data-action="vote-skip-feedback"]')) return closeVoteModal(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && voteModalProject) closeVoteModal(false);
});

const state = {
  query: "",
  genres: new Set(),
  tags: new Set(),
  platforms: new Set(),
  sort: "popular",
  dashboardGenre: "all",
  compareOverall: true,
  isAdmin: sessionStorage.getItem(ADMIN_SESSION_KEY) === "active",
  homeSeed: Number(sessionStorage.getItem("daye-home-feature-seed") || Date.now()),
  remoteVotes: [],
  resultsSyncMessage: "",
  apiVoteCounts: {},
  apiVoteLoaded: false,
};

function getResultsConfig() {
  return (window.SITE_CONFIG || {}).results || {};
}

function isVotingEnded() {
  const cfg = (typeof window !== "undefined" && window.SITE_CONFIG && window.SITE_CONFIG.voting) || {};
  if (!cfg.endDate) return false;
  const end = new Date(`${cfg.endDate}T23:59:59+08:00`);
  return !isNaN(end.getTime()) && Date.now() > end.getTime();
}

function getVotingConfig() {
  return (window.SITE_CONFIG || {}).voting || {};
}

function dateParts(label) {
  const text = String(label || "").trim();
  const match = text.match(/^([^（(]+)[（(]([^）)]+)[）)]\s*(.*)$/);
  if (!match) return { date: text, weekday: "", suffix: "" };
  return { date: match[1].trim(), weekday: match[2].trim(), suffix: match[3].trim() };
}

function dateDetail(parts, fallback = "") {
  return [parts.weekday ? `(${parts.weekday})` : "", parts.suffix].filter(Boolean).join(" ") || fallback;
}

function shouldShowPublicVoteCounts() {
  const resultsConfig = getResultsConfig();
  return Boolean(
    getVoteApiUrl()
    || (resultsConfig.csvUrl && (resultsConfig.publicRankingsOpen || isVotingEnded()))
    || resultsConfig.useMockVotes
    || getVotingConfig().prototypeVotingEnabled
  );
}

function getLocalVotes() {
  try {
    return JSON.parse(localStorage.getItem(VOTE_STORE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setLocalVotes(votes) {
  localStorage.setItem(VOTE_STORE_KEY, JSON.stringify(votes));
}

function getVotedProjects() {
  try {
    return new Set(JSON.parse(localStorage.getItem(VOTED_STORE_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function setVotedProjects(votedProjects) {
  localStorage.setItem(VOTED_STORE_KEY, JSON.stringify([...votedProjects]));
}

function getAdminOverrides() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_OVERRIDE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setAdminOverrides(overrides) {
  localStorage.setItem(ADMIN_OVERRIDE_KEY, JSON.stringify(overrides));
}

function getProjects() {
  const overrides = getAdminOverrides();
  return PROJECTS.map((project) => ({ ...project, ...(overrides[project.id] || {}) }));
}

function findProject(projectId) {
  return getProjects().find((item) => item.id === projectId) || getProjects()[0];
}

function allVotes() {
  const resultsConfig = getResultsConfig();
  if (resultsConfig.csvUrl) {
    return state.remoteVotes;
  }
  if (resultsConfig.useMockVotes) {
    return [...MOCK_VOTES, ...(getVotingConfig().prototypeVotingEnabled ? getLocalVotes() : [])];
  }
  if (getVotingConfig().prototypeVotingEnabled) {
    return getLocalVotes();
  }
  return [];
}

function projectVotes(projectId) {
  return allVotes().filter((vote) => vote.projectId === projectId);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

function scoreStats(votes) {
  const sampleCount = votes.length;
  const scores = Object.fromEntries(
    SCORE_FIELDS.map(([key]) => [key, Number(average(votes.map((vote) => vote[key])).toFixed(2))])
  );
  return { sampleCount, scores };
}

function scoreMean(stats) {
  return average(SCORE_FIELDS.map(([key]) => stats.scores[key]));
}

function projectStats(project) {
  const votes = projectVotes(project.id);
  return {
    votes,
    voteCount: votes.length,
    score: scoreStats(votes),
    averageScore: Number(scoreMean(scoreStats(votes)).toFixed(2)),
    commentCount: votes.filter((vote) => vote.likedMost || vote.suggestion).length,
  };
}

function filteredProjects() {
  const query = state.query.trim().toLowerCase();
  const filtered = getProjects().filter((project) => {
    const haystack = [
      project.id,
      project.title,
      project.platform,
      project.shortPitch,
      ...project.genre,
      ...project.tags,
    ].join(" ").toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesGenres = !state.genres.size || project.genre.some((genre) => state.genres.has(genre));
    const matchesTags = !state.tags.size || project.tags.some((tag) => state.tags.has(tag));
    const matchesPlatforms = !state.platforms.size || state.platforms.has(project.platform);
    return matchesQuery && matchesGenres && matchesTags && matchesPlatforms;
  });

  return filtered.sort((a, b) => {
    const aStats = projectStats(a);
    const bStats = projectStats(b);
    if (state.sort === "rating") return bStats.averageScore - aStats.averageScore;
    if (state.sort === "latest") return new Date(b.createdAt) - new Date(a.createdAt);
    return bStats.voteCount - aStats.voteCount;
  });
}

function uniqueValues(selector) {
  return [...new Set(getProjects().flatMap(selector))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function route() {
  const hash = window.location.hash.replace(/^#/, "") || "home";
  const [page, id] = hash.split("/");
  setActiveNav(page);
  if (page === "browse") renderBrowse();
  else if (page === "detail") renderDetail(id || PROJECTS[0].id);
  else if (page === "results") renderResults();
  else if (page === "about") renderAbout();
  else if (page === "rules") renderRules();
  else if (page === "awards") renderAwards();
  else if (page === "admin") renderAdmin();
  else renderHome();
  app.focus({ preventScroll: true });
}

async function loadExternalVotes() {
  const config = getResultsConfig();
  if (!config.csvUrl) return;
  try {
    const response = await fetch(config.csvUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`CSV ${response.status}`);
    const csv = await response.text();
    const rows = parseCsv(csv);
    state.remoteVotes = rows.map(normalizeCsvVote).filter(Boolean);
    state.resultsSyncMessage = `已同步 ${state.remoteVotes.length} 筆表單回應`;
  } catch (error) {
    state.remoteVotes = [];
    state.resultsSyncMessage = "表單結果讀取失敗，請檢查 Sheet CSV 發布與 CORS。";
    console.warn("Results CSV load failed.", error);
  }
}

function setupExternalVoteRefresh() {
  const config = getResultsConfig();
  if (!config.csvUrl) return;
  const seconds = Number(config.refreshSeconds || 60);
  window.setInterval(async () => {
    await loadExternalVotes();
    if (window.location.hash.replace(/^#/, "") === "results") renderResults();
    if (!window.location.hash || window.location.hash === "#home") renderHome();
  }, Math.max(30, seconds) * 1000);
}

function setActiveNav(page) {
  document.querySelectorAll(".main-nav a").forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${page}`);
  });
}

function renderHome() {
  const projects = getProjects();
  const featured = homeFeaturedProjects(projects);
  const start = dateParts(EVENT_CONFIG.startDate || "6/15（一）");
  const deadline = dateParts(EVENT_CONFIG.deadline);
  const publish = dateParts(getVotingConfig().publishLabel || "6/20（六）早上 9:00");
  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">${EVENT_CONFIG.subtitle}</p>
        <h1 class="event-title"><span>大業 AI 繪圖社</span><span>期末成果展</span></h1>
        <p>${escapeHtml(EVENT_CONFIG.purpose)}</p>
        <div class="hero-actions">
          <a class="btn primary" href="#browse">立刻試玩投票</a>
          <a class="btn ghost" href="#rules">先看投票玩法</a>
        </div>
      </div>
      <div class="hero-console" aria-label="成果展摘要">
        <div>
          <strong class="hero-date">${escapeHtml(start.date)} <small>(${escapeHtml(start.weekday)})</small></strong>
          <span>投票開始</span>
        </div>
        <div class="deadline-card">
          <strong class="hero-date">${escapeHtml(deadline.date)} <small>(${escapeHtml(deadline.weekday)})</small></strong>
          <span>投票截止${deadline.suffix ? `・${escapeHtml(deadline.suffix)}` : ""}</span>
        </div>
        <div>
          <strong class="hero-date">${escapeHtml(publish.date)} <small>(${escapeHtml(publish.weekday)})</small></strong>
          <span>結果公布${publish.suffix ? `・${escapeHtml(publish.suffix)}` : ""}</span>
        </div>
      </div>
    </section>

    <section class="info-strip">
      <article>
        <h2>你的一票，決定人氣王</h2>
        <p>這場成果展不是把作品放上來而已，而是把舞台交給觀眾。誰的畫面最吸睛？誰的玩法最想再玩一次？票選結果會說話。</p>
      </article>
      <article>
        <h2>先玩過，再出手</h2>
        <p>${EVENT_CONFIG.votingRule}</p>
      </article>
      <article>
        <h2>你的回饋，作者看得到</h2>
        <p>${EVENT_CONFIG.participationValue} ${EVENT_CONFIG.notice}</p>
      </article>
    </section>

    <section class="section-head">
      <div>
        <p class="eyebrow">Random Picks</p>
        <h2>隨機抽幾款開始試玩</h2>
      </div>
      <div class="section-actions">
        <button class="text-button" data-action="shuffle-home">換一批</button>
        <a href="#browse">看全部作品</a>
      </div>
    </section>
    <div class="card-grid featured-grid">
      ${featured.map(renderProjectCard).join("")}
    </div>
  `;
  document.querySelector("[data-action='shuffle-home']")?.addEventListener("click", () => {
    state.homeSeed = Date.now();
    sessionStorage.setItem("daye-home-feature-seed", String(state.homeSeed));
    renderHome();
  });
  bindAdminEditButtons();
}

function homeFeaturedProjects(projects) {
  const playable = projects.filter((project) => project.playUrl && project.playUrl !== "#");
  return seededShuffle(playable.length ? playable : projects, state.homeSeed).slice(0, 4);
}

function seededShuffle(items, seed) {
  const shuffled = [...items];
  let value = Math.max(1, Math.floor(seed) % 2147483647);
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    value = (value * 16807) % 2147483647;
    const swapIndex = value % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function renderBrowse() {
  const projects = filteredProjects();
  app.innerHTML = `
    <section class="browse-layout">
      <aside class="filter-panel">
        <div class="panel-head">
          <h1>Browse</h1>
          <button class="text-button" data-action="clear-filters">清除篩選</button>
        </div>
        ${renderFilterGroup("genre", "遊戲類型", uniqueValues((project) => project.genre), state.genres)}
        ${renderFilterGroup("platform", "平台", uniqueValues((project) => [project.platform]), state.platforms)}
        ${renderFilterGroup("tag", "標籤", uniqueValues((project) => project.tags).slice(0, 18), state.tags)}
      </aside>
      <section class="browse-main">
        <div class="searchbar">
          <input id="searchInput" type="search" value="${escapeAttr(state.query)}" placeholder="搜尋作品名稱、代號、類型、關鍵字" />
          <select id="sortSelect" aria-label="排序">
            <option value="popular"${state.sort === "popular" ? " selected" : ""}>人氣排序</option>
            <option value="rating"${state.sort === "rating" ? " selected" : ""}>評分排序</option>
            <option value="latest"${state.sort === "latest" ? " selected" : ""}>最新排序</option>
          </select>
        </div>
        <div class="browse-summary">
          <strong>${projects.length}</strong>
          <span>件作品符合目前條件</span>
        </div>
        <div class="card-grid">
          ${projects.map(renderProjectCard).join("")}
        </div>
      </section>
    </section>
  `;
  bindBrowseControls();
  bindAdminEditButtons();
}

function renderFilterGroup(type, title, values, selectedSet) {
  return `
    <section class="filter-group">
      <h2>${title}</h2>
      <div class="chip-list">
        ${values.map((value) => `
          <button class="chip ${selectedSet.has(value) ? "is-selected" : ""}" data-filter-type="${type}" data-filter-value="${escapeAttr(value)}">
            ${value}
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function bindBrowseControls() {
  document.querySelector("#searchInput").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderBrowse();
  });
  document.querySelector("#sortSelect").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderBrowse();
  });
  document.querySelectorAll("[data-filter-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const set = button.dataset.filterType === "genre" ? state.genres : button.dataset.filterType === "platform" ? state.platforms : state.tags;
      if (set.has(button.dataset.filterValue)) set.delete(button.dataset.filterValue);
      else set.add(button.dataset.filterValue);
      renderBrowse();
    });
  });
  document.querySelector("[data-action='clear-filters']").addEventListener("click", () => {
    state.query = "";
    state.genres.clear();
    state.tags.clear();
    state.platforms.clear();
    state.sort = "popular";
    renderBrowse();
  });
}

function renderProjectCard(project) {
  const voted = hasVotedLocal(project.id);
  const apiEnabled = !!getVoteApiUrl();
  const nonVotableIds = (window.SITE_CONFIG && window.SITE_CONFIG.voting && window.SITE_CONFIG.voting.nonVotableIds) || [];
  const isDemo = nonVotableIds.includes(project.id);
  const voteLabel = isDemo
    ? "🎓 不參賽"
    : shouldShowPublicVoteCounts()
      ? `${apiEnabled ? apiVoteCountOf(project.id) : projectStats(project).voteCount} 票`
      : "投票中";
  return `
    <article class="project-card-wrap ${isDemo ? "is-demo" : ""}">
      ${renderAdminEditButton(project.id)}
      <a class="project-card theme-${project.theme} ${project.cover ? "has-cover-image" : ""}" href="#detail/${project.id}">
        <div class="cover-art">
          ${coverImage(project)}
          <span>${escapeHtml(project.id)}</span>
          ${isDemo ? `<span class="demo-badge" title="教師示範作品，不參賽">🎓 教師示範</span>` : ""}
          ${project.cover ? "" : `<strong>${escapeHtml(project.title)}</strong>`}
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span>${escapeHtml(project.genre[0])}</span>
            <span>${escapeHtml(project.platform)}</span>
          </div>
          <h2>${escapeHtml(project.title)}</h2>
          <p>${escapeHtml(project.shortPitch)}</p>
          <div class="card-footer">
            <span data-vote-count-for="${project.id}">${voteLabel}</span>
          </div>
        </div>
      </a>
      ${apiEnabled && !isDemo ? `
      <div class="card-vote-row">
        <button class="btn ghost vote-btn-card" type="button" data-action="vote" data-project="${project.id}" ${voted ? "disabled" : ""}>
          ${voted ? "✓ 已投" : "👍 投票"}
        </button>
      </div>` : ""}
      ${isDemo ? `
      <div class="card-vote-row">
        <span class="demo-note">教師示範作品，僅供試玩學習</span>
      </div>` : ""}
    </article>
  `;
}

function renderDetail(projectId) {
  const project = findProject(projectId);
  const stats = projectStats(project);
  const voteUrl = getExternalVoteUrl(project);
  const apiEnabled = !!getVoteApiUrl();
  const voted = hasVotedLocal(project.id);
  const nonVotableIds = (window.SITE_CONFIG && window.SITE_CONFIG.voting && window.SITE_CONFIG.voting.nonVotableIds) || [];
  const isDemo = nonVotableIds.includes(project.id);
  const voteAction = isDemo
    ? `<span class="btn ghost is-disabled" aria-disabled="true">🎓 教師示範作品 · 不參賽</span>`
    : apiEnabled
      ? `<button class="btn ghost" type="button" data-action="vote" data-project="${escapeAttr(project.id)}" ${voted ? "disabled" : ""}>${voted ? "✓ 已投" : "投這件當人氣王"}</button>`
      : voteUrl
        ? `<a class="btn ghost" href="${voteUrl}" target="_blank" rel="noreferrer">投這件當人氣王</a>`
        : "";
  app.innerHTML = `
    <section class="detail-hero theme-${project.theme}">
      <div class="detail-media">
        <div class="detail-cover ${project.cover ? "has-cover-image" : ""}">
          ${coverImage(project)}
          ${renderAdminEditButton(project.id)}
          <span>${escapeHtml(project.id)}</span>
          ${project.cover ? "" : `<strong>${escapeHtml(project.title)}</strong>`}
        </div>
      </div>
      <div class="detail-copy">
        <a class="back-link" href="#browse">返回 Browse</a>
        <p class="eyebrow">${escapeHtml(project.genre.join(" / "))} · ${escapeHtml(project.platform)}</p>
        <h1>${escapeHtml(project.title)}</h1>
        <p>${escapeHtml(project.description)}</p>
        <div class="tag-row">${project.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="detail-actions">
          <a class="btn primary" href="${project.playUrl}" ${project.playUrl === "#" ? "aria-disabled='true'" : ""}>開始遊玩</a>
          ${voteAction}
          ${state.isAdmin ? `<button class="btn ghost" data-action="edit-project" data-project-id="${escapeAttr(project.id)}">編輯作品</button>` : ""}
        </div>
      </div>
    </section>

  `;
  bindDetailControls(project);
  bindAdminEditButtons();
}

function getExternalVoteUrl(project) {
  const votingConfig = getVotingConfig();
  if (!votingConfig.enabled || !votingConfig.formUrl) return "";
  const url = new URL(votingConfig.formUrl, window.location.href);
  if (votingConfig.gameParamName) {
    url.searchParams.set(votingConfig.gameParamName, project.id);
  }
  return url.href;
}

function bindDetailControls(project) {
  document.querySelector("[data-action='edit-project']")?.addEventListener("click", () => openProjectEditor(project.id));
}

function renderResults() {
  // 新版：API 按鈕投票結果
  if (getVoteApiUrl()) {
    return renderApiResults();
  }
  const votes = allVotes();
  const resultsConfig = getResultsConfig();
  const usingExternalResults = Boolean(resultsConfig.csvUrl);
  const publish = dateParts(getVotingConfig().publishLabel || "6/20（六）早上 9:00");
  const publishDetail = dateDetail(publish, "完成資料檢查後");
  if (!usingExternalResults && !resultsConfig.useMockVotes && votes.length === 0) {
    app.innerHTML = `
      <section class="section-head dashboard-head">
        <div>
          <p class="eyebrow">Results Dashboard</p>
          <h1>投票統計</h1>
          <p>投票期間不公開即時票數與排行，避免影響後續投票選擇。截止後由主辦檢查資料並公布整理後結果。</p>
        </div>
      </section>
      <section class="stats-grid private-results-grid">
        <article><span>投票狀態</span><strong>開放中</strong><small>${EVENT_CONFIG.deadline} 截止</small></article>
        <article><span>結果公布</span><strong>${escapeHtml(publish.date)}</strong><small>${escapeHtml(publishDetail)}</small></article>
        <article><span>資料來源</span><strong>Google Form</strong><small>不公開原始回覆</small></article>
      </section>
      <article class="panel">
        <h2>公平性說明</h2>
        <p>投票需登入 Google 帳號且每個帳號限填一次。公開頁不顯示原始回覆資料；主辦會在截止後整理票數與回饋，再公布結果。</p>
      </article>
    `;
    return;
  }
  if (usingExternalResults && !resultsConfig.publicRankingsOpen && !isVotingEnded()) {
    app.innerHTML = `
      <section class="section-head dashboard-head">
        <div>
          <p class="eyebrow">Results Dashboard</p>
          <h1>投票統計</h1>
          <p>投票期間只公開目前總票數，不公開各作品排行，避免影響後續投票選擇。</p>
        </div>
      </section>
      <section class="stats-grid private-results-grid">
        <article><span>目前已投</span><strong>${votes.length}</strong><small>票</small></article>
        <article><span>結果公布</span><strong>${escapeHtml(publish.date)}</strong><small>${escapeHtml(publishDetail)}</small></article>
      </section>
      <article class="panel">
        <h2>公平性規則</h2>
        <p>正式結果將在投票截止與資料檢查後公布。若偵測到異常回覆，主辦單位可保留排除異常資料與調整統計的權利。學生填寫的優化建議僅內部供作者學習使用，不對外公開。</p>
        <p class="form-message">${state.resultsSyncMessage || "尚未同步表單結果。"}</p>
      </article>
    `;
    return;
  }
  const projects = getProjects();
  const topVotes = [...projects].sort((a, b) => projectStats(b).voteCount - projectStats(a).voteCount).slice(0, 3);
  const topCreativity = bestByScore("creativity");
  const topGameplay = bestByScore("gameplay");
  const topComments = [...projects].sort((a, b) => projectStats(b).commentCount - projectStats(a).commentCount)[0];
  const popularGenre = mostPopularGenre();

  app.innerHTML = `
    <section class="section-head dashboard-head">
      <div>
        <p class="eyebrow">Results Dashboard</p>
        <h1>人氣與評價統計</h1>
      </div>
    </section>

    <section class="stats-grid">
      <article><span>總投票數</span><strong>${votes.length}</strong></article>
      <article><span>平均 AI 結合創意分最高</span><strong>${topCreativity.id}</strong><small>${topCreativity.title}</small></article>
      <article><span>平均遊戲趣味性分最高</span><strong>${topGameplay.id}</strong><small>${topGameplay.title}</small></article>
      <article><span>最受歡迎類型</span><strong>${popularGenre.genre}</strong><small>${popularGenre.count} 票</small></article>
    </section>

    <section class="dashboard-grid">
      <article class="panel">
        <h2>最高票前三名</h2>
        <ol class="rank-list">
          ${topVotes.map((project) => `<li><a href="#detail/${project.id}"><strong>${project.id}</strong><span>${project.title}</span><em>${projectStats(project).voteCount} 票</em></a></li>`).join("")}
        </ol>
      </article>
    </section>
  `;
}

function renderApiResults() {
  const projects = getProjects();
  const nonVotableIds = (window.SITE_CONFIG && window.SITE_CONFIG.voting && window.SITE_CONFIG.voting.nonVotableIds) || [];
  const votableProjects = projects.filter((project) => !nonVotableIds.includes(project.id));
  const counts = state.apiVoteCounts || {};
  const total = votableProjects.reduce((sum, project) => sum + Number(counts[project.id] || 0), 0);
  const ended = isVotingEnded();
  const publicOpen = (window.SITE_CONFIG && window.SITE_CONFIG.results && window.SITE_CONFIG.results.publicRankingsOpen) || false;
  const showRanking = ended || publicOpen;
  const publish = dateParts(getVotingConfig().publishLabel || "6/20（六）早上 9:00");
  const publishDetail = dateDetail(publish, "完成資料檢查後");

  // 投票期間：只顯示總票數、不顯示排行
  if (!showRanking) {
    app.innerHTML = `
      <section class="section-head dashboard-head">
        <div>
          <p class="eyebrow">Results Dashboard</p>
          <h1>投票統計</h1>
          <p>投票期間只公開總票數，不公開排行，避免影響後續投票選擇。整理後結果預計於 <strong>${escapeHtml(publish.date)} ${escapeHtml(publishDetail)}</strong> 公布。</p>
        </div>
      </section>
      <section class="stats-grid private-results-grid">
        <article><span>目前已投</span><strong>${total}</strong><small>票</small></article>
        <article><span>結果公布</span><strong>${escapeHtml(publish.date)}</strong><small>${escapeHtml(publishDetail)}</small></article>
        <article><span>展品數</span><strong>${projects.length}</strong><small>件</small></article>
      </section>
      <article class="panel">
        <h2>公平性說明</h2>
        <p>投票期間不公開各作品排行。截止後主辦會檢查資料，排除不參賽作品與異常資料後，再公布整理後結果。</p>
      </article>
    `;
    return;
  }

  // 截止後：完整排行 + 票數柱狀圖
  const ranked = votableProjects
    .map((p) => ({ id: p.id, title: p.title, votes: Number(counts[p.id] || 0) }))
    .sort((a, b) => b.votes - a.votes);
  const maxVotes = Math.max(...ranked.map((r) => r.votes), 1);
  const topThree = ranked.slice(0, 3);

  app.innerHTML = `
    <section class="section-head dashboard-head">
      <div>
        <p class="eyebrow">Results Dashboard</p>
        <h1>人氣票數排行</h1>
        <p>總投票數 <strong>${total}</strong> 票｜參賽作品 ${votableProjects.length} 件｜每位觀眾限填 1 次。</p>
      </div>
    </section>

    <section class="stats-grid">
      ${topThree.map((p, i) => `
        <article>
          <span>第 ${i + 1} 名</span>
          <strong>${escapeHtml(p.id)}</strong>
          <small>${escapeHtml(p.title)}・${p.votes} 票</small>
        </article>
      `).join("")}
    </section>

    <section class="vote-bar-chart">
      ${ranked.map((p, i) => `
        <a class="vote-bar-row" href="#detail/${p.id}">
          <span class="rank">${i + 1}</span>
          <span class="id">${escapeHtml(p.id)}</span>
          <span class="title">${escapeHtml(p.title)}</span>
          <span class="bar-track"><span class="bar-fill" style="width: ${(p.votes / maxVotes * 100).toFixed(1)}%"></span></span>
          <span class="votes">${p.votes} 票</span>
        </a>
      `).join("")}
    </section>
  `;
}

function renderRules() {
  const rules = (window.SITE_CONFIG && window.SITE_CONFIG.rules) || {};
  const voting = (window.SITE_CONFIG && window.SITE_CONFIG.voting) || {};
  app.innerHTML = `
    <section class="section-head">
      <div>
        <p class="eyebrow">Voting Rules</p>
        <h1>📜 投票規則</h1>
        <p>${escapeHtml(rules.purpose || "")}</p>
      </div>
    </section>

    <section class="rules-grid">
      <article class="panel">
        <h2>📅 時間</h2>
        <p><strong>投票期：</strong>${escapeHtml(rules.period || "")}</p>
        <p><strong>結果公布：</strong>${escapeHtml(rules.publishAt || "")}</p>
      </article>

      <article class="panel">
        <h2>📝 怎麼投</h2>
        <ol>
          ${(rules.howToVote || []).map(s => `<li>${escapeHtml(s)}</li>`).join("")}
        </ol>
        <p class="notice">${escapeHtml(rules.duringPeriod || "")}</p>
      </article>

      <article class="panel">
        <h2>🛡️ 隱私保護</h2>
        <ul>
          ${(rules.privacy || []).map(s => `<li>${escapeHtml(s)}</li>`).join("")}
        </ul>
      </article>

      <article class="panel">
        <h2>${escapeHtml(rules.antiFraud && rules.antiFraud.title || "公平性規則")}</h2>
        <p class="muted">觀眾票主要影響人氣類獎項；其他獎項由內部評鑑與評審決定，讓作品能從不同面向被看見。</p>
        <ol>
          ${(rules.antiFraud && rules.antiFraud.layers || []).map(s => `<li>${escapeHtml(s)}</li>`).join("")}
        </ol>
      </article>

      <article class="panel">
        <h2>🎓 教師示範作品</h2>
        <p>K01 瘋狂大賽車為指導老師示範作品，<strong>不參賽、不可投票</strong>，僅供觀眾試玩學習。</p>
      </article>
    </section>

    <div class="detail-actions">
      <a class="btn primary" href="#browse">看作品去 →</a>
      <a class="btn ghost" href="#awards">看 14 個獎項 →</a>
    </div>
  `;
}

function renderAwards() {
  const awards = (window.SITE_CONFIG && window.SITE_CONFIG.awards) || {};
  const list = awards.list || [];
  const projects = getProjects();
  const findById = (id) => projects.find(p => p.id === id);

  const now = Date.now();
  const publishAt = awards.publishAt ? new Date(awards.publishAt).getTime() : null;
  const published = publishAt && now >= publishAt;

  const groups = [
    { code: "A", title: "🎟️ 觀眾票決定", subtitle: "由觀眾支持度決定的人氣類獎項" },
    { code: "B", title: "📊 內部評鑑決定", subtitle: "由社員與老師依作品表現綜合評定" },
    { code: "C", title: "💛 評審特別獎", subtitle: "補足作品亮點與努力歷程的特別獎項" },
  ];

  app.innerHTML = `
    <section class="section-head">
      <div>
        <p class="eyebrow">Awards Lineup</p>
        <h1>🏆 14 個獎位 · 通通有獎</h1>
        <p>${escapeHtml(awards.purpose || "")}</p>
        <p class="${published ? "success" : "notice"}">
          ${published ? "✅ 結果已公布" : `⏳ 公布時間：${escapeHtml(awards.publishLabel || "")}`}
        </p>
      </div>
    </section>

    ${groups.map(g => {
      const items = list.filter(a => a.group === g.code);
      if (!items.length) return "";
      return `
        <section class="awards-group">
          <h2>${escapeHtml(g.title)}</h2>
          <p class="muted">${escapeHtml(g.subtitle)}</p>
          <div class="awards-grid">
            ${items.map(a => {
              const winner = a.winner ? findById(a.winner) : null;
              return `
                <article class="panel award-card ${a.winner ? "has-winner" : ""}">
                  <div class="award-head">
                    <span class="award-icon">${a.icon}</span>
                    <h3>${escapeHtml(a.name)}</h3>
                  </div>
                  <p class="award-desc">${escapeHtml(a.desc)}</p>
                  ${published && winner ? `
                    <a class="award-winner" href="#detail/${winner.id}">
                      <strong>🏆 ${escapeHtml(winner.id)}</strong>
                      <span>${escapeHtml(winner.title)}</span>
                      ${a.winnerNote ? `<em>${escapeHtml(a.winnerNote)}</em>` : ""}
                    </a>
                  ` : published ? `
                    <p class="muted award-pending">本獎項從缺</p>
                  ` : `
                    <p class="muted award-pending">⏳ 等待 6/20 公布</p>
                  `}
                </article>
              `;
            }).join("")}
          </div>
        </section>
      `;
    }).join("")}

    <div class="detail-actions">
      <a class="btn primary" href="#browse">看作品去 →</a>
      <a class="btn ghost" href="#rules">看投票規則 →</a>
    </div>
  `;
}

function renderAbout() {
  app.innerHTML = `
    <section class="about-page">
      <div>
        <p class="eyebrow">About Event</p>
        <h1>社團介紹與評分標準</h1>
        <p>大業 AI 繪圖社本學期以「AI 視覺、遊戲企劃、互動程式」為主軸，讓學生把想法整理成可以被試玩的作品。本次成果展開放校內試玩、觀眾票選與建議回饋，作品創作者以代號展示。</p>
      </div>
      <div class="info-strip about-strip">
        <article><h2>展期與時程</h2><p>6/15（一）開展、6/19（五）投票截止。期間每個 Google 帳號可填答 1 次，截止後由主辦整理並公布結果。</p></article>
        <article><h2>課程主題</h2><p>AI 生成視覺、遊戲設計、HTML/CSS/JS 原型、作品包裝與上架展示，本次共展出 ${getProjects().length} 件作品。</p></article>
        <article><h2>五項評分標準</h2><p>AI 結合創意、畫面精緻度、遊戲趣味性、操作流暢度、整體體驗滿意度，每項 1～5 分，請依實際試玩體驗給分。</p></article>
      </div>
    </section>
  `;
}

function renderAdmin() {
  if (!state.isAdmin) {
    app.innerHTML = `
      <section class="admin-login">
        <div>
          <p class="eyebrow">Admin</p>
          <h1>管理者登入</h1>
          <p>登入後可在作品卡與作品詳情旁使用筆圖案，直接更換封面與文字。這是靜態網站管理原型，資料暫存在本機瀏覽器。</p>
        </div>
        <form class="panel admin-login-form" id="adminLoginForm">
          <label class="field">
            <span>管理碼</span>
            <input name="passcode" type="password" autocomplete="current-password" placeholder="請輸入管理碼" required />
          </label>
          <button class="btn primary" type="submit">登入管理</button>
          <p id="adminLoginMessage" class="form-message"></p>
        </form>
      </section>
    `;
    document.querySelector("#adminLoginForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const message = document.querySelector("#adminLoginMessage");
      const submitButton = form.querySelector("button[type='submit']");
      const passcode = new FormData(event.currentTarget).get("passcode");
      submitButton.disabled = true;
      message.textContent = "";
      try {
        if (!(await isValidAdminPasscode(passcode))) {
          message.textContent = "管理碼不正確。";
          return;
        }
        state.isAdmin = true;
        sessionStorage.setItem(ADMIN_SESSION_KEY, "active");
        renderAdmin();
      } finally {
        submitButton.disabled = false;
      }
    });
    return;
  }

  const overrides = getAdminOverrides();
  const projects = getProjects();
  app.innerHTML = `
    <section class="section-head admin-head">
      <div>
        <p class="eyebrow">Admin</p>
        <h1>作品管理</h1>
        <p>你可以直接修改封面、作品名稱、亮點、介紹與分類。修改會立即反映在本機預覽。</p>
      </div>
      <div class="admin-actions">
        <button class="btn ghost" data-action="export-overrides">匯出修改資料</button>
        <button class="btn ghost" data-action="clear-overrides">清除本機修改</button>
        <button class="btn ghost" data-action="admin-logout">登出</button>
      </div>
    </section>
    <section class="admin-note panel">
      <h2>目前是靜態後台原型</h2>
      <p>GitHub Pages 無法安全寫入公開資料庫。這裡先把修改存在你的瀏覽器；正式版可把同一套表單接到 Supabase、Firebase 或 Google Sheets Apps Script。</p>
    </section>
    <div class="admin-project-list">
      ${projects.map((project) => `
        <article class="admin-project-row ${overrides[project.id] ? "has-local-edit" : ""}">
          <div class="admin-row-cover theme-${project.theme} ${project.cover ? "has-cover-image" : ""}">
            ${coverImage(project)}
            <span>${escapeHtml(project.id)}</span>
          </div>
          <div>
            <h2>${escapeHtml(project.title)}</h2>
            <p>${escapeHtml(project.shortPitch)}</p>
            <small>${escapeHtml(project.genre.join(" / "))} · ${escapeHtml(project.platform)}</small>
          </div>
          <button class="icon-edit admin-row-edit" data-edit-project="${escapeAttr(project.id)}" aria-label="編輯 ${escapeAttr(project.title)}">✎</button>
        </article>
      `).join("")}
    </div>
  `;
  bindAdminPageControls();
  bindAdminEditButtons();
}

function bestByScore(key) {
  return [...getProjects()].sort((a, b) => projectStats(b).score.scores[key] - projectStats(a).score.scores[key])[0];
}

function mostPopularGenre() {
  const counts = new Map();
  allVotes().forEach((vote) => {
    const project = getProjects().find((item) => item.id === vote.projectId);
    project?.genre.forEach((genre) => counts.set(genre, (counts.get(genre) || 0) + 1));
  });
  const [genre, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || ["無", 0];
  return { genre, count };
}

function qrImage(url) {
  const target = url === "#" ? window.location.href : new URL(url, window.location.href).href;
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=12&data=${encodeURIComponent(target)}`;
}

function parseCsv(csv) {
  const rows = [];
  let current = "";
  let row = [];
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows.filter((item) => item.some((cell) => String(cell).trim()));
  return dataRows.map((cells) => Object.fromEntries(headers.map((header, index) => [header.trim(), cells[index] || ""])));
}

function normalizeCsvVote(row, index) {
  const columns = getResultsConfig().columns || {};
  const projectId = normalizeProjectId(getCsvValue(row, columns.projectId, ["作品代號", "遊戲代號", "projectId", "project_id"]));
  if (!projectId) return null;
  return {
    id: `csv_${index}_${projectId}`,
    projectId,
    likedMost: getCsvValue(row, columns.likedMost, ["最喜歡的地方", "likedMost"]),
    suggestion: getCsvValue(row, columns.suggestion, ["建議改進", "suggestion"]),
    creativity: toScore(getCsvValue(row, columns.creativity, ["AI 結合創意", "創意", "creativity"])),
    art: toScore(getCsvValue(row, columns.art, ["畫面精緻度", "美術風格", "art"])),
    gameplay: toScore(getCsvValue(row, columns.gameplay, ["遊戲趣味性", "遊戲性", "gameplay"])),
    smoothness: toScore(getCsvValue(row, columns.smoothness, ["操作流暢度", "smoothness"])),
    completeness: toScore(getCsvValue(row, columns.completeness, ["整體體驗滿意度", "完成度", "completeness"])),
    createdAt: getCsvValue(row, columns.createdAt, ["時間戳記", "Timestamp", "createdAt"]) || new Date().toISOString(),
  };
}

function normalizeProjectId(value) {
  const match = String(value || "").trim().match(/G\d{2}/iu);
  return match ? match[0].toUpperCase() : "";
}

function getCsvValue(row, preferred, fallbacks = []) {
  const keys = [preferred, ...fallbacks].filter(Boolean);
  for (const key of keys) {
    if (row[key] !== undefined && String(row[key]).trim() !== "") return String(row[key]).trim();
  }
  return "";
}

function toScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(1, Math.min(5, number));
}

function renderAdminEditButton(projectId) {
  if (!state.isAdmin) return "";
  return `<button class="icon-edit" data-edit-project="${escapeAttr(projectId)}" aria-label="編輯作品 ${escapeAttr(projectId)}">✎</button>`;
}

function bindAdminPageControls() {
  document.querySelector("[data-action='admin-logout']")?.addEventListener("click", () => {
    state.isAdmin = false;
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    renderAdmin();
  });
  document.querySelector("[data-action='clear-overrides']")?.addEventListener("click", () => {
    if (!window.confirm("確定清除這台瀏覽器中的所有作品修改？")) return;
    localStorage.removeItem(ADMIN_OVERRIDE_KEY);
    renderAdmin();
  });
  document.querySelector("[data-action='export-overrides']")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(getAdminOverrides(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "daye-project-overrides.json";
    link.click();
    URL.revokeObjectURL(url);
  });
}

function bindAdminEditButtons() {
  if (!state.isAdmin) return;
  document.querySelectorAll("[data-edit-project]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openProjectEditor(button.dataset.editProject);
    });
  });
}

function openProjectEditor(projectId) {
  const project = findProject(projectId);
  const modal = document.createElement("div");
  modal.className = "admin-modal";
  modal.innerHTML = `
    <div class="admin-modal-backdrop" data-close-editor></div>
    <form class="admin-editor panel" id="projectEditorForm">
      <div class="panel-head">
        <div>
          <p class="eyebrow">${escapeHtml(project.id)}</p>
          <h2>編輯作品</h2>
        </div>
        <button class="text-button" type="button" data-close-editor>關閉</button>
      </div>
      <div class="editor-cover-grid">
        <div class="editor-preview theme-${project.theme}">
          <span>4:3</span>
          <strong>${escapeHtml(project.title)}</strong>
        </div>
        <div class="editor-box-preview ${project.boxCover ? "has-cover-image" : ""}" ${boxCoverStyle(project)}>
          <span>2:3</span>
        </div>
      </div>
      <label class="field">
        <span>上傳封面 4:3</span>
        <input name="cover" type="file" accept="image/*" />
      </label>
      ${project.cover ? `<button class="text-button danger-text" type="button" data-action="remove-cover">移除橫式封面</button>` : ""}
      <label class="field">
        <span>上傳盒裝封面 2:3</span>
        <input name="boxCover" type="file" accept="image/*" />
      </label>
      ${project.boxCover ? `<button class="text-button danger-text" type="button" data-action="remove-box-cover">移除盒裝封面</button>` : ""}
      <label class="field">
        <span>作品名稱</span>
        <input name="title" value="${escapeAttr(project.title)}" required />
      </label>
      <label class="field">
        <span>一句亮點</span>
        <textarea name="shortPitch" rows="2" required>${escapeHtml(project.shortPitch)}</textarea>
      </label>
      <label class="field">
        <span>作品介紹</span>
        <textarea name="description" rows="4" required>${escapeHtml(project.description)}</textarea>
      </label>
      <div class="editor-two-col">
        <label class="field">
          <span>遊戲類型，以逗號分隔</span>
          <input name="genre" value="${escapeAttr(project.genre.join(", "))}" required />
        </label>
        <label class="field">
          <span>平台</span>
          <input name="platform" value="${escapeAttr(project.platform)}" required />
        </label>
      </div>
      <label class="field">
        <span>標籤，以逗號分隔</span>
        <input name="tags" value="${escapeAttr(project.tags.join(", "))}" />
      </label>
      <label class="field">
        <span>遊玩連結</span>
        <input name="playUrl" value="${escapeAttr(project.playUrl)}" />
      </label>
      <div class="editor-actions">
        <button class="btn primary" type="submit">儲存修改</button>
        <button class="btn ghost" type="button" data-action="reset-project">還原這件作品</button>
      </div>
      <p class="form-message" id="editorMessage"></p>
    </form>
  `;
  document.body.appendChild(modal);
  document.body.classList.add("is-editing");

  const closeEditor = () => {
    modal.remove();
    document.body.classList.remove("is-editing");
  };
  modal.querySelectorAll("[data-close-editor]").forEach((button) => button.addEventListener("click", closeEditor));
  modal.querySelector("[data-action='remove-cover']")?.addEventListener("click", () => {
    modal.dataset.removeCover = "true";
    modal.querySelector(".editor-preview").style.backgroundImage = "";
    modal.querySelector(".editor-preview").classList.remove("has-cover-image");
  });
  modal.querySelector("[data-action='remove-box-cover']")?.addEventListener("click", () => {
    modal.dataset.removeBoxCover = "true";
    modal.querySelector(".editor-box-preview").style.backgroundImage = "";
    modal.querySelector(".editor-box-preview").classList.remove("has-cover-image");
  });
  modal.querySelector("[data-action='reset-project']").addEventListener("click", () => {
    const overrides = getAdminOverrides();
    delete overrides[project.id];
    setAdminOverrides(overrides);
    closeEditor();
    route();
  });
  modal.querySelector("#projectEditorForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#editorMessage");
    const submitButton = event.currentTarget.querySelector("button[type='submit']");
    message.textContent = "正在處理圖片...";
    submitButton.disabled = true;
    const form = new FormData(event.currentTarget);
    const file = form.get("cover");
    const boxFile = form.get("boxCover");
    const existing = getAdminOverrides();
    try {
      const nextCover = modal.dataset.removeCover === "true"
        ? ""
        : file && file.size
          ? await imageFileToDataUrl(file, { maxWidth: 1280, maxHeight: 960, quality: 0.82 })
          : project.cover || "";
      const nextBoxCover = modal.dataset.removeBoxCover === "true"
        ? ""
        : boxFile && boxFile.size
          ? await imageFileToDataUrl(boxFile, { maxWidth: 900, maxHeight: 1350, quality: 0.84 })
          : project.boxCover || "";
      existing[project.id] = {
        title: String(form.get("title") || "").trim(),
        shortPitch: String(form.get("shortPitch") || "").trim(),
        description: String(form.get("description") || "").trim(),
        genre: splitList(form.get("genre")),
        platform: String(form.get("platform") || "").trim(),
        tags: splitList(form.get("tags")),
        playUrl: String(form.get("playUrl") || "#").trim() || "#",
        cover: nextCover,
        boxCover: nextBoxCover,
      };
      setAdminOverrides(existing);
      message.textContent = "已儲存。";
      window.setTimeout(() => {
        closeEditor();
        route();
      }, 350);
    } catch (error) {
      console.error(error);
      submitButton.disabled = false;
      message.textContent = isStorageQuotaError(error)
        ? "儲存失敗：這台瀏覽器的本機儲存空間已滿。請先到後台清除本機修改，或改用較小圖片。"
        : "儲存失敗：圖片處理時發生問題，請換一張圖片再試。";
    }
  });
}

function splitList(value) {
  return String(value || "")
    .split(/[,，]/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function imageFileToDataUrl(file, options) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.addEventListener("load", () => {
      const scale = Math.min(1, options.maxWidth / image.naturalWidth, options.maxHeight / image.naturalHeight);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", options.quality));
    });
    image.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image could not be loaded."));
    });
    image.src = objectUrl;
  });
}

function isStorageQuotaError(error) {
  return error?.name === "QuotaExceededError"
    || error?.name === "NS_ERROR_DOM_QUOTA_REACHED"
    || error?.code === 22
    || error?.code === 1014;
}

function coverImage(project) {
  if (!project.cover) return "";
  return `<img class="cover-image" src="${escapeAttr(project.cover)}" alt="${escapeAttr(project.title)} 封面" loading="lazy" />`;
}

function boxCoverStyle(project) {
  if (!project.boxCover) return "";
  return `style="background-image: linear-gradient(180deg, rgba(0,0,0,.02), rgba(0,0,0,.18)), url('${escapeAttr(project.boxCover)}')"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

window.addEventListener("hashchange", route);
loadExternalVotes().finally(() => {
  setupExternalVoteRefresh();
  route();
});

// 載入投票按鈕系統的即時票數 + 每 60 秒刷新
fetchVoteCounts().then((counts) => {
  state.apiVoteCounts = counts;
  state.apiVoteLoaded = true;
  // 已渲染的頁面更新顯示
  Object.keys(counts).forEach((id) => refreshVoteCountDisplays(id));
});
setInterval(() => {
  if (!getVoteApiUrl()) return;
  fetchVoteCounts().then((counts) => {
    state.apiVoteCounts = counts;
    Object.keys(counts).forEach((id) => refreshVoteCountDisplays(id));
  });
}, 60000);
