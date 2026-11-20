import type { Env } from './types';

/** PostHog's EU cloud. Visitor data stays in the EU. */
const DEFAULT_HOST = 'https://eu.i.posthog.com';
const MAX_BODY_BYTES = 65_536;
/** The only paths the relay passes on: event capture. Nothing else at PostHog is reachable through us. */
const ALLOWED = new Set(['/i/v0/e/', '/e/', '/batch/']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AnalyticsEnv = Pick<Env, 'POSTHOG_KEY' | 'POSTHOG_HOST'>;
const host = (env: AnalyticsEnv) => env.POSTHOG_HOST || DEFAULT_HOST;

/**
 * /ingest/* → PostHog, so ad blockers that block third-party trackers don't hide our own first-party
 * page views. Only POSTs of events, at most 64 KB, carrying our own project key; cookies are never
 * passed either way.
 */
export async function proxyIngest(request: Request, env: AnalyticsEnv): Promise<Response> {
  const path = new URL(request.url).pathname.replace(/^\/ingest/, '');
  if (!env.POSTHOG_KEY || request.method !== 'POST' || !ALLOWED.has(path)) return new Response(null, { status: 404 });
  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_BODY_BYTES) return new Response(null, { status: 413 });
  if (!new TextDecoder().decode(body).includes(env.POSTHOG_KEY)) return new Response(null, { status: 403 });
  const headers = new Headers({ 'content-type': request.headers.get('content-type') ?? 'application/json' });
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) headers.set('x-forwarded-for', ip);
  try {
    const res = await fetch(`${host(env)}${path}`, { method: 'POST', headers, body });
    return new Response(null, { status: res.ok ? 204 : res.status });
  } catch {
    return new Response(null, { status: 502 });
  }
}

/** An anonymous id the browser sent, if it is one; otherwise a fresh one, so nothing personal is ever used. */
export const visitorIdOr = (v: unknown): string => (typeof v === 'string' && UUID.test(v) ? v : crypto.randomUUID());

/** A server-side event. Never throws: analytics must not break the request it describes. */
export async function capture(env: AnalyticsEnv, event: string, distinctId: string, properties: Record<string, unknown>): Promise<void> {
  if (!env.POSTHOG_KEY) return;
  try {
    await fetch(`${host(env)}/i/v0/e/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key: env.POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $lib: 'pengopal-worker', $process_person_profile: false },
      }),
    });
  } catch {
    /* dropped: never worth failing the visitor's request over */
  }
}
