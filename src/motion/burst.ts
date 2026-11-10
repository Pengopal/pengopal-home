import { STREAM_PALETTE } from '../codestream/palette.generated';
import { GLYPHS } from '../codestream/stream';
import { prefersReducedMotion } from './reveal';

const COUNT = 60;

/** A one-off burst of opal code characters from an element (spec §3.6, on a successful send). */
export function burst(from: HTMLElement): void {
  if (prefersReducedMotion()) return;
  const r = from.getBoundingClientRect();
  const cx = r.left + window.scrollX + r.width / 2;
  const cy = r.top + window.scrollY + r.height / 2;
  const dur = getComputedStyle(document.documentElement).getPropertyValue('--dur-2').trim() || '700ms';
  for (let i = 0; i < COUNT; i++) {
    const s = document.createElement('span');
    s.className = 'glyph-fly glyph-fly--burst';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = GLYPHS[i % GLYPHS.length];
    s.style.color = STREAM_PALETTE[i % STREAM_PALETTE.length];
    s.style.left = `${cx}px`;
    s.style.top = `${cy}px`;
    const angle = (i / COUNT) * Math.PI * 2;
    const dist = 80 + Math.random() * 140;
    s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    s.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    s.style.animationDuration = dur;
    s.addEventListener('animationend', () => s.remove());
    document.body.appendChild(s);
    window.setTimeout(() => s.remove(), 2500);
  }
}
