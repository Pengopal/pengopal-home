import worker from '../../worker/index';

function env(assetsHit: string[]) {
  return {
    ASSETS: { fetch: async (r: Request) => { assetsHit.push(new URL(r.url).pathname); return new Response('asset'); } },
    EMAIL: { send: async () => ({ messageId: 'x' }) },
    TURNSTILE_SECRET: 's',
    CONTACT_TO: 'owner@example.com',
  } as never;
}

test('GET / goes to ASSETS', async () => {
  const hits: string[] = [];
  const res = await worker.fetch(new Request('https://pengopal.com/'), env(hits));
  expect(await res.text()).toBe('asset');
  expect(hits).toEqual(['/']);
});

test('POST /api/contact reaches the handler, not ASSETS', async () => {
  const hits: string[] = [];
  const res = await worker.fetch(
    new Request('https://pengopal.com/api/contact', { method: 'POST', body: '{bad', headers: { 'content-type': 'application/json' } }),
    env(hits),
  );
  expect(res.status).toBe(400);
  expect(hits).toEqual([]);
});
