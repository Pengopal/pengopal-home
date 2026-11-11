import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Stands in for Cloudflare Turnstile: renders nothing and hands back a token straight away. */
async function stubTurnstile(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { turnstile: unknown }).turnstile = {
      render: (_el: Element, opts: { callback: (t: string) => void }) => {
        setTimeout(() => opts.callback('test-token'), 0);
        return 'w1';
      },
      reset: () => {},
    };
  });
  await page.route('https://challenges.cloudflare.com/**', (r) => r.abort());
}

/** Opens the contact dialog and fills in a valid enquiry. */
async function fillContactForm(page: Page) {
  await page.locator('section#contact [data-open-contact]').click();
  const form = page.locator('section#contact form');
  await form.getByLabel('Name').fill('Ada');
  await form.getByLabel('Email').fill('ada@example.com');
  await form.getByLabel('What are you building?').fill('A multi-tenant SaaS with SSO.');
  return form;
}

test('the page loads without errors and fits a phone screen', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://challenges.cloudflare.com/**', (r) => r.abort());
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Software and AI, built end to end.');
  await expect(page.locator('section#work a[href="https://tenantry.pengopal.com"]')).toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(errors).toEqual([]);
});

test('the contact form sends an enquiry and says thank you', async ({ page }) => {
  await stubTurnstile(page);
  let body: Record<string, string> | undefined;
  await page.route('**/api/contact', async (r) => {
    body = r.request().postDataJSON();
    await r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/');
  const form = await fillContactForm(page);
  await form.getByRole('button', { name: 'Send' }).click();
  await expect(page.locator('section#contact [data-success]')).toBeVisible();
  expect(body).toMatchObject({ name: 'Ada', email: 'ada@example.com', turnstileToken: 'test-token' });
});

test('if sending fails, the visitor gets an email link with their message', async ({ page }) => {
  await stubTurnstile(page);
  await page.route('**/api/contact', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: '{"ok":false}' }));
  await page.goto('/');
  const form = await fillContactForm(page);
  await form.getByRole('button', { name: 'Send' }).click();
  const alert = page.locator('section#contact [data-failed]');
  await expect(alert).toBeVisible();
  expect(decodeURIComponent((await alert.locator('a').getAttribute('href'))!)).toContain('A multi-tenant SaaS with SSO.');
});

test('no WCAG 2.1 AA violations, in light and dark', async ({ browser }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    const ctx = await browser.newContext({ colorScheme, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.route('https://challenges.cloudflare.com/**', (r) => r.abort());
    await page.goto('/');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => `${colorScheme} ${v.id}`)).toEqual([]);
    await ctx.close();
  }
});

test('the 404 page, robots.txt and sitemap are served', async ({ page, request }) => {
  const res = await page.goto('/does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.locator('main a[href="/"]')).toBeVisible();
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://pengopal.com/sitemap-index.xml');
  expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
});
