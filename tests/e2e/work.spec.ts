import { test, expect } from '@playwright/test';

test('#work follows the hero, with eyebrow, h2 and the opal highlight', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main > section').evaluateAll((s) => s.map((el) => el.id || el.className));
  expect(ids[1]).toBe('work');
  const sec = page.locator('section#work');
  await expect(sec.locator('.eyebrow')).toHaveText("What we've built");
  await expect(sec.locator('h2')).toHaveText('Products we design, build and run.');
  await expect(sec.locator('h2 .opal-text')).toHaveText('and run.');
});

test('Tenantry card: logo, badge, pitch, three stats and two tiers', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('section#work article.project');
  await expect(card).toHaveCount(1);
  await expect(card.getByRole('img', { name: 'Tenantry' }).first()).toBeVisible();
  await expect(card.locator('.project__badge')).toHaveText('v0.6.2 · MIT · live');
  await expect(card).toContainText('Multi-tenant sign-in, teams and branding for SaaS, built on Keycloak.');
  await expect(card.locator('.project__stat dt')).toHaveText(['33', '2', '1']);
  await expect(card.locator('.project__tier h4')).toHaveText(['Standard', 'Enterprise']);
});

test('demo and code links are exact and open safely in a new tab', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('section#work article.project');
  const demo = card.getByRole('link', { name: 'Try the live demo' });
  const code = card.getByRole('link', { name: 'View the code' });
  await expect(demo).toHaveAttribute('href', 'https://tenantry.pengopal.com');
  await expect(code).toHaveAttribute('href', 'https://github.com/mfurqanwork/tenantry-keycloak-multitenancy');
  for (const l of [demo, code]) {
    await expect(l).toHaveAttribute('target', '_blank');
    await expect(l).toHaveAttribute('rel', /noopener/);
  }
  await expect(demo).toHaveClass(/btn--primary/);
  await expect(code).toHaveClass(/btn--secondary/);
});

test('three screenshots, lazy, sized, with alt text', async ({ page }) => {
  await page.goto('/');
  const shots = page.locator('section#work .project__shot img');
  await expect(shots).toHaveCount(3);
  for (const img of await shots.all()) {
    await expect(img).toHaveAttribute('loading', 'lazy');
    await expect(img).toHaveAttribute('width', /\d+/);
    await expect(img).toHaveAttribute('height', /\d+/);
    expect(((await img.getAttribute('alt')) ?? '').length).toBeGreaterThan(10);
  }
  await expect(page.locator('section#work [data-role]')).toHaveCount(3);
});

test('the next-project slot shows while there is one project', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section#work .work__next')).toHaveText('Next project — space reserved');
  await expect(page.locator('section#work .work__next')).toHaveAttribute('aria-hidden', 'true');
});

test.describe('phone width', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test('only the main screenshot shows, unrotated, with no sideways scroll', async ({ page }) => {
    await page.goto('/');
    await page.locator('section#work').scrollIntoViewIfNeeded();
    await expect(page.locator('section#work [data-role="main"]')).toBeVisible();
    await expect(page.locator('section#work [data-role="back"]')).toBeHidden();
    await expect(page.locator('section#work [data-role="front"]')).toBeHidden();
    await expect(page.locator('section#work [data-role="main"]')).toHaveCSS('transform', 'none');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('screenshots do not float', async ({ page }) => {
    await page.goto('/');
    for (const role of ['main', 'back', 'front']) {
      await expect(page.locator(`section#work [data-role="${role}"]`)).toHaveCSS('animation-name', 'none');
    }
  });
});

test('a missing screenshot keeps the layout and shows its alt', async ({ browser }) => {
  const measure = async (block: boolean) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    if (block) await page.route('**/work/tenantry/search.webp', (r) => r.fulfill({ status: 404, body: '' }));
    await page.goto('/');
    await page.locator('section#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const h = (await page.locator('section#work article.project').boundingBox())!.height;
    const alt = await page.locator('section#work [data-role="back"] img').getAttribute('alt');
    await ctx.close();
    return { h, alt };
  };
  const ok = await measure(false);
  const broken = await measure(true);
  expect(Math.abs(ok.h - broken.h)).toBeLessThanOrEqual(2);
  expect(broken.alt).toBe('Tenantry search across pages, people and projects');
});
