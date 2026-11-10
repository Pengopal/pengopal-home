import { test, expect } from '@playwright/test';

const FEATURES = ['shared realm + Organizations', 'realm-per-tenant for enterprise', 'Postgres row-level security', 'one-command Docker deploy'];

test('card shows title, Coming soon, description and four feature lines', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('section#open-source');
  await expect(section.locator('h2')).toHaveText('Building in public');
  const card = section.locator('article.oss');
  await expect(card.locator('h3')).toHaveText('Multi-tenant SaaS starter');
  await expect(card.locator('.oss__badge')).toHaveText('Coming soon');
  await expect(card).toContainText('A production-ready starter on Keycloak SSO.');
  await expect(card.locator('.oss__terminal li')).toHaveText(FEATURES);
});

test('no link inside the card while the repo is not public', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section#open-source article.oss a')).toHaveCount(0);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('all lines are present and visible', async ({ page }) => {
    await page.goto('/');
    const items = page.locator('.oss__terminal li');
    await expect(items).toHaveText(FEATURES);
    for (const li of await items.all()) await expect(li).toBeVisible();
  });
});

test('terminal finishes typing after it is revealed', async ({ page }) => {
  await page.goto('/');
  const term = page.locator('.oss__terminal');
  await expect(term).not.toHaveAttribute('data-typed', 'true');
  await term.scrollIntoViewIfNeeded();
  await expect(term).toHaveAttribute('data-typed', 'true', { timeout: 6000 });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('terminal is complete on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.oss__terminal')).toHaveAttribute('data-typed', 'true');
  });
});
