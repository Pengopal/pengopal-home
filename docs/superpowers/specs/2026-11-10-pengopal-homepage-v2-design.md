# Pengopal homepage v2 — design spec

Date: 2026-11-10 · Status: awaiting Furqan's review · Builds on: `2026-11-10-pengopal-homepage-design.md` (v1). Everything in v1 still holds unless this document changes it.

## 1. Why v2

Furqan's review of v1: "too simple and plain". The hero stays as it is. The rest of the page changes in five ways:

- **Brand colour.** Opal becomes the primary brand colour, with navy as the secondary. The generic gradient text is replaced by a custom **Opal Mosaic** treatment taken from the logo.
- **Work first.** A new **What we've built** section leads the page, featuring **Tenantry**, with room for more projects later.
- **Services.** The cards get richer, animated scenes instead of line icons.
- **How we work.** It becomes a modern showcase timeline.
- **Contact.** It becomes a quiet band; the form moves into a dialog.

Decisions made with Furqan in the visual companion (mockups in `.superpowers/brainstorm/`):

| Topic | Decision |
|---|---|
| Brand text style | **Opal Mosaic**: text filled with a faceted texture whose every colour is a real pixel from the logo's "opal" letters, drifting slowly |
| Primary button | **Mosaic border**: navy fill, white text, a thin drifting opal-mosaic border |
| Secondary button | Outline, as in v1 |
| Page order | Hero → What we've built → Services → How we work → contact band → footer |
| Tenantry links | The live demo `https://tenantry.pengopal.com` **and** the public repo `https://github.com/mfurqanwork/tenantry-keycloak-multitenancy` |

## 2. Brand system

**Mosaic texture.**
- `scripts/make-opal-mosaic.mjs` (sharp) generates `public/brand/opal-mosaic.webp`, 900×300, at most 40 KB.
- It builds 170 Voronoi cells. Each cell is filled with a colour picked from the real pixels of the "opal" letters in `../Brand Assets/Brand_logo_original.jpg`: the crop x 625–995, y 640–810, keeping pixels with chroma > 45 and min channel < 215.
- Each cell gets a 12% directional shade, giving a crystal sheen.
- The random seed is fixed (7), so the texture is reproducible. It is never hand-edited.

**Tokens** (in `tokens.css`):
- `--opal-mosaic: url('/brand/opal-mosaic.webp')`.
- `--opal-mosaic-size` (420px for text, 240px for borders).
- `--opal-mosaic-dim: brightness(.74) saturate(1.25)` (light theme) / `none` (dark theme).
- `--opal-drift: 24s`.

**`.opal-text` (replaces v1's gradient text).**
- Text is filled with the mosaic via `background-clip: text`.
- In light mode the mosaic is dimmed with `--opal-mosaic-dim`.
- It drifts horizontally over `--opal-drift`, and stays still under reduced motion.
- Use it only for short highlights: one phrase per heading.
- **Contrast rule:** opal text is allowed only at heading sizes (≥ 24px, bold), where WCAG's 3:1 large-text threshold applies. A test checks that the dimmed texture's darkest-luminance 95th percentile reaches ≥ 3:1 against white (light) and `#0E1A3A` (dark). The test samples the generated texture with the same filter maths. If it fails, the dim factor is lowered until it passes.

**`.btn--primary` (changes v1's).**
- Navy `--ink` fill, white text (15.5:1).
- A 2.5px transparent border painted with the mosaic using the `padding-box`/`border-box` background technique. The mosaic drifts.
- Hover: a soft opal glow (`box-shadow` with a palette colour at 35%).
- Dark theme: the same, which shows on navy because of the border.
- `.btn--secondary` stays the v1 outline.

**Hero.** The headline highlight and the primary button pick up `.opal-text` and the new `.btn--primary` automatically. No other hero changes.

## 3. Sections

### 3.1 What we've built (`#work`, new, after the hero)

- **Background:** deep navy `--ink-deep` in both themes, a feature band. A large, blurred, 16%-opacity mosaic glow sits in the top-right corner.
- **Heading:** eyebrow "What we've built", h2 "Products we design, build <opal>and run.</opal>".
- **Projects come from `site.projects: Project[]`**, so more can be added without touching components. The first and only entry for now is Tenantry. Copy is taken from Tenantry's README, never invented:
  - **Logo:** `public/work/tenantry/logo-dark.svg`, a copy of Tenantry's `tenantry-logo-dark.svg`, unaltered to respect Tenantry's brand rules.
  - **Badge:** "v0.6.2 · MIT · live".
  - **Pitch:** "Multi-tenant sign-in, teams and branding for SaaS, built on Keycloak. Two tiers on one codebase, with isolation enforced at the token, the API and the database."
  - **Stats** (all from the README): "33 / isolation guarantees tested in CI", "2 / tiers: shared realm or a realm each", "1 / codebase for both tiers".
  - **Tiers:**
    - Standard: "Organizations in one shared realm. Cheap, instant, one sign-on."
    - Enterprise: "A realm of their own, with apps, security rules and directory sync."
  - **Links:** primary "Try the live demo" → `https://tenantry.pengopal.com`; secondary "View the code" → the GitHub repo. Both open in a new tab with `rel="noopener"`.
  - **Screenshots** (copied from Tenantry's `docs/images/`, converted to WebP):
    - `home.webp`, the main frame;
    - `search.webp`, behind it, rotated 3°;
    - `login-branded.webp`, in front, rotated −2°.
    Each sits in a browser frame and floats gently (±6px, 7–9s). They are lazy-loaded with width and height set, and their alt text describes each screen.
- **Room for more:** a dashed "Next project" slot under the project. It's an `aside`, hidden from assistive technology since it has no content, and appears only while `site.projects.length < 2`.
- **Layout:** two columns at ≥ 48rem (text left, screenshots right). On phones the screenshots stack under the text and only `home.webp` is shown, unrotated.
- **Data shape:** `Project = { id; name; logo: { src; width; height }; badge; pitch; stats: { value; label }[]; tiers?: { name; body }[]; links: { demo?: string; code?: string }; shots: { src; alt; width; height }[] }`.

### 3.2 Services (`#services`, changed)

The three cards keep their copy from v1, trimmed to three deliverables each, with a short tech line. The 48px line icons are replaced by a 150px-tall **scene** at the top of each card. Each scene is built from HTML and CSS with mosaic accents:

| Service | Scene | Motion |
|---|---|---|
| Web apps & SaaS | An app window (sidebar, content lines, one mosaic card) and a navy chip `<App /> → prod` | The mosaic card drifts; on reveal, the content lines draw in from left to right |
| AI features | A document with one mosaic-highlighted line, a question bubble (navy) and an answer bubble citing it | On reveal: the question appears, a typing indicator shows, then the answer appears. It plays once |
| Identity & multi-tenant SaaS | Six tenant tiles (one opal "Enterprise" tile) wired with a dashed line into a navy "one guard" shield | The dash flows towards the guard; on reveal, the tiles light up one after another |

- Scenes are `aria-hidden`. The card's h3, outcome and list carry the meaning.
- Under reduced motion, each scene shows its final frame.
- The icon components from v1 (`src/components/icons/*`) are removed.

### 3.3 How we work (`#how-we-work`, changed)

- **Desktop (≥ 48rem): a horizontal showcase track.**
  - Four numbered nodes sit on a rail. The rail's filled part is the mosaic, growing as the section scrolls through the viewport, using v1's `initCommitLine` logic adapted to width. It only ever grows.
  - Under each node is a step panel (h3, body) with a mini visual:
    - "day 1": a single commit dot;
    - "week 1": two commit dots;
    - a milestone bar chart whose bars fill with mosaic as the rail passes;
    - "live": a dot in opal blue.
  - Nodes the rail has passed turn navy; the rest are outlined.
- **Phones:** the same steps, stacked vertically along a vertical rail, as in v1.
- The process note ("You talk directly to the engineer…") sits under the h2.
- `<ol>` semantics are kept. Reduced motion shows the rail full and every node passed.

### 3.4 Contact (`#contact`, changed)

- A quiet band before the footer, not a full section: h2 "Have a project in mind?" (visually sized as h3), the line "Tell us what you're building. Or email hello@pengopal.com", and one primary button "Start a project".
- **The button opens a native `<dialog>`** holding v1's form, unchanged. The dialog:
  - focuses its first field when opened;
  - closes with Escape or a close button;
  - returns focus to the trigger;
  - turns the Turnstile load trigger into "the dialog opened".
- **Without JavaScript**, the button is a link to `#contact-form`. The form renders inside the band, below the line, with `<details>` closed: a disclosure titled "Start a project" containing the form. With JavaScript, the dialog path is used instead.
- Every v1 contact behaviour and test still applies inside the dialog.

### 3.5 Navigation

- Header links become: Work (`#work`) · Services · How we work · Contact.
- "Open source" and the old `#open-source` section are removed. Tenantry *is* the open-source project now.
- The hero's secondary button "See what we're building" now points to `#work`.

## 4. What is removed

- The v1 "Building in public" section (`BuildingInPublic.astro`, `motion/terminal.ts` and their tests). It's superseded by What we've built.
- The v1 service icon files.
- `site.openSource` and `site.sections.openSource`.

## 5. Quality bar (v1's, plus)

- All v1 checks still pass: unit, e2e in three browsers, axe with no WCAG 2.1 AA violations in light and dark, Lighthouse mobile ≥ 95 in all four categories, phone width with no horizontal scroll.
- **New tests:**
  - **Opal contrast:** the texture/filter contrast check from §2.
  - **Projects:** the Tenantry card renders from `site.projects`; demo and code links are correct and have `rel="noopener"`; screenshots are lazy-loaded with alt text; the next-project slot is hidden at ≥ 2 projects.
  - **Services:** the scenes are `aria-hidden` and reach their final frame (including under reduced motion).
  - **Timeline:** the horizontal track at desktop width and the vertical one at phone width; the rail only grows; every node is passed at the end of scrolling.
  - **Contact dialog:** opens and closes (button, Escape); focus moves in and returns; the Turnstile script is requested only after the dialog opens; the no-JS `<details>` fallback holds the form.
  - **Copy:** the forbidden-content test also covers the new copy. Tenantry's facts come only from its README.
- **Weight budget:** mosaic texture ≤ 40 KB; the three screenshots together ≤ 150 KB as WebP; the page's own JS before the 3D stays under 50 KB gzip.
- **Visual review:** screenshots in light, dark and phone, reviewed by Furqan before merging.
