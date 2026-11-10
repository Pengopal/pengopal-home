# Pengopal Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and ship pengopal.com: a single-page company site with a Three.js "code current" hero and a working contact form, on Cloudflare Workers.

**Architecture:** Astro builds a fully static page from typed copy (`src/content/site.ts`) and design tokens (`src/styles/tokens.css`). A server-rendered SVG poster of the code stream is the first paint; Three.js is imported only after load and mounts over it. One Cloudflare Worker serves the static assets and handles `POST /api/contact`. That handler is a pure function with injected Turnstile and mail dependencies, so it is unit-tested without Cloudflare.

**Tech Stack:** Astro 7 (static output), TypeScript (strict), Three.js, Vitest, Playwright + @axe-core/playwright, @lhci/cli, Wrangler, @fontsource (Lexend, Inter, JetBrains Mono), @resvg/resvg-js and sharp (build scripts and tests only).

**Spec:** `docs/superpowers/specs/2026-11-10-pengopal-homepage-design.md`. Executors read it alongside this plan.

## Global Constraints

- Node ≥ 22.12 (Astro 7 requirement; this machine has 22.18). Install the latest stable version of each dependency and commit the lockfile.
- Copy comes only from `src/content/site.ts`. Components contain no user-visible strings.
- Never write "Pakistan", "time zone", "UTC", "PKT", a reply-time promise, GitHub links, testimonials, client logos, stats, years in business or team members.
- Headline: "Software and AI, built end to end." with "built end to end." as deep-opal gradient text.
- Sub-line: "Pengopal is a founder-led studio building web apps, AI features, and secure multi-tenant SaaS — from first commit to production."
- Colours, fonts, spacing, radii, durations and easing come only from `tokens.css` custom properties. No literal values in components.
- Code-stream colours come only from `src/codestream/palette.generated.ts`, which is generated from `../Brand Assets/Brand_logo_original.jpg`. They are never hand-picked.
- Every animation ends in a static state. Under `prefers-reduced-motion: reduce`, everything renders in its final state and no canvas mounts.
- Furqan's private inbox appears only in the Worker secret `CONTACT_TO`, never in the repo. The Turnstile secret is only in the `TURNSTILE_SECRET` secret.
- Hosting is Cloudflare Workers with Static Assets (not Pages). `wrangler.jsonc` binds `ASSETS` and `send_email` `EMAIL`.
- Work on branch `feat/homepage`, created from `main` before Task 1. Commit after every task. Never push. There is no remote yet.

## Review Focus

1. **Double-submit on a slow network.** A second click while a request is in flight must not send a second email. Test: Task 12, `submit button is disabled while sending`.
2. **The 3D chunk fails to load (offline or blocked).** The poster must stay and the page must not break. Test: Task 7, `poster stays when the three.js chunk fails`.
3. **Anchor link lands a heading under the sticky header.** Clicking a nav link must leave the section heading fully visible. Test: Task 4, `anchor target heading is not hidden by the header`.
4. **A bad stored theme value or blocked `localStorage`.** The page must follow the system theme without throwing. Test: Task 1, `invalid stored theme falls back to system`.
5. **Non-ASCII and maximum-length enquiries** (Arabic text, emoji, exactly 4000 characters). These must be accepted and sent intact as UTF-8. Test: Task 11, `accepts 4000-char Arabic + emoji message`.

## UI checklist (carried by every task that changes what the user sees)

```
pengopal.com single page — no reference page exists (greenfield repo; no pages near in kind).
This checklist is a proposal derived from the approved spec, read 2026-11-10; the code wins once written.

- [ ] page holder — src/layouts/Base.astro: <html lang="en" data-theme>, theme set by an inline <head> script before paint; one <header>, one <main>, one <footer> — as asked (spec §3, §4)
- [ ] sections — <section id=… aria-labelledby=…> per spec §3 anchor; h1 only in the hero, h2 per section, h3 for card/step titles — as asked (spec §3); the element whose meaning each role has
- [ ] navigation — <nav aria-label="Primary"> of <a href="#…">; on phones a <button aria-expanded aria-controls> disclosure — as asked (spec §3.1)
- [ ] links vs actions — navigation is <a>, actions are <button>; both styled only through the shared .btn classes (.btn--primary, .btn--secondary) in src/styles/global.css — proposal, see "Question" below
- [ ] lists — deliverables <ul>, process steps <ol>, terminal lines <ul role="list"> — the element whose meaning each role has
- [ ] colour, type, spacing, radius, motion — only var(--…) from src/styles/tokens.css; no literal in any component — as asked (spec §4)
- [ ] spacing — the token scale --space-1…--space-9 = 4, 8, 12, 16, 24, 32, 48, 64, 96 px; page gutter --space-4 (16px); content max --content-max 1200px; card radius --radius-card 12px — gutter, max and radius as asked (spec §4); the 4px base is a proposal
- [ ] type roles — h1: Lexend 600, clamp(2.5rem, 5vw + 1rem, 4rem), line-height 1.05, letter-spacing -0.02em; h2: Lexend 600, clamp(1.75rem, 2vw + 1rem, 2.5rem), line-height 1.15; h3: Lexend 600, 1.25rem, line-height 1.3; body: Inter 400, 1.0625rem, line-height 1.6; label/code: JetBrains Mono 400, 0.8125rem, line-height 1.5; sizes in rem so they follow the reader's text setting — families and weights as asked (spec §4); sizes are a proposal
- [ ] motion — only through src/motion/reveal.ts (onReveal, prefersReducedMotion); plays once; final state under reduced motion; --ease-out cubic-bezier(.2,.7,.2,1), --dur-1 400ms, --dur-2 700ms — as asked (spec §4)
- [ ] focus — :focus-visible ring 2px var(--focus) offset 2px on every interactive element; --focus = #5F6BFF light / #8FA8FF dark — proposal
- [ ] form — native <form>; every field has a <label for>; error text under its field, tied with aria-describedby, field marked aria-invalid; submit disabled while Turnstile is not ready and while sending — as asked (spec §3.6, §7)
- [ ] not copied from the mockup (.superpowers/brainstorm/…/visual-direction.html): its inline styles, pixel sizes, hand-picked particle colours and 2D canvas code — only the idea (glyphs flowing from the wake, bending around the cursor) carries over
```

Accessibility: the project states WCAG 2.1 AA (spec §8), so each section's check also runs `ui-consistency:accessibility`.

**Question waiting on Furqan (asked with this plan, separate from the plan's yes):** two new shared pieces the spec does not name.
- `.btn` classes in `src/styles/global.css`, used by Header, Hero and Contact (3 files). A no means each component styles its own buttons.
- Service icons as `src/components/icons/{Brackets,Spark,Key}.astro`, used by ServiceCard only (1 file). A no means the icons are written inline inside ServiceCard.

Tasks 4, 7, 8 and 12 are `parked — waiting on the shared-pieces answer` until it arrives.

---

### Task 1: Scaffold, tokens, base layout, theme

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/fonts.css`, `src/layouts/Base.astro`, `src/pages/index.astro`, `src/scripts/theme.ts`
- Test: `tests/unit/theme.test.ts`, `tests/e2e/theme.spec.ts`

**Interfaces:**
- Produces: `Base.astro` props `{ title: string; description: string }` with a default slot. `theme.ts` exports `resolveTheme(stored: string | null, systemDark: boolean): 'light' | 'dark'` and `THEME_KEY = 'pengopal-theme'`. `tokens.css` defines every custom property named in the UI checklist plus the colour tokens from spec §4: `--bg`, `--bg-soft`, `--ink`, `--navy`, `--gold`, `--muted`, `--text`, `--opal-light`, `--opal-deep` (as `linear-gradient(…)` values), `--focus`. Dark values are set under `[data-theme="dark"]`.
- npm scripts: `dev`, `build`, `preview`, `check` (astro check + tsc --noEmit), `test` (vitest run), `test:e2e` (playwright test), `lhci`.

- [ ] **Step 1: Create branch and scaffold.** `git switch -c feat/homepage`, then `npm create astro@latest . -- --template minimal --typescript strict --no-git --install`. Add `@fontsource/lexend`, `@fontsource/inter`, `@fontsource/jetbrains-mono`, `vitest`, `@playwright/test`, `@axe-core/playwright`, `@astrojs/sitemap`. Run `npx playwright install chromium firefox webkit`. Set `site: 'https://pengopal.com'` and `output: 'static'` in `astro.config.mjs`.
- [ ] **Step 2: Write the failing unit test** `tests/unit/theme.test.ts`:

```ts
import { resolveTheme } from '../../src/scripts/theme';
test('stored light/dark wins', () => { expect(resolveTheme('dark', false)).toBe('dark'); expect(resolveTheme('light', true)).toBe('light'); });
test('no stored value follows system', () => { expect(resolveTheme(null, true)).toBe('dark'); expect(resolveTheme(null, false)).toBe('light'); });
test('invalid stored theme falls back to system', () => { expect(resolveTheme('purple', true)).toBe('dark'); });
```

- [ ] **Step 3: Run** `npm test`. Expected: FAIL, module not found.
- [ ] **Step 4: Implement** `resolveTheme` in `src/scripts/theme.ts`. Write `Base.astro`:
  - `<head>`: an inline `is:inline` script that wraps `localStorage.getItem(THEME_KEY)` in try/catch and sets `document.documentElement.dataset.theme` before paint. The logic is duplicated inline because the module cannot run before paint; keep it identical to `resolveTheme`.
  - Meta charset and viewport, `title`, `description`.
  - `fonts.css` imports only `@fontsource/lexend/latin-600.css`, `@fontsource/inter/latin-400.css`, `inter/latin-500.css`, `jetbrains-mono/latin-400.css`, `jetbrains-mono/latin-600.css` and `jetbrains-mono/greek-400.css` (for λ).
  - Preload the Lexend 600 and Inter 400 woff2 files.
  - `index.astro` renders `Base` with an empty `<main>`.
- [ ] **Step 5: Write e2e** `tests/e2e/theme.spec.ts`:
  - `invalid stored theme falls back to system`: set `localStorage['pengopal-theme']='purple'` via `addInitScript`, `colorScheme:'dark'`, expect `html[data-theme="dark"]`.
  - `blocked storage does not throw`: an init script that makes `localStorage.getItem` throw; expect no page errors and `data-theme` set.
- [ ] **Step 6: Run** `npm test && npm run build && npm run test:e2e -- theme`. Expected: all PASS, build OK.
- [ ] **Step 7: Commit** `feat: scaffold Astro site with tokens, base layout and theme`.

### Task 2: Typed site copy

**Files:**
- Create: `src/content/site.ts`
- Test: `tests/unit/site.test.ts`

**Interfaces:**
- Produces `export const site: Site` and these types:
  - `Site = { meta: { title: string; description: string; url: string }; nav: { label: string; href: `#${string}` }[]; hero: { lead: string; highlight: string; sub: string; primary: Cta; secondary: Cta }; services: Service[]; process: { steps: { title: string; body: string }[]; note: string }; openSource: { title: string; status: 'Coming soon'; description: string; features: string[]; href?: string }; contact: { heading: string; line: string; email: 'hello@pengopal.com'; timelines: readonly ['As soon as possible', '1–3 months', '3+ months', 'Just exploring']; turnstileSiteKey: string }; footer: { company: 'Pengopal Technologies'; linkedin: 'https://www.linkedin.com/in/furqan26' } }`
  - `Cta = { label: string; href: `#${string}` }`
  - `Service = { id: 'web' | 'ai' | 'identity'; title: string; outcome: string; deliverables: string[]; icon: 'brackets' | 'spark' | 'key' }`

- [ ] **Step 1: Write the failing test** `tests/unit/site.test.ts`:

```ts
import { site } from '../../src/content/site';
const all = JSON.stringify(site);
test('headline split', () => { expect(site.hero.lead + ' ' + site.hero.highlight).toBe('Software and AI, built end to end.'); });
test('three services with four deliverables each', () => { expect(site.services.map(s => s.id)).toEqual(['web','ai','identity']); site.services.forEach(s => expect(s.deliverables).toHaveLength(4)); });
test('four process steps', () => { expect(site.process.steps.map(s => s.title)).toEqual(['Discovery call','Plan & estimate','Build in weekly milestones','Launch & support']); });
test('forbidden content absent', () => { for (const w of [/pakistan/i,/time ?zone/i,/\bUTC\b/,/\bPKT\b/,/github/i,/within \w+ (working )?days/i]) expect(all).not.toMatch(w); });
test('open-source card has no link yet', () => { expect(site.openSource.href).toBeUndefined(); expect(site.openSource.status).toBe('Coming soon'); });
test('nav targets exist', () => { expect(site.nav.map(n => n.href)).toEqual(['#services','#how-we-work','#open-source','#contact']); });
```

- [ ] **Step 2: Run** `npm test -- site`. Expected: FAIL.
- [ ] **Step 3: Write `site.ts`** with the exact copy from spec §2 and §3.2–§3.7: service titles, outcomes and deliverables, step titles and bodies, the process note, the open-source description, contact heading "Start a project" and line "Tell us what you're building.", and `meta.title` "Pengopal — Software and AI, built end to end". `features` (for the terminal) comes from the open-source description, as 4 short lines, for example "shared realm + Organizations", "realm-per-tenant for enterprise", "Postgres row-level security", "one-command Docker deploy". Set `turnstileSiteKey` to `import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'` (Cloudflare's always-pass test key).
- [ ] **Step 4: Run** `npm test -- site`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add typed site copy`.

### Task 3: Logo assets, dark variant, favicons, OG image

**Files:**
- Create: `scripts/make-dark-logo.mjs`, `scripts/make-og.mjs`, `public/brand/logo-light.svg` (copy of `../Brand Assets/web-ready/logo-horizontal/pengopal-horizontal-light.svg`), `public/brand/logo-dark.svg` (generated), `public/og.png` (generated), `public/favicon.svg`, `public/favicon.ico`, `public/favicon-16.png`, `public/favicon-32.png`, `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png` (copies from `../Brand Assets/web-ready/favicon/`), `src/components/Logo.astro`
- Test: `tests/unit/logo-dark.test.ts`

**Interfaces:**
- Produces: `Logo.astro`, with no props. It renders both `<img src="/brand/logo-light.svg" alt="Pengopal">` and `<img src="/brand/logo-dark.svg" alt="">`, with explicit width and height and a CSS-height-driven size. `[data-theme]` CSS shows exactly one of them.
- `make-dark-logo.mjs` reads `logo-light.svg`:
  - In the **second** top-level `<g>` (the wordmark), every path `fill` whose relative luminance is < 0.2 becomes `#EEF2FF`.
  - It adds `<filter id="outline">` (feMorphology dilate radius 3 on SourceAlpha → feFlood `#C9D3F5` → feComposite in → feMerge under SourceGraphic), applied to the **first** top-level `<g>` (the art).
  - It writes `logo-dark.svg`.
- `make-og.mjs` renders `logo-dark.svg` at 900 px wide, centred on a 1200×630 `#0E1A3A` canvas, with @resvg/resvg-js, to `public/og.png`.

- [ ] **Step 1: Write the failing test** `tests/unit/logo-dark.test.ts`. It renders both SVGs with @resvg/resvg-js at their viewBox size on transparent, then:
  - `opal unchanged`: take the pixels where the light render has chroma > 25 and 55 < L < 95 (Lab). The mean Lab of those pixels in the dark render differs from the light render by ΔE2000 < 2.
  - `Peng is light`: in the viewBox box x 983–1698, y 189–410, the opaque pixels of the dark render have mean relative luminance ≥ 0.8.
  - `light file untouched`: the sha256 of `public/brand/logo-light.svg` equals the sha256 of the source file in `../Brand Assets/web-ready/logo-horizontal/`.
- [ ] **Step 2: Run** `npm test -- logo-dark`. Expected: FAIL, missing files.
- [ ] **Step 3: Copy the light logo and favicons, write both scripts, and run** `node scripts/make-dark-logo.mjs && node scripts/make-og.mjs`. Add npm script `assets` that runs both.
- [ ] **Step 4: Run** `npm test -- logo-dark`. Expected: PASS. Open `public/og.png` and `logo-dark.svg` and confirm by eye that "Peng" is light, the body is outlined and the opal is unchanged.
- [ ] **Step 5: Write `Logo.astro`.** Commit `feat: add logo light/dark variants, favicons and OG image`.

### Task 4: Header, theme toggle, mobile menu — `parked — waiting on the shared-pieces answer`

**Files:**
- Create: `src/components/Header.astro`, `src/components/ThemeToggle.astro`, `src/scripts/header.ts`
- Modify: `src/pages/index.astro`, `src/styles/global.css` (`.btn` classes, if the answer is yes)
- Test: `tests/e2e/header.spec.ts`

**Interfaces:**
- Consumes: `site.nav`, `site.hero.primary` (Task 2); `Logo.astro` (Task 3); `THEME_KEY`, `resolveTheme` (Task 1).
- Produces: `.btn`, `.btn--primary`, `.btn--secondary` in `global.css` (on a yes). `header.ts` exports `initHeader(root: HTMLElement): void`, which handles the scrolled state at 24 px, the menu disclosure and Escape to close.

UI checklist (re-read before writing; do not work from memory):
```
pengopal.com single page — no reference page exists (greenfield repo; no pages near in kind).
This checklist is a proposal derived from the approved spec, read 2026-11-10; the code wins once written.

- [ ] page holder — src/layouts/Base.astro: <html lang="en" data-theme>, theme set by an inline <head> script before paint; one <header>, one <main>, one <footer> — as asked (spec §3, §4)
- [ ] sections — <section id=… aria-labelledby=…> per spec §3 anchor; h1 only in the hero, h2 per section, h3 for card/step titles — as asked (spec §3); the element whose meaning each role has
- [ ] navigation — <nav aria-label="Primary"> of <a href="#…">; on phones a <button aria-expanded aria-controls> disclosure — as asked (spec §3.1)
- [ ] links vs actions — navigation is <a>, actions are <button>; both styled only through the shared .btn classes (.btn--primary, .btn--secondary) in src/styles/global.css — proposal, see "Question" below
- [ ] lists — deliverables <ul>, process steps <ol>, terminal lines <ul role="list"> — the element whose meaning each role has
- [ ] colour, type, spacing, radius, motion — only var(--…) from src/styles/tokens.css; no literal in any component — as asked (spec §4)
- [ ] spacing — the token scale --space-1…--space-9 = 4, 8, 12, 16, 24, 32, 48, 64, 96 px; page gutter --space-4 (16px); content max --content-max 1200px; card radius --radius-card 12px — gutter, max and radius as asked (spec §4); the 4px base is a proposal
- [ ] type roles — h1: Lexend 600, clamp(2.5rem, 5vw + 1rem, 4rem), line-height 1.05, letter-spacing -0.02em; h2: Lexend 600, clamp(1.75rem, 2vw + 1rem, 2.5rem), line-height 1.15; h3: Lexend 600, 1.25rem, line-height 1.3; body: Inter 400, 1.0625rem, line-height 1.6; label/code: JetBrains Mono 400, 0.8125rem, line-height 1.5; sizes in rem so they follow the reader's text setting — families and weights as asked (spec §4); sizes are a proposal
- [ ] motion — only through src/motion/reveal.ts (onReveal, prefersReducedMotion); plays once; final state under reduced motion; --ease-out cubic-bezier(.2,.7,.2,1), --dur-1 400ms, --dur-2 700ms — as asked (spec §4)
- [ ] focus — :focus-visible ring 2px var(--focus) offset 2px on every interactive element; --focus = #5F6BFF light / #8FA8FF dark — proposal
- [ ] form — native <form>; every field has a <label for>; error text under its field, tied with aria-describedby, field marked aria-invalid; submit disabled while Turnstile is not ready and while sending — as asked (spec §3.6, §7)
- [ ] not copied from the mockup (.superpowers/brainstorm/…/visual-direction.html): its inline styles, pixel sizes, hand-picked particle colours and 2D canvas code — only the idea (glyphs flowing from the wake, bending around the cursor) carries over
```
Must not be copied from the mockup: its inline styles, pixel sizes and hand-picked colours.
Not in this task: form (Task 12), motion (Tasks 8–10).

- [ ] **Step 1: Write e2e** `tests/e2e/header.spec.ts`:
  - `toggle switches and persists theme`: click toggle → `aria-pressed` flips and `html[data-theme]` changes; reload → same theme.
  - `menu is a disclosure on phones`: at 375×812 the nav links are hidden; button `aria-expanded="false"` → click → `"true"` and links are visible; Escape → `"false"` and focus returns to the button.
  - `anchor target heading is not hidden by the header`: click "Services" → the `#services h2` bounding box top is ≥ the header's height. Use a stub section added in this task if Task 8 is not built yet; Task 8 replaces it.
  - `header becomes solid after scroll`: scroll 30 px → the header has `data-scrolled="true"`.
- [ ] **Step 2: Run** `npm run test:e2e -- header`. Expected: FAIL.
- [ ] **Step 3: Implement `Header.astro`, `ThemeToggle.astro` and `header.ts`.** Add `scroll-margin-top: var(--header-h)` on `section[id]` in `global.css`. The toggle writes `THEME_KEY` inside try/catch.
- [ ] **Step 4: Run** `npm run test:e2e -- header`. Expected: PASS.
- [ ] **Step 5: Report the section ready for its check.** The dispatcher sends it, with the UI checklist, to the one checker agent for this page (with `ui-consistency:verifying` and `ui-consistency:accessibility`), never the writer. Fix what it reports.
- [ ] **Step 6: Report status here** (`done` once the check passes, or `parked — <why>`). Commit `feat: add header, theme toggle and mobile menu`.

### Task 5: Calibrate the UI check

- [ ] Make a copy of the finished Header (Task 4) in a temporary git worktree outside the checkout. In it, render the nav links as `<div onclick>` blocks instead of `<a>`. Hand the copy to a separate agent with `ui-consistency:verifying` and the UI checklist above, telling it only that the copy differs somewhere. Whoever plants does not check.
- [ ] If the agent does not report the plant, stop and tell Furqan the check is blind for that kind of difference. If it does, record here: "calibrated on Header (links vs actions); no plant tested values or motion". Remove the worktree.

### Task 6: Code-stream core (path, RNG, palette)

**Files:**
- Create: `scripts/sample-palette.mjs`, `src/codestream/palette.generated.ts`, `src/codestream/stream.ts`
- Test: `tests/unit/stream.test.ts`, `tests/unit/palette.test.ts`

**Interfaces:**
- Produces:
  - `export const STREAM_PALETTE: readonly string[]` (hex strings) in `palette.generated.ts`.
  - `createRng(seed: number): () => number`, a mulberry32 generator returning values in [0, 1).
  - `pathPoint(u: number, lane: number, width: number, height: number): { x: number; y: number }`. Here `u` runs from 0 at the wake to 1 at the left exit, and `lane` is in [-1, 1]. The curve is the mockup's shape: x goes from 0.78·w to −0.02·w, and y from 0.62·h + u²·0.28·h, plus a lane offset of `lane·(0.4+u)·0.03·h`.
  - `makeGlyphs(count: number, rng: () => number): GlyphSpec[]`, where `GlyphSpec = { char: string; u: number; lane: number; z: number; speed: number; color: string }`.
  - `GLYPHS`: the set `{ } < > / = ; ( ) [ ] 0 1 => && || # @ λ` plus `const`, `await`, `SSO`, `RAG`.
- `sample-palette.mjs` (sharp):
  - Reads `../Brand Assets/Brand_logo_original.jpg`.
  - Keeps pixels with y < 625 (art only), min channel < 232, chroma (max − min) > 25 and max > 120. That is the opal wake and stars.
  - Runs k-means (k = 12, 20 iterations, seed 1) in Lab.
  - Writes the 12 centroids, sorted by hue, as hex strings into `palette.generated.ts`, with a header comment naming the source file and the date.

- [ ] **Step 1: Write the failing tests**:
  - `stream.test.ts`:
    - `rng is deterministic`: same seed, same first 5 values.
    - `path stays in bounds`: for u in 0..1 step 0.05 and lane in {−1, 0, 1} at 1280×720, x is within [−0.03w, 0.8w] and y within [0, h].
    - `makeGlyphs uses only palette colours and GLYPHS`.
    - `z is within [−6, 2]`.
  - `palette.test.ts`:
    - `12 colours`.
    - `each colour is colourful and light`: Lab chroma > 15 and 50 < L < 92.
    - `not hand-picked`: the file header contains `Brand_logo_original.jpg`.
- [ ] **Step 2: Run** `npm test -- stream palette`. Expected: FAIL.
- [ ] **Step 3: Write `sample-palette.mjs`, run it, then implement `stream.ts`.**
- [ ] **Step 4: Run** `npm test -- stream palette`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add code-stream path, rng and logo-sampled palette`.

### Task 7: Hero with poster, then Three.js code stream — `parked — waiting on the shared-pieces answer` (uses `.btn`)

**Files:**
- Create: `src/components/Hero.astro`, `src/codestream/glyphAtlas.ts`, `src/codestream/index.ts`, `src/scripts/hero.ts`, `src/motion/reveal.ts`
- Modify: `src/pages/index.astro`
- Test: `tests/e2e/hero.spec.ts`, `tests/unit/reveal.test.ts`

**Interfaces:**
- Consumes: `site.hero` (Task 2); `createRng`, `pathPoint`, `makeGlyphs`, `STREAM_PALETTE` (Task 6); `.btn` classes (Task 4); nothing else; this task creates `src/motion/reveal.ts`.
- Produces:
  - `prefersReducedMotion(): boolean`.
  - `onReveal(el: Element, cb: () => void, opts?: { threshold?: number; rootMargin?: string }): () => void`, which calls `cb` once on first intersection (default threshold 0.25). Under reduced motion it calls `cb` synchronously.
  - `mountCodeStream(canvas: HTMLCanvasElement, poster: HTMLElement): () => void` in `src/codestream/index.ts`, the only module importing `three`.
  - `buildGlyphAtlas(chars: string[], font: string): { texture: CanvasTexture; uv: Map<string, [number, number, number, number]> }`.
- Hero markup:
  - `<section aria-labelledby="hero-title">` with `<h1 id="hero-title">{lead} <span class="opal-text">{highlight}</span></h1>`, the sub-line, and two `<a class="btn …">` buttons.
  - A poster `<svg aria-hidden="true" data-poster>`, server-rendered from `makeGlyphs(220, createRng(7))` with `pathPoint` at viewBox 1280×720, as `<text>` elements with fill from the palette and opacity by z.
  - `<canvas aria-hidden="true" hidden>`.
- `hero.ts`:
  - After `load`, calls `requestIdleCallback` (falling back to `setTimeout` 200).
  - Returns early if reduced motion, `saveData`, or no WebGL is available.
  - Then `await import('../codestream/index')` inside try/catch; on error it logs `console.warn('codestream unavailable')` once and leaves the poster.
- `mountCodeStream`:
  - One `InstancedMesh` of quads with an atlas shader material.
  - 600 instances (300 below 768 px).
  - `devicePixelRatio` capped at 2.
  - Mouse rotates the camera up to 6°. Glyphs within a radius of the cursor ray are pushed aside, then ease back.
  - Pauses via IntersectionObserver and `visibilitychange`.
  - Frame watchdog: if average frame time > 22 ms over 2 s, halve the instances.
  - On the first frame: unhide the canvas, fade it in over `--dur-2`, then set `poster.hidden = true`.

UI checklist (re-read before writing; do not work from memory):
```
pengopal.com single page — no reference page exists (greenfield repo; no pages near in kind).
This checklist is a proposal derived from the approved spec, read 2026-11-10; the code wins once written.

- [ ] page holder — src/layouts/Base.astro: <html lang="en" data-theme>, theme set by an inline <head> script before paint; one <header>, one <main>, one <footer> — as asked (spec §3, §4)
- [ ] sections — <section id=… aria-labelledby=…> per spec §3 anchor; h1 only in the hero, h2 per section, h3 for card/step titles — as asked (spec §3); the element whose meaning each role has
- [ ] navigation — <nav aria-label="Primary"> of <a href="#…">; on phones a <button aria-expanded aria-controls> disclosure — as asked (spec §3.1)
- [ ] links vs actions — navigation is <a>, actions are <button>; both styled only through the shared .btn classes (.btn--primary, .btn--secondary) in src/styles/global.css — proposal, see "Question" below
- [ ] lists — deliverables <ul>, process steps <ol>, terminal lines <ul role="list"> — the element whose meaning each role has
- [ ] colour, type, spacing, radius, motion — only var(--…) from src/styles/tokens.css; no literal in any component — as asked (spec §4)
- [ ] spacing — the token scale --space-1…--space-9 = 4, 8, 12, 16, 24, 32, 48, 64, 96 px; page gutter --space-4 (16px); content max --content-max 1200px; card radius --radius-card 12px — gutter, max and radius as asked (spec §4); the 4px base is a proposal
- [ ] type roles — h1: Lexend 600, clamp(2.5rem, 5vw + 1rem, 4rem), line-height 1.05, letter-spacing -0.02em; h2: Lexend 600, clamp(1.75rem, 2vw + 1rem, 2.5rem), line-height 1.15; h3: Lexend 600, 1.25rem, line-height 1.3; body: Inter 400, 1.0625rem, line-height 1.6; label/code: JetBrains Mono 400, 0.8125rem, line-height 1.5; sizes in rem so they follow the reader's text setting — families and weights as asked (spec §4); sizes are a proposal
- [ ] motion — only through src/motion/reveal.ts (onReveal, prefersReducedMotion); plays once; final state under reduced motion; --ease-out cubic-bezier(.2,.7,.2,1), --dur-1 400ms, --dur-2 700ms — as asked (spec §4)
- [ ] focus — :focus-visible ring 2px var(--focus) offset 2px on every interactive element; --focus = #5F6BFF light / #8FA8FF dark — proposal
- [ ] form — native <form>; every field has a <label for>; error text under its field, tied with aria-describedby, field marked aria-invalid; submit disabled while Turnstile is not ready and while sending — as asked (spec §3.6, §7)
- [ ] not copied from the mockup (.superpowers/brainstorm/…/visual-direction.html): its inline styles, pixel sizes, hand-picked particle colours and 2D canvas code — only the idea (glyphs flowing from the wake, bending around the cursor) carries over
```
Must not be copied from the mockup: its 2D canvas code, its particle colours and its pixel sizes.
Not in this task: header (Task 4), section reveal motion (Task 8).

- [ ] **Step 1: Write tests**. `tests/unit/reveal.test.ts` (jsdom, with IntersectionObserver mocked): `fires once`, `reduced motion fires immediately`, `cleanup disconnects`. Then e2e `tests/e2e/hero.spec.ts`:
  - `h1 text`: matches the headline exactly.
  - `poster renders without JS`: with `javaScriptEnabled:false`, `svg[data-poster] text` count is 220.
  - `canvas mounts and poster hides` (Chromium): within 5 s the canvas is visible and the poster is hidden; no page errors.
  - `reduced motion keeps poster`: `reducedMotion:'reduce'`; after 3 s the canvas is still `hidden` and the poster is visible.
  - `poster stays when the three.js chunk fails`: `page.route('**/codestream/**', r => r.abort())` (match the built chunk name pattern); after 3 s the poster is visible and there are no uncaught errors.
- [ ] **Step 2: Run** `npm run build && npm run test:e2e -- hero`. Expected: FAIL.
- [ ] **Step 3: Implement** `Hero.astro`, `hero.ts`, `glyphAtlas.ts` and `index.ts`. Add `three` as a dependency.
- [ ] **Step 4: Run** `npm run build && npm run test:e2e -- hero`. Expected: PASS. Check the size of the initial JS (not the three chunk) with `du -b dist/_astro/*.js` minus the three chunk, gzipped: under 50 KB.
- [ ] **Step 5: Report the section ready for its check** (the same checker agent as Task 4, with the UI checklist). Fix what it reports.
- [ ] **Step 6: Report status here.** Commit `feat: add hero with server-rendered poster and Three.js code stream`.

### Task 8: Services — `parked — waiting on the shared-pieces answer` (icons)

**Files:**
- Create: `src/motion/assemble.ts`, `src/components/Services.astro`, `src/components/ServiceCard.astro`, `src/components/icons/Brackets.astro`, `Spark.astro`, `Key.astro` (on a yes; otherwise inline in ServiceCard)
- Modify: `src/pages/index.astro`, removing the Task 4 stub section
- Test: `tests/e2e/services.spec.ts`

**Interfaces:**
- Consumes: `site.services`; `STREAM_PALETTE`, `GLYPHS` (Task 6); `onReveal`, `prefersReducedMotion` (Task 7).
- Produces:
  - `assembleInto(card: HTMLElement, icon: SVGElement): void`, which spawns 40 absolutely positioned `<span aria-hidden>` glyphs that transition to points sampled on the icon's path over `--dur-2`, then removes them and sets `data-assembled`.

UI checklist (re-read before writing; do not work from memory):
```
pengopal.com single page — no reference page exists (greenfield repo; no pages near in kind).
This checklist is a proposal derived from the approved spec, read 2026-11-10; the code wins once written.

- [ ] page holder — src/layouts/Base.astro: <html lang="en" data-theme>, theme set by an inline <head> script before paint; one <header>, one <main>, one <footer> — as asked (spec §3, §4)
- [ ] sections — <section id=… aria-labelledby=…> per spec §3 anchor; h1 only in the hero, h2 per section, h3 for card/step titles — as asked (spec §3); the element whose meaning each role has
- [ ] navigation — <nav aria-label="Primary"> of <a href="#…">; on phones a <button aria-expanded aria-controls> disclosure — as asked (spec §3.1)
- [ ] links vs actions — navigation is <a>, actions are <button>; both styled only through the shared .btn classes (.btn--primary, .btn--secondary) in src/styles/global.css — proposal, see "Question" below
- [ ] lists — deliverables <ul>, process steps <ol>, terminal lines <ul role="list"> — the element whose meaning each role has
- [ ] colour, type, spacing, radius, motion — only var(--…) from src/styles/tokens.css; no literal in any component — as asked (spec §4)
- [ ] spacing — the token scale --space-1…--space-9 = 4, 8, 12, 16, 24, 32, 48, 64, 96 px; page gutter --space-4 (16px); content max --content-max 1200px; card radius --radius-card 12px — gutter, max and radius as asked (spec §4); the 4px base is a proposal
- [ ] type roles — h1: Lexend 600, clamp(2.5rem, 5vw + 1rem, 4rem), line-height 1.05, letter-spacing -0.02em; h2: Lexend 600, clamp(1.75rem, 2vw + 1rem, 2.5rem), line-height 1.15; h3: Lexend 600, 1.25rem, line-height 1.3; body: Inter 400, 1.0625rem, line-height 1.6; label/code: JetBrains Mono 400, 0.8125rem, line-height 1.5; sizes in rem so they follow the reader's text setting — families and weights as asked (spec §4); sizes are a proposal
- [ ] motion — only through src/motion/reveal.ts (onReveal, prefersReducedMotion); plays once; final state under reduced motion; --ease-out cubic-bezier(.2,.7,.2,1), --dur-1 400ms, --dur-2 700ms — as asked (spec §4)
- [ ] focus — :focus-visible ring 2px var(--focus) offset 2px on every interactive element; --focus = #5F6BFF light / #8FA8FF dark — proposal
- [ ] form — native <form>; every field has a <label for>; error text under its field, tied with aria-describedby, field marked aria-invalid; submit disabled while Turnstile is not ready and while sending — as asked (spec §3.6, §7)
- [ ] not copied from the mockup (.superpowers/brainstorm/…/visual-direction.html): its inline styles, pixel sizes, hand-picked particle colours and 2D canvas code — only the idea (glyphs flowing from the wake, bending around the cursor) carries over
```
Must not be copied from the mockup: anything; it had no services section.
Not in this task: process line (Task 9), terminal (Task 10).

- [ ] **Step 1: Write tests**:
  - `services.spec.ts`:
    - `three cards, each h3 + 4 li`.
    - `cards reach final state` (`data-assembled` present after scrolling into view).
    - `reduced motion: no glyph spans ever exist`.
- [ ] **Step 2: Run** them. Expected: FAIL.
- [ ] **Step 3: Implement** `assemble.ts`, the icons (1.75 px stroke, `currentColor`), `ServiceCard.astro` and `Services.astro` (`<section id="services" aria-labelledby="services-title">`).
- [ ] **Step 4: Run** them. Expected: PASS, including Task 4's anchor test against the real section.
- [ ] **Step 5: Report the section ready for its check** (same checker, UI checklist). Fix what it reports.
- [ ] **Step 6: Report status.** Commit `feat: add services section`.

### Task 9: How we work

**Files:**
- Create: `src/components/HowWeWork.astro`, `src/motion/commitLine.ts`
- Modify: `src/pages/index.astro`
- Test: `tests/e2e/process.spec.ts`

**Interfaces:**
- Consumes: `site.process`; `onReveal`, `prefersReducedMotion` (Task 7).
- Produces: `initCommitLine(list: HTMLOListElement): () => void`. It sets `--progress` (0–1) on the list from scroll position and `data-reached` on each `<li>` whose dot the line has passed. Under reduced motion it sets progress to 1 and marks all steps reached.

UI checklist (re-read before writing; do not work from memory):
```
pengopal.com single page — no reference page exists (greenfield repo; no pages near in kind).
This checklist is a proposal derived from the approved spec, read 2026-11-10; the code wins once written.

- [ ] page holder — src/layouts/Base.astro: <html lang="en" data-theme>, theme set by an inline <head> script before paint; one <header>, one <main>, one <footer> — as asked (spec §3, §4)
- [ ] sections — <section id=… aria-labelledby=…> per spec §3 anchor; h1 only in the hero, h2 per section, h3 for card/step titles — as asked (spec §3); the element whose meaning each role has
- [ ] navigation — <nav aria-label="Primary"> of <a href="#…">; on phones a <button aria-expanded aria-controls> disclosure — as asked (spec §3.1)
- [ ] links vs actions — navigation is <a>, actions are <button>; both styled only through the shared .btn classes (.btn--primary, .btn--secondary) in src/styles/global.css — proposal, see "Question" below
- [ ] lists — deliverables <ul>, process steps <ol>, terminal lines <ul role="list"> — the element whose meaning each role has
- [ ] colour, type, spacing, radius, motion — only var(--…) from src/styles/tokens.css; no literal in any component — as asked (spec §4)
- [ ] spacing — the token scale --space-1…--space-9 = 4, 8, 12, 16, 24, 32, 48, 64, 96 px; page gutter --space-4 (16px); content max --content-max 1200px; card radius --radius-card 12px — gutter, max and radius as asked (spec §4); the 4px base is a proposal
- [ ] type roles — h1: Lexend 600, clamp(2.5rem, 5vw + 1rem, 4rem), line-height 1.05, letter-spacing -0.02em; h2: Lexend 600, clamp(1.75rem, 2vw + 1rem, 2.5rem), line-height 1.15; h3: Lexend 600, 1.25rem, line-height 1.3; body: Inter 400, 1.0625rem, line-height 1.6; label/code: JetBrains Mono 400, 0.8125rem, line-height 1.5; sizes in rem so they follow the reader's text setting — families and weights as asked (spec §4); sizes are a proposal
- [ ] motion — only through src/motion/reveal.ts (onReveal, prefersReducedMotion); plays once; final state under reduced motion; --ease-out cubic-bezier(.2,.7,.2,1), --dur-1 400ms, --dur-2 700ms — as asked (spec §4)
- [ ] focus — :focus-visible ring 2px var(--focus) offset 2px on every interactive element; --focus = #5F6BFF light / #8FA8FF dark — proposal
- [ ] form — native <form>; every field has a <label for>; error text under its field, tied with aria-describedby, field marked aria-invalid; submit disabled while Turnstile is not ready and while sending — as asked (spec §3.6, §7)
- [ ] not copied from the mockup (.superpowers/brainstorm/…/visual-direction.html): its inline styles, pixel sizes, hand-picked particle colours and 2D canvas code — only the idea (glyphs flowing from the wake, bending around the cursor) carries over
```
Must not be copied from the mockup: anything; it had no process section.
Not in this task: none.

- [ ] **Step 1: Write e2e**:
  - `four steps in an ol with h3 titles and the note text`.
  - `all steps reached after scrolling past the section`.
  - `reduced motion: all reached on load`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** The line is a CSS pseudo-element scaled by `--progress`; the dots are `::before` on each `li`.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Report the section ready for its check** (same checker). Fix what it reports.
- [ ] **Step 6: Report status.** Commit `feat: add how-we-work section with commit-line motion`.

### Task 10: Building in public

**Files:**
- Create: `src/components/BuildingInPublic.astro`, `src/motion/terminal.ts`
- Modify: `src/pages/index.astro`
- Test: `tests/e2e/open-source.spec.ts`

**Interfaces:**
- Consumes: `site.openSource`; `onReveal`, `prefersReducedMotion`.
- Produces: `typeLines(list: HTMLElement, lines: string[], msPerChar = 18): Promise<void>`. All lines are present in the DOM from the start, so screen readers and no-JS users get the full text. Typing only reveals them visually with `clip-path` (or `ch`) animation, then sets `data-typed`.

UI checklist (re-read before writing; do not work from memory):
```
pengopal.com single page — no reference page exists (greenfield repo; no pages near in kind).
This checklist is a proposal derived from the approved spec, read 2026-11-10; the code wins once written.

- [ ] page holder — src/layouts/Base.astro: <html lang="en" data-theme>, theme set by an inline <head> script before paint; one <header>, one <main>, one <footer> — as asked (spec §3, §4)
- [ ] sections — <section id=… aria-labelledby=…> per spec §3 anchor; h1 only in the hero, h2 per section, h3 for card/step titles — as asked (spec §3); the element whose meaning each role has
- [ ] navigation — <nav aria-label="Primary"> of <a href="#…">; on phones a <button aria-expanded aria-controls> disclosure — as asked (spec §3.1)
- [ ] links vs actions — navigation is <a>, actions are <button>; both styled only through the shared .btn classes (.btn--primary, .btn--secondary) in src/styles/global.css — proposal, see "Question" below
- [ ] lists — deliverables <ul>, process steps <ol>, terminal lines <ul role="list"> — the element whose meaning each role has
- [ ] colour, type, spacing, radius, motion — only var(--…) from src/styles/tokens.css; no literal in any component — as asked (spec §4)
- [ ] spacing — the token scale --space-1…--space-9 = 4, 8, 12, 16, 24, 32, 48, 64, 96 px; page gutter --space-4 (16px); content max --content-max 1200px; card radius --radius-card 12px — gutter, max and radius as asked (spec §4); the 4px base is a proposal
- [ ] type roles — h1: Lexend 600, clamp(2.5rem, 5vw + 1rem, 4rem), line-height 1.05, letter-spacing -0.02em; h2: Lexend 600, clamp(1.75rem, 2vw + 1rem, 2.5rem), line-height 1.15; h3: Lexend 600, 1.25rem, line-height 1.3; body: Inter 400, 1.0625rem, line-height 1.6; label/code: JetBrains Mono 400, 0.8125rem, line-height 1.5; sizes in rem so they follow the reader's text setting — families and weights as asked (spec §4); sizes are a proposal
- [ ] motion — only through src/motion/reveal.ts (onReveal, prefersReducedMotion); plays once; final state under reduced motion; --ease-out cubic-bezier(.2,.7,.2,1), --dur-1 400ms, --dur-2 700ms — as asked (spec §4)
- [ ] focus — :focus-visible ring 2px var(--focus) offset 2px on every interactive element; --focus = #5F6BFF light / #8FA8FF dark — proposal
- [ ] form — native <form>; every field has a <label for>; error text under its field, tied with aria-describedby, field marked aria-invalid; submit disabled while Turnstile is not ready and while sending — as asked (spec §3.6, §7)
- [ ] not copied from the mockup (.superpowers/brainstorm/…/visual-direction.html): its inline styles, pixel sizes, hand-picked particle colours and 2D canvas code — only the idea (glyphs flowing from the wake, bending around the cursor) carries over
```
Must not be copied from the mockup: the iceberg terminal string and its colours.
Not in this task: none.

- [ ] **Step 1: Write e2e**:
  - `card shows title, "Coming soon" badge, description, 4 feature lines`.
  - `no link inside the card while href is undefined`.
  - `lines fully present without JS`.
  - `data-typed after reveal`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** The section is `<section id="open-source" aria-labelledby="open-source-title">`.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Report the section ready for its check** (same checker). Fix what it reports.
- [ ] **Step 6: Report status.** Commit `feat: add building-in-public section`.

### Task 11: Contact Worker

**Files:**
- Create: `worker/index.ts`, `worker/contact.ts`, `worker/deps.ts`, `wrangler.jsonc`
- Test: `tests/unit/contact.test.ts`, `tests/unit/worker-index.test.ts`

**Interfaces:**
- Produces:
  - `Env = { ASSETS: Fetcher; EMAIL: SendEmail; TURNSTILE_SECRET: string; CONTACT_TO: string }`.
  - `MailMessage = { from: { email: 'website@pengopal.com'; name: 'Pengopal website' }; to: string; replyTo: string; subject: string; text: string }`.
  - `ContactDeps = { verifyTurnstile(token: string, ip: string | null): Promise<boolean>; sendMail(msg: MailMessage): Promise<void> }`.
  - `handleContact(request: Request, env: Pick<Env, 'CONTACT_TO'>, deps: ContactDeps): Promise<Response>`.
  - `makeDeps(env: Env): ContactDeps` in `deps.ts`. It POSTs form data `secret`, `response` and `remoteip` to `https://challenges.cloudflare.com/turnstile/v0/siteverify` and reads `success`. It sends with `env.EMAIL.send({...msg})`.
  - The default export in `worker/index.ts` routes `POST /api/contact` to `handleContact` and everything else to `env.ASSETS.fetch(request)`.
- Rules (spec §6.2):
  - Non-POST → 405.
  - Body > 16 384 bytes → 413.
  - Honeypot `website` non-empty → 200 `{ok:true}`, nothing sent.
  - Name 1–120 characters after trim. Email ≤ 254 characters and matching `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Message 1–4000 characters after trim. Timeline in `site.contact.timelines` or empty. Failure → 400 `{ok:false, fields:{name?,email?,message?,timeline?}}`.
  - Turnstile false → 403 `{ok:false}`.
  - `sendMail` throws → 502 `{ok:false}`.
  - Success → 200 `{ok:true}`.
  - Subject `New enquiry — ${name}`. The text body lists Name, Email, Timeline and Message on separate lines.
- `wrangler.jsonc`:
  - `name: "pengopal-web"`, `main: "worker/index.ts"`, `compatibility_date` = the day of implementation.
  - `assets: { directory: "./dist", binding: "ASSETS", not_found_handling: "404-page" }`.
  - `send_email: [{ name: "EMAIL" }]`.
  - `observability: { enabled: true }`.
  - No inbox address anywhere.

- [ ] **Step 1: Write the failing tests** `contact.test.ts`. Use a `req(body, init?)` helper and fake deps that record calls. Cases:
  - `valid enquiry sends one mail with replyTo = visitor and to = CONTACT_TO`.
  - `GET → 405`.
  - `17 KB body → 413`.
  - `honeypot → 200, no mail, no turnstile call`.
  - `missing name → 400 fields.name`.
  - `bad email → 400 fields.email`.
  - `4001-char message → 400 fields.message`.
  - `unknown timeline → 400 fields.timeline`.
  - `turnstile false → 403, no mail`.
  - `sendMail throws → 502`.
  - `accepts 4000-char Arabic + emoji message`: `'مرحبا 👋 '.repeat(…)` sliced to 4000 → 200, and the mail text contains it byte-for-byte.
  - `invalid JSON → 400`.
- `worker-index.test.ts`:
  - `POST /api/contact reaches handler`.
  - `GET / goes to ASSETS`.
- [ ] **Step 2: Run** `npm test -- contact worker-index`. Expected: FAIL.
- [ ] **Step 3: Implement** `contact.ts`, `deps.ts`, `index.ts` and `wrangler.jsonc`. Add `wrangler` and `@cloudflare/workers-types` as dev dependencies.
- [ ] **Step 4: Run** `npm test -- contact worker-index && npx wrangler deploy --dry-run`. Expected: tests PASS; the dry run bundles without errors.
- [ ] **Step 5: Commit** `feat: add contact Worker with validation, Turnstile and email`.

### Task 12: Contact section UI — `parked — waiting on the shared-pieces answer` (uses `.btn`)

**Files:**
- Create: `src/components/Contact.astro`, `src/scripts/contact.ts`, `src/motion/burst.ts`
- Modify: `src/pages/index.astro`
- Test: `tests/unit/contact-client.test.ts`, `tests/e2e/contact.spec.ts`

**Interfaces:**
- Consumes: `site.contact`; `.btn`; `STREAM_PALETTE`, `GLYPHS`; `prefersReducedMotion`; the API contract from Task 11.
- Produces:
  - `EnquiryInput = { name: string; email: string; message: string; timeline: string; website: string; turnstileToken: string }`.
  - `submitEnquiry(data: EnquiryInput, fetchImpl = fetch): Promise<{ ok: true } | { ok: false; kind: 'validation'; fields: Record<string, string> } | { ok: false; kind: 'failed' }>`. A 400 with `fields` → validation; any other non-200 or a network error → failed.
  - `mailtoFallback(d: Pick<EnquiryInput,'name'|'message'|'timeline'>): string`, which returns `mailto:hello@pengopal.com?subject=…&body=…` with `encodeURIComponent`.
  - `burst(from: HTMLElement): void`, about 60 palette glyphs over `--dur-2`, removed after. It is a no-op under reduced motion.
- Turnstile: inject `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` only when `#contact` is within 600 px of the viewport (`onReveal` with rootMargin). Render the widget in invisible/managed mode with `site.contact.turnstileSiteKey`. If the script fails to load: the submit stays disabled and a note plus the mailto link are shown (spec §7).

UI checklist (re-read before writing; do not work from memory):
```
pengopal.com single page — no reference page exists (greenfield repo; no pages near in kind).
This checklist is a proposal derived from the approved spec, read 2026-11-10; the code wins once written.

- [ ] page holder — src/layouts/Base.astro: <html lang="en" data-theme>, theme set by an inline <head> script before paint; one <header>, one <main>, one <footer> — as asked (spec §3, §4)
- [ ] sections — <section id=… aria-labelledby=…> per spec §3 anchor; h1 only in the hero, h2 per section, h3 for card/step titles — as asked (spec §3); the element whose meaning each role has
- [ ] navigation — <nav aria-label="Primary"> of <a href="#…">; on phones a <button aria-expanded aria-controls> disclosure — as asked (spec §3.1)
- [ ] links vs actions — navigation is <a>, actions are <button>; both styled only through the shared .btn classes (.btn--primary, .btn--secondary) in src/styles/global.css — proposal, see "Question" below
- [ ] lists — deliverables <ul>, process steps <ol>, terminal lines <ul role="list"> — the element whose meaning each role has
- [ ] colour, type, spacing, radius, motion — only var(--…) from src/styles/tokens.css; no literal in any component — as asked (spec §4)
- [ ] spacing — the token scale --space-1…--space-9 = 4, 8, 12, 16, 24, 32, 48, 64, 96 px; page gutter --space-4 (16px); content max --content-max 1200px; card radius --radius-card 12px — gutter, max and radius as asked (spec §4); the 4px base is a proposal
- [ ] type roles — h1: Lexend 600, clamp(2.5rem, 5vw + 1rem, 4rem), line-height 1.05, letter-spacing -0.02em; h2: Lexend 600, clamp(1.75rem, 2vw + 1rem, 2.5rem), line-height 1.15; h3: Lexend 600, 1.25rem, line-height 1.3; body: Inter 400, 1.0625rem, line-height 1.6; label/code: JetBrains Mono 400, 0.8125rem, line-height 1.5; sizes in rem so they follow the reader's text setting — families and weights as asked (spec §4); sizes are a proposal
- [ ] motion — only through src/motion/reveal.ts (onReveal, prefersReducedMotion); plays once; final state under reduced motion; --ease-out cubic-bezier(.2,.7,.2,1), --dur-1 400ms, --dur-2 700ms — as asked (spec §4)
- [ ] focus — :focus-visible ring 2px var(--focus) offset 2px on every interactive element; --focus = #5F6BFF light / #8FA8FF dark — proposal
- [ ] form — native <form>; every field has a <label for>; error text under its field, tied with aria-describedby, field marked aria-invalid; submit disabled while Turnstile is not ready and while sending — as asked (spec §3.6, §7)
- [ ] not copied from the mockup (.superpowers/brainstorm/…/visual-direction.html): its inline styles, pixel sizes, hand-picked particle colours and 2D canvas code — only the idea (glyphs flowing from the wake, bending around the cursor) carries over
```
Must not be copied from the mockup: anything; it had no form.
Not in this task: footer (Task 13).

- [ ] **Step 1: Write tests**:
  - `contact-client.test.ts`:
    - `200 → ok`.
    - `400 with fields → validation`.
    - `502 → failed`.
    - `fetch rejects → failed`.
    - `mailto encodes Arabic and newlines`.
  - `contact.spec.ts`: route `**/api/contact` and stub Turnstile with an init script that defines `window.turnstile` and calls the callback with a token. Cases:
    - `labels tied to fields`.
    - `success replaces form with thank-you`.
    - `400 shows errors under fields with aria-invalid and keeps input`.
    - `502 shows error with a mailto link containing the message`.
    - `submit button is disabled while sending`: delay the route 1 s, click twice, and assert exactly 1 request.
    - `turnstile script blocked → submit disabled + mailto note`.
    - `no "Pakistan" or "time zone" text in #contact`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** The section is `<section id="contact" aria-labelledby="contact-title">`. Timeline is a native `<select>` whose first option is empty, "Select…". The honeypot is a visually hidden `<input name="website" tabindex="-1" autocomplete="off">` inside an `aria-hidden` wrapper.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Report the section ready for its check** (same checker). Fix what it reports.
- [ ] **Step 6: Report status.** Commit `feat: add contact form with Turnstile and mailto fallback`.

### Task 13: Footer, SEO, 404

**Files:**
- Create: `src/components/Footer.astro`, `src/pages/404.astro`, `public/robots.txt`
- Modify: `src/layouts/Base.astro` (meta), `astro.config.mjs` (sitemap)
- Test: `tests/e2e/seo.spec.ts`

**Interfaces:**
- Consumes: `site.meta`, `site.footer`, `site.contact.email`.
- Produces:
  - Base `<head>`: canonical `https://pengopal.com/`, `og:title`, `og:description`, `og:image https://pengopal.com/og.png` (1200×630), `twitter:card summary_large_image`, favicon links (`/favicon.svg`, `/favicon.ico`, `/apple-touch-icon.png`), and JSON-LD `Organization {name:"Pengopal", legalName:"Pengopal Technologies", url, logo:"https://pengopal.com/brand/logo-light.svg", email:"hello@pengopal.com"}`.
  - Footer: `© {new Date().getFullYear()} Pengopal Technologies`, a mailto link, and LinkedIn with `rel="me noopener"`.
  - `robots.txt`: `User-agent: *`, `Allow: /`, `Sitemap: https://pengopal.com/sitemap-index.xml`.

UI checklist (re-read before writing; do not work from memory):
```
pengopal.com single page — no reference page exists (greenfield repo; no pages near in kind).
This checklist is a proposal derived from the approved spec, read 2026-11-10; the code wins once written.

- [ ] page holder — src/layouts/Base.astro: <html lang="en" data-theme>, theme set by an inline <head> script before paint; one <header>, one <main>, one <footer> — as asked (spec §3, §4)
- [ ] sections — <section id=… aria-labelledby=…> per spec §3 anchor; h1 only in the hero, h2 per section, h3 for card/step titles — as asked (spec §3); the element whose meaning each role has
- [ ] navigation — <nav aria-label="Primary"> of <a href="#…">; on phones a <button aria-expanded aria-controls> disclosure — as asked (spec §3.1)
- [ ] links vs actions — navigation is <a>, actions are <button>; both styled only through the shared .btn classes (.btn--primary, .btn--secondary) in src/styles/global.css — proposal, see "Question" below
- [ ] lists — deliverables <ul>, process steps <ol>, terminal lines <ul role="list"> — the element whose meaning each role has
- [ ] colour, type, spacing, radius, motion — only var(--…) from src/styles/tokens.css; no literal in any component — as asked (spec §4)
- [ ] spacing — the token scale --space-1…--space-9 = 4, 8, 12, 16, 24, 32, 48, 64, 96 px; page gutter --space-4 (16px); content max --content-max 1200px; card radius --radius-card 12px — gutter, max and radius as asked (spec §4); the 4px base is a proposal
- [ ] type roles — h1: Lexend 600, clamp(2.5rem, 5vw + 1rem, 4rem), line-height 1.05, letter-spacing -0.02em; h2: Lexend 600, clamp(1.75rem, 2vw + 1rem, 2.5rem), line-height 1.15; h3: Lexend 600, 1.25rem, line-height 1.3; body: Inter 400, 1.0625rem, line-height 1.6; label/code: JetBrains Mono 400, 0.8125rem, line-height 1.5; sizes in rem so they follow the reader's text setting — families and weights as asked (spec §4); sizes are a proposal
- [ ] motion — only through src/motion/reveal.ts (onReveal, prefersReducedMotion); plays once; final state under reduced motion; --ease-out cubic-bezier(.2,.7,.2,1), --dur-1 400ms, --dur-2 700ms — as asked (spec §4)
- [ ] focus — :focus-visible ring 2px var(--focus) offset 2px on every interactive element; --focus = #5F6BFF light / #8FA8FF dark — proposal
- [ ] form — native <form>; every field has a <label for>; error text under its field, tied with aria-describedby, field marked aria-invalid; submit disabled while Turnstile is not ready and while sending — as asked (spec §3.6, §7)
- [ ] not copied from the mockup (.superpowers/brainstorm/…/visual-direction.html): its inline styles, pixel sizes, hand-picked particle colours and 2D canvas code — only the idea (glyphs flowing from the wake, bending around the cursor) carries over
```
Must not be copied from the mockup: anything.
Not in this task: none.

- [ ] **Step 1: Write e2e** `seo.spec.ts`:
  - `title and description exact`.
  - `og:image absolute`.
  - `JSON-LD parses and has name Pengopal`.
  - `footer has no github link and current year`.
  - `404 page returns branded page with link home` (run against `wrangler dev` or `astro preview`).
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement**, and add `@astrojs/sitemap`.
- [ ] **Step 4: Run** `npm run build && ls dist/sitemap-index.xml && npm run test:e2e -- seo`. Expected: PASS.
- [ ] **Step 5: Report the section ready for its check** (same checker). Fix what it reports.
- [ ] **Step 6: Report status.** Commit `feat: add footer, SEO metadata, sitemap and 404`.

### Task 14: Quality gates, README, screenshots

**Files:**
- Create: `tests/e2e/a11y.spec.ts`, `tests/e2e/phone.spec.ts`, `lighthouserc.json`, `README.md`, `scripts/screenshots.mjs`

- [ ] **Step 1: Write tests**:
  - `a11y.spec.ts`: axe with `withTags(['wcag2a','wcag2aa','wcag21aa'])` on the whole page, in light and dark, after all reveals have completed (scroll to the bottom). Expect zero violations. A keyboard test tabs through the page and asserts the focus order: skip link (add one in Base if missing) → logo → nav links → theme toggle → CTA → hero buttons → … → form fields → submit → footer links.
  - `phone.spec.ts`: at 375×812, `document.documentElement.scrollWidth <= 375`.
  - `lighthouserc.json`: `collect.staticDistDir: "./dist"`, `numberOfRuns: 3`, mobile preset. Assertions: `categories:performance`, `accessibility`, `best-practices` and `seo` each `minScore: 0.95`; `largest-contentful-paint` ≤ 2500 ms.
- [ ] **Step 2: Run** `npm run check && npm test && npm run build && npm run test:e2e && npm run lhci` across Chromium, Firefox and WebKit. Expected: all pass. If mobile performance is below 95, fall back to the poster only on viewports narrower than 768 px (spec §9) and re-run.
- [ ] **Step 3: Write `README.md`**:
  - Run: `npm i`, `npm run dev`.
  - Build: `npm run build`.
  - Test commands.
  - Regenerate assets: `npm run assets`, `node scripts/sample-palette.mjs`.
  - Deploy (Furqan's steps, from spec §6.4):
    1. Create a Turnstile widget for pengopal.com and put its site key in `.env` as `PUBLIC_TURNSTILE_SITE_KEY`.
    2. `npx wrangler secret put TURNSTILE_SECRET`.
    3. `npx wrangler secret put CONTACT_TO`.
    4. Confirm the destination is verified in Email Routing.
    5. `npm run build && npx wrangler deploy`.
    6. Add pengopal.com and www as custom domains, with www redirecting to the apex.
  - The real-submission test, and what to do if the email lands in spam.
- [ ] **Step 4: Run `node scripts/screenshots.mjs`.** It saves full-page PNGs of light desktop, dark desktop and 375 px phone to `screenshots/` (git-ignored). Send them to Furqan for approval.
- [ ] **Step 5: Commit** `chore: add quality gates, README and screenshot script`.

### Task 15: Close the plan

- [ ] Every task is done or parked; the last check passed. Report the result to Furqan with: test and Lighthouse numbers, the screenshots, which steps still need him (Turnstile keys, secrets, deploy approval, the real form test), and his answer to the shared-pieces question.
