import { prefersReducedMotion } from './reveal';

type Axis = 'x' | 'y';

/**
 * Draws the process rail as the page scrolls (spec v2 §3.3). Sets --progress (0–1) on the list and
 * data-reached on each step the rail has passed.
 * - 'y' (phones): the rail runs down the list, and its tip follows a point 60% down the viewport.
 * - 'x' (desktop): the rail runs across, filling while the list rises from 80% to 20% of the viewport.
 * Plays once: progress only ever grows, even when the axis changes on resize. Under reduced motion
 * the rail is full. Returns a cleanup.
 */
export function initCommitLine(list: HTMLOListElement, axis: () => Axis = () => 'y'): () => void {
  const steps = [...list.querySelectorAll<HTMLLIElement>(':scope > li')];
  let shown = 0;

  const passed = (li: HTMLLIElement, p: number, ax: Axis) =>
    ax === 'x'
      ? (li.offsetLeft + li.offsetWidth / 2) / (list.offsetWidth || 1) <= p + 0.001
      : li.offsetTop <= p * list.offsetHeight + 1;

  const set = (progress: number) => {
    const p = Math.max(shown, Math.min(1, progress));
    shown = p;
    list.style.setProperty('--progress', p.toFixed(3));
    const ax = axis();
    steps.forEach((li) => {
      if (passed(li, p, ax)) li.dataset.reached = 'true';
    });
  };

  if (prefersReducedMotion()) {
    set(1);
    return () => {};
  }

  let raf = 0;
  const update = () => {
    raf = 0;
    const r = list.getBoundingClientRect();
    const vh = window.innerHeight;
    // Near the end of the page the list may never rise far enough, so the bottom of the page completes it.
    const atEnd = window.scrollY + vh >= document.documentElement.scrollHeight - 2;
    if (atEnd && r.top < vh) return set(1);
    set(axis() === 'x' ? (vh * 0.8 - r.top) / (vh * 0.6) : (vh * 0.6 - r.top) / (r.height || 1));
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };
  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}
