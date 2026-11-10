# Pengopal homepage — design spec

Date: 2026-11-10 · Status: awaiting Furqan's review · Site: pengopal.com

## 1. Purpose and success

A single-page company site for Pengopal, a software and AI studio. It must make clear, within one screen, what Pengopal builds, and turn interested visitors into project enquiries. It is a **company** site, not a personal portfolio. There is no founder section, no photo, and no named past employers.

There is no client portfolio yet, so trust comes from three things: a clear explanation of the services, visible craft (the site itself is the proof of quality), and honesty. The site never fabricates testimonials, client logos, stats, years in business or team members.

**Done means:**
- All sections in §3 are live on pengopal.com.
- The contact form delivers enquiries to Furqan's inbox.
- Every check in §8 passes.

## 2. Decisions already made

| Topic | Decision |
|---|---|
| Logo | Swimming penguin with opal wake. The header uses `Brand Assets/web-ready/logo-horizontal/pengopal-horizontal-light.svg` |
| Visual direction | "Code Current": light and kinetic. The penguin's opal wake is made of flowing code characters |
| 3D | The code stream is rendered in real 3D depth with Three.js and tilts with the mouse. The penguin itself stays the exact logo SVG |
| Headline | "Software and AI, built end to end." |
| Sub-line | "Pengopal is a founder-led studio building web apps, AI features, and secure multi-tenant SaaS — from first commit to production." |
| Founder | No section. LinkedIn appears in the footer only |
| Contact | Form plus mailto link. No mention of Pakistan or time zones anywhere |
| GitHub | Hidden until a GitHub organization exists (`pengopal` looked free on 2026-11-10) |
| Stack | Astro (static output) + TypeScript + Three.js |
| Hosting | Cloudflare **Workers with Static Assets** (not Pages; see §6.4) |

## 3. Page structure (top to bottom)

All copy lives in `src/content/site.ts` and can be edited without touching components. The text below is the starting draft.

### 3.1 Header
- Logo (light or dark variant, following the theme), linking to the top of the page.
- Anchor links: Services · How we work · Open source · Contact.
- Theme toggle.
- "Start a project" button, linking to `#contact`.
- Becomes a slim bar with a solid background after 24 px of scroll. On phone widths, the links collapse into a menu button that opens an accessible disclosure panel.

### 3.2 Hero
- The headline, with "built end to end." in deep-opal gradient text. The sub-line below it.
- Primary button "Start a project" (to `#contact`). Secondary "See what we're building" (to `#open-source`).
- The 3D code stream (§5) flows from the penguin's wake across the hero, behind the copy at low contrast and never under the text at a level that hurts legibility.

### 3.3 Services (`#services`)
Three cards. Each has an icon, a title, a one-line outcome, and deliverables:

1. **Web apps & SaaS.** "Product-ready web apps, from first screen to production deploy."
   - React and TypeScript frontends
   - NestJS or FastAPI backends
   - Postgres data models
   - Dockerised deploys
2. **AI features.** "AI that answers from your own data, not guesses."
   - RAG search over your documents
   - Chat assistants
   - Document extraction, including Arabic
   - AI added to an existing product
3. **Identity & multi-tenant SaaS.** "Sign-in, tenants and permissions done right from day one."
   - Keycloak SSO
   - Organizations and multi-tenancy
   - Role-based access control
   - Enterprise SSO for your customers

**Motion:** when a card enters the viewport, about 40 code characters drift in and settle into the card's icon shape. Plays once.

### 3.4 How we work (`#how-we-work`)
Four steps:
1. **Discovery call.** Understand the product, users and constraints.
2. **Plan & estimate.** Written scope, milestones and price before any code.
3. **Build in weekly milestones.** Working software every week, with a short written update.
4. **Launch & support.** Deploy, hand over, and stay on for fixes and next steps.

Supporting line: "You talk directly to the engineer building your product. No hand-offs, no account managers."

**Motion:** a vertical line styled like a git commit graph draws down as the user scrolls. Each step's commit dot lights up when its step is reached.

### 3.5 Building in public (`#open-source`)
- One card: **Multi-tenant SaaS starter** — Coming soon.
- Description: "A production-ready starter on Keycloak SSO. A shared realm with Organizations for standard tenants, realm-per-tenant for enterprise customers, Postgres row-level security, and a Docker deploy."
- No link until the GitHub organization exists. The link field in `site.ts` is optional; the card renders a link only when it is set.
- **Motion:** a mini terminal types out the planned features line by line, once.

### 3.6 Contact (`#contact`)
- Heading: "Start a project". Short line: "Tell us what you're building." (A reply-time promise is not included unless Furqan chooses to commit to one.)
- Form fields:
  - Name (required)
  - Email (required)
  - "What are you building?" (required, at most 4000 characters)
  - Timeline (optional select: As soon as possible · 1–3 months · 3+ months · Just exploring)
- Spam protection: a hidden honeypot field and Cloudflare Turnstile (managed, invisible mode).
- Alternative: "Prefer email? hello@pengopal.com" as a mailto link.
- **Success:** the form is replaced with a thank-you message, and a one-off burst of opal code characters plays.
- **Failure:** an inline error says the message didn't send. It offers a mailto link pre-filled with the visitor's text, so no enquiry is lost.

### 3.7 Footer
© {current year} Pengopal Technologies · hello@pengopal.com · LinkedIn (linkedin.com/in/furqan26).

### 3.8 Out of scope
Pricing, testimonials, case studies, blog, founder section, GitHub links, analytics. Any later addition gets its own spec.

## 4. Visual system

All values are defined once, in `src/styles/tokens.css`, as CSS custom properties.

**Colour.**
- Light theme (default): background `#FFFFFF` and `#F5F6FA`, ink `#12224A`, secondary navy `#2A3D78`, gold `#F4B740` for tiny highlights only.
- Dark theme: background `#0E1A3A`, text `#EEF2FF`, muted text `#AFC0F5`.
- Opal light gradient: `#6FE0F2 → #8FA8FF → #D3A6FF → #FFB6D3 → #FFE2A6 → #8DF0CF`.
- Opal deep gradient, for text on white: `#1FA9D1 → #5F6BFF → #A35CFF → #E8609E`.
- Gradient text appears only on short highlights.
- Code-stream character colours are **sampled from the logo's opal** (`Brand_logo_original.jpg`) and stored as a generated palette file. They are never hand-picked.

**Theme.** Follows `prefers-color-scheme` until the visitor uses the toggle. The choice is then stored in `localStorage`, read inside try/catch. An inline script in `<head>` sets the theme before first paint, so the page never flashes the wrong theme.

**Dark-mode logo.** A new variant made from the approved horizontal light SVG:
- "Peng" recoloured to `#EEF2FF`.
- A thin light outline (`#C9D3F5`) on the penguin's navy body.
- Opal unchanged.

It must pass the same colour check as the existing logo files (§8). The same dark lockup is used for the Open Graph image.

**Type.**
- Lexend 600 for headings.
- Inter 400/500 for body text.
- JetBrains Mono 400/600 for code characters and small labels.
- Self-hosted WOFF2, subset to Latin plus the code-stream glyphs, with `font-display: swap`.
- Only the heading weight and the body regular are preloaded.

**Layout.**
- 12-column grid, max content width 1200 px, 16 px side gutter on phones.
- Generous vertical rhythm.
- Cards: 1 px border, 12 px radius, no glassmorphism, no gradient washes, no blobs, no emoji, no stock photos.

**Icons.** Three custom line icons: brackets for web apps, a spark for AI, a key for identity. Each is an inline SVG at 1.75 px stroke.

**Motion vocabulary.**
- Ease-out (`cubic-bezier(.2,.7,.2,1)`), 400–700 ms, no bounce.
- Every animation ends in a static state.
- Scroll-triggered effects use IntersectionObserver and play once.
- Under `prefers-reduced-motion: reduce`, every element renders in its final state and the 3D stream does not start.

## 5. The 3D code stream

**Module.** `src/codestream/` is the only place Three.js is imported.

**Loading sequence.**
1. The server-rendered hero shows the logo, the copy, and a static SVG/PNG poster of the stream. This is the LCP content, and it needs no JavaScript.
2. After the `load` event, during idle time, the hero island dynamically imports the module. This is skipped under reduced motion, when WebGL is unavailable, or with `navigator.connection.saveData`.
3. Once the first frame renders, the canvas fades in over the poster, and the poster is removed from the accessibility tree. The canvas is `aria-hidden`.

**Rendering.**
- About 600 glyph instances, drawn as one instanced mesh.
- A single glyph atlas texture is generated at runtime from JetBrains Mono: `{}<>/=;()[]01=>&&||#@λ` plus short tokens such as `const`, `await`, `SSO`, `RAG`.
- Each instance has a position along a curved path that starts at the penguin's wake and exits left, a depth (z) between −6 and +2, a speed, and a colour from the sampled palette.
- Size and opacity are attenuated by depth, so near glyphs are large and sharp and far ones small and faded.

**Interaction.**
- Mouse position gently rotates the camera by up to 6°. On touch devices the stream drifts on its own. Device tilt is not used, because iOS would show a permission prompt.
- Glyphs within a radius of the cursor ray are pushed aside, then ease back.

**Performance guards.**
- `devicePixelRatio` is capped at 2.
- Rendering pauses when the hero is out of view (IntersectionObserver) or the tab is hidden (`visibilitychange`).
- The glyph count halves on viewports narrower than 768 px.
- A frame-time watchdog halves the count again if the average frame time exceeds 22 ms over 2 seconds.

**Failure behaviour.** Any error during import or initialisation leaves the poster in place and logs one console warning. The page never breaks.

## 6. Architecture

### 6.1 Repository layout
```
pengopal-web/
  astro.config.mjs        static output, sitemap integration
  wrangler.jsonc          Worker + static assets + send_email binding
  src/
    pages/index.astro     the single page (and 404.astro)
    layouts/Base.astro    <head>: meta, OG, theme script, font preloads
    styles/tokens.css     all design tokens
    styles/global.css
    content/site.ts       all copy and links (typed)
    components/           Logo, Header, ThemeToggle, Hero, Services, ServiceCard,
                          HowWeWork, BuildingInPublic, Contact, Footer
    codestream/           index.ts (entry), glyphAtlas.ts, stream.ts (path math), palette.ts
    motion/               reveal.ts (IntersectionObserver helpers), assemble.ts, commitLine.ts
  worker/
    index.ts              fetch handler: POST /api/contact → contact.ts; all else → ASSETS
    contact.ts            validation, honeypot, Turnstile check, email send
  public/                 favicons, logo SVGs (light + dark), og.png, robots.txt
  tests/                  unit (Vitest) and e2e (Playwright)
  README.md
```

**Unit boundaries.**
- `site.ts` has no imports from components.
- Components read only from `site.ts` and `tokens.css`.
- `codestream/` exposes one function, `mountCodeStream(canvas, poster): () => void`, which returns a cleanup function.
- `worker/contact.ts` exports a pure `handleContact(request, env, deps)`. Its dependencies (Turnstile verifier, mailer) are injected so it can be tested without Cloudflare.

### 6.2 Contact data flow
1. The browser submits JSON `{name, email, message, timeline, website (honeypot), turnstileToken}` to `POST /api/contact`.
2. The Worker rejects these outright:
   - a non-POST request → 405
   - a body over 16 KB → 413
   - a filled honeypot → 200 with no email sent, so bots learn nothing
3. Validation:
   - name 1–120 characters
   - a syntactically valid email of at most 254 characters
   - message 1–4000 characters
   - timeline one of the allowed values or empty
   - On failure, the Worker returns 400 with the field errors.
4. The Worker verifies the token with Turnstile `siteverify` using the `TURNSTILE_SECRET` secret and the visitor's IP. A failed check returns 403.
5. The Worker sends the email through the `send_email` binding:
   - from `website@pengopal.com`, a routing-domain address
   - to the verified destination in secret `CONTACT_TO`
   - reply-to set to the visitor's email
   - subject `New enquiry — {name}`
   - plain-text body with all fields
6. Success returns 200 `{ok:true}`. A mailer error returns 502 `{ok:false}`, and the client shows the mailto fallback (§3.6).

### 6.3 Secrets and privacy
- Furqan's private destination inbox is never committed. It lives in the Worker secret `CONTACT_TO`, alongside `TURNSTILE_SECRET`. The Turnstile site key is public and lives in `site.ts`.
- No analytics, no cookies, no third-party scripts other than Turnstile, which loads only when the contact section approaches the viewport.

### 6.4 Hosting
Cloudflare Workers with Static Assets, per Cloudflare's docs checked on 2026-11-10:
- Pages Functions do not support the `send_email` binding. Workers do.
- Cloudflare recommends Workers for new projects.
- Sending to a verified destination address is free on the Workers Free plan when Email Routing is configured.

Astro builds static files to `dist/`. `wrangler.jsonc` sets:
- `main: worker/index.ts`
- `assets: { directory: ./dist, binding: ASSETS, not_found_handling: "404-page" }`
- `send_email: [{ name: "EMAIL" }]`

pengopal.com and www.pengopal.com attach as custom domains, with www redirecting to the apex.

**Steps only Furqan can do (the README walks through them):**
1. Create a Turnstile widget for pengopal.com.
2. `wrangler secret put TURNSTILE_SECRET` and `wrangler secret put CONTACT_TO`.
3. Confirm the destination inbox is verified in Email Routing.
4. Authorise the first `wrangler deploy`.

### 6.5 SEO and metadata
- Title: "Pengopal — Software and AI, built end to end".
- Meta description from the sub-line.
- Canonical `https://pengopal.com/`.
- Open Graph and Twitter card using `og.png` (1200×630, the dark lockup on `#0E1A3A`).
- Favicons from `Brand Assets/web-ready/favicon/`.
- `sitemap.xml` via `@astrojs/sitemap` and `robots.txt` allowing everything.
- JSON-LD `Organization` with name, url, logo and email.

## 7. Error handling summary

| Situation | Behaviour |
|---|---|
| WebGL unavailable or 3D error | Poster stays, one console warning |
| Reduced motion | No 3D, no scroll animations; final states shown |
| `localStorage` blocked | Theme follows the system and the toggle still works for the session |
| Turnstile fails to load | Submit is disabled, with a note and the mailto link |
| Contact API 4xx | Field errors shown inline, input kept |
| Contact API 5xx or network error | Error message plus pre-filled mailto fallback, input kept |

## 8. Quality bar and tests

| Area | Tool | Pass condition |
|---|---|---|
| Contact logic | Vitest on `handleContact` with fake deps | Covers: valid, each validation failure, honeypot, Turnstile fail, mailer throw, wrong method, oversize body |
| Code-stream maths | Vitest on `stream.ts` and `palette.ts` | Path stays inside bounds; palette matches logo samples |
| Types and build | `astro check`, `tsc`, `astro build` | Zero errors |
| Page behaviour | Playwright (Chromium, Firefox, WebKit) | All sections render; anchors scroll; theme toggle persists; form success and failure paths, with the API mocked; no console errors |
| Phone width | Playwright at 375×812 | No horizontal scroll; menu works |
| Accessibility | `@axe-core/playwright` plus keyboard pass | Zero WCAG 2.1 AA violations; visible focus; logical tab order; form labels and errors announced |
| Performance | Lighthouse CI, mobile, on the built site | 95+ in all four categories; page JS before the deferred 3D under 50 KB gzip; LCP under 2.5 s |
| Reduced motion | Playwright with `reducedMotion: 'reduce'` | No canvas mounted; all content visible |
| Dark logo colours | The existing colour-check script | Opal stats within the tolerance of the approved files |
| Manual | Screenshots in light, dark and phone, reviewed by Furqan; one real form submission after the secrets are set | Furqan approves the look; the email arrives |

## 9. Risks

- **3D vs Lighthouse.** Mitigated by the poster-first, idle-time import and the frame watchdog. If mobile performance still falls below 95, phones get the poster only.
- **Opal text contrast.** Deep-opal gradient text on white must meet 4.5:1 at every stop for body sizes. Headline highlights at 40 px and above need 3:1. axe and a manual check confirm this; failing stops are darkened.
- **Email deliverability.** The first real submission is tested together (§8). If messages land in spam, the README covers marking the sender as safe.
