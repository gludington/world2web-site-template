import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

// Resolved here, at config-parse time, rather than in src/lib/config.ts at
// runtime: this file's own import.meta.url is reliable, but a runtime
// module's import.meta.url is NOT once Astro bundles it into a relocated
// build chunk (dist/.prerender/chunks/...), and process.cwd() isn't
// reliable either -- it's wherever the build command happened to be
// invoked from (`cd site && npm run build` vs. running from the repo root
// give different answers), not fixed to this project's root. Baking the
// absolute path in via Vite's `define` sidesteps both problems.
//
// This file lives at the project root, so "./content" (not "../content")
// -- content/ is a child of this repo now, not a sibling one level up like
// it was when the site was developed inside the world2web dev repo.
const CONTENT_DIR = fileURLToPath(new URL("./content", import.meta.url));

// Static output only -- the eventual GM-vs-player build split is still an
// open question, not part of this scaffold.
export default defineConfig({
  output: "static",
  // host: true -- listen on every network interface, not just localhost,
  // so the dev server is reachable from another device on the LAN at all.
  server: {
    host: true,
  },
  vite: {
    define: {
      __WORLD2WEB_CONTENT_DIR__: JSON.stringify(CONTENT_DIR),
    },
    server: {
      // Vite's DNS-rebinding protection rejects any request whose Host
      // header isn't localhost/127.0.0.1/the bound IP -- true disables
      // that check entirely, accepting any hostname. Fine for local dev
      // on a trusted LAN; don't carry this into a publicly reachable
      // deployment (Netlify/Cloudflare's own build output isn't affected
      // either way -- this only governs `astro dev`).
      allowedHosts: true,
    },
  },
});
