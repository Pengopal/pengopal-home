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

/**
 * Loads the 3D code stream after the page has loaded, in idle time. The poster stays whenever
 * motion is reduced, data saving is on, WebGL is missing, or anything fails (spec §5, §7).
 */
export function startCodeStream(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-codestream]');
  const poster = document.querySelector<SVGSVGElement>('svg[data-poster]');
  if (!canvas || !poster) return;
  if (prefersReducedMotion() || saveData() || !webglAvailable()) return;

  const go = async () => {
    try {
      const { mountCodeStream } = await import('../codestream/mount');
      mountCodeStream(canvas, poster);
    } catch {
      canvas.hidden = true;
      poster.removeAttribute('hidden');
      console.warn('codestream unavailable');
    }
  };
  const idle = () => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => void go());
    else globalThis.setTimeout(() => void go(), 200);
  };
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
}
