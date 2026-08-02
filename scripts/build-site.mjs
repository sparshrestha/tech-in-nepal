import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { catalogSummary, parseCatalog, validateCatalog } from "./catalog.mjs";
import { categoryMeta } from "./category-meta.mjs";
import { escapeHtml, renderCard } from "./render-card.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, "_site");
const sourceDirectory = path.join(root, "site");

function normalizeBasePath(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed === "/") return "";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

function joinUrl(origin, basePath, suffix = "") {
  const normalizedOrigin = origin.replace(/\/+$/, "");
  const normalizedSuffix = suffix.replace(/^\/+/, "");
  const rootUrl = `${normalizedOrigin}${basePath}/`;
  return normalizedSuffix ? new URL(normalizedSuffix, rootUrl).toString() : rootUrl;
}

function renderCategoryNav(categories) {
  return [{ name: "All", id: "" }, ...categories]
    .map(
      (category) => `
        <li>
          <a
            class="category-chip${category.id ? "" : " is-active"}"
            href="#${escapeHtml(category.id || "catalog")}"
            data-category-filter="${escapeHtml(category.id)}"
            data-category-name="${escapeHtml(category.name)}"${category.id ? "" : ' aria-current="true"'}
          >
            <span>${escapeHtml(category.name)}</span>
          </a>
        </li>`
    )
    .join("");
}

function renderCategorySections(categories) {
  return categories
    .map((category) => {
      const cards = category.items.map(renderCard).join("");
      const meta = categoryMeta[category.name] ?? {
        icon: "◆",
        description: "Community-curated projects and resources connected to Nepal."
      };
      const showMore =
        category.items.length > 9
          ? `
            <button class="show-more" type="button" data-show-more aria-expanded="false">
              <span>Show all ${category.items.length} items</span>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 6 4.5 4 4.5-4" /></svg>
            </button>`
          : "";

      return `
        <section class="catalog-section" id="${escapeHtml(category.id)}" data-section>
          <div class="section-heading">
            <h2><span aria-hidden="true">${meta.icon}</span> ${escapeHtml(category.name)}</h2>
            <span class="section-heading__count">${category.items.length}</span>
          </div>
          <p class="catalog-section__description">${escapeHtml(meta.description)}</p>
          <div class="catalog-grid" data-grid>
            ${cards}
          </div>
          ${showMore}
        </section>`;
    })
    .join("");
}

function renderStructuredData(catalog, config, canonicalUrl) {
  const payload = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: config.title,
    description: config.description,
    url: canonicalUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: catalog.items.length,
      itemListElement: catalog.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: item.url,
        description: item.description
      }))
    }
  };

  return JSON.stringify(payload).replaceAll("<", "\\u003c");
}

function replaceTokens(template, tokens) {
  return Object.entries(tokens).reduce(
    (result, [token, value]) => result.replaceAll(`{{${token}}}`, String(value)),
    template
  );
}

const [readme, template, configSource] = await Promise.all([
  readFile(path.join(root, "README.md"), "utf8"),
  readFile(path.join(sourceDirectory, "index.html"), "utf8"),
  readFile(path.join(root, "site.config.json"), "utf8")
]);

const config = JSON.parse(configSource);
const catalog = parseCatalog(readme);
const validationErrors = validateCatalog(catalog);

if (validationErrors.length > 0) {
  throw new Error(`Catalog validation failed:\n${validationErrors.map((error) => `- ${error}`).join("\n")}`);
}

const basePath = normalizeBasePath(process.env.BASE_PATH ?? config.basePath);
const siteOrigin = (process.env.SITE_ORIGIN ?? config.url).replace(/\/+$/, "");
const canonicalUrl = joinUrl(siteOrigin, basePath);
const assetBase = basePath;
const renderedHtml = replaceTokens(template, {
  ASSET_BASE: escapeHtml(assetBase),
  CANONICAL_URL: escapeHtml(canonicalUrl),
  CATEGORY_NAV: renderCategoryNav(catalog.categories),
  CATEGORY_SECTIONS: renderCategorySections(catalog.categories),
  DESCRIPTION: escapeHtml(config.description),
  REPOSITORY_URL: escapeHtml(config.repositoryUrl),
  SITE_TITLE: escapeHtml(config.title),
  STRUCTURED_DATA: renderStructuredData(catalog, config, canonicalUrl),
  TOTAL_CATEGORIES: catalog.categories.length,
  TOTAL_LISTINGS: catalog.items.length,
  YEAR: new Date().getUTCFullYear()
});

const publicCatalog = {
  version: 1,
  counts: {
    listings: catalog.items.length,
    categories: catalog.categories.length
  },
  categories: catalog.categories.map((category) => ({
    name: category.name,
    id: category.id,
    items: category.items.map(({ name, url, description, domain }) => ({
      name,
      url,
      description,
      domain
    }))
  }))
};

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(path.join(sourceDirectory, "assets"), path.join(outputDirectory, "assets"), {
  recursive: true
});

await Promise.all([
  writeFile(path.join(outputDirectory, "index.html"), renderedHtml),
  writeFile(path.join(outputDirectory, "catalog.json"), `${JSON.stringify(publicCatalog, null, 2)}\n`),
  writeFile(path.join(outputDirectory, ".nojekyll"), ""),
  writeFile(
    path.join(outputDirectory, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${joinUrl(siteOrigin, basePath, "sitemap.xml")}\n`
  ),
  writeFile(
    path.join(outputDirectory, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${escapeHtml(
      canonicalUrl
    )}</loc></url>\n</urlset>\n`
  )
]);

console.log(`Built _site: ${catalogSummary(catalog)}.`);
