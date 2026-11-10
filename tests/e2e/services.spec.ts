import { test, expect } from '@playwright/test';

test('h2 "What we build" with the opal "for you."', async ({ page }) => {
  await page.goto('/');
  const sec = page.locator('section#services');
  await expect(sec.locator('h2')).toHaveText('What we build for you.');
  await expect(sec.locator('h2 .opal-text')).toHaveText('for you.');
});

test('three cards, each with a hidden scene, an h3, the outcome and three deliverables', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('section#services article.service');
  await expect(cards).toHaveCount(3);
  await expect(cards.locator('h3')).toHaveText(['Web apps & SaaS', 'AI features', 'Identity & multi-tenant SaaS']);
  for (let i = 0; i < 3; i++) {
    const card = cards.nth(i);
    await expect(card.locator('[data-scene]')).toHaveAttribute('aria-hidden', 'true');
    await expect(card.locator('.service__outcome')).not.toBeEmpty();
    await expect(card.locator('ul > li')).toHaveCount(3);
  }
  await expect(page.locator('section#services svg.service__icon')).toHaveCount(0);
});

test('every scene plays once it scrolls into view', async ({ page }) => {
  await page.goto('/');
  for (const scene of await page.locator('section#services [data-scene]').all()) {
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toHaveAttribute('data-played', 'true', { timeout: 5000 });
  }
});

test('the AI answer appears only after the question', async ({ page }) => {
  await page.goto('/');
  const scene = page.locator('section#services .scene--ai');
  const answer = scene.locator('.scene__answer');
  await expect(answer).toBeHidden();
  await scene.scrollIntoViewIfNeeded();
  await expect(scene.locator('.scene__question')).toBeVisible();
  await expect(answer).toBeVisible({ timeout: 5000 });
  await expect(scene).toHaveAttribute('data-played', 'true');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('scenes are already played on load and nothing animates', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('section#services [data-scene][data-played="true"]')).toHaveCount(3);
    const animated = await page.locator('section#services [data-scene] *').evaluateAll((els) =>
      els.filter((el) => getComputedStyle(el).animationName !== 'none').length,
    );
    expect(animated).toBe(0);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('scenes show their final frame', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('section#services .scene--ai .scene__answer')).toBeVisible();
  });
});
