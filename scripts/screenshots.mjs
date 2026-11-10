// Screenshots of the built site for review: light desktop, dark desktop, 375px phone.
// Usage: npm run build && node scripts/screenshots.mjs [outDir=screenshots] [--header]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const headerOnly = args.includes('--header');
const out = args.find((a) => !a.startsWith('--')) ?? 'screenshots';
const PORT = 4329;
const url = `http://127.0.0.1:${PORT}/`;
mkdirSync(out, { recursive: true });

const server = spawn('npx', ['astro', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 40; i++) {
  try { if ((await fetch(url)).ok) break; } catch { /* not up yet */ }
  await new Promise((r) => setTimeout(r, 250));
}

const views = [
  ['light', { colorScheme: 'light', viewport: { width: 1280, height: 800 } }],
  ['dark', { colorScheme: 'dark', viewport: { width: 1280, height: 800 } }],
  ['phone', { colorScheme: 'light', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true }],
];

const browser = await chromium.launch();
try {
  for (const [name, opts] of views) {
    const page = await (await browser.newContext(opts)).newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    if (headerOnly) {
      if (name === 'phone') await page.getByRole('button', { name: 'Menu' }).click();
      await page.screenshot({ path: `${out}/header-${name}.png`, clip: { x: 0, y: 0, width: opts.viewport.width, height: name === 'phone' ? 420 : 160 } });
    } else {
      // Let scroll-triggered sections play out before the full-page capture.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
    }
  }
} finally {
  await browser.close();
  server.kill();
  // Astro allows one preview server per project; make sure ours is gone so tests can start theirs.
  await new Promise((r) => spawn('npx', ['astro', 'preview', 'stop'], { shell: true, stdio: 'ignore' }).on('exit', r));
}
console.log(`screenshots written to ${out}/`);
process.exit(0);
