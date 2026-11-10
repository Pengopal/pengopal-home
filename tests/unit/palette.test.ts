import { readFileSync } from 'node:fs';
import { converter } from 'culori';
import { STREAM_PALETTE } from '../../src/codestream/palette.generated';

const toLab = converter('lab');

test('12 colours', () => {
  expect(STREAM_PALETTE).toHaveLength(12);
  STREAM_PALETTE.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/));
});

test('each colour is colourful and light', () => {
  for (const c of STREAM_PALETTE) {
    const lab = toLab(c)!;
    expect(Math.hypot(lab.a, lab.b)).toBeGreaterThan(15);
    expect(lab.l).toBeGreaterThan(50);
    expect(lab.l).toBeLessThan(92);
  }
});

test('not hand-picked: generated from the logo', () => {
  expect(readFileSync('src/codestream/palette.generated.ts', 'utf8')).toContain('Brand_logo_original.jpg');
});
