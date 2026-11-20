import { handleContact } from './contact';
import { makeDeps } from './deps';
import type { Env } from './types';

/** The site lives on the apex; www is attached only to send visitors there. */
const CANONICAL_HOST = 'pengopal.com';

/**
 * Sent with every response. The page's own Content Security Policy is a <meta> tag that Astro
 * writes with hashes of its scripts and styles; this header adds what a <meta> can't carry.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
};

function withSecurityHeaders(res: Response): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
  return out;
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (url.protocol === 'http:' || url.hostname === `www.${CANONICAL_HOST}`) {
    url.protocol = 'https:';
    url.port = '';
    if (url.hostname === `www.${CANONICAL_HOST}`) url.hostname = CANONICAL_HOST;
    url.hash = '';
    return Response.redirect(url.toString(), 301);
  }
  if (url.pathname === '/api/contact') return handleContact(request, env, makeDeps(env));
  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return withSecurityHeaders(await route(request, env));
  },
};
