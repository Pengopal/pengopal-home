import worker from '../../worker/index';
import { handleContact, type ContactDeps, type MailMessage } from '../../worker/contact';

const ENV = { CONTACT_TO: 'owner@example.com' };
const VALID = { name: 'Ada', email: 'ada@example.com', message: 'We need SSO.', timeline: '1–3 months', website: '', turnstileToken: 'tok' };

function fakeDeps(opts: { turnstile?: boolean; mailThrows?: boolean } = {}) {
  const mails: MailMessage[] = [];
  const deps: ContactDeps = {
    async verifyTurnstile() { return opts.turnstile ?? true; },
    async sendMail(msg) { if (opts.mailThrows) throw new Error('mail down'); mails.push(msg); },
  };
  return { deps, mails };
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

test('routing: www redirects to the apex, /api/contact reaches the handler, the rest is static', async () => {
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

  const api = await worker.fetch(new Request('https://pengopal.com/api/contact', { method: 'POST', body: '{bad' }), env);
  expect(api.status).toBe(400);

  expect(await (await worker.fetch(new Request('https://pengopal.com/'), env)).text()).toBe('asset');
  expect(hits).toEqual(['/']);
});
