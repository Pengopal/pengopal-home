import { checkDeployEnv } from '../../scripts/check-deploy-env.mjs';

test('a missing site key stops the deploy', () => {
  expect(() => checkDeployEnv({})).toThrow(/PUBLIC_TURNSTILE_SITE_KEY/);
});

test("Cloudflare's always-pass test key stops the deploy", () => {
  expect(() => checkDeployEnv({ PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA' })).toThrow(/test key/);
});

test('a real-looking key passes', () => {
  expect(() => checkDeployEnv({ PUBLIC_TURNSTILE_SITE_KEY: '0x4AAAAAAAreal-site-key' })).not.toThrow();
});
