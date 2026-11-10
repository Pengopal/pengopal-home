/**
 * All copy and links for pengopal.com (spec §3). Edit text here; components contain none.
 * Never add: Pakistan / time zones, GitHub links, testimonials, client logos, stats, reply-time promises.
 */

export type Anchor = `#${string}`;
export interface Cta { label: string; href: Anchor }
export interface Service {
  id: 'web' | 'ai' | 'identity';
  title: string;
  outcome: string;
  deliverables: string[];
  icon: 'brackets' | 'spark' | 'key';
}

/** Shared with the contact Worker, which must not import anything Vite-specific. */
export const TIMELINES = ['As soon as possible', '1–3 months', '3+ months', 'Just exploring'] as const;
export type Timeline = (typeof TIMELINES)[number];

export interface Site {
  meta: { title: string; description: string; url: string };
  nav: { label: string; href: Anchor }[];
  hero: { lead: string; highlight: string; sub: string; primary: Cta; secondary: Cta };
  services: Service[];
  sections: { services: string; process: string; openSource: string };
  process: { steps: { title: string; body: string }[]; note: string };
  openSource: { title: string; status: 'Coming soon'; description: string; features: string[]; href?: string };
  contact: {
    heading: string;
    line: string;
    email: 'hello@pengopal.com';
    timelines: typeof TIMELINES;
    turnstileSiteKey: string;
  };
  footer: { company: 'Pengopal Technologies'; linkedin: 'https://www.linkedin.com/in/furqan26'; linkedinLabel: string };
  notFound: { title: string; heading: string; body: string; home: string };
  a11y: { skip: string; navLabel: string; menu: string; themeToggle: string; home: string };
}

const SUB =
  'Pengopal is a founder-led studio building web apps, AI features, and secure multi-tenant SaaS — from first commit to production.';

/** Cloudflare's documented always-pass test key; the real key comes from PUBLIC_TURNSTILE_SITE_KEY. */
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

export const site: Site = {
  meta: {
    title: 'Pengopal — Software and AI, built end to end',
    description: SUB,
    url: 'https://pengopal.com/',
  },
  nav: [
    { label: 'Services', href: '#services' },
    { label: 'How we work', href: '#how-we-work' },
    { label: 'Open source', href: '#open-source' },
    { label: 'Contact', href: '#contact' },
  ],
  hero: {
    lead: 'Software and AI,',
    highlight: 'built end to end.',
    sub: SUB,
    primary: { label: 'Start a project', href: '#contact' },
    secondary: { label: "See what we're building", href: '#open-source' },
  },
  services: [
    {
      id: 'web',
      title: 'Web apps & SaaS',
      outcome: 'Product-ready web apps, from first screen to production deploy.',
      deliverables: ['React and TypeScript frontends', 'NestJS or FastAPI backends', 'Postgres data models', 'Dockerised deploys'],
      icon: 'brackets',
    },
    {
      id: 'ai',
      title: 'AI features',
      outcome: 'AI that answers from your own data, not guesses.',
      deliverables: [
        'RAG search over your documents',
        'Chat assistants',
        'Document extraction, including Arabic',
        'AI added to an existing product',
      ],
      icon: 'spark',
    },
    {
      id: 'identity',
      title: 'Identity & multi-tenant SaaS',
      outcome: 'Sign-in, tenants and permissions done right from day one.',
      deliverables: ['Keycloak SSO', 'Organizations and multi-tenancy', 'Role-based access control', 'Enterprise SSO for your customers'],
      icon: 'key',
    },
  ],
  sections: { services: 'What we build', process: 'How we work', openSource: 'Building in public' },
  process: {
    steps: [
      { title: 'Discovery call', body: 'Understand the product, users and constraints.' },
      { title: 'Plan & estimate', body: 'Written scope, milestones and price before any code.' },
      { title: 'Build in weekly milestones', body: 'Working software every week, with a short written update.' },
      { title: 'Launch & support', body: 'Deploy, hand over, and stay on for fixes and next steps.' },
    ],
    note: 'You talk directly to the engineer building your product. No hand-offs, no account managers.',
  },
  openSource: {
    title: 'Multi-tenant SaaS starter',
    status: 'Coming soon',
    description:
      'A production-ready starter on Keycloak SSO. A shared realm with Organizations for standard tenants, realm-per-tenant for enterprise customers, Postgres row-level security, and a Docker deploy.',
    features: [
      'shared realm + Organizations',
      'realm-per-tenant for enterprise',
      'Postgres row-level security',
      'one-command Docker deploy',
    ],
  },
  contact: {
    heading: 'Start a project',
    line: "Tell us what you're building.",
    email: 'hello@pengopal.com',
    timelines: TIMELINES,
    turnstileSiteKey: import.meta.env?.PUBLIC_TURNSTILE_SITE_KEY ?? TURNSTILE_TEST_SITE_KEY,
  },
  footer: {
    company: 'Pengopal Technologies',
    linkedin: 'https://www.linkedin.com/in/furqan26',
    linkedinLabel: 'LinkedIn',
  },
  notFound: {
    title: 'Page not found — Pengopal',
    heading: 'This page swam off.',
    body: 'The link may be old, or the address mistyped.',
    home: 'Back to the homepage',
  },
  a11y: { skip: 'Skip to content', navLabel: 'Primary', menu: 'Menu', themeToggle: 'Dark theme', home: 'Pengopal home' },
};
