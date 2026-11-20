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
  /** PostHog project key (public, like the Turnstile site key). Unset: no analytics. */
  POSTHOG_KEY?: string;
  /** PostHog ingestion host; defaults to the EU cloud. */
  POSTHOG_HOST?: string;
}
export interface WorkerContext { waitUntil(promise: Promise<unknown>): void }
