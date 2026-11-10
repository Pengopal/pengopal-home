// Generates public/brand/opal-mosaic.webp: Pengopal's Opal Mosaic texture (spec v2 §2).
// Every cell's colour is a real pixel from the "opal" letters of the logo; nothing is hand-picked.
// Usage: node scripts/make-opal-mosaic.mjs
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const SRC = '../Brand Assets/Brand_logo_original.jpg';
const CROP = { left: 625, top: 640, width: 370, height: 170 }; // the "opal" letters
const W = 900, H = 300, CELLS = 170, SHADE = 0.12, QUALITY = 82;
const LIGHT = [-0.6, -0.8]; // light from the top left: each facet gets a crystal sheen

function lcg(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}

/** Writes the mosaic to `out`. Same seed, same texture. */
export async function makeMosaic(out = 'public/brand/opal-mosaic.webp', { seed = 7 } = {}) {
  const { data } = await sharp(SRC).extract(CROP).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const pool = [];
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn > 45 && mn < 215) pool.push([r, g, b]);
  }
  const rnd = lcg(seed);
  const seeds = Array.from({ length: CELLS }, () => ({ x: rnd() * W, y: rnd() * H, c: pool[Math.floor(rnd() * pool.length)] }));
  const img = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let best = 0, bd = Infinity;
      for (let k = 0; k < CELLS; k++) {
        const dx = x - seeds[k].x, dy = y - seeds[k].y, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = k; }
      }
      const sd = seeds[best], dx = x - sd.x, dy = y - sd.y, len = Math.hypot(dx, dy) || 1;
      const shade = 1 + SHADE * ((dx * LIGHT[0] + dy * LIGHT[1]) / len) * Math.min(1, len / 30);
      const i = (y * W + x) * 3;
      for (let c = 0; c < 3; c++) img[i + c] = Math.max(0, Math.min(255, Math.round(sd.c[c] * shade)));
    }
  }
  await sharp(img, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: QUALITY, lossless: false }).toFile(out);
}

const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const clamp = (v) => Math.max(0, Math.min(255, v));

/** CSS brightness() then saturate(), as the browser applies them (sRGB). */
function cssFilter(r, g, b, f) {
  if (!f) return [r, g, b];
  r *= f.brightness; g *= f.brightness; b *= f.brightness;
  const s = f.saturate;
  return [
    clamp((0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b),
    clamp((0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b),
    clamp((0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b),
  ];
}

/**
 * The p-th percentile WCAG contrast of the texture's pixels (after the CSS filter) against `bg`.
 * p = 5 means 95% of pixels reach at least the returned ratio.
 */
export function mosaicContrast(pixels, channels, filter, bg, percentile) {
  const h = bg.replace('#', '');
  const bgL = lum(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16));
  const ratios = [];
  for (let i = 0; i < pixels.length; i += channels) {
    const [r, g, b] = cssFilter(pixels[i], pixels[i + 1], pixels[i + 2], filter);
    const L = lum(r, g, b);
    ratios.push((Math.max(L, bgL) + 0.05) / (Math.min(L, bgL) + 0.05));
  }
  ratios.sort((a, b) => a - b);
  return ratios[Math.floor((percentile / 100) * (ratios.length - 1))];
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await makeMosaic();
  console.log('wrote public/brand/opal-mosaic.webp');
}
