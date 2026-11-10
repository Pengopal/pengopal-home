import { site, TIMELINES } from '../../src/content/site';

const all = JSON.stringify(site);

test('headline split', () => {
  expect(site.hero.lead + ' ' + site.hero.highlight).toBe('Software and AI, built end to end.');
});

test('sub-line exact', () => {
  expect(site.hero.sub).toBe(
    'Pengopal is a founder-led studio building web apps, AI features, and secure multi-tenant SaaS — from first commit to production.',
  );
});

test('three services with four deliverables each', () => {
  expect(site.services.map((s) => s.id)).toEqual(['web', 'ai', 'identity']);
  site.services.forEach((s) => expect(s.deliverables).toHaveLength(4));
});

test('four process steps', () => {
  expect(site.process.steps.map((s) => s.title)).toEqual([
    'Discovery call',
    'Plan & estimate',
    'Build in weekly milestones',
    'Launch & support',
  ]);
});

test('forbidden content absent', () => {
  for (const w of [/pakistan/i, /time ?zone/i, /\bUTC\b/, /\bPKT\b/, /github/i, /within \w+ (working )?days/i]) {
    expect(all).not.toMatch(w);
  }
});

test('open-source card has no link yet', () => {
  expect(site.openSource.href).toBeUndefined();
  expect(site.openSource.status).toBe('Coming soon');
});

test('nav targets exist', () => {
  expect(site.nav.map((n) => n.href)).toEqual(['#services', '#how-we-work', '#open-source', '#contact']);
});

test('timelines are one shared list', () => {
  expect(site.contact.timelines).toBe(TIMELINES);
  expect([...TIMELINES]).toEqual(['As soon as possible', '1–3 months', '3+ months', 'Just exploring']);
});

test('contact and footer fixed values', () => {
  expect(site.contact.email).toBe('hello@pengopal.com');
  expect(site.footer.linkedin).toBe('https://www.linkedin.com/in/furqan26');
  expect(site.meta.title).toBe('Pengopal — Software and AI, built end to end');
});
