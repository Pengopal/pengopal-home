import { handleContact } from './contact';
import { makeDeps } from './deps';
import type { Env } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contact') return handleContact(request, env, makeDeps(env));
    return env.ASSETS.fetch(request);
  },
};
