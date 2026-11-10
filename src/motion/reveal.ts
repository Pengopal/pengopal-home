/** True when the visitor asked their system for less motion. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

/**
 * Calls `cb` once, the first time `el` scrolls into view. Under reduced motion (or without
 * IntersectionObserver) it calls `cb` straight away, so callers can render their final state.
 * Returns a cleanup function.
 */
export function onReveal(
  el: Element,
  cb: () => void,
  opts: { threshold?: number; rootMargin?: string } = {},
): () => void {
  if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
    cb();
    return () => {};
  }
  let done = false;
  const io = new IntersectionObserver(
    (entries) => {
      if (done || !entries.some((e) => e.isIntersecting)) return;
      done = true;
      io.disconnect();
      cb();
    },
    { threshold: opts.threshold ?? 0.25, ...(opts.rootMargin ? { rootMargin: opts.rootMargin } : {}) },
  );
  io.observe(el);
  return () => io.disconnect();
}
