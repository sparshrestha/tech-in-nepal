import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseCatalog } from "./catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readme = await readFile(path.join(root, "README.md"), "utf8");
const catalog = parseCatalog(readme);
const httpListings = catalog.items.filter((item) => item.url.startsWith("http://"));
const requestTimeout = 10_000;
const redirectLimit = 6;

function describeError(error) {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause;

  if (cause instanceof Error && cause.message && cause.message !== error.message) {
    return `${error.message}: ${cause.message}`;
  }

  return error.message;
}

async function inspectRedirects(listing) {
  let currentUrl = new URL(listing.url);
  const chain = [];

  try {
    for (let redirect = 0; redirect <= redirectLimit; redirect += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), requestTimeout);
      let response;

      try {
        response = await fetch(currentUrl, {
          redirect: "manual",
          signal: controller.signal,
          headers: {
            Accept: "text/html,application/xhtml+xml",
            "User-Agent": "tech-in-nepal-url-audit/1.0"
          }
        });
      } finally {
        clearTimeout(timeout);
      }

      chain.push({ status: response.status, url: currentUrl.toString() });
      const location = response.headers.get("location");
      await response.body?.cancel();

      if (response.status >= 300 && response.status < 400 && location) {
        currentUrl = new URL(location, currentUrl);
        continue;
      }

      return {
        listing,
        chain,
        finalUrl: currentUrl.toString(),
        redirectsToHttps: currentUrl.protocol === "https:"
      };
    }

    return {
      listing,
      chain,
      error: `exceeded ${redirectLimit} redirects`,
      finalUrl: currentUrl.toString(),
      redirectsToHttps: false
    };
  } catch (error) {
    return {
      listing,
      chain,
      error: describeError(error),
      finalUrl: currentUrl.toString(),
      redirectsToHttps: false
    };
  }
}

async function inspectAll(listings, concurrency = 4) {
  const results = new Array(listings.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < listings.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await inspectRedirects(listings[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, listings.length) }, () => worker())
  );
  return results;
}

if (httpListings.length === 0) {
  console.log("HTTP URL audit passed: all catalog listings use HTTPS.");
} else {
  console.log(
    `HTTP URL audit: ${httpListings.length} plaintext URL${httpListings.length === 1 ? "" : "s"}.`
  );

  const results = await inspectAll(httpListings);
  const redirects = results.filter((result) => result.redirectsToHttps);
  const insecure = results.filter((result) => !result.redirectsToHttps && !result.error);
  const failed = results.filter((result) => result.error);

  console.log(`\nRedirects to HTTPS (${redirects.length}):`);
  redirects.forEach(({ listing, finalUrl, chain }) => {
    const statuses = chain.map(({ status }) => status).join(" -> ");
    console.log(`- README.md:${listing.line} ${listing.name}: ${listing.url} -> ${finalUrl} (${statuses})`);
  });

  console.log(`\nRemains on HTTP (${insecure.length}):`);
  insecure.forEach(({ listing, finalUrl, chain }) => {
    const status = chain.at(-1)?.status ?? "unknown status";
    console.log(`- README.md:${listing.line} ${listing.name}: ${finalUrl} (${status})`);
  });

  console.log(`\nCould not verify (${failed.length}):`);
  failed.forEach(({ listing, error }) => {
    console.log(`- README.md:${listing.line} ${listing.name}: ${listing.url} (${error})`);
  });
}
