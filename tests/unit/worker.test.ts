import worker from '../../worker/index';
import { handleContact, type ContactDeps, type MailMessage } from '../../worker/contact';
import { proxyIngest } from '../../worker/analytics';

const ENV = { CONTACT_TO: 'owner@example.com' };
const VALID = { name: 'Ada', email: 'ada@example.com', message: 'We need SSO.', timeline: '1–3 months', website: '', turnstileToken: 'tok' };

function fakeDeps(opts: { turnstile?: boolean; mailThrows?: boolean } = {}) {
  const mails: MailMessage[] = [];
  const events: { event: string; props: Record<string, unknown> }[] = [];
  const deps: ContactDeps = {
    track(event, props) { events.push({ event, props }); },
    async verifyTurnstile() { return opts.turnstile ?? true; },
    async sendMail(msg) { if (opts.mailThrows) throw new Error('mail down'); mails.push(msg); },
  };
  return { deps, mails, events };
}

const post = (body: unknown) =>
  new Request('https://pengopal.com/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9' },
    body: JSON.stringify(body),
  });

test('a valid enquiry sends one email to the owner, with reply-to set to the visitor', async () => {
  const f = fakeDeps();
  const res = await handleContact(post(VALID), ENV, f.deps);
  expect(res.status).toBe(200);
  expect(f.mails).toHaveLength(1);
  expect(f.mails[0]).toMatchObject({ to: 'owner@example.com', replyTo: 'ada@example.com' });
  expect(f.mails[0].text).toContain('We need SSO.');
  // Analytics learns that an enquiry arrived and its timeline, never who sent it or what it says.
  expect(f.events).toEqual([{ event: 'contact_sent', props: { timeline: '1–3 months' } }]);
});

test('the analytics relay passes on only our own event posts, to PostHog EU', async () => {
  const env = { POSTHOG_KEY: 'phc_ours' };
  const sent: string[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => { sent.push(url); return new Response(null, { status: 200 }); }) as typeof fetch;
  try {
    const post = (path: string, body: string, method = 'POST') =>
      proxyIngest(new Request(`https://pengopal.com/ingest${path}`, method === 'POST' ? { method, body } : { method }), env);
    expect((await post('/i/v0/e/', '{"api_key":"phc_ours"}')).status).toBe(204);
    expect((await post('/i/v0/e/', '{"api_key":"phc_someone_else"}')).status).toBe(403);
    expect((await post('/decide/', '{"api_key":"phc_ours"}')).status).toBe(404);
    expect((await post('/i/v0/e/', '', 'GET')).status).toBe(404);
    expect((await post('/i/v0/e/', `{"api_key":"phc_ours","x":"${'a'.repeat(70_000)}"}`)).status).toBe(413);
    expect((await proxyIngest(new Request('https://pengopal.com/ingest/i/v0/e/', { method: 'POST', body: 'x' }), {})).status).toBe(404);
    expect(sent).toEqual(['https://eu.i.posthog.com/i/v0/e/']);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('bad input is rejected and nothing is sent (bad email, header injection, too long)', async () => {
  const f = fakeDeps();
  for (const bad of [{ email: 'not-an-email' }, { name: 'Ada\r\nBcc: x@evil.test' }, { message: 'x'.repeat(4001) }]) {
    const res = await handleContact(post({ ...VALID, ...bad }), ENV, f.deps);
    expect(res.status).toBe(400);
  }
  expect(f.mails).toHaveLength(0);
});

test('a failed spam check is refused and nothing is sent', async () => {
  const f = fakeDeps({ turnstile: false });
  expect((await handleContact(post(VALID), ENV, f.deps)).status).toBe(403);
  expect(f.mails).toHaveLength(0);
});

test('a mail failure returns 502 so the page can offer the email link', async () => {
  expect((await handleContact(post(VALID), ENV, fakeDeps({ mailThrows: true }).deps)).status).toBe(502);
});

test('routing: HTTPS and the apex are enforced, /api/contact reaches the handler, the rest is static with security headers', async () => {
  const hits: string[] = [];
  const env = {
    ASSETS: { fetch: async (r: Request) => { hits.push(new URL(r.url).pathname); return new Response('asset'); } },
    EMAIL: { send: async () => ({ messageId: 'x' }) },
    TURNSTILE_SECRET: 's',
    CONTACT_TO: 'owner@example.com',
  } as never;

  const www = await worker.fetch(new Request('https://www.pengopal.com/work?x=1'), env);
  expect(www.status).toBe(301);
  expect(www.headers.get('location')).toBe('https://pengopal.com/work?x=1');
  for (const [from, to] of [['http://pengopal.com/a', 'https://pengopal.com/a'], ['https://www.pengopal.com/', 'https://pengopal.com/'], ['http://pengopal.com:8080/', 'https://pengopal.com/']]) {
    expect((await worker.fetch(new Request(from), env)).headers.get('location')).toBe(to);
  }

  const api = await worker.fetch(new Request('https://pengopal.com/api/contact', { method: 'POST', body: '{bad' }), env);
  expect(api.status).toBe(400);

  const home = await worker.fetch(new Request('https://pengopal.com/'), env);
  expect(await home.text()).toBe('asset');
  expect(home.headers.get('strict-transport-security')).toContain('max-age=31536000');
  expect(home.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
  expect(home.headers.get('x-content-type-options')).toBe('nosniff');
  expect(hits).toEqual(['/']);
});
