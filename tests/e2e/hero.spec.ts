import { test, expect } from '@playwright/test';

const HEADLINE = 'Software and AI, built end to end.';

test('h1 text and the two calls to action', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText(HEADLINE);
  await expect(page.locator('h1 .opal-text')).toHaveText('built end to end.');
  const hero = page.locator('section.hero');
  await expect(hero.locator('a.btn.btn--primary')).toHaveAttribute('href', '#contact');
  await expect(hero.locator('a.btn.btn--secondary')).toHaveAttribute('href', '#open-source');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('poster renders 220 glyphs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('svg[data-poster] text')).toHaveCount(220);
    await expect(page.locator('svg[data-poster]')).toBeVisible();
  });
});

test('canvas mounts and poster hides', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'headless WebGL is only reliable in Chromium');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('canvas[data-codestream]')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('svg[data-poster]')).toBeHidden({ timeout: 8000 });
  expect(errors).toEqual([]);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('keeps the poster and never mounts the canvas', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    await expect(page.locator('canvas[data-codestream]')).toBeHidden();
    await expect(page.locator('svg[data-poster]')).toBeVisible();
  });
});

test('poster stays when the three.js chunk fails', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/_astro/mount.*.js', (r) => r.abort());
  await page.goto('/');
  await page.waitForTimeout(3000);
  await expect(page.locator('svg[data-poster]')).toBeVisible();
  await expect(page.locator('canvas[data-codestream]')).toBeHidden();
  expect(errors).toEqual([]);
});
