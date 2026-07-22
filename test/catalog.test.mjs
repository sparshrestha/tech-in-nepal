import test from "node:test";
import assert from "node:assert/strict";
import {
  displayDomain,
  parseCatalog,
  slugify,
  validateCatalog
} from "../scripts/catalog.mjs";

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

