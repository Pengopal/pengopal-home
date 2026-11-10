import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

test('no horizontal scroll at phone width', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(375);
});
