import type { ContactDeps } from './contact';
import type { Env } from './types';

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function makeDeps(env: Env): ContactDeps {
  return {
    async verifyTurnstile(token, ip) {
      if (!token) return false;
      const form = new FormData();
      form.append('secret', env.TURNSTILE_SECRET);
      form.append('response', token);
      if (ip) form.append('remoteip', ip);
      try {
        const res = await fetch(SITEVERIFY, { method: 'POST', body: form });
        const data = (await res.json()) as { success?: boolean };
        return data.success === true;
      } catch {
        return false;
      }
    },
    async sendMail(msg) {
      await env.EMAIL.send(msg);
    },
  };
}
