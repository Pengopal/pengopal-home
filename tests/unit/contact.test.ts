import { handleContact, type ContactDeps, type MailMessage } from '../../worker/contact';

const ENV = { CONTACT_TO: 'owner@example.com' };
const VALID = { name: 'Ada', email: 'ada@example.com', message: 'We need SSO.', timeline: '1–3 months', website: '', turnstileToken: 'tok' };

function fakeDeps(opts: { turnstile?: boolean; mailThrows?: boolean } = {}) {
  const mails: MailMessage[] = [];
  const turnstileCalls: [string, string | null][] = [];
  const deps: ContactDeps = {
    async verifyTurnstile(token, ip) { turnstileCalls.push([token, ip]); return opts.turnstile ?? true; },
    async sendMail(msg) { if (opts.mailThrows) throw new Error('mail down'); mails.push(msg); },
  };
  return { deps, mails, turnstileCalls };
}

function req(body: unknown, init: RequestInit = {}) {
  return new Request('https://pengopal.com/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    ...init,
  });
}

const json = (r: Response) => r.json() as Promise<Record<string, unknown>>;

test('valid enquiry sends one mail with replyTo = visitor and to = CONTACT_TO', async () => {
  const f = fakeDeps();
  const res = await handleContact(req(VALID), ENV, f.deps);
  expect(res.status).toBe(200);
  expect(await json(res)).toEqual({ ok: true });
  expect(f.mails).toHaveLength(1);
  const m = f.mails[0];
  expect(m.to).toBe('owner@example.com');
  expect(m.replyTo).toBe('ada@example.com');
  expect(m.from).toEqual({ email: 'website@pengopal.com', name: 'Pengopal website' });
  expect(m.subject).toBe('New enquiry — Ada');
  for (const s of ['Name: Ada', 'Email: ada@example.com', 'Timeline: 1–3 months', 'We need SSO.']) expect(m.text).toContain(s);
  expect(f.turnstileCalls).toEqual([['tok', '203.0.113.9']]);
});

test('GET → 405', async () => {
  const res = await handleContact(new Request('https://pengopal.com/api/contact'), ENV, fakeDeps().deps);
  expect(res.status).toBe(405);
});

test('17 KB body → 413', async () => {
  const f = fakeDeps();
  const res = await handleContact(req({ ...VALID, message: 'x'.repeat(17 * 1024) }), ENV, f.deps);
  expect(res.status).toBe(413);
  expect(f.mails).toHaveLength(0);
});

test('honeypot → 200, no mail, no turnstile call', async () => {
  const f = fakeDeps();
  const res = await handleContact(req({ ...VALID, website: 'http://spam.example' }), ENV, f.deps);
  expect(res.status).toBe(200);
  expect(f.mails).toHaveLength(0);
  expect(f.turnstileCalls).toHaveLength(0);
});

test('missing name → 400 fields.name', async () => {
  const res = await handleContact(req({ ...VALID, name: '   ' }), ENV, fakeDeps().deps);
  expect(res.status).toBe(400);
  expect((await json(res)).fields).toHaveProperty('name');
});

test('bad email → 400 fields.email', async () => {
  const res = await handleContact(req({ ...VALID, email: 'not-an-email' }), ENV, fakeDeps().deps);
  expect(res.status).toBe(400);
  expect((await json(res)).fields).toHaveProperty('email');
});

test('4001-char message → 400 fields.message', async () => {
  const res = await handleContact(req({ ...VALID, message: 'a'.repeat(4001) }), ENV, fakeDeps().deps);
  expect(res.status).toBe(400);
  expect((await json(res)).fields).toHaveProperty('message');
});

test('unknown timeline → 400 fields.timeline', async () => {
  const res = await handleContact(req({ ...VALID, timeline: 'yesterday' }), ENV, fakeDeps().deps);
  expect(res.status).toBe(400);
  expect((await json(res)).fields).toHaveProperty('timeline');
});

test('empty timeline is allowed', async () => {
  const res = await handleContact(req({ ...VALID, timeline: '' }), ENV, fakeDeps().deps);
  expect(res.status).toBe(200);
});

test('turnstile false → 403, no mail', async () => {
  const f = fakeDeps({ turnstile: false });
  const res = await handleContact(req(VALID), ENV, f.deps);
  expect(res.status).toBe(403);
  expect(f.mails).toHaveLength(0);
});

test('sendMail throws → 502', async () => {
  const res = await handleContact(req(VALID), ENV, fakeDeps({ mailThrows: true }).deps);
  expect(res.status).toBe(502);
  expect(await json(res)).toEqual({ ok: false });
});

test('accepts 4000-char Arabic + emoji message', async () => {
  const msg = Array.from('مرحبا 👋 '.repeat(800)).slice(0, 4000).join('');
  expect(Array.from(msg)).toHaveLength(4000);
  const f = fakeDeps();
  const res = await handleContact(req({ ...VALID, message: msg }), ENV, f.deps);
  expect(res.status).toBe(200);
  expect(f.mails[0].text).toContain(msg);
});

test('invalid JSON → 400', async () => {
  const res = await handleContact(req('{not json'), ENV, fakeDeps().deps);
  expect(res.status).toBe(400);
});
