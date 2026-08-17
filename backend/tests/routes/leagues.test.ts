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

  it('returns the leagues on the happy path, using SLEEPER_OWNER_ID and the current year by default', async () => {
    const res = await request(app).get('/api/leagues');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ leagues: leaguesFixture });
  });

  it('uses the ownerId and season query params when provided, instead of the env var default', async () => {
    let requestedUrl: string | undefined;
    mswServer.use(
      http.get('https://api.sleeper.app/v1/user/:ownerId/leagues/nfl/:season', ({ request, params }) => {
        requestedUrl = request.url;
        expect(params.ownerId).toBe('some-other-owner-id');
        expect(params.season).toBe('2024');
        return HttpResponse.json(leaguesFixture);
      }),
    );

    const res = await request(app).get('/api/leagues').query({ ownerId: 'some-other-owner-id', season: '2024' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ leagues: leaguesFixture });
    expect(requestedUrl).toBeDefined();
  });

  it('returns 400 when no ownerId is given and SLEEPER_OWNER_ID is not set', async () => {
    const original = process.env.SLEEPER_OWNER_ID;
    delete process.env.SLEEPER_OWNER_ID;

    const res = await request(app).get('/api/leagues');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'ownerId is required' });

    process.env.SLEEPER_OWNER_ID = original;
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
