const app = document.querySelector("#app");
const VOTE_STORE_KEY = "daye-ai-exhibition-votes";
const VOTED_STORE_KEY = "daye-ai-exhibition-voted-projects";
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
};

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

function allVotes() {
  return [...MOCK_VOTES, ...getLocalVotes()];
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
  const filtered = PROJECTS.filter((project) => {
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
  return [...new Set(PROJECTS.flatMap(selector))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function route() {
  const hash = window.location.hash.replace(/^#/, "") || "home";
  const [page, id] = hash.split("/");
  setActiveNav(page);
  if (page === "browse") renderBrowse();
  else if (page === "detail") renderDetail(id || PROJECTS[0].id);
  else if (page === "results") renderResults();
  else if (page === "about") renderAbout();
  else renderHome();
  app.focus({ preventScroll: true });
}

function setActiveNav(page) {
  document.querySelectorAll(".main-nav a").forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${page}`);
  });
}

function renderHome() {
  const featured = PROJECTS.filter((project) => project.featured).slice(0, 5);
  const totalVotes = allVotes().length;
  app.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">${EVENT_CONFIG.subtitle}</p>
        <h1>${EVENT_CONFIG.title}</h1>
        <p>這是一個校內遊戲成果展。觀眾可以瀏覽作品、試玩、匿名投票，並留下能幫助創作者改進的具體建議。</p>
        <div class="hero-actions">
          <a class="btn primary" href="#browse">進入作品瀏覽</a>
          <a class="btn ghost" href="#results">查看即時統計</a>
        </div>
      </div>
      <div class="hero-console" aria-label="成果展摘要">
        <div><strong>${PROJECTS.length}</strong><span>展示作品</span></div>
        <div><strong>${totalVotes}</strong><span>目前票數</span></div>
        <div><strong>${EVENT_CONFIG.deadline}</strong><span>投票截止</span></div>
      </div>
    </section>

    <section class="info-strip">
      <article>
        <h2>投票辦法</h2>
        <p>${EVENT_CONFIG.votingRule}送出後可填寫最喜歡的地方與建議改進，分數會整理成作品雷達圖。</p>
      </article>
      <article>
        <h2>抽獎辦法</h2>
        <p>${EVENT_CONFIG.rewardRule}主辦單位可用後台表單資料核對抽獎資格，前台不公開個人資料。</p>
      </article>
      <article>
        <h2>隱私提醒</h2>
        <p>${EVENT_CONFIG.notice}前台只顯示作品代號、作品內容與匿名統計。</p>
      </article>
    </section>

    <section class="section-head">
      <div>
        <p class="eyebrow">Featured</p>
        <h2>先從這幾款開始試玩</h2>
      </div>
      <a href="#browse">看全部作品</a>
    </section>
    <div class="card-grid featured-grid">
      ${featured.map(renderProjectCard).join("")}
    </div>
  `;
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
    <a class="project-card theme-${project.theme}" href="#detail/${project.id}">
      <div class="cover-art">
        <span>${project.id}</span>
        <strong>${project.title}</strong>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span>${project.genre[0]}</span>
          <span>${project.platform}</span>
        </div>
        <h2>${project.title}</h2>
        <p>${project.shortPitch}</p>
        <div class="card-footer">
          <span>${stats.voteCount} 票</span>
          <span>${stats.averageScore ? stats.averageScore.toFixed(1) : "0.0"} / 5</span>
        </div>
      </div>
    </a>
  `;
}

function renderDetail(projectId) {
  const project = PROJECTS.find((item) => item.id === projectId) || PROJECTS[0];
  const stats = projectStats(project);
  const overall = scoreStats(allVotes());
  const voted = getVotedProjects().has(project.id);
  app.innerHTML = `
    <section class="detail-hero theme-${project.theme}">
      <div class="detail-cover">
        <span>${project.id}</span>
        <strong>${project.title}</strong>
      </div>
      <div class="detail-copy">
        <a class="back-link" href="#browse">返回 Browse</a>
        <p class="eyebrow">${project.genre.join(" / ")} · ${project.platform}</p>
        <h1>${project.title}</h1>
        <p>${project.description}</p>
        <div class="tag-row">${project.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
        <div class="detail-actions">
          <a class="btn primary" href="${project.playUrl}" ${project.playUrl === "#" ? "aria-disabled='true'" : ""}>開始遊玩</a>
          <button class="btn ghost" data-action="scroll-vote">${voted ? "已投票" : "匿名投票"}</button>
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
      <form class="panel vote-form" id="voteForm">
        <div class="panel-head">
          <h2>匿名投票與建議</h2>
          <span>${voted ? "本裝置已投過" : "每件作品 1 次"}</span>
        </div>
        <p class="notice">${EVENT_CONFIG.notice}</p>
        ${SCORE_FIELDS.map(([key, label]) => renderRating(key, label)).join("")}
        <label class="field">
          <span>最喜歡的地方</span>
          <textarea name="likedMost" rows="3" placeholder="例如：操作很直覺、角色美術很有記憶點"></textarea>
        </label>
        <label class="field">
          <span>建議改進</span>
          <textarea name="suggestion" rows="3" placeholder="例如：新手提示可以更清楚、音效可以再多一點"></textarea>
        </label>
        <button class="btn primary" type="submit" ${voted ? "disabled" : ""}>${voted ? "已完成投票" : "送出匿名投票"}</button>
        <p id="formMessage" class="form-message"></p>
      </form>
      <article class="panel comments-panel">
        <h2>留言摘錄</h2>
        ${renderComments(stats.votes)}
      </article>
    </section>
  `;
  bindDetailControls(project);
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

function bindDetailControls(project) {
  document.querySelector("[data-action='scroll-vote']").addEventListener("click", () => {
    document.querySelector("#voteSection").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector("#compareToggle").addEventListener("change", (event) => {
    state.compareOverall = event.target.checked;
    renderDetail(project.id);
  });
  document.querySelector("#voteForm").addEventListener("submit", (event) => {
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
  const genreVotes = state.dashboardGenre === "all"
    ? votes
    : votes.filter((vote) => PROJECTS.find((project) => project.id === vote.projectId)?.genre.includes(state.dashboardGenre));
  const stats = scoreStats(genreVotes);
  const topVotes = [...PROJECTS].sort((a, b) => projectStats(b).voteCount - projectStats(a).voteCount).slice(0, 3);
  const topCreativity = bestByScore("creativity");
  const topGameplay = bestByScore("gameplay");
  const topComments = [...PROJECTS].sort((a, b) => projectStats(b).commentCount - projectStats(a).commentCount)[0];
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
      ${PROJECTS.map((project) => `
        <a class="mini-radar panel" href="#detail/${project.id}">
          <h3>${project.id} ${project.title}</h3>
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
        <article><h2>課程主題</h2><p>AI 生成視覺、遊戲設計、HTML/CSS/JS 原型、作品包裝與上架展示。</p></article>
        <article><h2>參與方式</h2><p>觀眾先瀏覽 Browse，進入作品 Detail 試玩，再匿名投票與留下具體建議。</p></article>
        <article><h2>資料原則</h2><p>前台不公開學生姓名、班級、座號或學號，只展示作品代號、內容與統計。</p></article>
      </div>
      <article class="panel schema-panel">
        <h2>後續資料串接建議</h2>
        <p>靜態原型可部署到 GitHub Pages；正式投票建議接 Google Forms + Apps Script + Sheets，或 Supabase/Firebase。前台只讀取彙整後的匿名統計 JSON，不直接公開原始回覆。</p>
        <pre><code>projects: { id, title, cover, genre, tags, platform, shortPitch, description, playUrl, qrUrl }
votes: { projectId, likedMost, suggestion, creativity, art, gameplay, smoothness, completeness, createdAt }
event_config: { title, subtitle, votingRule, rewardRule, notice }</code></pre>
      </article>
    </section>
  `;
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
  return [...PROJECTS].sort((a, b) => projectStats(b).score.scores[key] - projectStats(a).score.scores[key])[0];
}

function mostPopularGenre() {
  const counts = new Map();
  allVotes().forEach((vote) => {
    const project = PROJECTS.find((item) => item.id === vote.projectId);
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

function escapeAttr(value) {
  return String(value).replace(/"/g, "&quot;");
}

window.addEventListener("hashchange", route);
route();
