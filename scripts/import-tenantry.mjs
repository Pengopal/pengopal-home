// Converts three of Tenantry's screenshots to WebP for the "What we've built" section.
// Re-run when Tenantry's screenshots change. Expects Tenantry's repo at SRC.
//
// public/work/tenantry/logo-dark.svg is Tenantry's own dark logo (packages/ui/assets/brand/tenantry-logo-dark.svg),
// unchanged except that the word is outlined from Geist SemiBold, its brand typeface, so it renders the same
// everywhere (an SVG shown as an <img> cannot load web fonts).
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const SRC = '../../JobHunt2025/multi-tenant-idm-saas/docs/images';
const OUT = 'public/work/tenantry';
mkdirSync(OUT, { recursive: true });

await sharp(`${SRC}/home-light.webp`).resize(800).webp({ quality: 80 }).toFile(`${OUT}/home.webp`);
await sharp(`${SRC}/search-light.webp`).resize(800).webp({ quality: 80 }).toFile(`${OUT}/search.webp`);
// The front card: a workspace's branded sign-in, cropped from the 1600 × 888 screenshot.
await sharp(`${SRC}/login-branded-light.webp`)
  .extract({ left: 470, top: 60, width: 660, height: 640 })
  .resize(400)
  .webp({ quality: 82 })
  .toFile(`${OUT}/login-branded.webp`);
console.log(`wrote ${OUT}`);
