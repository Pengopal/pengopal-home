/**
 * All copy and links for pengopal.com (spec §3). Edit text here; components contain none.
 * Never add: Pakistan / time zones, testimonials, client logos, invented stats, reply-time promises.
 * GitHub links only for a project's own public repository (Tenantry's). Project facts come from its README.
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

export interface SectionHeading { eyebrow: string; title: string; highlight: string }
export interface Project {
  id: string;
  name: string;
  logo: { src: string; width: number; height: number; alt: string };
  badge: string;
  pitch: string;
  stats: { value: string; label: string }[];
  tiers?: { name: string; body: string }[];
  links: { demo?: { label: string; href: string }; code?: { label: string; href: string } };
  shots: { src: string; alt: string; width: number; height: number; role: 'main' | 'back' | 'front' }[];
}

/** Shared with the contact Worker, which must not import anything Vite-specific. */
export const TIMELINES = ['As soon as possible', '1–3 months', '3+ months', 'Just exploring'] as const;
export type Timeline = (typeof TIMELINES)[number];

export interface Site {
  meta: { title: string; description: string; url: string };
  nav: { label: string; href: Anchor }[];
  hero: { lead: string; highlight: string; sub: string; primary: Cta; secondary: Cta };
  services: Service[];
  projects: Project[];
  sections: { work: SectionHeading; services: SectionHeading; process: SectionHeading; nextProject: string };
  process: { steps: { title: string; body: string }[]; note: string };
  contact: {
    heading: string;
    line: string;
    email: 'hello@pengopal.com';
    timelines: typeof TIMELINES;
    turnstileSiteKey: string;
    labels: { name: string; email: string; message: string; timeline: string; timelineEmpty: string; send: string; sending: string; trap: string };
    preferEmail: string;
    success: { heading: string; body: string };
    failed: string;
    failedLink: string;
    spamCheckFailed: string;
    errors: { name: string; email: string; message: string; timeline: string };
    band: { title: string; line: string; orEmail: string; dialogTitle: string; close: string };
  };
  brand: { name: 'Pengopal'; logoAlt: string; ogImageAlt: string; copyrightMark: string };
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
    { label: 'Work', href: '#work' },
    { label: 'Services', href: '#services' },
    { label: 'How we work', href: '#how-we-work' },
    { label: 'Contact', href: '#contact' },
  ],
  hero: {
    lead: 'Software and AI,',
    highlight: 'built end to end.',
    sub: SUB,
    primary: { label: 'Start a project', href: '#contact' },
    secondary: { label: "See what we're building", href: '#work' },
  },
  services: [
    {
      id: 'web',
      title: 'Web apps & SaaS',
      outcome: 'Product-ready web apps, from first screen to production deploy.',
      deliverables: ['React + TypeScript frontends', 'NestJS or FastAPI backends', 'Postgres and Docker deploys'],
      icon: 'brackets',
    },
    {
      id: 'ai',
      title: 'AI features',
      outcome: 'AI that answers from your own data, not guesses.',
      deliverables: ['RAG search over your documents', 'Chat assistants', 'Document extraction, including Arabic'],
      icon: 'spark',
    },
    {
      id: 'identity',
      title: 'Identity & multi-tenant SaaS',
      outcome: 'Sign-in, tenants and permissions done right from day one.',
      deliverables: ['Keycloak SSO', 'Organizations and role-based access', 'Enterprise SSO for your customers'],
      icon: 'key',
    },
  ],
  projects: [
    {
      id: 'tenantry',
      name: 'Tenantry',
      logo: { src: '/work/tenantry/logo-dark.svg', width: 168, height: 32, alt: 'Tenantry' },
      badge: 'v0.6.2 · MIT · live',
      pitch:
        'Multi-tenant sign-in, teams and branding for SaaS, built on Keycloak. Two tiers on one codebase, with isolation enforced at the token, the API and the database.',
      stats: [
        { value: '33', label: 'isolation guarantees tested in CI' },
        { value: '2', label: 'tiers: shared realm or a realm each' },
        { value: '1', label: 'codebase for both tiers' },
      ],
      tiers: [
        { name: 'Standard', body: 'Organizations in one shared realm. Cheap, instant, one sign-on.' },
        { name: 'Enterprise', body: 'A realm of their own, with apps, security rules and directory sync.' },
      ],
      links: {
        demo: { label: 'Try the live demo', href: 'https://tenantry.pengopal.com' },
        code: { label: 'View the code', href: 'https://github.com/mfurqanwork/tenantry-keycloak-multitenancy' },
      },
      shots: [
        { src: '/work/tenantry/home.webp', alt: 'Tenantry home: a setup card, workspace numbers and latest projects', width: 800, height: 432, role: 'main' },
        { src: '/work/tenantry/search.webp', alt: 'Tenantry search across pages, people and projects', width: 800, height: 432, role: 'back' },
        { src: '/work/tenantry/login-branded.webp', alt: "A workspace's own branded sign-in page", width: 400, height: 320, role: 'front' },
      ],
    },
  ],
  sections: {
    work: { eyebrow: "What we've built", title: 'Products we design, build', highlight: 'and run.' },
    services: { eyebrow: 'Services', title: 'What we build', highlight: 'for you.' },
    process: { eyebrow: 'How we work', title: 'From first call to', highlight: 'production.' },
    nextProject: 'Next project — space reserved',
  },
  process: {
    steps: [
      { title: 'Discovery call', body: 'Understand the product, users and constraints.' },
      { title: 'Plan & estimate', body: 'Written scope, milestones and price before any code.' },
      { title: 'Build in weekly milestones', body: 'Working software every week, with a short written update.' },
      { title: 'Launch & support', body: 'Deploy, hand over, and stay on for fixes and next steps.' },
    ],
    note: 'You talk directly to the engineer building your product. No hand-offs, no account managers.',
  },
  contact: {
    heading: 'Start a project',
    line: "Tell us what you're building.",
    email: 'hello@pengopal.com',
    timelines: TIMELINES,
    turnstileSiteKey: import.meta.env?.PUBLIC_TURNSTILE_SITE_KEY ?? TURNSTILE_TEST_SITE_KEY,
    labels: {
      name: 'Name',
      email: 'Email',
      message: 'What are you building?',
      timeline: 'Timeline',
      timelineEmpty: 'Select…',
      send: 'Send',
      sending: 'Sending…',
      trap: 'Website',
    },
    preferEmail: 'Prefer email?',
    success: { heading: 'Thanks — message received.', body: "We'll read it and get back to you by email." },
    failed: "Your message didn't send.",
    failedLink: 'Email it to us instead',
    spamCheckFailed: "The spam check couldn't load, so the form can't send right now.",
    band: {
      title: 'Have a project in mind?',
      line: "Tell us what you're building.",
      orEmail: 'Or email',
      dialogTitle: 'Start a project',
      close: 'Close',
    },
    errors: {
      name: 'Please enter your name (up to 120 characters).',
      email: 'Please enter a valid email address.',
      message: 'Please tell us what you are building (up to 4000 characters).',
      timeline: 'Please choose a timeline from the list.',
    },
  },
  brand: { name: 'Pengopal', logoAlt: 'Pengopal', ogImageAlt: 'Pengopal logo on deep navy', copyrightMark: '©' },
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
