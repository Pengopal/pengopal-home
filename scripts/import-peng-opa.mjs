// Converts PengOPA's screenshots to WebP for the "What we've built" section.
// Re-run when its screenshots change. Expects the peng-opa repo cloned next to this one.
//
// public/work/peng-opa/logo-dark.svg is PengOPA's own logo (apps/web/public/brand/pengopa-logo.svg)
// in the colours of its dark logo card, with the name outlined from Geist SemiBold so it renders
// the same everywhere (an SVG shown as an <img> cannot load web fonts).
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const SRC = '../peng-opa/docs/images';
const OUT = 'public/work/peng-opa';
mkdirSync(OUT, { recursive: true });

await sharp(`${SRC}/home.png`).resize(800).webp({ quality: 80 }).toFile(`${OUT}/home.webp`);
await sharp(`${SRC}/editor.png`).resize(800).webp({ quality: 80 }).toFile(`${OUT}/editor.webp`);
// The front card: the editor's "Try it" panel with its result, cropped from the 1440 × 900 screenshot.
await sharp(`${SRC}/editor.png`)
  .extract({ left: 1012, top: 172, width: 376, height: 442 })
  .resize(400)
  .webp({ quality: 82 })
  .toFile(`${OUT}/try-it.webp`);
console.log(`wrote ${OUT}`);
