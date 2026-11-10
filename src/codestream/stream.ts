import { STREAM_PALETTE } from './palette.generated';

/** Characters and short tokens the stream is made of (spec §5). */
export const GLYPHS: readonly string[] = [
  '{', '}', '<', '>', '/', '=', ';', '(', ')', '[', ']', '0', '1',
  '=>', '&&', '||', '#', '@', 'λ', 'const', 'await', 'SSO', 'RAG',
];

export interface GlyphSpec { char: string; u: number; lane: number; z: number; speed: number; color: string }

/** mulberry32: small, fast, deterministic. Returns values in [0, 1). */
export function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The wake's curve. u = 0 at the penguin's wake, 1 at the left exit; lane in [-1, 1] spreads the stream.
 * x: 0.78·w → −0.02·w; y: 0.62·h + u²·0.22·h, plus a lane offset that widens downstream
 * (up to ±0.098·h) so the stream reads as a ribbon as wide as the wake.
 */
export function pathPoint(u: number, lane: number, width: number, height: number): { x: number; y: number } {
  const x = width * (0.78 - 0.8 * u);
  const y = height * (0.62 + u * u * 0.22) + lane * (0.4 + u) * 0.07 * height;
  return { x, y };
}

const SINGLE = GLYPHS.filter((g) => [...g].length === 1);
const TOKENS = GLYPHS.filter((g) => [...g].length > 1);
/** Mostly single characters; words and operators are accents (about 1 in 7), so the stream stays light. */
const TOKEN_SHARE = 0.14;

export function makeGlyphs(count: number, rng: () => number): GlyphSpec[] {
  return Array.from({ length: count }, () => ({
    char: rng() < TOKEN_SHARE ? TOKENS[Math.floor(rng() * TOKENS.length)] : SINGLE[Math.floor(rng() * SINGLE.length)],
    u: rng(),
    lane: rng() * 2 - 1,
    z: -6 + rng() * 8,
    speed: 0.02 + rng() * 0.05,
    color: STREAM_PALETTE[Math.floor(rng() * STREAM_PALETTE.length)],
  }));
}
