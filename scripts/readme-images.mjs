// Regenerates the README's images in docs/images/ from the built site.
// Usage: npm run build && node scripts/readme-images.mjs
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const OUT = 'docs/images';
const PORT = 4331;
const URL = `http://127.0.0.1:${PORT}/`;
mkdirSync(OUT, { recursive: true });

const server = spawn('npx', ['astro', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(URL)).ok) break; } catch { /* not up yet */ }
  await new Promise((r) => setTimeout(r, 250));
}

/** Small, sharp PNGs: a 256-colour palette keeps README images light without visible loss. */
const save = (buf, name, width) =>
  sharp(buf).resize({ width, withoutEnlargement: true }).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(`${OUT}/${name}.png`);

async function settle(page) {
  // Scroll through so every section's reveal plays, then let the motion settle.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);
}

const browser = await chromium.launch();
try {
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.route('https://challenges.cloudflare.com/**', (r) => r.abort());
    await page.goto(URL, { waitUntil: 'networkidle' });
    await settle(page);
    await save(await page.screenshot(), `hero-${scheme}`, 1280);
    if (scheme === 'light') {
      for (const [sel, name] of [['#work', 'work'], ['#services', 'services'], ['#how-we-work', 'process']]) {
        const el = page.locator(`section${sel}`);
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(600);
        await save(await el.screenshot(), name, 1280);
      }
      await page.locator('section#contact [data-open-contact]').click();
      await page.waitForTimeout(600);
      await save(await page.screenshot(), 'contact-dialog', 1280);
    }
    await ctx.close();
  }

  const phone = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await phone.newPage();
  await p.goto(URL, { waitUntil: 'networkidle' });
  await save(await p.screenshot(), 'phone', 375 * 2);
  await phone.close();

  // The header card: the dark lockup on deep navy, cropped from the share image.
  await sharp('public/og.png').extract({ left: 0, top: 165, width: 1200, height: 300 }).png({ compressionLevel: 9 }).toFile(`${OUT}/readme-card.png`);
} finally {
  await browser.close();
  server.kill();
  await new Promise((r) => spawn('npx', ['astro', 'preview', 'stop'], { shell: true, stdio: 'ignore' }).on('exit', r));
}
console.log(`README images written to ${OUT}/`);
process.exit(0);
