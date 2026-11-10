// @vitest-environment jsdom
import { initCommitLine } from '../../src/motion/commitLine';

const VIEW_H = 1000;
let top = 2000; // the list's top edge relative to the viewport

function makeList() {
  const ol = document.createElement('ol');
  for (let i = 0; i < 4; i++) {
    const li = document.createElement('li');
    // Four equal columns, 250px wide: node centres at 12.5%, 37.5%, 62.5%, 87.5%.
    Object.defineProperty(li, 'offsetLeft', { value: i * 250 });
    Object.defineProperty(li, 'offsetTop', { value: i * 200 });
    Object.defineProperty(li, 'offsetWidth', { value: 250 });
    ol.appendChild(li);
  }
  Object.defineProperty(ol, 'offsetWidth', { value: 1000 });
  Object.defineProperty(ol, 'offsetHeight', { value: 800 });
  ol.getBoundingClientRect = () => ({ top, height: 300, bottom: top + 300, left: 0, right: 1000, width: 1000, x: 0, y: top, toJSON() {} }) as DOMRect;
  document.body.appendChild(ol);
  return ol;
}

const progress = (ol: HTMLElement) => Number(ol.style.getPropertyValue('--progress'));
const reached = (ol: HTMLElement) => [...ol.children].map((li) => (li as HTMLElement).dataset.reached === 'true');
const scrollTo = (t: number) => { top = t; window.dispatchEvent(new Event('scroll')); };

beforeEach(() => {
  document.body.innerHTML = '';
  top = 2000;
  Object.defineProperty(window, 'innerHeight', { value: VIEW_H, configurable: true });
  window.matchMedia = ((q: string) => ({ matches: false, media: q })) as never;
  // Runs the frame at once and returns 0, as if no frame were still pending.
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => { cb(0); return 0; }) as never;
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 100000, configurable: true });
});

test('x axis: steps are reached as the rail passes their node centres', () => {
  const ol = makeList();
  initCommitLine(ol as HTMLOListElement, () => 'x');
  expect(reached(ol)).toEqual([false, false, false, false]);
  scrollTo(500); // halfway through the 800 → 200 window
  expect(progress(ol)).toBeCloseTo(0.5, 2);
  expect(reached(ol)).toEqual([true, true, false, false]);
  scrollTo(100);
  expect(progress(ol)).toBe(1);
  expect(reached(ol)).toEqual([true, true, true, true]);
});

test('progress never decreases', () => {
  const ol = makeList();
  initCommitLine(ol as HTMLOListElement, () => 'x');
  scrollTo(400);
  const high = progress(ol);
  scrollTo(900);
  expect(progress(ol)).toBe(high);
});

test('an axis switch keeps the highest progress and every passed step', () => {
  const ol = makeList();
  let axis: 'x' | 'y' = 'x';
  initCommitLine(ol as HTMLOListElement, () => axis);
  scrollTo(100);
  expect(progress(ol)).toBe(1);
  axis = 'y';
  scrollTo(3000);
  expect(progress(ol)).toBe(1);
  expect(reached(ol)).toEqual([true, true, true, true]);
});
