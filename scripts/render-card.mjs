export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderCard(item, index) {
  const searchText = [item.name, item.description, item.category, item.domain]
    .join(" ")
    .toLowerCase();
  const hiddenClass = index >= 9 ? " is-initially-hidden" : "";
  const itemUrl = escapeHtml(item.url);

  return `
    <article class="listing-card${hiddenClass}" data-card data-search="${escapeHtml(searchText)}">
      <h3 class="listing-card__title">
        <a href="${itemUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.name)}</a>
      </h3>
      <p class="listing-card__description">${escapeHtml(item.description)}</p>
      <div class="listing-card__meta">
        <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" /><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" /></svg>
        <a href="${itemUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.domain)}</a>
      </div>
    </article>`;
}
