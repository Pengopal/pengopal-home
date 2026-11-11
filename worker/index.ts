import { handleContact } from './contact';
import { makeDeps } from './deps';
import type { Env } from './types';

/** The site lives on the apex; www is attached only to send visitors there. */
const CANONICAL_HOST = 'pengopal.com';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === `www.${CANONICAL_HOST}`) {
      url.hostname = CANONICAL_HOST;
      url.hash = '';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === '/api/contact') return handleContact(request, env, makeDeps(env));
    return env.ASSETS.fetch(request);
  },
};
