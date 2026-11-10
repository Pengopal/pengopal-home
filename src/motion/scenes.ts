import { prefersReducedMotion } from './reveal';

/**
 * Plays a service scene once (spec v2 §3.2). Each scene's moving parts carry data-step="1…n";
 * they appear in order, --dur-1 apart. A part with data-until="n" disappears once step n shows
 * (the AI typing dots). The markup's default is the final frame, so no-JS visitors see it whole.
 */
export function playScene(scene: HTMLElement): void {
  const finish = () => {
    delete scene.dataset.pending;
    scene.dataset.played = 'true';
  };
  if (prefersReducedMotion()) return finish();

  const steps = [...scene.querySelectorAll<HTMLElement>('[data-step]')];
  const transient = [...scene.querySelectorAll<HTMLElement>('[data-until]')];
  const last = Math.max(0, ...steps.map((el) => Number(el.dataset.step)));
  const dur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-1')) || 400;

  scene.dataset.playing = 'true';
  for (let n = 1; n <= last; n++) {
    window.setTimeout(() => {
      steps.filter((el) => Number(el.dataset.step) === n).forEach((el) => (el.dataset.on = 'true'));
      transient.filter((el) => Number(el.dataset.until) === n).forEach((el) => (el.dataset.gone = 'true'));
      if (n === last) {
        delete scene.dataset.playing;
        finish();
      }
    }, n * dur);
  }
  if (last === 0) finish();
}
