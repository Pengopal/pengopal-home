// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://pengopal.com',
  output: 'static',
  // The CSS is small; inlining it removes a render-blocking request before first paint.
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap()],
});
