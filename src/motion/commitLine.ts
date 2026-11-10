import { prefersReducedMotion } from './reveal';

/**
 * Draws the process list's line like a git commit graph as the page scrolls (spec §3.4):
 * sets --progress (0–1) on the list and data-reached on each step the line has passed.
 * Under reduced motion the line is complete and every step is reached. Returns a cleanup.
 */
export function initCommitLine(list: HTMLOListElement): () => void {
  const steps = [...list.querySelectorAll<HTMLLIElement>(':scope > li')];
  const set = (progress: number) => {
    const p = Math.max(0, Math.min(1, progress));
    list.style.setProperty('--progress', p.toFixed(3));
    const reachedAt = p * list.offsetHeight;
    steps.forEach((li) => {
      if (li.offsetTop <= reachedAt + 1) li.dataset.reached = 'true';
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
    // The line's tip follows a point 60% down the viewport.
    const tip = window.innerHeight * 0.6;
    // Near the end of the page the list may never rise that far, so the bottom of the page completes it.
    const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    set(atEnd && r.top < window.innerHeight ? 1 : (tip - r.top) / (r.height || 1));
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
