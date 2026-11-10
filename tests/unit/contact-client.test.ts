import { submitEnquiry, mailtoFallback, type EnquiryInput } from '../../src/scripts/contact-client';

const DATA: EnquiryInput = { name: 'Ada', email: 'ada@example.com', message: 'Hi', timeline: '', website: '', turnstileToken: 't' };
const respond = (status: number, body: unknown) => async () => new Response(JSON.stringify(body), { status });

test('posts JSON to /api/contact', async () => {
  let seen: { url: string; init: RequestInit } | undefined;
  await submitEnquiry(DATA, (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response('{"ok":true}', { status: 200 });
  }) as typeof fetch);
  expect(seen!.url).toBe('/api/contact');
  expect(seen!.init.method).toBe('POST');
  expect(JSON.parse(seen!.init.body as string)).toEqual(DATA);
});

test('200 → ok', async () => {
  expect(await submitEnquiry(DATA, respond(200, { ok: true }) as typeof fetch)).toEqual({ ok: true });
});

test('400 with fields → validation', async () => {
  const r = await submitEnquiry(DATA, respond(400, { ok: false, fields: { email: 'bad' } }) as typeof fetch);
  expect(r).toEqual({ ok: false, kind: 'validation', fields: { email: 'bad' } });
});

test('502 → failed', async () => {
  expect(await submitEnquiry(DATA, respond(502, { ok: false }) as typeof fetch)).toEqual({ ok: false, kind: 'failed' });
});

test('403 → failed', async () => {
  expect(await submitEnquiry(DATA, respond(403, { ok: false }) as typeof fetch)).toEqual({ ok: false, kind: 'failed' });
});

test('fetch rejects → failed', async () => {
  const r = await submitEnquiry(DATA, (async () => { throw new TypeError('offline'); }) as typeof fetch);
  expect(r).toEqual({ ok: false, kind: 'failed' });
});

test('mailto encodes Arabic and newlines', () => {
  const url = mailtoFallback({ name: 'سارة', message: 'سطر أول\nline two & more', timeline: '3+ months' });
  expect(url.startsWith('mailto:hello@pengopal.com?')).toBe(true);
  const q = new URLSearchParams(url.split('?')[1]);
  expect(q.get('subject')).toBe('New enquiry — سارة');
  expect(q.get('body')).toContain('سطر أول\nline two & more');
  expect(q.get('body')).toContain('Timeline: 3+ months');
  expect(url).not.toMatch(/[\s]/);
  expect(url.split('?')[1].split('&')).toHaveLength(2);
});

test('a request that never answers fails after the timeout', async () => {
  const hang = ((_u: string, init: RequestInit) =>
    new Promise((_, reject) => init.signal?.addEventListener('abort', () => reject(new DOMException('timeout', 'TimeoutError'))))) as typeof fetch;
  const started = Date.now();
  const r = await submitEnquiry(DATA, hang, 50);
  expect(r).toEqual({ ok: false, kind: 'failed' });
  expect(Date.now() - started).toBeLessThan(2000);
});
