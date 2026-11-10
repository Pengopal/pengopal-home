import { CanvasTexture, LinearFilter } from 'three';

export interface GlyphAtlas {
  texture: CanvasTexture;
  /** u0, v0, u1, v1 of each glyph's cell, in texture space (v up). */
  uv: Map<string, [number, number, number, number]>;
  /** width / height of each glyph's cell, so quads keep the glyph's proportions. */
  aspect: Map<string, number>;
}

const CELL_H = 64;
const PAD = 6;
const ATLAS_W = 1024;

/** Draws every glyph once, white on transparent, so instances can tint it with their own colour. */
export function buildGlyphAtlas(chars: readonly string[], font: string): GlyphAtlas {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  const widths = chars.map((c) => Math.ceil(ctx.measureText(c).width) + PAD * 2);

  // Simple shelf packing.
  const pos: [number, number][] = [];
  let x = 0, y = 0;
  widths.forEach((w) => {
    if (x + w > ATLAS_W) { x = 0; y += CELL_H; }
    pos.push([x, y]);
    x += w;
  });
  canvas.width = ATLAS_W;
  canvas.height = y + CELL_H;

  ctx.font = font; // resizing a canvas resets its context state
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  const uv = new Map<string, [number, number, number, number]>();
  const aspect = new Map<string, number>();
  chars.forEach((c, i) => {
    const [cx, cy] = pos[i];
    ctx.fillText(c, cx + PAD, cy + CELL_H / 2);
    const H = canvas.height;
    uv.set(c, [cx / ATLAS_W, 1 - (cy + CELL_H) / H, (cx + widths[i]) / ATLAS_W, 1 - cy / H]);
    aspect.set(c, widths[i] / CELL_H);
  });

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  return { texture, uv, aspect };
}
