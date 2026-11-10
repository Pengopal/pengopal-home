// @vitest-environment jsdom
import { onReveal, prefersReducedMotion } from '../../src/motion/reveal';

type Cb = (entries: { isIntersecting: boolean }[]) => void;
let observers: { cb: Cb; opts: IntersectionObserverInit | undefined; disconnected: boolean }[] = [];

function setReducedMotion(reduce: boolean) {
  window.matchMedia = ((q: string) => ({ matches: reduce && q.includes('reduce'), media: q })) as never;
}

beforeEach(() => {
  observers = [];
  setReducedMotion(false);
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
    rec: (typeof observers)[number];
    constructor(cb: Cb, opts?: IntersectionObserverInit) {
      this.rec = { cb, opts, disconnected: false };
      observers.push(this.rec);
    }
    observe() {}
    disconnect() { this.rec.disconnected = true; }
  };
});

test('fires once, on first intersection', () => {
  const el = document.createElement('div');
  let calls = 0;
  onReveal(el, () => calls++);
  observers[0].cb([{ isIntersecting: false }]);
  expect(calls).toBe(0);
  observers[0].cb([{ isIntersecting: true }]);
  observers[0].cb([{ isIntersecting: true }]);
  expect(calls).toBe(1);
  expect(observers[0].disconnected).toBe(true);
});

test('passes threshold (default 0.25) and rootMargin through', () => {
  onReveal(document.createElement('div'), () => {});
  onReveal(document.createElement('div'), () => {}, { threshold: 0.5, rootMargin: '600px 0px' });
  expect(observers[0].opts?.threshold).toBe(0.25);
  expect(observers[1].opts).toMatchObject({ threshold: 0.5, rootMargin: '600px 0px' });
});

test('reduced motion fires immediately without observing', () => {
  setReducedMotion(true);
  expect(prefersReducedMotion()).toBe(true);
  let calls = 0;
  onReveal(document.createElement('div'), () => calls++);
  expect(calls).toBe(1);
  expect(observers).toHaveLength(0);
});

test('cleanup disconnects', () => {
  const stop = onReveal(document.createElement('div'), () => {});
  stop();
  expect(observers[0].disconnected).toBe(true);
});
