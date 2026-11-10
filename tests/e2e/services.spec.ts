import { test, expect } from '@playwright/test';

test('three service cards, each with an h3 and four deliverables', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('section#services');
  await expect(section.locator('h2')).toHaveText('What we build for you.');
  const cards = section.locator('article.service');
  await expect(cards).toHaveCount(3);
  await expect(cards.locator('h3')).toHaveText(['Web apps & SaaS', 'AI features', 'Identity & multi-tenant SaaS']);
  for (let i = 0; i < 3; i++) await expect(cards.nth(i).locator('ul > li')).toHaveCount(3);
  await expect(cards.locator('svg.service__icon')).toHaveCount(3);
});

test('cards reach their final state after scrolling into view', async ({ page }) => {
  await page.goto('/');
  await page.locator('section#services').scrollIntoViewIfNeeded();
  for (const card of await page.locator('article.service').all()) {
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveAttribute('data-assembled', 'true', { timeout: 4000 });
  }
  await expect(page.locator('.glyph-fly')).toHaveCount(0, { timeout: 4000 });
  await expect(page.locator('svg.service__icon').first()).toHaveCSS('opacity', '1');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no flying glyphs ever exist and cards are final', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __fly: number }).__fly = 0;
      new MutationObserver((ms) => {
        for (const m of ms) m.addedNodes.forEach((n) => {
          if (n instanceof HTMLElement && n.classList.contains('glyph-fly')) (window as unknown as { __fly: number }).__fly++;
        });
      }).observe(document, { childList: true, subtree: true });
    });
    await page.goto('/');
    await page.locator('section#services').scrollIntoViewIfNeeded();
    await expect(page.locator('article.service[data-assembled="true"]')).toHaveCount(3);
    expect(await page.evaluate(() => (window as unknown as { __fly: number }).__fly)).toBe(0);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('icons are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('svg.service__icon').first()).toHaveCSS('opacity', '1');
  });
});
