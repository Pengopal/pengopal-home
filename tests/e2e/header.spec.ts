import { test, expect } from '@playwright/test';

test('toggle switches and persists theme', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'light' });
  const page = await ctx.newPage();
  await page.goto('/');
  const toggle = page.getByRole('button', { name: /dark theme/i });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: /dark theme/i })).toHaveAttribute('aria-pressed', 'true');
  await ctx.close();
});

test('primary nav links and CTA', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Primary' });
  await expect(nav.getByRole('link')).toHaveText(['Work', 'Services', 'How we work', 'Contact']);
  await expect(page.locator('header a.btn.btn--primary')).toHaveAttribute('href', '#contact');
  await expect(page.locator('header').getByRole('img', { name: 'Pengopal' })).toBeVisible();
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('menu is a disclosure on phones', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: 'Menu' });
    const links = page.getByRole('navigation', { name: 'Primary' }).getByRole('link');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(links.first()).toBeHidden();
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(links.first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
  });

  test('choosing a link closes the menu', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: 'Menu' });
    await button.click();
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Services' }).click();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});

test('anchor target heading is not hidden by the header', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Services' }).click();
  await page.waitForTimeout(800);
  const headerBox = await page.locator('header.site-header').boundingBox();
  const h2Box = await page.locator('#services h2').boundingBox();
  expect(h2Box!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
});

test('header becomes solid after scroll', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('header.site-header');
  await expect(header).toHaveAttribute('data-scrolled', 'false');
  await page.mouse.wheel(0, 400);
  await expect(header).toHaveAttribute('data-scrolled', 'true');
});
