export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderCard(item, index, linkCheckFailed = false) {
  const searchText = [item.name, item.description, item.category, item.domain]
    .join(" ")
    .toLowerCase();
  const hiddenClass = index >= 9 ? " is-initially-hidden" : "";
  const itemUrl = escapeHtml(item.url);
  const warning = linkCheckFailed
    ? `
        <span class="listing-card__warning" role="img" aria-label="Automated check could not verify this website. It may still work." title="Automated check could not verify this website. It may still work.">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2 14 14H2L8 2Z" /><path d="M8 6v3.5M8 12h.01" /></svg>
        </span>`
    : "";

  return `
    <article class="listing-card${hiddenClass}" data-card data-search="${escapeHtml(searchText)}">
      <h3 class="listing-card__title">
        <a href="${itemUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.name)}</a>
      </h3>
      <p class="listing-card__description">${escapeHtml(item.description)}</p>
      <div class="listing-card__meta">
        <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" /><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" /></svg>
        <a href="${itemUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.domain)}</a>${warning}
      </div>
    </article>`;
}
