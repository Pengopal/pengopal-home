// Privacy-first analytics for pengopal.com, sent to PostHog through our own Worker (/ingest).
//
// - No cookies and no storage: the visitor id lives only in this page's memory, so no consent banner
//   is needed. Visitors are anonymous; PostHog creates no person profiles for them.
// - Honours Do Not Track and Global Privacy Control: nothing is sent at all.
// - URLs are sent without their query string or hash, except the utm_* campaign tags.
// - No key at build time (local dev, tests): every call is a no-op.

const KEY = import.meta.env.PUBLIC_POSTHOG_KEY as string | undefined;
const ENDPOINT = '/ingest/i/v0/e/';
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

type Props = Record<string, string | number | boolean | undefined>;

/** A UUIDv7: what PostHog expects for $session_id (time-ordered). */
function uuidv7(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  let ms = Date.now();
  for (let i = 5; i >= 0; i--) { b[i] = ms % 256; ms = Math.floor(ms / 256); }
  b[6] = (b[6]! & 0x0f) | 0x70;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function optedOut(): boolean {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean };
  return n.globalPrivacyControl === true || n.doNotTrack === '1';
}

const enabled = !!KEY && typeof window !== 'undefined' && !optedOut();
const visitorId = enabled ? uuidv7() : '';
const sessionId = visitorId;

/** The page's address without query or hash, plus the campaign tags it arrived with. */
function pageProps(): Props {
  const url = new URL(location.href);
  const props: Props = {
    $current_url: `${url.origin}${url.pathname}`,
    $host: url.host,
    $pathname: url.pathname,
    $screen_width: screen.width,
    $viewport_width: innerWidth,
  };
  for (const k of UTM) {
    const v = url.searchParams.get(k);
    if (v) props[k] = v.slice(0, 200);
  }
  if (document.referrer) {
    try {
      const ref = new URL(document.referrer);
      props.$referrer = `${ref.origin}${ref.pathname}`;
      props.$referring_domain = ref.host;
    } catch { /* not a URL: leave it out */ }
  } else {
    props.$referrer = '$direct';
    props.$referring_domain = '$direct';
  }
  return props;
}

/** Sends one event. Uses sendBeacon so a click that leaves the page still arrives. */
export function track(event: string, props: Props = {}): void {
  if (!enabled) return;
  const body = JSON.stringify({
    api_key: KEY,
    event,
    distinct_id: visitorId,
    timestamp: new Date().toISOString(),
    properties: { ...pageProps(), ...props, $session_id: sessionId, product: 'pengopal-home', $lib: 'pengopal-web', $process_person_profile: false },
  });
  // text/plain keeps sendBeacon a simple request; the Worker passes it on as it is.
  if (!navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'text/plain' }))) {
    void fetch(ENDPOINT, { method: 'POST', body, keepalive: true }).catch(() => {});
  }
}

/** The anonymous id of this page view, so the server's contact_sent joins the same visit. */
export const analyticsVisitorId = (): string | undefined => (enabled ? visitorId : undefined);

/** Page view, sections seen, and clicks on anything marked data-track="event" (props from data-track-*). */
export function initAnalytics(): void {
  if (!enabled) return;
  track('$pageview');

  const seen = new Set<string>();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const id = (e.target as HTMLElement).id;
      if (e.isIntersecting && id && !seen.has(id)) {
        seen.add(id);
        track('section_viewed', { section: id });
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.3 });
  document.querySelectorAll('main section[id]').forEach((s) => io.observe(s));

  document.addEventListener('click', (e) => {
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-track]');
    if (!el) return;
    const props: Props = {};
    for (const [k, v] of Object.entries(el.dataset)) {
      if (k.startsWith('track') && k !== 'track') props[k.slice(5).toLowerCase()] = v;
    }
    track(el.dataset.track!, props);
  }, { capture: true });

  addEventListener('pagehide', () => track('$pageleave'), { once: true });
}
