import { test, expect } from '@playwright/test';

const STEPS = ['Discovery call', 'Plan & estimate', 'Build in weekly milestones', 'Launch & support'];
const reached = (page: import('@playwright/test').Page) => page.locator('section#how-we-work li[data-reached="true"]');
const progress = (page: import('@playwright/test').Page) =>
  page.locator('section#how-we-work ol').evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--progress')));

async function scrollPast(page: import('@playwright/test').Page) {
  await page.locator('section#how-we-work').scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 1800);
  await page.waitForTimeout(400);
}

test('heading, note, and four steps in an ordered list', async ({ page }) => {
  await page.goto('/');
  const sec = page.locator('section#how-we-work');
  await expect(sec.locator('h2')).toHaveText('From first call to production.');
  await expect(sec.locator('h2 .opal-text')).toHaveText('production.');
  await expect(sec).toContainText('You talk directly to the engineer building your product.');
  await expect(sec.locator('ol > li h3')).toHaveText(STEPS);
  await expect(sec.locator('ol > li .process__mini')).toHaveCount(4);
  await expect(sec.locator('ol > li .process__mini').first()).toHaveAttribute('aria-hidden', 'true');
});

test('desktop: the four steps sit in one horizontal row', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.locator('section#how-we-work .process__node')).toHaveCount(4);
  const ys = await page.locator('section#how-we-work .process__node').evaluateAll((n) => n.map((e) => e.getBoundingClientRect().top));
  ys.forEach((y) => expect(Math.abs(y - ys[0])).toBeLessThanOrEqual(4));
});

test.describe('phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test('steps are stacked vertically', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('section#how-we-work .process__node')).toHaveCount(4);
  const ys = await page.locator('section#how-we-work .process__node').evaluateAll((n) => n.map((e) => e.getBoundingClientRect().top));
    for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeGreaterThan(ys[i - 1] + 40);
  });
});

test('before scrolling, later steps are not reached', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section#how-we-work li').last()).not.toHaveAttribute('data-reached', 'true');
});

test('the mosaic rail fills and every step is passed after scrolling past', async ({ page }) => {
  await page.goto('/');
  await scrollPast(page);
  await expect(reached(page)).toHaveCount(4, { timeout: 4000 });
  expect(await progress(page)).toBeCloseTo(1, 1);
  const rail = await page.locator('section#how-we-work ol').evaluate((el) => getComputedStyle(el, '::after').backgroundImage);
  expect(rail).toContain('opal-mosaic');
});

test('the rail only grows when scrolling back up', async ({ page }) => {
  await page.goto('/');
  await scrollPast(page);
  const high = await progress(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  expect(await progress(page)).toBeGreaterThanOrEqual(high);
});

test('resizing across the breakpoint keeps every passed step', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await scrollPast(page);
  await expect(reached(page)).toHaveCount(4, { timeout: 4000 });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(400);
  await page.mouse.wheel(0, -200);
  await page.waitForTimeout(400);
  await expect(reached(page)).toHaveCount(4);
  expect(await progress(page)).toBe(1);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the rail is full and every step reached on load', async ({ page }) => {
    await page.goto('/');
    await expect(reached(page)).toHaveCount(4);
    expect(await progress(page)).toBe(1);
  });
});
