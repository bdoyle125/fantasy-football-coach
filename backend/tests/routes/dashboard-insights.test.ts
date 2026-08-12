import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../msw/server';
import { TEST_PLAYER_ID, TEST_OPPONENT, playersDictFixture } from '../msw/handlers';

import { createApp } from '../../src/server';

// Purely arithmetic route (no OpenAI call), so tests only need Sleeper MSW mocks.
describe('POST /api/dashboard-insights', () => {
  const app = createApp();

  it('returns a team strength tier and a player to watch on the happy path', async () => {
    const res = await request(app)
      .post('/api/dashboard-insights')
      .send({ players: [{ id: TEST_PLAYER_ID, name: 'Test Player', position: 'QB', team: 'KC' }] });

    expect(res.status).toBe(200);
    expect(res.body.teamStrength.tier).toBe('Elite');
    expect(res.body.teamStrength.playersCounted).toBe(1);
    expect(res.body.playerToWatch).toMatchObject({
      playerId: TEST_PLAYER_ID,
      name: 'Test Player',
      position: 'QB',
      opponent: TEST_OPPONENT,
    });
    expect(typeof res.body.playerToWatch.defenseRank).toBe('number');
  });

  it('returns 400 when players is missing or not an array', async () => {
    const res = await request(app).post('/api/dashboard-insights').send({ players: 'not-an-array' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid players data' });
  });

  it('reports an Unknown tier when no roster player has season stats', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', () => {
        return HttpResponse.json(null);
      }),
    );

    const res = await request(app)
      .post('/api/dashboard-insights')
      .send({ players: [{ id: TEST_PLAYER_ID, name: 'Test Player', position: 'QB', team: 'KC' }] });

    expect(res.status).toBe(200);
    expect(res.body.teamStrength).toEqual({ tier: 'Unknown', averagePointsPerGame: 0, playersCounted: 0, usedLastSeasonFallback: false });
  });

  it('excludes an injured player from Player to Watch consideration', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        return HttpResponse.json({
          [TEST_PLAYER_ID]: { ...playersDictFixture[TEST_PLAYER_ID], injury_status: 'Out' },
        });
      }),
    );

    const res = await request(app)
      .post('/api/dashboard-insights')
      .send({ players: [{ id: TEST_PLAYER_ID, name: 'Test Player', position: 'QB', team: 'KC' }] });

    expect(res.status).toBe(200);
    expect(res.body.playerToWatch).toBeNull();
  });

  it('returns a clean 500 when an upstream Sleeper call fails unexpectedly', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/state/nfl', () => {
        return HttpResponse.error();
      }),
    );

    const res = await request(app)
      .post('/api/dashboard-insights')
      .send({ players: [{ id: TEST_PLAYER_ID, name: 'Test Player', position: 'QB', team: 'KC' }] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error computing dashboard insights' });
  });
});
