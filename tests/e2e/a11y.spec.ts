import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function settle(page: Page) {
  // Scroll through so every reveal plays out, then come back to the top.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`no WCAG 2.1 AA violations (${colorScheme})`, async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme });
    const page = await ctx.newPage();
    await page.route('https://challenges.cloudflare.com/**', (r) => r.abort());
    await page.goto('/');
    await settle(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join(' | ')}`);
    expect(summary).toEqual([]);
    await ctx.close();
  });
}

test('keyboard order runs skip link → logo → nav → theme → CTA → hero buttons', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit does not tab to links by default');
  await page.goto('/');
  const order: string[] = [];
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('Tab');
    order.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        return el.getAttribute('aria-label') ?? el.textContent?.trim() ?? el.tagName;
      }),
    );
  }
  expect(order).toEqual([
    'Skip to content',
    'Pengopal home',
    'Services',
    'How we work',
    'Open source',
    'Contact',
    'Start a project',
    'Dark theme',
    'Start a project',
  ]);
});

test('every interactive element shows a visible focus outline', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit does not tab to links by default');
  await page.goto('/');
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
    expect(outline).not.toBe('none');
  }
});
