import { URL } from "node:url";

const HEADING_PATTERN = /^##\s+(.+?)\s*$/;
const TOC_ITEM_PATTERN = /^- \[([^\]]+)\]\(#([^)]+)\)\s*$/;
const LISTING_PATTERN = /^- \[([^\]]+)\]\(([^)]+)\) - (.+?)\s*$/;
const LISTING_LIKE_PATTERN = /^- \[[^\]]+\]\([^)]+\)/;
const POST_CATALOG_HEADINGS = new Set(["Stargazers over time", "StarMapper"]);

export function slugify(value) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function displayDomain(value) {
  try {
    const host = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    const labels = {
      "play.google.com": "Google Play",
      "youtube.com": "YouTube",
      "facebook.com": "Facebook",
      "twitter.com": "Twitter"
    };

    return labels[host] ?? host;
  } catch {
    return value;
  }
}

export function normalizeUrl(value) {
  const parsed = new URL(value);
  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();

  if (parsed.pathname !== "/") {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }

  return parsed.toString();
}

export function parseCatalog(markdown) {
  const lines = markdown.split(/\r?\n/);
  const categories = [];
  const toc = [];
  const issues = [];
  let state = "preamble";
  let currentCategory = null;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const headingMatch = line.match(HEADING_PATTERN);

    if (headingMatch) {
      const heading = headingMatch[1].trim();

      if (heading === "Table of index") {
        state = "toc";
        currentCategory = null;
        return;
      }

      if (POST_CATALOG_HEADINGS.has(heading)) {
        state = "done";
        currentCategory = null;
        return;
      }

      if (state === "toc" || state === "catalog") {
        state = "catalog";
        currentCategory = {
          name: heading,
          id: slugify(heading),
          items: [],
          line: lineNumber
        };
        categories.push(currentCategory);
      }

      return;
    }

    if (state === "toc") {
      const tocMatch = line.match(TOC_ITEM_PATTERN);
      if (tocMatch) {
        toc.push({ name: tocMatch[1].trim(), id: tocMatch[2].trim(), line: lineNumber });
      }
      return;
    }

    if (state !== "catalog" || !currentCategory || !LISTING_LIKE_PATTERN.test(line)) {
      return;
    }

    const listingMatch = line.match(LISTING_PATTERN);
    if (!listingMatch) {
      issues.push(
        `README.md:${lineNumber} must use "- [Name](https://example.com) - Description".`
      );
      return;
    }

    const name = listingMatch[1].trim();
    const url = listingMatch[2].trim();
    const description = listingMatch[3].trim();

    currentCategory.items.push({
      name,
      url,
      description,
      category: currentCategory.name,
      categoryId: currentCategory.id,
      domain: displayDomain(url),
      line: lineNumber
    });
  });

  return {
    categories,
    toc,
    items: categories.flatMap((category) => category.items),
    issues
  };
}

export function validateCatalog(catalog) {
  const errors = [...catalog.issues];

  if (catalog.categories.length === 0) {
    errors.push("README.md contains no catalog categories after the table of index.");
  }

  const categoryIds = new Set();
  for (const category of catalog.categories) {
    if (!category.id) {
      errors.push(`README.md:${category.line} category "${category.name}" has no valid anchor.`);
    } else if (categoryIds.has(category.id)) {
      errors.push(`README.md:${category.line} duplicates category anchor "${category.id}".`);
    }
    categoryIds.add(category.id);

    if (category.items.length === 0) {
      errors.push(`README.md:${category.line} category "${category.name}" has no listings.`);
    }
  }

  const expectedToc = catalog.categories.map(({ name, id }) => `${name}|${id}`);
  const actualToc = catalog.toc.map(({ name, id }) => `${name}|${id}`);

  if (expectedToc.join("\n") !== actualToc.join("\n")) {
    errors.push(
      "README.md table of index must contain every catalog category, in the same order and with matching anchors."
    );
  }

  const seenUrls = new Map();
  for (const item of catalog.items) {
    if (!item.name) {
      errors.push(`README.md:${item.line} listing name cannot be empty.`);
    }

    if (!item.description) {
      errors.push(`README.md:${item.line} listing description cannot be empty.`);
    }

    let normalized;
    try {
      const parsed = new URL(item.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error("unsupported protocol");
      }
      normalized = normalizeUrl(item.url);
    } catch {
      errors.push(`README.md:${item.line} listing URL must be a valid HTTP or HTTPS URL.`);
      continue;
    }

    const previousLine = seenUrls.get(normalized);
    if (previousLine) {
      errors.push(
        `README.md:${item.line} duplicates the listing URL already used on line ${previousLine}.`
      );
    } else {
      seenUrls.set(normalized, item.line);
    }
  }

  return errors;
}

export function catalogSummary(catalog) {
  return `${catalog.items.length} listings across ${catalog.categories.length} categories`;
}
