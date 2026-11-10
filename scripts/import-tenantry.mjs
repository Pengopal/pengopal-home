// Copies Tenantry's logo (unaltered, per its brand rules) and converts three screenshots to WebP
// for the "What we've built" section (spec v2 §3.1). Re-run when Tenantry's screenshots change.
import { copyFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const SRC = '../../JobHunt2025/multi-tenant-idm-saas';
const OUT = 'public/work/tenantry';
mkdirSync(OUT, { recursive: true });
copyFileSync(`${SRC}/packages/ui/assets/brand/tenantry-logo-dark.svg`, `${OUT}/logo-dark.svg`);
for (const name of ['home', 'search', 'login-branded']) {
  await sharp(`${SRC}/docs/images/${name}.png`).webp({ quality: 80 }).toFile(`${OUT}/${name}.webp`);
}
console.log(`wrote ${OUT}`);
