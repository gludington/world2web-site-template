// Runs Pagefind over dist/ -- but only once there's something to index.
//
// A brand-new site (fresh from the template or a one-click deploy button,
// before the first Publish to Web) has no posts, so every built page is a
// listing page carrying data-pagefind-ignore. Pagefind treats "nothing to
// index" as a hard error (exit 1), which made the very first host build
// fail. That looked broken to new users even though nothing was wrong, so
// this skips indexing until at least one searchable page exists. Any
// *other* Pagefind failure still fails the build.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const SITE_DIR = "dist";

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith(".html")) yield full;
  }
}

// Matches Layout.astro: non-searchable pages render <body data-pagefind-ignore="">.
const IGNORED_BODY_RE = /<body\b[^>]*\bdata-pagefind-ignore\b/;
const hasSearchablePage = [...htmlFiles(SITE_DIR)].some(
  (file) => !IGNORED_BODY_RE.test(readFileSync(file, "utf-8")),
);

if (!hasSearchablePage) {
  console.log("[build-search] No published posts yet -- skipping the search index.");
  process.exit(0);
}

const result = spawnSync("pagefind", ["--site", SITE_DIR], { stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
