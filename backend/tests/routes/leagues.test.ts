import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../msw/server';
import { leaguesFixture } from '../msw/handlers';
import { createApp } from '../../src/server';

// Like /api/player/:playerId, this route calls `fetch` inline rather than through a
// service function.
describe('GET /api/leagues', () => {
  const app = createApp();

  it('returns the leagues on the happy path', async () => {
    const res = await request(app).get('/api/leagues');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ leagues: leaguesFixture });
  });

  it('returns 500 on a network-level failure', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/user/:ownerId/leagues/nfl/:season', () => {
        return HttpResponse.error();
      }),
    );

    const res = await request(app).get('/api/leagues');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error fetching leagues data' });
  });

  it('documents the existing gap: an upstream non-ok status is not checked, so it still returns 200', async () => {
    // Known gap, not fixed this session: unlike /api/player/:playerId, this route never
    // checks `leaguesRes.ok`, so a valid JSON error body from a failed upstream request
    // is passed straight through as a "successful" 200 response.
    mswServer.use(
      http.get('https://api.sleeper.app/v1/user/:ownerId/leagues/nfl/:season', () => {
        return HttpResponse.json({ error: 'league not found' }, { status: 500 });
      }),
    );

    const res = await request(app).get('/api/leagues');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ leagues: { error: 'league not found' } });
  });
});
