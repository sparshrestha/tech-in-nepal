import test from "node:test";
import assert from "node:assert/strict";
import {
  displayDomain,
  parseCatalog,
  slugify,
  validateCatalog
} from "../scripts/catalog.mjs";
import { renderCard } from "../scripts/render-card.mjs";

const validReadme = `
## Awesome List of Tech in Nepal

## Table of index
- [Software Companies](#software-companies)
- [Education](#education)

## Software Companies
- [Example Labs](https://example.com/) - Builds useful software.

## Education
- [Learn Nepal](https://learn.example.com/path/) - Technology education resources.

## Stargazers over time
`;

test("parses README categories and listings", () => {
  const catalog = parseCatalog(validReadme);

  assert.equal(catalog.categories.length, 2);
  assert.equal(catalog.items.length, 2);
  assert.deepEqual(catalog.categories.map(({ name }) => name), ["Software Companies", "Education"]);
  assert.equal(catalog.items[0].domain, "example.com");
  assert.deepEqual(validateCatalog(catalog), []);
});

test("ignores presentation sections after the catalog", () => {
  for (const heading of ["Stargazers over time", "StarMapper"]) {
    const readme = validReadme.replace("## Stargazers over time", `## ${heading}`);
    const catalog = parseCatalog(readme);

    assert.deepEqual(catalog.categories.map(({ name }) => name), ["Software Companies", "Education"]);
    assert.deepEqual(validateCatalog(catalog), []);
  }
});

test("renders item URLs as safe new-tab links", () => {
  const html = renderCard(
    {
      name: "Example Labs",
      url: "https://example.com/",
      description: "Builds useful software.",
      category: "Software Companies",
      domain: "example.com"
    },
    0
  );
  const links = html.match(/<a\b[^>]*>/g) ?? [];

  assert.equal(links.length, 2);
  for (const link of links) {
    assert.match(link, /href="https:\/\/example\.com\/"/);
    assert.match(link, /target="_blank"/);
    assert.match(link, /rel="noopener noreferrer"/);
  }
});

test("reports malformed listing rows instead of silently dropping them", () => {
  const malformed = validReadme.replace(
    "- [Example Labs](https://example.com/) - Builds useful software.",
    "- [Example Labs](https://example.com/)"
  );
  const errors = validateCatalog(parseCatalog(malformed));

  assert.ok(errors.some((error) => error.includes("must use")));
  assert.ok(errors.some((error) => error.includes("has no listings")));
});

test("requires the README table of index to match categories", () => {
  const missingTocEntry = validReadme.replace("- [Education](#education)\n", "");
  const errors = validateCatalog(parseCatalog(missingTocEntry));

  assert.ok(errors.some((error) => error.includes("table of index")));
});

test("requires listings within each category to be alphabetical", () => {
  const outOfOrder = validReadme.replace(
    "- [Example Labs](https://example.com/) - Builds useful software.",
    [
      "- [Zulu Labs](https://zulu.example.com/) - Builds useful software.",
      "- [Alpha Labs](https://alpha.example.com/) - Builds useful software."
    ].join("\n")
  );
  const errors = validateCatalog(parseCatalog(outOfOrder));

  assert.ok(
    errors.some((error) =>
      error.includes('category "Software Companies" must be alphabetical')
    )
  );
  assert.ok(errors.some((error) => error.includes('"Alpha Labs" should appear before "Zulu Labs"')));
});

test("rejects duplicate normalized URLs", () => {
  const duplicate = validReadme.replace(
    "https://learn.example.com/path/",
    "https://example.com"
  );
  const errors = validateCatalog(parseCatalog(duplicate));

  assert.ok(errors.some((error) => error.includes("duplicates the listing URL")));
});

test("normalizes slugs and friendly platform domains", () => {
  assert.equal(slugify("ISP Internet Service Providers"), "isp-internet-service-providers");
  assert.equal(
    displayDomain("https://play.google.com/store/apps/details?id=example"),
    "Google Play"
  );
});
