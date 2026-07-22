(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const searchInput = document.querySelector("[data-search-input]");
  const searchStatus = document.querySelector("[data-search-status]");
  const emptyState = document.querySelector("[data-empty-state]");
  const clearSearch = document.querySelector("[data-clear-search]");
  const cards = [...document.querySelectorAll("[data-card]")];
  const sections = [...document.querySelectorAll("[data-section]")];

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

  function updateSearch() {
    const query = searchInput.value.trim().toLowerCase();
    let resultCount = 0;

    for (const card of cards) {
      const matches = !query || card.dataset.search.includes(query);
      card.classList.toggle("is-searching", Boolean(query));
      card.hidden = Boolean(query) && !matches;
      if (matches) resultCount += 1;
    }

    for (const section of sections) {
      const sectionCards = [...section.querySelectorAll("[data-card]")];
      const hasResults = sectionCards.some((card) => !card.hidden);
      section.hidden = Boolean(query) && !hasResults;

      const showMore = section.querySelector("[data-show-more]");
      if (showMore) showMore.hidden = Boolean(query);
    }

    emptyState.hidden = resultCount !== 0;
    searchStatus.textContent = query
      ? `${resultCount} matching ${resultCount === 1 ? "listing" : "listings"}`
      : `Showing all ${cards.length} listings`;
  }

  searchInput?.addEventListener("input", updateSearch);

  clearSearch?.addEventListener("click", () => {
    searchInput.value = "";
    updateSearch();
    searchInput.focus();
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

    if (event.key === "/" && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      searchInput?.focus();
    }

    if (event.key === "Escape" && document.activeElement === searchInput && searchInput.value) {
      searchInput.value = "";
      updateSearch();
    }
  });

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
})();
