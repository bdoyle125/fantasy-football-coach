import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../msw/server';
import { playerStatsFixture } from '../msw/handlers';
import { createApp } from '../../src/server';

// This route calls `fetch` inline rather than through a service function, so failure
// modes are mocked directly at the msw handler for the one endpoint it hits.
describe('GET /api/player/:playerId', () => {
  const app = createApp();

  it('returns the player stats on the happy path', async () => {
    const res = await request(app).get('/api/player/1234');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ playerData: playerStatsFixture });
  });

  // Hits the explicit `!response.ok` check, not the catch block.
  it('returns 500 when the Sleeper API responds with a non-ok status', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', () => {
        return HttpResponse.json({ error: 'boom' }, { status: 500 });
      }),
    );

    const res = await request(app).get('/api/player/1234');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch player stats from Sleeper API' });
  });

  // Response is `ok` but `.json()` throws — falls through to the catch block instead.
  it('returns 500 when the Sleeper API returns malformed JSON', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', () => {
        return new HttpResponse('not valid json', {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );

    const res = await request(app).get('/api/player/1234');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: 'Exception occurred while fetching player stats from Sleeper API',
    });
  });

  it('returns 500 on a network-level failure', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', () => {
        return HttpResponse.error();
      }),
    );

    const res = await request(app).get('/api/player/1234');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: 'Exception occurred while fetching player stats from Sleeper API',
    });
  });
});
