import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Resvg } from '@resvg/resvg-js';
import { differenceCiede2000, converter } from 'culori';

const SRC = '../Brand Assets/web-ready/logo-horizontal/pengopal-horizontal-light.svg';
const LIGHT = 'public/brand/logo-light.svg';
const DARK = 'public/brand/logo-dark.svg';
const toLab = converter('lab');
const de = differenceCiede2000();

function render(path: string) {
  const r = new Resvg(readFileSync(path, 'utf8')).render();
  return { w: r.width, h: r.height, px: r.pixels };
}

function meanLab(px: Uint8Array, idx: number[]) {
  let l = 0, a = 0, b = 0;
  for (const i of idx) {
    const c = toLab({ mode: 'rgb', r: px[i] / 255, g: px[i + 1] / 255, b: px[i + 2] / 255 })!;
    l += c.l; a += c.a; b += c.b;
  }
  const n = idx.length;
  return { mode: 'lab' as const, l: l / n, a: a / n, b: b / n };
}

test('light file untouched', () => {
  const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');
  expect(sha(LIGHT)).toBe(sha(SRC));
});

test('opal unchanged in the dark variant', () => {
  const L = render(LIGHT), D = render(DARK);
  expect([D.w, D.h]).toEqual([L.w, L.h]);
  const idx: number[] = [];
  for (let i = 0; i < L.px.length; i += 4) {
    if (L.px[i + 3] < 250) continue;
    const c = toLab({ mode: 'rgb', r: L.px[i] / 255, g: L.px[i + 1] / 255, b: L.px[i + 2] / 255 })!;
    if (Math.hypot(c.a, c.b) > 25 && c.l > 55 && c.l < 95) idx.push(i);
  }
  expect(idx.length).toBeGreaterThan(10_000);
  expect(de(meanLab(L.px, idx), meanLab(D.px, idx))).toBeLessThan(2);
});

test('Peng is light in the dark variant', () => {
  const D = render(DARK);
  let sum = 0, n = 0;
  for (let y = 190; y <= 410; y++) for (let x = 987; x <= 1682; x++) {
    const i = (y * D.w + x) * 4;
    if (D.px[i + 3] < 200) continue;
    const lin = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    sum += 0.2126 * lin(D.px[i]) + 0.7152 * lin(D.px[i + 1]) + 0.0722 * lin(D.px[i + 2]);
    n++;
  }
  expect(n).toBeGreaterThan(5_000);
  expect(sum / n).toBeGreaterThanOrEqual(0.8);
});
