import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { catalogSummary, parseCatalog, validateCatalog } from "./catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readme = await readFile(path.join(root, "README.md"), "utf8");
const catalog = parseCatalog(readme);
const errors = validateCatalog(catalog);

if (errors.length > 0) {
  console.error(`Catalog validation failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Catalog validation passed: ${catalogSummary(catalog)}.`);
}

