import { TIMELINES, site } from '../src/content/site';
import type { Env } from './types';

export interface MailMessage {
  from: { email: 'website@pengopal.com'; name: 'Pengopal website' };
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}
export interface ContactDeps {
  verifyTurnstile(token: string, ip: string | null): Promise<boolean>;
  sendMail(msg: MailMessage): Promise<void>;
}

const MAX_BODY_BYTES = 16_384;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

/** Length in characters as a person counts them (code points), so emoji count once. */
const chars = (s: string) => Array.from(s).length;
const str = (v: unknown) => (typeof v === 'string' ? v : '');

export async function handleContact(request: Request, env: Pick<Env, 'CONTACT_TO'>, deps: ContactDeps): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } });

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) return reply(413, { ok: false });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return reply(413, { ok: false });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') throw new Error('not an object');
    body = parsed as Record<string, unknown>;
  } catch {
    return reply(400, { ok: false, fields: {} });
  }

  // Bots that fill the hidden field learn nothing.
  if (str(body.website).trim() !== '') return reply(200, { ok: true });

  const name = str(body.name).trim();
  const email = str(body.email).trim();
  const message = str(body.message); // sent exactly as typed; only checked for being blank
  const timeline = str(body.timeline);
  const fields: Record<string, string> = {};
  if (chars(name) < 1 || chars(name) > 120) fields.name = site.contact.errors.name;
  if (email.length > 254 || !EMAIL_RE.test(email)) fields.email = site.contact.errors.email;
  if (message.trim() === '' || chars(message) > 4000) fields.message = site.contact.errors.message;
  if (timeline !== '' && !(TIMELINES as readonly string[]).includes(timeline)) fields.timeline = site.contact.errors.timeline;
  if (Object.keys(fields).length) return reply(400, { ok: false, fields });

  const ok = await deps.verifyTurnstile(str(body.turnstileToken), request.headers.get('cf-connecting-ip'));
  if (!ok) return reply(403, { ok: false });

  try {
    await deps.sendMail({
      from: { email: 'website@pengopal.com', name: 'Pengopal website' },
      to: env.CONTACT_TO,
      replyTo: email,
      subject: `New enquiry — ${name}`,
      text: [`Name: ${name}`, `Email: ${email}`, `Timeline: ${timeline || 'Not given'}`, '', 'Message:', message].join('\n'),
    });
  } catch {
    return reply(502, { ok: false });
  }
  return reply(200, { ok: true });
}
