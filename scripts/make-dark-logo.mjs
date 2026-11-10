// Builds public/brand/logo-dark.svg from the approved light lockup (spec §4, "Dark-mode logo"):
// "Peng" → #EEF2FF, a thin #C9D3F5 outline around the art, opal untouched.
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'public/brand/logo-light.svg';
const OUT = 'public/brand/logo-dark.svg';
const PENG = '#EEF2FF';
const OUTLINE = '#C9D3F5';
const OUTLINE_RADIUS = 8; // art-group user units (drawn at 0.5×): ~1.5px at OG size; the header adds its own CSS hairline

const svg = readFileSync(SRC, 'utf8');

/** [start, end) of each top-level <g>…</g> inside the root <svg>. */
function topLevelGroups(text) {
  const spans = [];
  const re = /<(\/?)g\b[^>]*?(\/?)>/g;
  let depth = 0, start = -1, m;
  while ((m = re.exec(text))) {
    const closing = m[1] === '/', selfClosing = m[2] === '/';
    if (selfClosing) continue;
    if (!closing) { if (depth === 0) start = m.index; depth++; }
    else { depth--; if (depth === 0) spans.push([start, re.lastIndex]); }
  }
  return spans;
}

function luminance(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const groups = topLevelGroups(svg);
if (groups.length !== 2) throw new Error(`expected 2 top-level groups (art, wordmark), found ${groups.length}`);
const [[a0, a1], [w0, w1]] = groups;

const art = svg.slice(a0, a1).replace(/^<g\b/, '<g filter="url(#outline)"');
const word = svg.slice(w0, w1).replace(/fill="(#[0-9a-fA-F]{3,6})"/g, (all, hex) =>
  luminance(hex) < 0.2 ? `fill="${PENG}"` : all,
);

const defs =
  `<defs><filter id="outline" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">` +
  `<feMorphology in="SourceAlpha" operator="dilate" radius="${OUTLINE_RADIUS}" result="grown"/>` +
  `<feFlood flood-color="${OUTLINE}"/><feComposite in2="grown" operator="in" result="ring"/>` +
  `<feMerge><feMergeNode in="ring"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;

const head = svg.slice(0, a0);
const out = head.replace(/(<svg\b[^>]*>)/, `$1${defs}`) + art + svg.slice(a1, w0) + word + svg.slice(w1);
writeFileSync(OUT, out);
console.log(`wrote ${OUT} (${(out.length / 1024).toFixed(0)} KB)`);
