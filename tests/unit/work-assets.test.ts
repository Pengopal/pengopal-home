import { readFileSync, statSync } from 'node:fs';
import sharp from 'sharp';
import { site } from '../../src/content/site';

const TENANTRY = '../../JobHunt2025/multi-tenant-idm-saas';

test('each screenshot exists and matches its declared size', async () => {
  for (const s of site.projects[0].shots) {
    const m = await sharp(`public${s.src}`).metadata();
    expect([m.width, m.height, m.format]).toEqual([s.width, s.height, 'webp']);
  }
});

test('the three screenshots together are at most 150 KB', () => {
  const total = site.projects[0].shots.reduce((n, s) => n + statSync(`public${s.src}`).size, 0);
  expect(total).toBeLessThanOrEqual(150 * 1024);
});

test("Tenantry's logo is used unaltered", () => {
  const logo = site.projects[0].logo.src;
  expect(readFileSync(`public${logo}`)).toEqual(readFileSync(`${TENANTRY}/packages/ui/assets/brand/tenantry-logo-dark.svg`));
});
