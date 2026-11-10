// Refuses to deploy without a real Turnstile site key: with Cloudflare's always-pass test key
// baked in, the production secret rejects every token and no enquiry would ever arrive.
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const TEST_KEY = '1x00000000000000000000AA';

export function checkDeployEnv(env) {
  const key = env.PUBLIC_TURNSTILE_SITE_KEY;
  if (!key) throw new Error('PUBLIC_TURNSTILE_SITE_KEY is not set (add it to .env). Deploy stopped: the contact form would reject every enquiry.');
  if (key === TEST_KEY) throw new Error("PUBLIC_TURNSTILE_SITE_KEY is Cloudflare's always-pass test key. Deploy stopped: use the real site key.");
}

function readDotEnv(path = '.env') {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8').split(/\r?\n/).map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^['"]|['"]$/g, '')]),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    checkDeployEnv({ ...readDotEnv(), ...process.env });
    console.log('deploy env ok');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
