import { readFileSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { makeMosaic, mosaicContrast } from '../../scripts/make-opal-mosaic.mjs';

const FILE = 'public/brand/opal-mosaic.webp';
const raw = async (p: string) => sharp(p).removeAlpha().raw().toBuffer({ resolveWithObject: true });

test('texture exists and is at most 40 KB', () => {
  expect(statSync(FILE).size).toBeLessThanOrEqual(40 * 1024);
});

test('is 900×300', async () => {
  const m = await sharp(FILE).metadata();
  expect([m.width, m.height]).toEqual([900, 300]);
});

test('is reproducible from the logo with seed 7', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mosaic-'));
  const again = join(dir, 'again.webp');
  await makeMosaic(again, { seed: 7 });
  const h = (b: Buffer) => createHash('sha256').update(b).digest('hex');
  expect(h((await raw(again)).data)).toBe(h((await raw(FILE)).data));
  expect(readFileSync(again).length).toBeGreaterThan(0);
});

test('light theme: 95% of pixels reach 3:1 on white with the light dim filter (brightness .70)', async () => {
  const { data, info } = await raw(FILE);
  expect(mosaicContrast(data, info.channels, { brightness: 0.7, saturate: 1.25 }, '#ffffff', 5)).toBeGreaterThanOrEqual(3);
});

test('dark theme: 95% of pixels reach 3:1 on #0E1A3A', async () => {
  const { data, info } = await raw(FILE);
  expect(mosaicContrast(data, info.channels, null, '#0e1a3a', 5)).toBeGreaterThanOrEqual(3);
});
