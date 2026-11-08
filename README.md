# Your World2Web Site

A campaign website for journals published from Foundry VTT with the
[World2Web](https://github.com/gludington/world2web) module.

**You don't need to edit anything here.** World2Web writes your posts into `content/` when you
click **Publish to Web** in Foundry, and keeps the site itself up to date: the site's pages and
styles come from the [`@world2web/site`](https://www.npmjs.com/package/@world2web/site) package,
and Publish to Web updates its version to match your installed module. Update World2Web in
Foundry, publish, and your site gets the new version.

## Getting started

Use World2Web's **Setup Wizard** in Foundry (**Configure Settings → World2Web → Setup Wizard**).
It creates your copy of this repo at Netlify, Cloudflare or Vercel, then walks you through
connecting Foundry to it. The full guide is at
[world2web.loodingdongs.com](https://world2web.loodingdongs.com).

Or deploy directly:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/gludington/world2web-site-template)
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/gludington/world2web-site-template)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/gludington/world2web-site-template)

Your first build shows a "Your site is ready" page until you publish something.

## What's in here

- `content/` — your posts, written by World2Web. Don't edit by hand; the next publish may
  overwrite your changes.
- `public/assets/` — images from your posts, also written by World2Web.
- `astro.config.mjs`, `src/content.config.ts`, `package.json` — a few lines that load the site
  from `@world2web/site`.
- `wrangler.jsonc` — only used if you host on Cloudflare.

## Previewing locally (optional)

```sh
npm install
npm run dev
```

Search needs a full build, so it's empty in `npm run dev`. Run `npm run dev:search` instead: it
builds once and the dev server uses that build's search index (rerun it to pick up new posts).

To try content without publishing: turn on **Enable Dev Mode** in World2Web's settings, click
**Dev Sync** in Foundry, then run `npx world2web-ingest ~/Downloads/world2web-....json` here.

## Customizing (advanced)

Site name, theme and URL layout are World2Web settings in Foundry; most people never need more.

To change the site's code itself, copy the source of
[`@world2web/site`](https://github.com/gludington/world2web/tree/main/packages/site) into this
repo and turn off **Keep Site Up to Date** in World2Web's settings, so publishing stops changing
your site's version. From then on, updating the site is up to you.
