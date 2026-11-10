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

test('nav targets: Work first', () => {
  expect(site.nav.map((n) => [n.label, n.href])).toEqual([
    ['Work', '#work'],
    ['Services', '#services'],
    ['How we work', '#how-we-work'],
    ['Contact', '#contact'],
  ]);
});

test('hero secondary points to #work', () => {
  expect(site.hero.secondary.href).toBe('#work');
});

test('one project, Tenantry, with exact links', () => {
  expect(site.projects.map((p) => p.id)).toEqual(['tenantry']);
  const t = site.projects[0];
  expect(t.name).toBe('Tenantry');
  expect(t.links.demo?.href).toBe('https://tenantry.pengopal.com');
  expect(t.links.code?.href).toBe('https://github.com/mfurqanwork/tenantry-keycloak-multitenancy');
  expect(t.badge).toBe('v0.6.2 · MIT · live');
});

test('three Tenantry stats: 33, 2, 1', () => {
  expect(site.projects[0].stats.map((s) => s.value)).toEqual(['33', '2', '1']);
});

test('Tenantry screenshots: one main, one back, one front, each with alt text', () => {
  const shots = site.projects[0].shots;
  expect(shots.map((s) => s.role).sort()).toEqual(['back', 'front', 'main']);
  shots.forEach((s) => expect(s.alt.length).toBeGreaterThan(10));
});

test('section headings', () => {
  expect(site.sections.work).toEqual({ eyebrow: "What we've built", title: 'Products we design, build', highlight: 'and run.' });
  expect(site.sections.services).toEqual({ eyebrow: 'Services', title: 'What we build', highlight: 'for you.' });
  expect(site.sections.process).toEqual({ eyebrow: 'How we work', title: 'From first call to', highlight: 'production.' });
});

test('three services with three deliverables each', () => {
  expect(site.services.map((s) => s.id)).toEqual(['web', 'ai', 'identity']);
  site.services.forEach((s) => expect(s.deliverables).toHaveLength(3));
});

test('four process steps', () => {
  expect(site.process.steps.map((s) => s.title)).toEqual([
    'Discovery call',
    'Plan & estimate',
    'Build in weekly milestones',
    'Launch & support',
  ]);
});

test('no open-source section any more', () => {
  expect('openSource' in site).toBe(false);
});

test('contact band copy', () => {
  expect(site.contact.band.title).toBe('Have a project in mind?');
});

test('forbidden content absent', () => {
  for (const w of [/pakistan/i, /time ?zone/i, /\bUTC\b/, /\bPKT\b/, /within \w+ (working )?days/i]) {
    expect(all).not.toMatch(w);
  }
  // GitHub appears only as Tenantry's own public repository.
  expect(all.match(/github\.com\/[\w-]+\/[\w-]+/g)).toEqual(['github.com/mfurqanwork/tenantry-keycloak-multitenancy']);
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
