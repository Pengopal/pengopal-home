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
