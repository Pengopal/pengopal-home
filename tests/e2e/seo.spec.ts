import { test, expect } from '@playwright/test';

test('title and description exact', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Pengopal — Software and AI, built end to end');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Pengopal is a founder-led studio building web apps, AI features, and secure multi-tenant SaaS — from first commit to production.',
  );
});

test('canonical and social metadata are absolute', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://pengopal.com/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://pengopal.com/og.png');
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', '/favicon.svg');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
});

test('JSON-LD parses and describes the organization', async ({ page }) => {
  await page.goto('/');
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
  expect(ld['@type']).toBe('Organization');
  expect(ld.name).toBe('Pengopal');
  expect(ld.legalName).toBe('Pengopal Technologies');
  expect(ld.email).toBe('hello@pengopal.com');
});

test('footer has no github link and the current year', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer).toContainText(`© ${new Date().getFullYear()} Pengopal Technologies`);
  await expect(footer.locator('a[href="mailto:hello@pengopal.com"]')).toBeVisible();
  await expect(footer.locator('a[href="https://www.linkedin.com/in/furqan26"]')).toHaveAttribute('rel', /me/);
  await expect(page.locator('a[href*="github"]')).toHaveCount(0);
});

test('404 page is branded with a link home', async ({ page }) => {
  const res = await page.goto('/does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('main a[href="/"]')).toBeVisible();
  await expect(page.locator('header nav a').first()).toHaveAttribute('href', '/#services');
});

test('robots and sitemap are served', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://pengopal.com/sitemap-index.xml');
  expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
});
