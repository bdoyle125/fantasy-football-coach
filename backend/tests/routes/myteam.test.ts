import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../msw/server';
import { TEST_OWNER_ID, TEST_LEAGUE_ID, TEST_PLAYER_ID } from '../msw/handlers';
import { createApp } from '../../src/server';

// Covers the route wiring around getTeamForOwner (env/query handling, status codes) —
// the exhaustive Sleeper failure matrix is owned by tests/getTeamForOwner.test.ts, not
// duplicated here.
describe('GET /api/myteam', () => {
  const app = createApp();

  // One test below deletes SLEEPER_OWNER_ID to force the 400 path; restore it after
  // every test so that mutation doesn't leak into the others.
  afterEach(() => {
    process.env.SLEEPER_LEAGUE_ID = TEST_LEAGUE_ID;
    process.env.SLEEPER_OWNER_ID = TEST_OWNER_ID;
  });

  it('returns the assembled team on the happy path', async () => {
    const res = await request(app).get('/api/myteam');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: TEST_OWNER_ID,
      name: 'Test Team',
      leagueId: TEST_LEAGUE_ID,
      ownerId: TEST_OWNER_ID,
    });
    expect(res.body.players).toHaveLength(1);
    expect(res.body.players[0].id).toBe(TEST_PLAYER_ID);
  });

  it('returns 400 when the league or owner ID is missing', async () => {
    delete process.env.SLEEPER_OWNER_ID;

    const res = await request(app).get('/api/myteam');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'Missing Sleeper league or owner ID in environment variables or query',
    });
  });

  it('returns a clean 500 when the Sleeper API returns invalid upstream data', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/rosters', () => {
        return HttpResponse.json({ not: 'an array' });
      }),
    );

    const res = await request(app).get('/api/myteam');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error fetching team data' });
  });
});
