import { test, expect, type Page } from '@playwright/test';

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

async function fill(page: Page) {
  const form = page.locator('section#contact form');
  await form.scrollIntoViewIfNeeded();
  await form.getByLabel('Name').fill('Ada');
  await form.getByLabel('Email').fill('ada@example.com');
  await form.getByLabel('What are you building?').fill('A multi-tenant SaaS with SSO.');
  await form.getByLabel('Timeline').selectOption('1–3 months');
  return form;
}

test('every field has a label and the email link is offered', async ({ page }) => {
  await stubTurnstile(page);
  await page.goto('/');
  const section = page.locator('section#contact');
  await expect(section.locator('h2')).toHaveText('Start a project');
  for (const label of ['Name', 'Email', 'What are you building?', 'Timeline']) {
    await expect(section.getByLabel(label)).toBeVisible();
  }
  await expect(section.locator('.contact__prefer a[href="mailto:hello@pengopal.com"]')).toBeVisible();
  await expect(section).not.toContainText(/pakistan|time ?zone|UTC/i);
});

test('success replaces the form with a thank-you', async ({ page }) => {
  await stubTurnstile(page);
  let body: Record<string, string> | undefined;
  await page.route('**/api/contact', async (r) => {
    body = r.request().postDataJSON();
    await r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/');
  const form = await fill(page);
  await form.getByRole('button', { name: 'Send' }).click();
  await expect(page.locator('section#contact [data-success]')).toBeVisible();
  await expect(page.locator('section#contact form')).toBeHidden();
  expect(body).toMatchObject({ name: 'Ada', email: 'ada@example.com', timeline: '1–3 months', website: '', turnstileToken: 'test-token' });
});

test('400 shows errors under fields, marks them invalid and keeps input', async ({ page }) => {
  await stubTurnstile(page);
  await page.route('**/api/contact', (r) =>
    r.fulfill({ status: 400, contentType: 'application/json', body: '{"ok":false,"fields":{"email":"server wording"}}' }),
  );
  await page.goto('/');
  const form = await fill(page);
  await form.getByRole('button', { name: 'Send' }).click();
  const email = form.getByLabel('Email');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  const errId = await email.getAttribute('aria-describedby');
  await expect(page.locator(`#${errId}`)).toHaveText('Please enter a valid email address.');
  await expect(email).toHaveValue('ada@example.com');
});

test('502 shows an error with an email link containing the message', async ({ page }) => {
  await stubTurnstile(page);
  await page.route('**/api/contact', (r) => r.fulfill({ status: 502, contentType: 'application/json', body: '{"ok":false}' }));
  await page.goto('/');
  const form = await fill(page);
  await form.getByRole('button', { name: 'Send' }).click();
  const alert = page.locator('section#contact [data-failed]');
  await expect(alert).toBeVisible();
  const href = await alert.locator('a').getAttribute('href');
  expect(decodeURIComponent(href!)).toContain('A multi-tenant SaaS with SSO.');
  await expect(form.getByLabel('Name')).toHaveValue('Ada');
});

test('submit button is disabled while sending (no double send)', async ({ page }) => {
  await stubTurnstile(page);
  let requests = 0;
  await page.route('**/api/contact', async (r) => {
    requests++;
    await new Promise((res) => setTimeout(res, 1000));
    await r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/');
  const form = await fill(page);
  const send = form.getByRole('button', { name: 'Send' });
  await send.click();
  await expect(send).toBeDisabled();
  await send.click({ force: true }).catch(() => {});
  await page.keyboard.press('Enter');
  await expect(page.locator('section#contact [data-success]')).toBeVisible();
  expect(requests).toBe(1);
});

test('if the spam check cannot load, sending is disabled and email is offered', async ({ page }) => {
  await page.route('https://challenges.cloudflare.com/**', (r) => r.abort());
  await page.goto('/');
  await page.locator('section#contact form').scrollIntoViewIfNeeded();
  await expect(page.locator('section#contact [data-turnstile-error]')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('section#contact form').getByRole('button', { name: 'Send' })).toBeDisabled();
  await expect(page.locator('section#contact [data-turnstile-error] a[href^="mailto:"]')).toBeVisible();
});

test("client-side errors use our own wording, not the browser's", async ({ page }) => {
  await stubTurnstile(page);
  await page.goto('/');
  const form = await fill(page);
  await form.getByLabel('Email').fill('not-an-email');
  await form.getByRole('button', { name: 'Send' }).click();
  const email = form.getByLabel('Email');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#e-email')).toHaveText('Please enter a valid email address.');
});

test('a 4000-character Arabic and emoji message is sent whole', async ({ page }) => {
  await stubTurnstile(page);
  let sent = '';
  await page.route('**/api/contact', async (r) => {
    sent = r.request().postDataJSON().message;
    await r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/');
  const form = await fill(page);
  const msg = Array.from('مرحبا 👋 '.repeat(800)).slice(0, 4000).join('');
  const box = form.getByLabel('What are you building?');
  await box.fill('');
  await box.focus();
  await page.keyboard.insertText(msg);
  await form.getByRole('button', { name: 'Send' }).click();
  await expect(page.locator('section#contact [data-success]')).toBeVisible();
  expect(Array.from(sent)).toHaveLength(4000);
  expect(sent).toBe(msg);
});

test('a message over 4000 characters shows our error and is not sent', async ({ page }) => {
  await stubTurnstile(page);
  let requests = 0;
  await page.route('**/api/contact', (r) => { requests++; return r.fulfill({ status: 200, body: '{"ok":true}' }); });
  await page.goto('/');
  const form = await fill(page);
  const box = form.getByLabel('What are you building?');
  await box.fill('a'.repeat(4001));
  await form.getByRole('button', { name: 'Send' }).click();
  await expect(page.locator('#e-message')).toHaveText('Please tell us what you are building (up to 4000 characters).');
  expect(requests).toBe(0);
});

for (const failure of ['error-callback', 'render throws'] as const) {
  test(`spam-check ${failure}: a message and the email link are shown`, async ({ page }) => {
    await page.addInitScript((mode) => {
      (window as unknown as { turnstile: unknown }).turnstile = {
        render: (_el: Element, opts: Record<string, () => void>) => {
          if (mode === 'render throws') throw new Error('bad sitekey');
          setTimeout(() => opts['error-callback'](), 0);
          return 'w1';
        },
        reset: () => {},
      };
    }, failure);
    await page.goto('/');
    await page.locator('section#contact form').scrollIntoViewIfNeeded();
    await expect(page.locator('section#contact [data-turnstile-error]')).toBeVisible();
    await expect(page.locator('section#contact form').getByRole('button', { name: 'Send' })).toBeDisabled();
  });
}
