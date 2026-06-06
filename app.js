const app = document.querySelector("#app");
const VOTE_STORE_KEY = "daye-ai-exhibition-votes";
const VOTED_STORE_KEY = "daye-ai-exhibition-voted-projects";
const ADMIN_OVERRIDE_KEY = "daye-ai-exhibition-project-overrides";
const ADMIN_SESSION_KEY = "daye-ai-exhibition-admin-session";
const ADMIN_PASSCODE = "daye2026";
const SCORE_FIELDS = [
  ["creativity", "創意"],
  ["art", "美術風格"],
  ["gameplay", "遊戲性"],
  ["smoothness", "操作流暢度"],
  ["completeness", "完成度"],
];

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
};

function getResultsConfig() {
  return (window.SITE_CONFIG || {}).results || {};
}

function getVotingConfig() {
  return (window.SITE_CONFIG || {}).voting || {};
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
  const totalVotes = allVotes().length;
  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">${EVENT_CONFIG.subtitle}</p>
        <h1 class="event-title"><span>大業 AI 繪圖社</span><span>期末成果展</span></h1>
        <p>這是一個校內遊戲成果展。觀眾可以瀏覽作品、試玩、匿名投票，並留下能幫助創作者改進的具體建議。</p>
        <div class="hero-actions">
          <a class="btn primary" href="#browse">進入作品瀏覽</a>
          <a class="btn ghost" href="#results">查看即時統計</a>
        </div>
      </div>
      <div class="hero-console" aria-label="成果展摘要">
        <div><strong>${projects.length}</strong><span>展示作品</span></div>
        <div><strong>${totalVotes}</strong><span>目前票數</span></div>
        <div class="deadline-card"><strong>${EVENT_CONFIG.deadline}</strong><span>投票截止</span></div>
      </div>
    </section>

    <section class="info-strip">
      <article>
        <h2>投票辦法</h2>
        <p>${EVENT_CONFIG.votingRule}</p>
      </article>
      <article>
        <h2>抽獎辦法</h2>
        <p>${EVENT_CONFIG.rewardRule}</p>
      </article>
      <article>
        <h2>隱私提醒</h2>
        <p>${EVENT_CONFIG.notice}前台只顯示作品代號、作品內容與匿名統計。</p>
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
  const stats = projectStats(project);
  return `
    <article class="project-card-wrap">
      ${renderAdminEditButton(project.id)}
      <a class="project-card theme-${project.theme} ${project.cover ? "has-cover-image" : ""}" href="#detail/${project.id}">
        <div class="cover-art">
          ${coverImage(project)}
          <span>${escapeHtml(project.id)}</span>
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
            <span>${stats.voteCount} 票</span>
            <span>${stats.averageScore ? stats.averageScore.toFixed(1) : "0.0"} / 5</span>
          </div>
        </div>
      </a>
    </article>
  `;
}

function renderDetail(projectId) {
  const project = findProject(projectId);
  const stats = projectStats(project);
  const overall = scoreStats(allVotes());
  const voted = getVotedProjects().has(project.id);
  const votingConfig = getVotingConfig();
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
          <button class="btn ghost" data-action="scroll-vote">${votingConfig.formUrl ? "前往投票" : "投票狀態"}</button>
          ${state.isAdmin ? `<button class="btn ghost" data-action="edit-project" data-project-id="${escapeAttr(project.id)}">編輯作品</button>` : ""}
        </div>
      </div>
    </section>

    <section class="detail-grid">
      <article class="panel">
        <div class="panel-head">
          <h2>作品評價雷達圖</h2>
          <label class="toggle-row">
            <input id="compareToggle" type="checkbox" ${state.compareOverall ? "checked" : ""} />
            <span>本作品 vs 全體平均</span>
          </label>
        </div>
        ${renderRadar(stats.score, state.compareOverall ? overall : null)}
      </article>

      <article class="panel qr-panel">
        <h2>手機試玩 QR</h2>
        <img alt="${project.title} 試玩 QR code" src="${qrImage(project.playUrl)}" />
        <p>掃描後開啟作品頁。若作品連結尚未設定，會停留在原型連結。</p>
      </article>
    </section>

    <section id="voteSection" class="feedback-layout">
      ${renderVotePanel(project, voted)}
      <article class="panel comments-panel">
        <h2>留言摘錄</h2>
        ${renderComments(stats.votes)}
      </article>
    </section>
  `;
  bindDetailControls(project);
  bindAdminEditButtons();
}

function renderRating(key, label) {
  return `
    <fieldset class="rating-row">
      <legend>${label}</legend>
      <div>
        ${[1, 2, 3, 4, 5].map((value) => `
          <label>
            <input type="radio" name="${key}" value="${value}" ${value === 4 ? "checked" : ""} />
            <span>${value}</span>
          </label>
        `).join("")}
      </div>
    </fieldset>
  `;
}

function renderVotePanel(project, voted) {
  const votingConfig = getVotingConfig();
  const voteUrl = getExternalVoteUrl(project);
  if (voteUrl) {
    return `
      <article class="panel vote-form">
        <div class="panel-head">
          <h2>匿名投票與建議</h2>
          <span>Google Form</span>
        </div>
        <p class="notice">正式投票會開啟 Google 表單。此頁不儲存投票，避免把本機資料誤認成真實票數。</p>
        <p>作品代號：<strong>${escapeHtml(project.id)}</strong></p>
        <div class="hero-actions">
          <a class="btn primary" href="${voteUrl}" target="_blank" rel="noreferrer">前往投票表單</a>
        </div>
      </article>
    `;
  }

  if (!votingConfig.prototypeVotingEnabled) {
    return `
      <article class="panel vote-form">
        <div class="panel-head">
          <h2>匿名投票與建議</h2>
          <span>尚未開放</span>
        </div>
        <p class="notice">正式投票表單尚未接上。接上 Google Form 後，這裡會改成「前往投票表單」。</p>
        <p>目前不啟用本機假投票，避免把 localStorage 測試資料誤認成真實票數。</p>
      </article>
    `;
  }

  return `
    <form class="panel vote-form" id="voteForm">
      <div class="panel-head">
        <h2>匿名投票與建議</h2>
        <span>${voted ? "本裝置已投過" : "本機測試"}</span>
      </div>
      <p class="notice">這是本機原型測試，不會同步到公開網站或老師後台。</p>
      ${SCORE_FIELDS.map(([key, label]) => renderRating(key, label)).join("")}
      <label class="field">
        <span>最喜歡的地方</span>
        <textarea name="likedMost" rows="3" placeholder="例如：操作很直覺、角色美術很有記憶點"></textarea>
      </label>
      <label class="field">
        <span>建議改進</span>
        <textarea name="suggestion" rows="3" placeholder="例如：新手提示可以更清楚、音效可以再多一點"></textarea>
      </label>
      <button class="btn primary" type="submit" ${voted ? "disabled" : ""}>${voted ? "已完成投票" : "送出本機測試投票"}</button>
      <p id="formMessage" class="form-message"></p>
    </form>
  `;
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
  document.querySelector("[data-action='scroll-vote']").addEventListener("click", () => {
    document.querySelector("#voteSection").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector("#compareToggle").addEventListener("change", (event) => {
    state.compareOverall = event.target.checked;
    renderDetail(project.id);
  });
  document.querySelector("#voteForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const voted = getVotedProjects();
    if (voted.has(project.id)) return;
    const form = new FormData(event.currentTarget);
    const localVotes = getLocalVotes();
    localVotes.push({
      id: `vote_${Date.now()}`,
      projectId: project.id,
      likedMost: String(form.get("likedMost") || "").trim(),
      suggestion: String(form.get("suggestion") || "").trim(),
      creativity: Number(form.get("creativity")),
      art: Number(form.get("art")),
      gameplay: Number(form.get("gameplay")),
      smoothness: Number(form.get("smoothness")),
      completeness: Number(form.get("completeness")),
      createdAt: new Date().toISOString(),
    });
    setLocalVotes(localVotes);
    voted.add(project.id);
    setVotedProjects(voted);
    document.querySelector("#formMessage").textContent = "已送出，謝謝你的回饋。記得保留抽獎規則需要的資料給主辦單位。";
    window.setTimeout(() => renderDetail(project.id), 900);
  });
}

function renderResults() {
  const votes = allVotes();
  const resultsConfig = getResultsConfig();
  const usingExternalResults = Boolean(resultsConfig.csvUrl);
  if (!usingExternalResults && !resultsConfig.useMockVotes && votes.length === 0) {
    app.innerHTML = `
      <section class="section-head dashboard-head">
        <div>
          <p class="eyebrow">Results Dashboard</p>
          <h1>投票統計</h1>
          <p>正式 Google Form / Sheet 尚未接上，因此目前不顯示假排行或假評分。</p>
        </div>
      </section>
      <section class="stats-grid private-results-grid">
        <article><span>目前已投</span><strong>0</strong><small>票</small></article>
        <article><span>資料來源</span><strong>未連接</strong><small>等待 Sheet CSV</small></article>
      </section>
      <article class="panel">
        <h2>下一步</h2>
        <p>建立 Google 投票表單，將回應試算表發布為 CSV，並把 CSV URL 填入 <code>site-config.js</code> 的 <code>results.csvUrl</code>。</p>
      </article>
    `;
    return;
  }
  if (usingExternalResults && !resultsConfig.publicRankingsOpen) {
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
        <article><span>排行公開</span><strong>截止後</strong><small>${EVENT_CONFIG.deadline}</small></article>
      </section>
      <article class="panel">
        <h2>公平性規則</h2>
        <p>正式結果將在投票截止與資料檢查後公布。若偵測到灌票、洗票或不當留言，主辦單位可保留刪除與調整統計的權利。</p>
        <p class="form-message">${state.resultsSyncMessage || "尚未同步表單結果。"}</p>
      </article>
    `;
    return;
  }
  const genreVotes = state.dashboardGenre === "all"
    ? votes
    : votes.filter((vote) => getProjects().find((project) => project.id === vote.projectId)?.genre.includes(state.dashboardGenre));
  const stats = scoreStats(genreVotes);
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
      <label class="select-label">
        類型平均
        <select id="genreDashboardSelect">
          <option value="all">全部作品</option>
          ${uniqueValues((project) => project.genre).map((genre) => `<option value="${genre}"${state.dashboardGenre === genre ? " selected" : ""}>${genre}</option>`).join("")}
        </select>
      </label>
    </section>

    <section class="stats-grid">
      <article><span>總投票數</span><strong>${votes.length}</strong></article>
      <article><span>平均創意分最高</span><strong>${topCreativity.id}</strong><small>${topCreativity.title}</small></article>
      <article><span>平均遊戲性分最高</span><strong>${topGameplay.id}</strong><small>${topGameplay.title}</small></article>
      <article><span>留言數最多</span><strong>${topComments.id}</strong><small>${topComments.title}</small></article>
      <article><span>最受歡迎類型</span><strong>${popularGenre.genre}</strong><small>${popularGenre.count} 票</small></article>
    </section>

    <section class="dashboard-grid">
      <article class="panel">
        <h2>最高票前三名</h2>
        <ol class="rank-list">
          ${topVotes.map((project) => `<li><a href="#detail/${project.id}"><strong>${project.id}</strong><span>${project.title}</span><em>${projectStats(project).voteCount} 票</em></a></li>`).join("")}
        </ol>
      </article>
      <article class="panel">
        <h2>${state.dashboardGenre === "all" ? "全體平均雷達圖" : `${state.dashboardGenre} 平均雷達圖`}</h2>
        ${renderRadar(stats, null)}
      </article>
    </section>

    <section class="section-head">
      <div>
        <p class="eyebrow">Project Radar</p>
        <h2>每件作品評價</h2>
      </div>
    </section>
    <div class="mini-radar-grid">
      ${projects.map((project) => `
        <a class="mini-radar panel" href="#detail/${project.id}">
          <h3>${escapeHtml(project.id)} ${escapeHtml(project.title)}</h3>
          ${renderRadar(projectStats(project).score, stats, true)}
        </a>
      `).join("")}
    </div>
  `;
  document.querySelector("#genreDashboardSelect").addEventListener("change", (event) => {
    state.dashboardGenre = event.target.value;
    renderResults();
  });
}

function renderAbout() {
  app.innerHTML = `
    <section class="about-page">
      <div>
        <p class="eyebrow">About Event</p>
        <h1>社團介紹與參與方式</h1>
        <p>大業 AI 繪圖社本學期以「AI 視覺、遊戲企劃、互動程式」為主軸，讓學生把想法整理成可以被試玩的作品。</p>
      </div>
      <div class="info-strip about-strip">
        <article><h2>參與方式</h2><p>觀眾先瀏覽 Browse，進入作品 Detail 試玩，再匿名投票與留下具體建議。</p></article>
        <article><h2>課程主題</h2><p>AI 生成視覺、遊戲設計、HTML/CSS/JS 原型、作品包裝與上架展示。</p></article>
        <article><h2>資料原則</h2><p>前台不公開學生姓名、班級、座號或學號，只展示作品代號、內容與統計。</p></article>
      </div>
      <article class="panel schema-panel">
        <h2>後續資料串接建議</h2>
        <p>靜態原型可部署到 GitHub Pages；正式投票建議接 Google Forms + Apps Script + Sheets，或 Supabase/Firebase。前台只讀取彙整後的匿名統計 JSON，不直接公開原始回覆。</p>
        <pre><code>projects: { id, title, cover, boxCover, genre, tags, platform, shortPitch, description, playUrl, qrUrl }
votes: { projectId, likedMost, suggestion, creativity, art, gameplay, smoothness, completeness, createdAt }
event_config: { title, subtitle, votingRule, rewardRule, notice }</code></pre>
      </article>
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
    document.querySelector("#adminLoginForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const passcode = new FormData(event.currentTarget).get("passcode");
      if (passcode !== ADMIN_PASSCODE) {
        document.querySelector("#adminLoginMessage").textContent = "管理碼不正確。";
        return;
      }
      state.isAdmin = true;
      sessionStorage.setItem(ADMIN_SESSION_KEY, "active");
      renderAdmin();
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

function renderRadar(stats, compareStats = null, compact = false) {
  const points = radarPoints(stats.scores);
  const comparePoints = compareStats ? radarPoints(compareStats.scores) : "";
  const values = SCORE_FIELDS.map(([key, label]) => `<span>${label} ${Number(stats.scores[key] || 0).toFixed(1)}</span>`).join("");
  return `
    <div class="radar ${compact ? "is-compact" : ""}">
      <svg viewBox="0 0 240 240" role="img" aria-label="五項評分雷達圖">
        ${[1, 2, 3, 4, 5].map((level) => `<polygon class="grid" points="${radarGridPoints(level)}"></polygon>`).join("")}
        ${SCORE_FIELDS.map((_, index) => `<line class="axis" x1="120" y1="120" x2="${axisPoint(index, 5).x}" y2="${axisPoint(index, 5).y}"></line>`).join("")}
        ${compareStats ? `<polygon class="compare-shape" points="${comparePoints}"></polygon>` : ""}
        <polygon class="score-shape" points="${points}"></polygon>
        ${SCORE_FIELDS.map(([, label], index) => {
          const point = axisPoint(index, 5.75);
          return `<text x="${point.x}" y="${point.y}" text-anchor="middle">${label}</text>`;
        }).join("")}
      </svg>
      <div class="radar-meta">
        <strong>${scoreMean(stats).toFixed(1)} / 5</strong>
        <span>樣本數 ${stats.sampleCount}</span>
        ${compareStats ? "<em>淺色為全體平均</em>" : ""}
      </div>
      ${compact ? "" : `<div class="radar-values">${values}</div>`}
    </div>
  `;
}

function axisPoint(index, value) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / SCORE_FIELDS.length;
  const radius = (value / 5) * 82;
  return {
    x: Number((120 + Math.cos(angle) * radius).toFixed(2)),
    y: Number((120 + Math.sin(angle) * radius).toFixed(2)),
  };
}

function radarGridPoints(level) {
  return SCORE_FIELDS.map((_, index) => {
    const point = axisPoint(index, level);
    return `${point.x},${point.y}`;
  }).join(" ");
}

function radarPoints(scores) {
  return SCORE_FIELDS.map(([key], index) => {
    const point = axisPoint(index, Number(scores[key] || 0));
    return `${point.x},${point.y}`;
  }).join(" ");
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

function renderComments(votes) {
  const comments = votes
    .filter((vote) => vote.likedMost || vote.suggestion)
    .slice(-6)
    .reverse();
  if (!comments.length) return "<p class='empty'>尚無留言。</p>";
  return `<ul class="comment-list">${comments.map((vote) => `
    <li>
      <strong>${vote.likedMost || "喜歡作品整體表現"}</strong>
      <span>${vote.suggestion || "沒有留下改進建議"}</span>
    </li>
  `).join("")}</ul>`;
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
    creativity: toScore(getCsvValue(row, columns.creativity, ["創意", "creativity"])),
    art: toScore(getCsvValue(row, columns.art, ["美術風格", "art"])),
    gameplay: toScore(getCsvValue(row, columns.gameplay, ["遊戲性", "gameplay"])),
    smoothness: toScore(getCsvValue(row, columns.smoothness, ["操作流暢度", "smoothness"])),
    completeness: toScore(getCsvValue(row, columns.completeness, ["完成度", "completeness"])),
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
        <div class="editor-preview theme-${project.theme} ${project.cover ? "has-cover-image" : ""}" ${coverStyle(project)}>
          <span>16:9</span>
          <strong>${escapeHtml(project.title)}</strong>
        </div>
        <div class="editor-box-preview ${project.boxCover ? "has-cover-image" : ""}" ${boxCoverStyle(project)}>
          <span>2:3</span>
        </div>
      </div>
      <label class="field">
        <span>上傳橫式封面 16:9</span>
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
          ? await imageFileToDataUrl(file, { maxWidth: 1280, maxHeight: 720, quality: 0.82 })
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

function coverStyle(project) {
  if (!project.cover) return "";
  return `style="background-image: linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.48)), url('${escapeAttr(project.cover)}')"`;
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
