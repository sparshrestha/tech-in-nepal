import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { categoryMeta, renderCategoryIcon } from "../scripts/category-meta.mjs";
import { parseCatalog } from "../scripts/catalog.mjs";

function issueFormCategories(source) {
  const lines = source.split(/\r?\n/);
  const categoryId = lines.findIndex((line) => line.trim() === "id: category");
  const options = lines.findIndex(
    (line, index) => index > categoryId && line.trim() === "options:"
  );

  assert.notEqual(categoryId, -1, "listing issue form must define the category field");
  assert.notEqual(options, -1, "listing issue form category field must define options");

  const categories = [];
  for (const line of lines.slice(options + 1)) {
    if (!line.startsWith("        - ")) break;
    categories.push(line.slice(10));
  }

  return categories;
}

test("category metadata and submission options match the README catalog", async () => {
  const [readme, issueForm] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../.github/ISSUE_TEMPLATE/listing.yml", import.meta.url), "utf8")
  ]);
  const catalogCategories = parseCatalog(readme).categories.map(({ name }) => name);

  assert.deepEqual(Object.keys(categoryMeta), catalogCategories);
  assert.deepEqual(issueFormCategories(issueForm), [
    ...catalogCategories,
    "New category proposal"
  ]);

  for (const [name, meta] of Object.entries(categoryMeta)) {
    assert.ok(meta.icon, `${name} must define an icon`);
    const renderedIcon = renderCategoryIcon(meta.icon);
    assert.match(renderedIcon, /^<svg class="category-icon"/);
    assert.match(renderedIcon, /width="1em" height="1em" fill="none" stroke="currentColor"/);
    assert.ok(meta.description, `${name} must define a description`);
  }
});
