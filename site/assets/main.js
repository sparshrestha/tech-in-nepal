(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const githubLink = document.querySelector("[data-github-repository]");
  const githubStars = document.querySelector("[data-github-stars]");
  const githubStarCount = document.querySelector("[data-github-star-count]");
  const backToTop = document.querySelector("[data-back-to-top]");
  const searchInput = document.querySelector("[data-search-input]");
  const searchStatus = document.querySelector("[data-search-status]");
  const emptyState = document.querySelector("[data-empty-state]");
  const emptyStateMessage = document.querySelector("[data-empty-state-message]");
  const clearSearch = document.querySelector("[data-clear-search]");
  const clearFilters = document.querySelector("[data-clear-filters]");
  const cards = [...document.querySelectorAll("[data-card]")];
  const sections = [...document.querySelectorAll("[data-section]")];
  const categoryFilters = [...document.querySelectorAll("[data-category-filter]")];
  const validCategories = new Set(sections.map((section) => section.id));
  let selectedCategory = "";

  function setTheme(theme) {
    root.dataset.theme = theme;
    try {
      localStorage.setItem("tech-in-nepal-theme", theme);
    } catch {
      // Theme switching still works when browser storage is unavailable.
    }
    themeColor?.setAttribute("content", theme === "dark" ? "#0f0f0f" : "#ffffff");
    themeToggle?.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  setTheme(root.dataset.theme === "dark" ? "dark" : "light");

  themeToggle?.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  function showGithubStars(count) {
    const formattedCount = new Intl.NumberFormat("en-US").format(count);
    const starLabel = count === 1 ? "star" : "stars";

    githubStarCount.textContent = formattedCount;
    githubStars.classList.add("is-visible");
    githubLink.setAttribute(
      "aria-label",
      `Tech in Nepal on GitHub, ${formattedCount} ${starLabel}`
    );
  }

  async function loadGithubStars() {
    if (!githubLink || !githubStars || !githubStarCount) return;

    let repositoryUrl;
    try {
      repositoryUrl = new URL(githubLink.dataset.githubRepository);
    } catch {
      return;
    }

    const [owner, repositoryName] = repositoryUrl.pathname.split("/").filter(Boolean);
    const repository = repositoryName?.replace(/\.git$/i, "");
    if (repositoryUrl.hostname !== "github.com" || !owner || !repository) return;

    const cacheKey = `tech-in-nepal:github-stars:${owner}/${repository}`;
    const cacheLifetime = 30 * 60 * 1000;

    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey));
      const cacheIsFresh =
        Number.isInteger(cached?.count) &&
        cached.count >= 0 &&
        Number.isFinite(cached?.cachedAt) &&
        Date.now() - cached.cachedAt < cacheLifetime;

      if (cacheIsFresh) {
        showGithubStars(cached.count);
        return;
      }
    } catch {
      // Fetch a fresh count when browser storage is unavailable or invalid.
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
        {
          credentials: "omit",
          headers: { Accept: "application/vnd.github+json" },
          signal: controller.signal
        }
      );
      if (!response.ok) return;

      const payload = await response.json();
      const count = Number(payload.stargazers_count);
      if (!Number.isInteger(count) || count < 0) return;

      showGithubStars(count);
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ count, cachedAt: Date.now() }));
      } catch {
        // The live count can still be shown when browser storage is unavailable.
      }
    } catch {
      // Keep the GitHub link usable and hide the count when the request fails.
    } finally {
      window.clearTimeout(timeout);
    }
  }

  void loadGithubStars();

  function updateBackToTop() {
    if (!backToTop) return;
    const revealAfter = Math.min(600, window.innerHeight * 0.8);
    backToTop.hidden = window.scrollY <= revealAfter;
  }

  window.addEventListener("scroll", updateBackToTop, { passive: true });
  window.addEventListener("resize", updateBackToTop);
  backToTop?.addEventListener("click", () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
  updateBackToTop();

  function normalizeSearchText(value) {
    return String(value)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  }

  const searchableCards = new Map(
    cards.map((card) => [card, normalizeSearchText(card.dataset.search)])
  );

  function queryTokens(value) {
    const normalized = normalizeSearchText(value);
    return normalized ? normalized.split(/\s+/) : [];
  }

  function selectedCategoryName() {
    if (!selectedCategory) return "";

    return categoryFilters.find(
      (filter) => filter.dataset.categoryFilter === selectedCategory
    )?.dataset.categoryName;
  }

  function updateUrl(mode = "replace") {
    const url = new URL(window.location.href);
    const query = searchInput.value.trim();

    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");

    if (selectedCategory) url.searchParams.set("category", selectedCategory);
    else url.searchParams.delete("category");

    url.hash = "";
    window.history[`${mode}State`]({}, "", `${url.pathname}${url.search}`);
  }

  function updateCatalog() {
    const query = searchInput.value.trim();
    const tokens = queryTokens(query);
    const isSearching = tokens.length > 0;
    const categoryMatchCounts = new Map();
    let resultCount = 0;

    for (const section of sections) {
      const sectionCards = [...section.querySelectorAll("[data-card]")];
      const matchesCategory = !selectedCategory || section.id === selectedCategory;
      let categoryMatchCount = 0;
      let sectionResultCount = 0;

      for (const card of sectionCards) {
        const searchText = searchableCards.get(card);
        const matchesSearch = !isSearching || tokens.every((token) => searchText.includes(token));
        const matches = matchesCategory && matchesSearch;

        card.classList.toggle("is-searching", isSearching);
        card.hidden = !matches;
        if (matchesSearch) categoryMatchCount += 1;
        if (matches) sectionResultCount += 1;
      }

      categoryMatchCounts.set(section.id, categoryMatchCount);
      resultCount += sectionResultCount;
      section.hidden = !matchesCategory || (isSearching && sectionResultCount === 0);

      const showMore = section.querySelector("[data-show-more]");
      if (showMore) showMore.hidden = isSearching;
    }

    for (const filter of categoryFilters) {
      const category = filter.dataset.categoryFilter;
      const matchCount = categoryMatchCounts.get(category) ?? 0;
      const active = category === selectedCategory;
      const hasMatches = Boolean(category) && isSearching && matchCount > 0;

      filter.classList.toggle("is-active", active);
      filter.classList.toggle("has-matches", hasMatches);
      if (active) filter.setAttribute("aria-current", "true");
      else filter.removeAttribute("aria-current");

      if (hasMatches) {
        const listingLabel = matchCount === 1 ? "listing" : "listings";
        filter.setAttribute(
          "aria-label",
          `${filter.dataset.categoryName}, ${matchCount} matching ${listingLabel}`
        );
      } else {
        filter.removeAttribute("aria-label");
      }
    }

    const categoryName = selectedCategoryName();
    const listingLabel = resultCount === 1 ? "listing" : "listings";
    const resultLabel = resultCount === 1 ? "result" : "results";

    emptyState.hidden = resultCount !== 0;
    if (resultCount === 0) {
      emptyStateMessage.textContent = categoryName
        ? `Not found in ${categoryName}.`
        : "Not found in any category.";
    }
    clearFilters.hidden = !query && !selectedCategory;
    root.classList.toggle("has-search-query", isSearching);

    if (query && categoryName) {
      searchStatus.textContent = `${resultCount} ${resultLabel} for “${query}” in ${categoryName}`;
    } else if (query) {
      searchStatus.textContent = `${resultCount} ${resultLabel} for “${query}”`;
    } else if (categoryName) {
      searchStatus.textContent = `${resultCount} ${listingLabel} in ${categoryName}`;
    } else {
      searchStatus.textContent = `Showing all ${cards.length} listings`;
    }
  }

  function readUrlState() {
    const url = new URL(window.location.href);
    const category = url.searchParams.get("category") ?? "";

    searchInput.value = url.searchParams.get("q") ?? "";
    selectedCategory = validCategories.has(category) ? category : "";
    updateCatalog();
  }

  function clearAllFilters(mode = "push") {
    searchInput.value = "";
    selectedCategory = "";
    updateCatalog();
    updateUrl(mode);
    searchInput.focus();
  }

  searchInput?.addEventListener("input", () => {
    updateCatalog();
    updateUrl("replace");
  });

  categoryFilters.forEach((filter) => {
    filter.addEventListener("click", (event) => {
      event.preventDefault();
      const category = filter.dataset.categoryFilter;
      if (category === selectedCategory) return;

      selectedCategory = category;
      updateCatalog();
      updateUrl("push");
    });
  });

  clearSearch?.addEventListener("click", () => {
    clearAllFilters();
  });

  clearFilters?.addEventListener("click", () => clearAllFilters());

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

    if (event.key === "/" && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      searchInput?.focus();
    }

    if (event.key === "Escape" && document.activeElement === searchInput && searchInput.value) {
      searchInput.value = "";
      updateCatalog();
      updateUrl("replace");
    }
  });

  window.addEventListener("popstate", readUrlState);

  document.querySelectorAll("[data-show-more]").forEach((button) => {
    const section = button.closest("[data-section]");
    const count = section.querySelectorAll("[data-card]").length;

    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      section.classList.toggle("is-expanded", !expanded);
      button.querySelector("span").textContent = expanded ? `Show all ${count} items` : "Show less";
    });
  });

  readUrlState();
})();
