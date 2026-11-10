import { createRng, pathPoint, makeGlyphs, GLYPHS } from '../../src/codestream/stream';
import { STREAM_PALETTE } from '../../src/codestream/palette.generated';

test('rng is deterministic and in [0,1)', () => {
  const a = createRng(7), b = createRng(7);
  const xs = Array.from({ length: 5 }, () => a());
  expect(Array.from({ length: 5 }, () => b())).toEqual(xs);
  xs.forEach((x) => { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(1); });
  expect(createRng(8)()).not.toBe(xs[0]);
});

test('path starts at the wake and exits left', () => {
  const w = 1280, h = 720;
  expect(pathPoint(0, 0, w, h).x).toBeCloseTo(0.78 * w);
  expect(pathPoint(1, 0, w, h).x).toBeCloseTo(-0.02 * w);
  expect(pathPoint(0, 0, w, h).y).toBeCloseTo(0.62 * h);
});

test('path stays in bounds', () => {
  const w = 1280, h = 720;
  for (let u = 0; u <= 1.0001; u += 0.05) for (const lane of [-1, 0, 1]) {
    const p = pathPoint(u, lane, w, h);
    expect(p.x).toBeGreaterThanOrEqual(-0.03 * w);
    expect(p.x).toBeLessThanOrEqual(0.8 * w);
    expect(p.y).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeLessThanOrEqual(h);
  }
});

test('makeGlyphs uses only palette colours and GLYPHS, z in [-6, 2]', () => {
  const gs = makeGlyphs(500, createRng(1));
  expect(gs).toHaveLength(500);
  for (const g of gs) {
    expect(GLYPHS).toContain(g.char);
    expect(STREAM_PALETTE).toContain(g.color);
    expect(g.z).toBeGreaterThanOrEqual(-6);
    expect(g.z).toBeLessThanOrEqual(2);
    expect(g.u).toBeGreaterThanOrEqual(0);
    expect(g.u).toBeLessThan(1);
    expect(Math.abs(g.lane)).toBeLessThanOrEqual(1);
    expect(g.speed).toBeGreaterThan(0);
  }
});

test('glyph set matches the spec', () => {
  for (const c of ['{', '}', '<', '>', '/', '=', ';', '(', ')', '[', ']', '0', '1', '=>', '&&', '||', '#', '@', 'λ', 'const', 'await', 'SSO', 'RAG']) {
    expect(GLYPHS).toContain(c);
  }
});

test('words are accents, not the bulk of the stream', () => {
  const gs = makeGlyphs(2000, createRng(3));
  const words = gs.filter((g) => [...g.char].length > 1).length / gs.length;
  expect(words).toBeGreaterThan(0.08);
  expect(words).toBeLessThan(0.2);
});

test('the ribbon widens downstream', () => {
  const w = 1280, h = 720;
  const spread = (u: number) => pathPoint(u, 1, w, h).y - pathPoint(u, -1, w, h).y;
  expect(spread(0.9)).toBeGreaterThan(spread(0.1) * 2);
  expect(spread(0.9)).toBeGreaterThan(0.15 * h);
});
