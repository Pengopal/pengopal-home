import { prefersReducedMotion } from './reveal';

/**
 * "Types" the terminal's lines one after another (spec §3.5). Every line is in the DOM from the
 * start, so screen readers and no-JS visitors get the full text; typing only reveals it visually.
 */
export async function typeLines(list: HTMLElement, msPerChar = 18): Promise<void> {
  const items = [...list.querySelectorAll<HTMLElement>('li')];
  const done = () => {
    delete list.dataset.pending;
    list.dataset.typed = 'true';
  };
  if (prefersReducedMotion() || typeof Element.prototype.animate !== 'function') return done();

  for (const li of items) {
    const chars = Math.max(1, [...(li.textContent ?? '')].length);
    li.dataset.typing = 'true';
    const anim = li.animate(
      [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
      { duration: chars * msPerChar, easing: `steps(${chars}, end)`, fill: 'forwards' },
    );
    try {
      await anim.finished;
    } catch {
      // cancelled (e.g. page hidden mid-way): fall through to the final state
    }
    li.dataset.typed = 'true';
    delete li.dataset.typing;
  }
  done();
}
