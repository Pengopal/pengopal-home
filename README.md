# pengopal.com

The Pengopal company homepage: one static page built with Astro and TypeScript, with a Three.js "code current" hero. A Cloudflare Worker serves the site and handles the contact form.

- Design spec: `docs/superpowers/specs/2026-11-10-pengopal-homepage-design.md`
- Implementation plan: `docs/superpowers/plans/2026-11-10-pengopal-homepage.md`

## Requirements

Node 22.12 or newer. Astro is pinned to 7.3.8 because Astro 7.4+ needs Node 22.23.4. Once Node is upgraded, bump it with `npm i astro@latest`.

## Run

```bash
npm install
npm run dev          # http://localhost:4321
```

The contact form needs the Worker. To run it locally, build first and then run the Worker:

```bash
npm run build && npx wrangler dev
```

## Where things live

| What | File |
|---|---|
| All page text, links, form wording | `src/content/site.ts` |
| Colours, type, spacing, motion | `src/styles/tokens.css` |
| Shared styles (buttons, focus ring, sections) | `src/styles/global.css` |
| Logo (light and dark) | `public/brand/logo-light.svg`, `public/brand/logo-dark.svg` |
| One component per section | `src/components/` |
| 3D code stream (only file importing three.js) | `src/codestream/mount.ts` |
| Contact form server side | `worker/` |

To edit copy, change `site.ts` only. The tests block a few things that must never appear on the site: Pakistan or time zones, GitHub links, and reply-time promises.

## Build and test

```bash
npm run check        # astro check + TypeScript
npm test             # unit tests (Vitest)
npm run build
npm run test:e2e     # browser tests in Chromium, Firefox and WebKit (uses the built site)
npm run lhci         # Lighthouse, mobile: 95+ in all four categories
node scripts/screenshots.mjs   # light, dark and phone screenshots into screenshots/
```

Run `npx playwright install chromium firefox webkit` once before the browser tests.

## Regenerating brand assets

```bash
npm run assets                     # dark logo + share image (public/og.png) from logo-light.svg
node scripts/sample-palette.mjs    # code-stream colours, sampled from ../Brand Assets/Brand_logo_original.jpg
```

The stream colours are always sampled from the logo, never picked by hand.

## Deploy (Cloudflare Workers)

These steps need your Cloudflare login, so they're yours to run.

1. **Turnstile (spam check).** In the Cloudflare dashboard, go to Turnstile and add a widget for `pengopal.com` in Managed mode. Put the site key in a `.env` file in this folder:
   ```
   PUBLIC_TURNSTILE_SITE_KEY=your-site-key
   ```
   Without it, the site uses Cloudflare's always-pass test key, which is fine locally and wrong in production.
2. **Secrets.** These are never committed:
   ```bash
   npx wrangler secret put TURNSTILE_SECRET   # the widget's secret key
   npx wrangler secret put CONTACT_TO         # the inbox that receives enquiries
   ```
   `CONTACT_TO` must be a **verified destination address** in Email Routing. That's the inbox hello@pengopal.com already forwards to. Sending to a verified address is free.
3. **Email Routing.** Check that it's enabled for pengopal.com. Enquiries are sent from `website@pengopal.com`, with reply-to set to the visitor.
4. **Deploy.**
   ```bash
   npm run build && npx wrangler deploy
   ```
5. **Domains.** In the Worker's settings, add `pengopal.com` and `www.pengopal.com` as custom domains, and redirect `www` to the apex with a redirect rule.

### After the first deploy

Send one real enquiry through the form and check that it arrives. If it lands in spam, mark `website@pengopal.com` as a safe sender in your inbox.

If sending ever fails, visitors see a "didn't send" message with a ready-filled email link, so no enquiry is lost.
