import { test, expect } from '@playwright/test';

test('hero highlight uses the opal mosaic', async ({ page }) => {
  await page.goto('/');
  const hl = page.locator('h1 .opal-text');
  await expect(hl).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
  expect(await hl.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain('opal-mosaic');
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`primary buttons are navy with white text and a mosaic border (${colorScheme})`, async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme });
    const page = await ctx.newPage();
    await page.goto('/');
    const btn = page.locator('.btn--primary').first();
    await expect(btn).toHaveCSS('background-color', 'rgb(18, 34, 74)');
    await expect(btn).toHaveCSS('color', 'rgb(255, 255, 255)');
    expect(await btn.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain('opal-mosaic');
    await ctx.close();
  });
}

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('opal text and primary buttons do not animate', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1 .opal-text')).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.btn--primary').first()).toHaveCSS('animation-name', 'none');
  });
});

test('decorative motion waits until the page has loaded and gone idle', async ({ page }) => {
  await page.addInitScript(() => {
    // Record the motion flag and the opal text's play state once the document is parsed, which is always
    // before the load event (a first animation frame can come after load + idle on a busy machine).
    document.addEventListener('DOMContentLoaded', () => {
      const hl = document.querySelector('h1 .opal-text');
      (window as unknown as { __first: unknown }).__first = {
        motion: document.documentElement.dataset.motion ?? null,
        state: hl ? getComputedStyle(hl).animationPlayState : null,
      };
    });
  });
  await page.goto('/');
  expect(await page.evaluate(() => (window as unknown as { __first: unknown }).__first)).toEqual({ motion: null, state: 'paused' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on', { timeout: 5000 });
  await expect(page.locator('h1 .opal-text')).toHaveCSS('animation-play-state', 'running');
});

test.describe('reduced motion never turns decorative motion on', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no data-motion flag', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2500);
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', 'on');
  });
});

test('the feature-band glow uses a mask, not a blur filter', async ({ page }) => {
  await page.goto('/');
  const glow = page.locator('section#work .work__glow');
  await expect(glow).toHaveCSS('filter', 'none');
  expect(await glow.evaluate((el) => getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage)).toContain('radial-gradient');
});

test('opal text stays visible when the mosaic texture fails to load', async ({ page }) => {
  await page.route('**/brand/opal-mosaic.webp', (r) => r.fulfill({ status: 404, body: '' }));
  await page.goto('/');
  const bg = await page.locator('h1 .opal-text').evaluate((el) => getComputedStyle(el).backgroundImage);
  // A gradient layer sits under the texture, so the clipped text always has a fill.
  expect(bg).toContain('opal-mosaic');
  expect(bg).toContain('linear-gradient');
});
