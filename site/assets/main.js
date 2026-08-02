(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const themeColor = document.querySelector('meta[name="theme-color"]');
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
    let resultCount = 0;

    for (const section of sections) {
      const sectionCards = [...section.querySelectorAll("[data-card]")];
      const matchesCategory = !selectedCategory || section.id === selectedCategory;
      let sectionResultCount = 0;

      for (const card of sectionCards) {
        const searchText = searchableCards.get(card);
        const matchesSearch = !isSearching || tokens.every((token) => searchText.includes(token));
        const matches = matchesCategory && matchesSearch;

        card.classList.toggle("is-searching", isSearching);
        card.hidden = !matches;
        if (matches) sectionResultCount += 1;
      }

      resultCount += sectionResultCount;
      section.hidden = !matchesCategory || (isSearching && sectionResultCount === 0);

      const showMore = section.querySelector("[data-show-more]");
      if (showMore) showMore.hidden = isSearching;
    }

    for (const filter of categoryFilters) {
      const active = filter.dataset.categoryFilter === selectedCategory;
      filter.classList.toggle("is-active", active);
      if (active) filter.setAttribute("aria-current", "true");
      else filter.removeAttribute("aria-current");
    }

    const categoryName = selectedCategoryName();
    const listingLabel = resultCount === 1 ? "listing" : "listings";
    const resultLabel = resultCount === 1 ? "result" : "results";

    emptyState.hidden = resultCount !== 0;
    if (resultCount === 0) {
      emptyStateMessage.textContent = categoryName
        ? `No matching listings found in ${categoryName}.`
        : "No matching listings found in any category.";
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
