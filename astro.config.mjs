// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://pengopal.com',
  output: 'static',
  // The CSS is small; inlining it removes a render-blocking request before first paint.
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap()],
  // Content Security Policy: Astro hashes every script and style it emits and writes the policy
  // into a <meta> tag. The Worker adds the parts a <meta> can't carry (frame-ancestors).
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' https://challenges.cloudflare.com",
        'frame-src https://challenges.cloudflare.com',
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      // Turnstile's loader is added by the contact form script.
      scriptDirective: { resources: ["'self'", 'https://challenges.cloudflare.com'] },
      // Screenshot frames set their aspect ratio with a style attribute.
      styleDirective: { resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }] },
    },
  },
});
