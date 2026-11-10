import { prefersReducedMotion } from '../motion/reveal';

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function saveData(): boolean {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return conn?.saveData === true;
}

/** Below this width visitors get the poster only (spec §9: keeps phones fast). */
const MIN_3D_WIDTH = 768;
/** With no interaction, start the 3D this long after load, once the page has settled. */
const SETTLE_MS = 3500;

/**
 * Loads the 3D code stream on wide screens, on the first interaction or a few seconds after load,
 * so it never competes with the first paint. The poster stays on phones, under reduced motion or
 * data saving, without WebGL, or if anything fails (spec §5, §7, §9).
 */
export function startCodeStream(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-codestream]');
  const poster = document.querySelector<SVGSVGElement>('svg[data-poster]');
  if (!canvas || !poster) return;
  if (window.innerWidth < MIN_3D_WIDTH || prefersReducedMotion() || saveData() || !webglAvailable()) return;

  let started = false;
  const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;
  const go = async () => {
    if (started) return;
    started = true;
    events.forEach((e) => window.removeEventListener(e, kick));
    try {
      const { mountCodeStream } = await import('../codestream/mount');
      mountCodeStream(canvas, poster);
    } catch {
      canvas.hidden = true;
      poster.removeAttribute('hidden');
      console.warn('codestream unavailable');
    }
  };
  const kick = () => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => void go());
    else globalThis.setTimeout(() => void go(), 0);
  };
  const afterLoad = () => {
    events.forEach((e) => window.addEventListener(e, kick, { once: true, passive: true }));
    globalThis.setTimeout(kick, SETTLE_MS);
  };
  if (document.readyState === 'complete') afterLoad();
  else window.addEventListener('load', afterLoad, { once: true });
}
