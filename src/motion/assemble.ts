import { STREAM_PALETTE } from '../codestream/palette.generated';
import { GLYPHS } from '../codestream/stream';
import { prefersReducedMotion } from './reveal';

const COUNT = 40;
const SINGLE = GLYPHS.filter((g) => [...g].length === 1);

/** Points spread evenly along every path/circle in the icon, in page coordinates. */
function samplePoints(icon: SVGSVGElement, n: number): { x: number; y: number }[] {
  const shapes = [...icon.querySelectorAll<SVGGeometryElement>('path, circle')];
  const lengths = shapes.map((s) => s.getTotalLength());
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  const ctm = icon.getScreenCTM();
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    let at = (i / n) * total, k = 0;
    while (k < shapes.length - 1 && at > lengths[k]) at -= lengths[k++];
    const p = shapes[k].getPointAtLength(at);
    const sp = ctm ? new DOMPoint(p.x, p.y).matrixTransform(ctm) : p;
    pts.push({ x: sp.x + window.scrollX, y: sp.y + window.scrollY });
  }
  return pts;
}

/**
 * Code characters drift in from around the card and settle onto the icon's lines, then the icon
 * itself appears (spec §3.3). Plays once. Under reduced motion it only marks the card final.
 */
export function assembleInto(card: HTMLElement, icon: SVGSVGElement): void {
  const finish = () => {
    card.dataset.assembled = 'true';
    delete card.dataset.pending;
  };
  if (prefersReducedMotion()) return finish();

  const box = card.getBoundingClientRect();
  const targets = samplePoints(icon, COUNT);
  const dur = getComputedStyle(document.documentElement).getPropertyValue('--dur-2').trim() || '700ms';
  const spans = targets.map((t, i) => {
    const s = document.createElement('span');
    s.className = 'glyph-fly';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = SINGLE[i % SINGLE.length];
    s.style.color = STREAM_PALETTE[i % STREAM_PALETTE.length];
    const sx = box.left + window.scrollX + Math.random() * box.width;
    const sy = box.top + window.scrollY + Math.random() * box.height;
    s.style.left = `${sx}px`;
    s.style.top = `${sy}px`;
    s.style.setProperty('--dx', `${t.x - sx}px`);
    s.style.setProperty('--dy', `${t.y - sy}px`);
    s.style.animationDuration = dur;
    s.style.animationDelay = `${(i % 10) * 25}ms`;
    document.body.appendChild(s);
    return s;
  });

  let left = spans.length;
  spans.forEach((s) =>
    s.addEventListener('animationend', () => {
      s.remove();
      if (--left === 0) finish();
    }),
  );
  // Safety net: never leave a card unfinished if an animation event is lost.
  window.setTimeout(() => {
    spans.forEach((s) => s.remove());
    finish();
  }, 2500);
}
