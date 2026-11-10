import { test, expect, type Page } from '@playwright/test';

/** Stands in for Cloudflare Turnstile and counts how often a widget is rendered. */
async function stubTurnstile(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { turnstile: unknown; __renders: number };
    w.__renders = 0;
    w.turnstile = {
      render: (_el: Element, opts: { callback: (t: string) => void }) => {
        w.__renders++;
        setTimeout(() => opts.callback('test-token'), 0);
        return 'w1';
      },
      reset: () => {},
    };
  });
}

const dialog = (page: Page) => page.locator('section#contact dialog.contact-dialog');
const openFromBand = (page: Page) => page.locator('section#contact [data-open-contact]').click();

test('the band shows its title, line and email link, and no form until opened', async ({ page }) => {
  await stubTurnstile(page);
  await page.goto('/');
  const band = page.locator('section#contact');
  await expect(band.locator('h2#contact-title')).toHaveText('Have a project in mind?');
  await expect(band).toContainText("Tell us what you're building.");
  await expect(band.locator('.contact-band__line a[href="mailto:hello@pengopal.com"]')).toBeVisible();
  await expect(band.getByLabel('Name')).toBeHidden();
  await expect(dialog(page)).not.toHaveAttribute('open', '');
});

test('the dialog opens, focuses Name, and closes with Escape and the close button, returning focus', async ({ page }) => {
  await stubTurnstile(page);
  await page.goto('/');
  const trigger = page.locator('section#contact [data-open-contact]');
  await trigger.click();
  await expect(dialog(page)).toHaveAttribute('open', '');
  await expect(dialog(page).getByLabel('Name')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).not.toHaveAttribute('open', '');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog(page).getByRole('button', { name: 'Close' }).click();
  await expect(dialog(page)).not.toHaveAttribute('open', '');
  await expect(trigger).toBeFocused();
});

test('the spam check is requested only after the dialog first opens', async ({ page }) => {
  const calls: string[] = [];
  await page.route('https://challenges.cloudflare.com/**', (r) => { calls.push(r.request().url()); return r.abort(); });
  await page.goto('/');
  await page.locator('section#contact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  expect(calls).toEqual([]);
  await openFromBand(page);
  await expect.poll(() => calls.length).toBeGreaterThan(0);
});

test('reopening the dialog keeps the text and one spam check', async ({ page }) => {
  await stubTurnstile(page);
  await page.goto('/');
  await openFromBand(page);
  await dialog(page).getByLabel('Name').fill('Ada');
  await page.keyboard.press('Escape');
  await openFromBand(page);
  await expect(dialog(page).getByLabel('Name')).toHaveValue('Ada');
  expect(await page.evaluate(() => (window as unknown as { __renders: number }).__renders)).toBe(1);
});

test('the header and hero "Start a project" buttons open the dialog too', async ({ page }) => {
  await stubTurnstile(page);
  await page.goto('/');
  await page.locator('header .btn--primary').click();
  await expect(dialog(page)).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await page.locator('section.hero .btn--primary').click();
  await expect(dialog(page)).toHaveAttribute('open', '');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the form is reachable in the band', async ({ page }) => {
    await page.goto('/');
    await page.locator('section#contact details.contact-fallback summary').click();
    await expect(page.locator('section#contact').getByLabel('Name')).toBeVisible();
  });
});

test.describe('phone menu', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test('closing the dialog opened from the phone menu returns focus to the menu button', async ({ page }) => {
    await stubTurnstile(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.locator('header .btn--primary').click();
    await expect(dialog(page)).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(dialog(page)).not.toHaveAttribute('open', '');
    await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();
  });
});
