import { test, expect } from '@playwright/test';

test('four steps in an ordered list with h3 titles and the note', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('section#how-we-work');
  await expect(section.locator('h2')).toHaveText('How we work');
  await expect(section.locator('ol > li')).toHaveCount(4);
  await expect(section.locator('ol > li h3')).toHaveText([
    'Discovery call',
    'Plan & estimate',
    'Build in weekly milestones',
    'Launch & support',
  ]);
  await expect(section).toContainText('You talk directly to the engineer building your product.');
});

test('all steps are reached after scrolling past the section', async ({ page }) => {
  await page.goto('/');
  const list = page.locator('section#how-we-work ol');
  await list.scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 1600);
  await expect(page.locator('section#how-we-work li[data-reached="true"]')).toHaveCount(4, { timeout: 4000 });
  const progress = await list.evaluate((el) => getComputedStyle(el).getPropertyValue('--progress').trim());
  expect(Number(progress)).toBeCloseTo(1, 1);
});

test('before scrolling, later steps are not yet reached', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('section#how-we-work li').last()).not.toHaveAttribute('data-reached', 'true');
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('all steps are reached on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('section#how-we-work li[data-reached="true"]')).toHaveCount(4);
  });
});
