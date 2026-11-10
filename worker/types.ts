// Minimal shapes of the Cloudflare bindings this Worker uses. Kept local so the site's
// TypeScript config does not need the Workers ambient types (which clash with DOM types).
export interface AssetsBinding { fetch(request: Request): Promise<Response> }
export interface EmailBinding {
  send(message: {
    from: { email: string; name?: string };
    to: string;
    replyTo?: string;
    subject: string;
    text: string;
  }): Promise<unknown>;
}
export interface Env {
  ASSETS: AssetsBinding;
  EMAIL: EmailBinding;
  TURNSTILE_SECRET: string;
  CONTACT_TO: string;
}
