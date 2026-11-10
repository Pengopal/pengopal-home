# Pengopal Homepage v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the v1 page into the approved v2 design:
- the Opal Mosaic brand style and the mosaic-border primary button;
- a Tenantry-led "What we've built" section;
- services with animated scenes;
- a horizontal showcase timeline;
- a contact band that opens the form in a dialog.

**Architecture:**
- **Mosaic texture.** A build script generates one mosaic texture from the logo. Tokens expose it, and two shared classes (`.opal-text`, `.btn--primary`) apply it everywhere.
- **Projects.** They become typed data (`site.projects`) rendered by a reusable `ProjectCard`.
- **Reuse.** Sections reuse v1's motion helpers (`onReveal`, `prefersReducedMotion`, `initCommitLine`) and v1's contact logic, which moves unchanged into a native `<dialog>`.

**Tech Stack:** As in v1 (Astro 7.3.8, TypeScript, Three.js, Vitest, Playwright + axe, Lighthouse CI, Wrangler), plus sharp for the texture and WebP conversion.

**Spec:** `docs/superpowers/specs/2026-11-10-pengopal-homepage-v2-design.md`, which builds on `docs/superpowers/specs/2026-11-10-pengopal-homepage-design.md`. Executors read both.

## Global Constraints

- Every v1 Global Constraint still applies:
  - copy only in `src/content/site.ts`;
  - no Pakistan, time zones, GitHub links for a Pengopal org, invented stats or reply-time promises;
  - tokens only, no literals in components;
  - reduced motion shows final states;
  - secrets never committed;
  - work on branch `feat/homepage`, commit per task, never push.
- **Mosaic colours:** they come only from the generated `public/brand/opal-mosaic.webp` (seed 7, 170 cells, from the logo's "opal" letters). Never hand-picked or hand-edited.
- **Opal text:** only at heading sizes (≥ 24px, bold), one phrase per heading.
- **Tenantry:**
  - facts and copy come only from Tenantry's README;
  - its logo and screenshots are used unaltered (except the WebP conversion);
  - its links are exactly `https://tenantry.pengopal.com` and `https://github.com/mfurqanwork/tenantry-keycloak-multitenancy`, opened in a new tab with `rel="noopener"`.
- **Budgets:** texture ≤ 40 KB; the three screenshots together ≤ 150 KB; page JS before the 3D < 50 KB gzip; Lighthouse mobile ≥ 95 in all four categories.

## Review Focus

1. **Reopening the dialog.** Opening, closing and reopening the contact dialog must not render a second Turnstile widget or reset what was typed. Test: Task 6, `reopening the dialog keeps the text and one spam check`.
2. **Resizing across the breakpoint.** Going from desktop to phone width after scrolling must not leave the timeline half-drawn or broken. Test: Task 5, `resizing across the breakpoint keeps every passed step`.
3. **No JavaScript.** Visitors without JavaScript must still reach the form, and see the projects and services in full. Test: Task 6, `without JavaScript the form is reachable in the band`.
4. **Screenshots that fail to load.** If a Tenantry screenshot is missing, its alt text shows and the layout stays intact. Test: Task 3, `a missing screenshot keeps the layout and shows its alt`.
5. **Opal text over the hero's code stream.** Opal text in the hero headline must keep its contrast where the code stream doesn't reach (the headline sits top-left, the stream lower). Test: Task 1's texture contrast check, plus Task 7's axe run on the hero.

## UI checklist (carried by every task that changes what the user sees)

```
pengopal.com v2 — reference: the v1 sections on feat/homepage (Header, Hero, Services, HowWeWork, Contact, Footer), read 2026-11-10; the code wins.

- [ ] section holder — <section id=… aria-labelledby=…> with class "section", inside <main> in src/pages/index.astro; content in .container — 5 of 5 v1 sections
- [ ] headings — eyebrow (JetBrains Mono, --fs-label, uppercase, --muted) above an h2; h3 for cards/steps; opal highlight via .opal-text on one phrase of the h2 only — v1 h2/h3 pattern, 5 of 5; eyebrow and opal phrase as asked (spec v2 §3)
- [ ] copy — every string from site.ts (site.projects, site.services, site.process, site.contact, site.sections) — 10 of 10 v1 components
- [ ] buttons — only .btn .btn--primary / .btn--secondary from global.css; <a> for navigation, <button> for actions — the shared piece, used by Header, Hero, Contact
- [ ] values — only var(--…) from tokens.css; the mosaic only through --opal-mosaic tokens, .opal-text or .btn--primary; no literal colour, size or url() in a component — v1 rule, verified by the v1 checker
- [ ] spacing — --space-1…--space-9, gutter --space-4, cards --radius-card with a 1px --border border — 3 of 3 v1 card types
- [ ] motion — only through src/motion (onReveal, prefersReducedMotion, initCommitLine); plays once; final state under reduced motion; --ease-out, --dur-1, --dur-2 — the shared helpers, 4 of 4 v1 motion users
- [ ] decorative visuals — scenes, glows and screenshot frames are aria-hidden or carry meaningful alt; never the only carrier of meaning — v1 hero poster, mark and icons
- [ ] hidden states — the hidden attribute (the global [hidden] rule wins) — v1 Contact, Hero
- [ ] focus — the global :focus-visible ring; nothing removes it — v1 global.css
- [ ] layout — mobile-first, one breakpoint written as (min-width: 48rem) — 6 of 6 v1 components
- [ ] not copied from the mockups (.superpowers/brainstorm/…/layout-v2.html, opal-*.html): their inline styles, pixel sizes, literal colours, and fonts loaded from Google — only the structure and motion ideas carry over
```

Accessibility: the project states WCAG 2.1 AA, so each section's check also runs `ui-consistency:accessibility`.

---

### Task 1: Opal Mosaic brand system

**Files:**
- Create: `scripts/make-opal-mosaic.mjs`, `public/brand/opal-mosaic.webp` (generated)
- Modify: `src/styles/tokens.css`, `src/styles/global.css` (`.opal-text`, `.btn--primary`), `package.json` (`assets` also runs the new script)
- Test: `tests/unit/opal-mosaic.test.ts`, `tests/e2e/brand.spec.ts`

**Interfaces:**
- Produces:
  - tokens `--opal-mosaic`, `--opal-mosaic-size-text` (420px), `--opal-mosaic-size-border` (240px), `--opal-mosaic-dim` (light `brightness(.74) saturate(1.25)`, dark `none`), `--opal-drift` (24s), `--opal-glow`;
  - class `.opal-text`;
  - restyled `.btn--primary`;
  - `export function mosaicContrast(pixels: Uint8Array, channels: number, filter: { brightness: number; saturate: number } | null, bg: string, percentile: number): number` in `scripts/make-opal-mosaic.mjs` — the p-th percentile contrast of the (filtered) pixels against `bg`.

- [ ] **Step 1: Write failing tests.**
  - `opal-mosaic.test.ts` (sharp reads the generated file):
    - `texture exists and is ≤ 40 KB`.
    - `is 900×300`.
    - `is reproducible`: generate into a temp path with seed 7 and compare pixel hashes.
    - `light theme: 95% of pixels reach ≥ 3:1 on white with the light dim filter`: `mosaicContrast(px, 3, {brightness: .74, saturate: 1.25}, '#ffffff', 5) >= 3`.
    - `dark theme: 95% of pixels reach ≥ 3:1 on #0E1A3A`: `mosaicContrast(px, 3, null, '#0e1a3a', 5) >= 3`.
  - `brand.spec.ts`:
    - `hero highlight uses the mosaic`: computed `background-image` of `h1 .opal-text` contains `opal-mosaic`, and `color` is transparent.
    - `primary buttons are navy with white text and a mosaic border`: the computed background-color of `.btn--primary` is the `--ink` value; `color` is white; `background-image` contains `opal-mosaic`.
    - `reduced motion: no animation on .opal-text and .btn--primary`: `animation-name` is `none`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/opal-mosaic.test.ts` and `npx playwright test tests/e2e/brand.spec.ts --project=chromium`. Expected: FAIL (no file, old styles).
- [ ] **Step 3: Implement.**
  - **The script** reproduces the brainstorm generator: Voronoi cells, each filled with a colour sampled from the logo crop x 625–995, y 640–810 (pixels with chroma > 45 and min channel < 215), a 12% directional shade, and an LCG seed of 7. It writes WebP at quality 82.
  - **`mosaicContrast`** applies the CSS brightness and saturate filter matrices per pixel, then takes WCAG contrast against `bg`.
  - **If a contrast test fails,** lower the light `brightness` in 0.02 steps (and the token with it) until it passes. In dark mode, drop the darkest cells by raising the min-L of the sampled pool. Record either change as a ruling.
  - **Styles:**
    - `.opal-text`: `background: var(--opal-mosaic) 0 0 / var(--opal-mosaic-size-text) auto; background-clip: text; color: transparent; filter: var(--opal-mosaic-dim); animation: opal-drift var(--opal-drift) linear infinite`.
    - `.btn--primary`: `background: linear-gradient(var(--ink), var(--ink)) padding-box, var(--opal-mosaic) 0 0 / var(--opal-mosaic-size-border) auto border-box; border: var(--btn-mosaic-w) solid transparent; color: var(--white)`. Hover adds `box-shadow: 0 6px 22px var(--opal-glow)`. Dark keeps `--ink`.
    - Remove v1's dark `.btn--primary` override.
  - **Tokens:** `--btn-mosaic-w: 2.5px`; `--opal-glow`, a palette colour at 35% alpha.
- [ ] **Step 4: Run** the same tests plus `npm test` and the v1 `hero`/`header` e2e. Expected: all pass.
- [ ] **Step 5: Report the section ready for its check** (one checker agent, `ui-consistency:verifying` + `ui-consistency:accessibility`, never the writer). Fix what it reports.
- [ ] **Step 6: Commit** `feat: Opal Mosaic brand text and mosaic-border primary button`.

UI checklist (re-read before writing; do not work from memory):
```
pengopal.com v2 — reference: the v1 sections on feat/homepage (Header, Hero, Services, HowWeWork, Contact, Footer), read 2026-11-10; the code wins.

- [ ] section holder — <section id=… aria-labelledby=…> with class "section", inside <main> in src/pages/index.astro; content in .container — 5 of 5 v1 sections
- [ ] headings — eyebrow (JetBrains Mono, --fs-label, uppercase, --muted) above an h2; h3 for cards/steps; opal highlight via .opal-text on one phrase of the h2 only — v1 h2/h3 pattern, 5 of 5; eyebrow and opal phrase as asked (spec v2 §3)
- [ ] copy — every string from site.ts (site.projects, site.services, site.process, site.contact, site.sections) — 10 of 10 v1 components
- [ ] buttons — only .btn .btn--primary / .btn--secondary from global.css; <a> for navigation, <button> for actions — the shared piece, used by Header, Hero, Contact
- [ ] values — only var(--…) from tokens.css; the mosaic only through --opal-mosaic tokens, .opal-text or .btn--primary; no literal colour, size or url() in a component — v1 rule, verified by the v1 checker
- [ ] spacing — --space-1…--space-9, gutter --space-4, cards --radius-card with a 1px --border border — 3 of 3 v1 card types
- [ ] motion — only through src/motion (onReveal, prefersReducedMotion, initCommitLine); plays once; final state under reduced motion; --ease-out, --dur-1, --dur-2 — the shared helpers, 4 of 4 v1 motion users
- [ ] decorative visuals — scenes, glows and screenshot frames are aria-hidden or carry meaningful alt; never the only carrier of meaning — v1 hero poster, mark and icons
- [ ] hidden states — the hidden attribute (the global [hidden] rule wins) — v1 Contact, Hero
- [ ] focus — the global :focus-visible ring; nothing removes it — v1 global.css
- [ ] layout — mobile-first, one breakpoint written as (min-width: 48rem) — 6 of 6 v1 components
- [ ] not copied from the mockups (.superpowers/brainstorm/…/layout-v2.html, opal-*.html): their inline styles, pixel sizes, literal colours, and fonts loaded from Google — only the structure and motion ideas carry over
```

### Task 2: Copy and assets for v2

**Files:**
- Create: `scripts/import-tenantry.mjs`; `public/work/tenantry/{logo-dark.svg,home.webp,search.webp,login-branded.webp}` (generated by the script from `../../JobHunt2025/multi-tenant-idm-saas`)
- Modify: `src/content/site.ts`, `tests/unit/site.test.ts`
- Test: `tests/unit/site.test.ts`, `tests/unit/work-assets.test.ts`

**Interfaces:**
- Produces:
  - in `site.ts`:
    - `export interface Project { id: string; name: string; logo: { src: string; width: number; height: number; alt: string }; badge: string; pitch: string; stats: { value: string; label: string }[]; tiers?: { name: string; body: string }[]; links: { demo?: { label: string; href: string }; code?: { label: string; href: string } }; shots: { src: string; alt: string; width: number; height: number; role: 'main' | 'back' | 'front' }[] }`;
    - `site.projects: Project[]`;
    - `site.sections = { work: { eyebrow, title, highlight }, services: { eyebrow, title, highlight }, process: { eyebrow, title, highlight }, nextProject: string }`;
    - `site.nav` = Work `#work`, Services, How we work, Contact;
    - `site.hero.secondary.href = '#work'`;
    - `site.contact.band = { title: 'Have a project in mind?', line: "Tell us what you're building.", orEmail: 'Or email', dialogTitle: 'Start a project', close: 'Close' }`.
  - Removes `site.openSource` and `site.sections.openSource`.
- Copy (spec v2 §3.1, exact):
  - work eyebrow "What we've built", title "Products we design, build", highlight "and run.";
  - services eyebrow "Services", title "What we build", highlight "for you.";
  - process eyebrow "How we work", title "From first call to", highlight "production.";
  - nextProject "Next project — space reserved".
  - Tenantry:
    - badge "v0.6.2 · MIT · live";
    - pitch "Multi-tenant sign-in, teams and branding for SaaS, built on Keycloak. Two tiers on one codebase, with isolation enforced at the token, the API and the database.";
    - stats 33 / "isolation guarantees tested in CI", 2 / "tiers: shared realm or a realm each", 1 / "codebase for both tiers";
    - tiers Standard "Organizations in one shared realm. Cheap, instant, one sign-on." and Enterprise "A realm of their own, with apps, security rules and directory sync.";
    - links demo "Try the live demo" and code "View the code".
  - Services deliverables trimmed to 3 each:
    - web: React + TypeScript frontends, NestJS or FastAPI backends, Postgres and Docker deploys;
    - ai: RAG search over your documents, Chat assistants, Document extraction including Arabic;
    - identity: Keycloak SSO, Organizations and role-based access, Enterprise SSO for your customers.

- [ ] **Step 1: Update `site.test.ts`.**
  - `nav targets` → `['#work','#services','#how-we-work','#contact']`.
  - `hero secondary points to #work`.
  - `one project, Tenantry, with exact links` (demo/code hrefs as in Global Constraints).
  - `three Tenantry stats with values 33, 2, 1`.
  - `services have three deliverables each`.
  - `no openSource key`.
  - The forbidden-content test is unchanged and still passes.
- [ ] **Step 2: Write `work-assets.test.ts`:**
  - `each shot file exists and matches its declared width/height`;
  - `the three shots total ≤ 150 KB`;
  - `logo-dark.svg is byte-identical to Tenantry's tenantry-logo-dark.svg`.
- [ ] **Step 3: Run** `npm test`. Expected: FAIL.
- [ ] **Step 4: Implement.**
  - **`import-tenantry.mjs`** copies the logo unchanged and converts the three PNGs to WebP at quality 80 with sharp, keeping their size (800×432 and 400×320).
  - **Run it,** then update `site.ts`.
  - **Remove** `BuildingInPublic.astro`, `src/motion/terminal.ts`, `tests/e2e/open-source.spec.ts`, and the `<BuildingInPublic />` import and usage in `index.astro`.
  - **Point the hero's secondary button at `#work`.** It reads from `site`, so changing the data is enough.
- [ ] **Step 5: Run** `npm test && npm run check`. Expected: PASS, 0 errors.
- [ ] **Step 6: Commit** `feat: v2 copy, Tenantry project data and assets`.

### Task 3: What we've built

**Files:**
- Create: `src/components/Work.astro`, `src/components/ProjectCard.astro`
- Modify: `src/pages/index.astro` (insert `<Work />` right after `<Hero />`), `src/styles/tokens.css` (`--feature-bg`, `--feature-text`, `--feature-muted`, `--feature-border`, `--shot-shadow`, `--float-y`)
- Test: `tests/e2e/work.spec.ts`

**Interfaces:**
- Consumes: `site.projects`, `site.sections.work`, `site.sections.nextProject` (Task 2); `.opal-text`, `.btn--primary`, `.btn--secondary` (Task 1); `prefersReducedMotion` (v1).
- Produces:
  - `ProjectCard.astro` with props `{ project: Project }`;
  - `Work.astro` as `<section id="work" class="section work" aria-labelledby="work-title">`.

UI checklist (re-read before writing; do not work from memory):
```
pengopal.com v2 — reference: the v1 sections on feat/homepage (Header, Hero, Services, HowWeWork, Contact, Footer), read 2026-11-10; the code wins.

- [ ] section holder — <section id=… aria-labelledby=…> with class "section", inside <main> in src/pages/index.astro; content in .container — 5 of 5 v1 sections
- [ ] headings — eyebrow (JetBrains Mono, --fs-label, uppercase, --muted) above an h2; h3 for cards/steps; opal highlight via .opal-text on one phrase of the h2 only — v1 h2/h3 pattern, 5 of 5; eyebrow and opal phrase as asked (spec v2 §3)
- [ ] copy — every string from site.ts (site.projects, site.services, site.process, site.contact, site.sections) — 10 of 10 v1 components
- [ ] buttons — only .btn .btn--primary / .btn--secondary from global.css; <a> for navigation, <button> for actions — the shared piece, used by Header, Hero, Contact
- [ ] values — only var(--…) from tokens.css; the mosaic only through --opal-mosaic tokens, .opal-text or .btn--primary; no literal colour, size or url() in a component — v1 rule, verified by the v1 checker
- [ ] spacing — --space-1…--space-9, gutter --space-4, cards --radius-card with a 1px --border border — 3 of 3 v1 card types
- [ ] motion — only through src/motion (onReveal, prefersReducedMotion, initCommitLine); plays once; final state under reduced motion; --ease-out, --dur-1, --dur-2 — the shared helpers, 4 of 4 v1 motion users
- [ ] decorative visuals — scenes, glows and screenshot frames are aria-hidden or carry meaningful alt; never the only carrier of meaning — v1 hero poster, mark and icons
- [ ] hidden states — the hidden attribute (the global [hidden] rule wins) — v1 Contact, Hero
- [ ] focus — the global :focus-visible ring; nothing removes it — v1 global.css
- [ ] layout — mobile-first, one breakpoint written as (min-width: 48rem) — 6 of 6 v1 components
- [ ] not copied from the mockups (.superpowers/brainstorm/…/layout-v2.html, opal-*.html): their inline styles, pixel sizes, literal colours, and fonts loaded from Google — only the structure and motion ideas carry over
```
Not in this task: services, timeline, contact.

- [ ] **Step 1: Write `work.spec.ts`:**
  - `section #work follows the hero with eyebrow, h2 and opal highlight "and run."`.
  - `Tenantry card: logo alt "Tenantry", badge, pitch, 3 stats, 2 tiers`.
  - `demo and code links are exact, open in a new tab with rel=noopener`.
  - `three screenshots, lazy, with width/height and alt text` (main/back/front by `data-role`).
  - `next-project slot shown while there is one project`.
  - `phone width: only the main screenshot shows, unrotated`, plus no horizontal scroll.
  - `reduced motion: screenshots do not float` (`animation-name` none).
  - `a missing screenshot keeps the layout and shows its alt`: route `**/work/tenantry/search.webp` to a 404, check the card's height is unchanged within 2px of the normal run, and that the img has its alt.
- [ ] **Step 2: Run** `npm run build && npx playwright test tests/e2e/work.spec.ts --project=chromium`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **Background:** the section uses `--feature-bg` (navy `#0E1A3A`) in both themes, with text tokens to match. The glow is a decorative `aria-hidden` `<div>` using `--opal-mosaic`, blurred, at 16% opacity.
  - **Screenshots:** each sits in a frame `<figure>` with a decorative bar, and floats using `@keyframes` with `--float-y`, gated by `prefers-reduced-motion`.
  - **Next-project slot:** rendered only when `site.projects.length < 2`, as an `<aside aria-hidden="true">`.
  - **Opal text** sits on the dark band, so it uses the dark (unfiltered) texture. Scope `--opal-mosaic-dim: none` to `.work`.
- [ ] **Step 4: Run** the same tests in all three browsers. Expected: PASS.
- [ ] **Step 5: Report the section ready for its check** (same checker). Fix what it reports.
- [ ] **Step 6: Commit** `feat: add What we've built section with Tenantry`.

### Task 4: Services with scenes

**Files:**
- Create: `src/components/scenes/SceneWeb.astro`, `SceneAI.astro`, `SceneIdentity.astro`; `src/motion/scenes.ts`
- Modify: `src/components/ServiceCard.astro`, `src/components/Services.astro`
- Delete: `src/components/icons/*`, `src/motion/assemble.ts`
- Test: `tests/e2e/services.spec.ts` (rewrite)

**Interfaces:**
- Consumes: `site.services`, `site.sections.services`; `onReveal`, `prefersReducedMotion`.
- Produces:
  - `playScene(scene: HTMLElement): void` in `src/motion/scenes.ts`. It sets `data-playing`, then `data-played="true"` after the scene's last step. Under reduced motion it sets `data-played="true"` immediately.
  - Each scene is a `<div class="scene scene--{web|ai|identity}" aria-hidden="true" data-scene>`.

UI checklist (re-read before writing; do not work from memory):
```
pengopal.com v2 — reference: the v1 sections on feat/homepage (Header, Hero, Services, HowWeWork, Contact, Footer), read 2026-11-10; the code wins.

- [ ] section holder — <section id=… aria-labelledby=…> with class "section", inside <main> in src/pages/index.astro; content in .container — 5 of 5 v1 sections
- [ ] headings — eyebrow (JetBrains Mono, --fs-label, uppercase, --muted) above an h2; h3 for cards/steps; opal highlight via .opal-text on one phrase of the h2 only — v1 h2/h3 pattern, 5 of 5; eyebrow and opal phrase as asked (spec v2 §3)
- [ ] copy — every string from site.ts (site.projects, site.services, site.process, site.contact, site.sections) — 10 of 10 v1 components
- [ ] buttons — only .btn .btn--primary / .btn--secondary from global.css; <a> for navigation, <button> for actions — the shared piece, used by Header, Hero, Contact
- [ ] values — only var(--…) from tokens.css; the mosaic only through --opal-mosaic tokens, .opal-text or .btn--primary; no literal colour, size or url() in a component — v1 rule, verified by the v1 checker
- [ ] spacing — --space-1…--space-9, gutter --space-4, cards --radius-card with a 1px --border border — 3 of 3 v1 card types
- [ ] motion — only through src/motion (onReveal, prefersReducedMotion, initCommitLine); plays once; final state under reduced motion; --ease-out, --dur-1, --dur-2 — the shared helpers, 4 of 4 v1 motion users
- [ ] decorative visuals — scenes, glows and screenshot frames are aria-hidden or carry meaningful alt; never the only carrier of meaning — v1 hero poster, mark and icons
- [ ] hidden states — the hidden attribute (the global [hidden] rule wins) — v1 Contact, Hero
- [ ] focus — the global :focus-visible ring; nothing removes it — v1 global.css
- [ ] layout — mobile-first, one breakpoint written as (min-width: 48rem) — 6 of 6 v1 components
- [ ] not copied from the mockups (.superpowers/brainstorm/…/layout-v2.html, opal-*.html): their inline styles, pixel sizes, literal colours, and fonts loaded from Google — only the structure and motion ideas carry over
```
Must not be copied from the mockup: its literal colours, pixel positions and inline styles.

- [ ] **Step 1: Rewrite `services.spec.ts`:**
  - `h2 "What we build" with opal "for you."`.
  - `three cards, each with an aria-hidden scene, an h3, the outcome and 3 deliverables`.
  - `every scene reaches data-played="true" after scrolling into view` (timeout 5s).
  - `AI scene answer appears only after the question` (the answer is hidden before `data-played`).
  - `reduced motion: scenes are played on load and nothing animates`.
  - `without JavaScript: scenes show their final frame` (the AI answer is visible).
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the scenes from spec v2 §3.2's table, with tokens only:
  - **Web:** a window with a sidebar and content lines; one `--opal-mosaic` card; a navy `<App /> → prod` chip.
  - **AI:** a document with one mosaic line; a question bubble (navy), a typing indicator, and an answer bubble.
  - **Identity:** six tenant tiles (one mosaic "ent" tile); a flowing dashed wire to a navy guard holding a shield SVG.
  - **Default state** (no JS) is the final frame. JS sets `data-pending` before reveal, and `playScene` runs the steps with `--dur-1`/`--dur-2` delays.
  - **Card copy:** the copy in ServiceCard comes from `site` (no "Tech:" line).
- [ ] **Step 4: Run** the services and a11y specs. Expected: PASS.
- [ ] **Step 5: Report the section ready for its check** (same checker). Fix what it reports.
- [ ] **Step 6: Commit** `feat: services with animated scenes`.

### Task 5: Showcase timeline

**Files:**
- Modify: `src/components/HowWeWork.astro`, `src/motion/commitLine.ts`
- Test: `tests/e2e/process.spec.ts` (rewrite), `tests/unit/commit-line.test.ts`

**Interfaces:**
- Consumes: `site.process`, `site.sections.process`.
- Produces: `initCommitLine(list: HTMLOListElement, axis: () => 'x' | 'y' = () => 'y'): () => void`. On `'x'` it measures progress across the list's width while the section passes the viewport. It still only grows; `--progress` stays 0–1. Steps get `data-reached` when the progress passes their node's centre on the active axis.

UI checklist (re-read before writing; do not work from memory):
```
pengopal.com v2 — reference: the v1 sections on feat/homepage (Header, Hero, Services, HowWeWork, Contact, Footer), read 2026-11-10; the code wins.

- [ ] section holder — <section id=… aria-labelledby=…> with class "section", inside <main> in src/pages/index.astro; content in .container — 5 of 5 v1 sections
- [ ] headings — eyebrow (JetBrains Mono, --fs-label, uppercase, --muted) above an h2; h3 for cards/steps; opal highlight via .opal-text on one phrase of the h2 only — v1 h2/h3 pattern, 5 of 5; eyebrow and opal phrase as asked (spec v2 §3)
- [ ] copy — every string from site.ts (site.projects, site.services, site.process, site.contact, site.sections) — 10 of 10 v1 components
- [ ] buttons — only .btn .btn--primary / .btn--secondary from global.css; <a> for navigation, <button> for actions — the shared piece, used by Header, Hero, Contact
- [ ] values — only var(--…) from tokens.css; the mosaic only through --opal-mosaic tokens, .opal-text or .btn--primary; no literal colour, size or url() in a component — v1 rule, verified by the v1 checker
- [ ] spacing — --space-1…--space-9, gutter --space-4, cards --radius-card with a 1px --border border — 3 of 3 v1 card types
- [ ] motion — only through src/motion (onReveal, prefersReducedMotion, initCommitLine); plays once; final state under reduced motion; --ease-out, --dur-1, --dur-2 — the shared helpers, 4 of 4 v1 motion users
- [ ] decorative visuals — scenes, glows and screenshot frames are aria-hidden or carry meaningful alt; never the only carrier of meaning — v1 hero poster, mark and icons
- [ ] hidden states — the hidden attribute (the global [hidden] rule wins) — v1 Contact, Hero
- [ ] focus — the global :focus-visible ring; nothing removes it — v1 global.css
- [ ] layout — mobile-first, one breakpoint written as (min-width: 48rem) — 6 of 6 v1 components
- [ ] not copied from the mockups (.superpowers/brainstorm/…/layout-v2.html, opal-*.html): their inline styles, pixel sizes, literal colours, and fonts loaded from Google — only the structure and motion ideas carry over
```

- [ ] **Step 1: Write tests.**
  - `commit-line.test.ts` (jsdom; mock `getBoundingClientRect` and the scroll position): `x axis: reached follows node centres`; `progress never decreases`; `axis switch keeps the highest progress`.
  - `process.spec.ts`:
    - `desktop: four steps in a horizontal row (each node's y within 4px of the first)`.
    - `phone: steps stacked vertically`.
    - `rail fills with the mosaic and every node is passed after scrolling past`.
    - `the rail only grows when scrolling back up`.
    - `resizing across the breakpoint keeps every passed step`: scroll past at 1280px, resize to 375px, check that all four are still `data-reached` and `--progress` is 1.
    - `reduced motion: full rail on load`.
    - `ol semantics kept`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **Layout:**
    - desktop: a horizontal grid of four;
    - rail as a pseudo-element at the node row, filled part = `--opal-mosaic` scaled by `--progress`;
    - nodes 38px circles (`--space-*` based token `--node-size`), navy once reached, outlined before;
    - each panel carries a mini visual in `aria-hidden` (day 1, week 1, bars, live) whose filled parts use the mosaic.
  - **Phone:** v1's vertical layout.
  - **Axis:** passed from `matchMedia('(min-width: 48rem)')`.
- [ ] **Step 4: Run** the unit and e2e tests in three browsers. Expected: PASS.
- [ ] **Step 5: Report the section ready for its check** (same checker). Fix what it reports.
- [ ] **Step 6: Commit** `feat: showcase timeline`.

### Task 6: Contact band and dialog

**Files:**
- Modify: `src/components/Contact.astro` (the band + `<dialog>` + no-JS `<details>`), `src/scripts/contact.ts` (Turnstile trigger = the dialog opening)
- Test: `tests/e2e/contact.spec.ts` (update every test to open the dialog first), `tests/e2e/contact-band.spec.ts`

**Interfaces:**
- Consumes: `site.contact`, including `band` (Task 2); `initContact(form)` (v1).
- Produces: `initContact(form: HTMLFormElement, opts: { loadWhen: 'reveal' | 'manual' } = { loadWhen: 'reveal' }): { loadSpamCheck(): void }`. `Contact.astro` calls it with `manual` and calls `loadSpamCheck()` the first time the dialog opens; calling it again does nothing.
- Markup:
  - `<section id="contact" class="contact-band" aria-labelledby="contact-title">` holds the h2 and the line, an `<a class="btn btn--primary" href="#contact-form" data-open-contact>`, and a `<details id="contact-form" class="contact-fallback">` with a summary and the form.
  - On load, the script moves the form into `<dialog class="contact-dialog" aria-labelledby="contact-dialog-title">`, hides the `<details>`, and turns the link into a dialog trigger (`role` stays link, `preventDefault`).

UI checklist (re-read before writing; do not work from memory):
```
pengopal.com v2 — reference: the v1 sections on feat/homepage (Header, Hero, Services, HowWeWork, Contact, Footer), read 2026-11-10; the code wins.

- [ ] section holder — <section id=… aria-labelledby=…> with class "section", inside <main> in src/pages/index.astro; content in .container — 5 of 5 v1 sections
- [ ] headings — eyebrow (JetBrains Mono, --fs-label, uppercase, --muted) above an h2; h3 for cards/steps; opal highlight via .opal-text on one phrase of the h2 only — v1 h2/h3 pattern, 5 of 5; eyebrow and opal phrase as asked (spec v2 §3)
- [ ] copy — every string from site.ts (site.projects, site.services, site.process, site.contact, site.sections) — 10 of 10 v1 components
- [ ] buttons — only .btn .btn--primary / .btn--secondary from global.css; <a> for navigation, <button> for actions — the shared piece, used by Header, Hero, Contact
- [ ] values — only var(--…) from tokens.css; the mosaic only through --opal-mosaic tokens, .opal-text or .btn--primary; no literal colour, size or url() in a component — v1 rule, verified by the v1 checker
- [ ] spacing — --space-1…--space-9, gutter --space-4, cards --radius-card with a 1px --border border — 3 of 3 v1 card types
- [ ] motion — only through src/motion (onReveal, prefersReducedMotion, initCommitLine); plays once; final state under reduced motion; --ease-out, --dur-1, --dur-2 — the shared helpers, 4 of 4 v1 motion users
- [ ] decorative visuals — scenes, glows and screenshot frames are aria-hidden or carry meaningful alt; never the only carrier of meaning — v1 hero poster, mark and icons
- [ ] hidden states — the hidden attribute (the global [hidden] rule wins) — v1 Contact, Hero
- [ ] focus — the global :focus-visible ring; nothing removes it — v1 global.css
- [ ] layout — mobile-first, one breakpoint written as (min-width: 48rem) — 6 of 6 v1 components
- [ ] not copied from the mockups (.superpowers/brainstorm/…/layout-v2.html, opal-*.html): their inline styles, pixel sizes, literal colours, and fonts loaded from Google — only the structure and motion ideas carry over
```

- [ ] **Step 1: Write and update tests.**
  - In `contact.spec.ts`, every test first clicks "Start a project" in `#contact` and waits for `dialog[open]`.
  - `contact-band.spec.ts`:
    - `band shows title, line and email link, and no form until opened`.
    - `the dialog opens, focuses Name, and closes with Escape and the close button, returning focus to the trigger`.
    - `the spam check is requested only after the dialog first opens`: count requests to `challenges.cloudflare.com` before and after.
    - `reopening the dialog keeps the text and one spam check`: type a name, close, reopen; the value is kept and `[data-turnstile]` has exactly one child widget call (stub counts `render` calls = 1).
    - `without JavaScript the form is reachable in the band`: with `javaScriptEnabled: false`, click the summary and the Name field is visible.
    - `the header CTA and hero CTA open the dialog too`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **Dialog:** native `showModal()`; `close` restores focus to the opener.
  - **Header and hero CTAs:** they get `data-open-contact` through their `href="#contact"` (the script binds `a[href="#contact"].btn--primary`).
  - **Burst:** `burst()` still fires from the success message inside the dialog.
  - **Styles:** the dialog uses surface/border tokens and `--radius-card`, with a `::backdrop` scrim from tokens (`--scrim`).
- [ ] **Step 4: Run** all contact specs in three browsers and the unit tests. Expected: PASS.
- [ ] **Step 5: Report the section ready for its check** (same checker). Fix what it reports.
- [ ] **Step 6: Commit** `feat: contact band with dialog form`.

### Task 7: Quality gates and review

- [ ] **Step 1: Run everything:** `npm run check && npm test && npm run build && npx playwright test && npm run lhci`. Expected: all pass, and Lighthouse ≥ 95 in all four categories. If performance drops below 95, check the screenshots (lazy loading, sizes) and the mosaic animation cost first.
- [ ] **Step 2: Run the weight budget:** texture ≤ 40 KB, the three shots ≤ 150 KB (the Task 2 test), initial JS < 50 KB gzip (measure as in v1 Task 7).
- [ ] **Step 3: Recalibrate the checker** on the new kind of section. In a temporary worktree, take a copy of `Work.astro` with the demo link rendered as a `<button onclick>` and hand it to a fresh agent with `ui-consistency:verifying` and the checklist. It must find the plant. Then one checker reviews every v2 section together, with `ui-consistency:accessibility`. Fix its findings test-first.
- [ ] **Step 4: Screenshots:** run `node scripts/screenshots.mjs` (light, dark, phone) and send them to Furqan for approval.
- [ ] **Step 5: Final review:** a fresh reviewer on the most capable model reviews the whole branch since `f48ab19`, with this plan's Review Focus. Fix its Critical and Important findings test-first in one pass, and ledger the minor ones.
- [ ] **Step 6: Commit** `chore: v2 quality gates`. Report to Furqan: test numbers, Lighthouse, screenshots, deferred minors, and the rulings made.
