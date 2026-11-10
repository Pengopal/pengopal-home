// Renders public/og.png: the dark lockup centred on deep navy, 1200×630 (spec §6.5).
import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const W = 1200, H = 630, LOGO_W = 900, BG = '#0E1A3A';
const logo = readFileSync('public/brand/logo-dark.svg', 'utf8');
const vb = logo.match(/viewBox="([\d.\s-]+)"/)[1].split(/\s+/).map(Number);
const logoH = (LOGO_W * vb[3]) / vb[2];
const inner = logo.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const page =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
  `<rect width="${W}" height="${H}" fill="${BG}"/>` +
  `<svg x="${(W - LOGO_W) / 2}" y="${(H - logoH) / 2}" width="${LOGO_W}" height="${logoH}" viewBox="${vb.join(' ')}">${inner}</svg></svg>`;
writeFileSync('public/og.png', new Resvg(page).render().asPng());
console.log('wrote public/og.png');
