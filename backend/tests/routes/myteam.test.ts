import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../msw/server';
import { TEST_OWNER_ID, TEST_LEAGUE_ID, TEST_PLAYER_ID } from '../msw/handlers';
import { mockGetActiveLeagueSettings, mockSetActiveLeague } from '../mocks/settingsRepository';

// Must run before `createApp` is imported, same rationale as the OpenAI mock: register
// the fake before server.ts (transitively) imports the real repository module.
vi.mock('../../src/repositories/settingsRepository', () => ({
  getActiveLeagueSettings: mockGetActiveLeagueSettings,
  setActiveLeague: mockSetActiveLeague,
}));

import { createApp } from '../../src/server';

// Covers the route wiring around getTeamForOwner (DB-vs-env resolution, status codes) —
// the exhaustive Sleeper failure matrix is owned by tests/getTeamForOwner.test.ts, not
// duplicated here.
describe('GET /api/myteam', () => {
  const app = createApp();

  beforeEach(() => {
    mockGetActiveLeagueSettings.mockReset();
    mockSetActiveLeague.mockReset();
  });

  // Some tests below delete SLEEPER_OWNER_ID / SUPABASE_* to force fallback paths;
  // restore them after every test so those mutations don't leak into the others.
  afterEach(() => {
    process.env.SLEEPER_LEAGUE_ID = TEST_LEAGUE_ID;
    process.env.SLEEPER_OWNER_ID = TEST_OWNER_ID;
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  it('returns the assembled team using the DB-resolved active league', async () => {
    mockGetActiveLeagueSettings.mockResolvedValueOnce({
      userId: 'user-1',
      leagueId: 'league-1',
      provider: 'sleeper',
      providerLeagueId: TEST_LEAGUE_ID,
      providerOwnerId: TEST_OWNER_ID,
      leagueName: 'Test League',
    });

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

  it('falls back to env vars when no active league is configured in Supabase', async () => {
    mockGetActiveLeagueSettings.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/myteam');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      leagueId: TEST_LEAGUE_ID,
      ownerId: TEST_OWNER_ID,
    });
  });

  it('returns 400 when neither the DB nor env vars have a league or owner ID', async () => {
    mockGetActiveLeagueSettings.mockResolvedValueOnce(null);
    delete process.env.SLEEPER_OWNER_ID;

    const res = await request(app).get('/api/myteam');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'Missing Sleeper league or owner ID in database or environment variables',
    });
  });

  it('returns a clean 500 when the Sleeper API returns invalid upstream data', async () => {
    mockGetActiveLeagueSettings.mockResolvedValueOnce(null);
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/rosters', () => {
        return HttpResponse.json({ not: 'an array' });
      }),
    );

    const res = await request(app).get('/api/myteam');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error fetching team data' });
  });

  it('returns a clean 500 when the settings repository throws', async () => {
    mockGetActiveLeagueSettings.mockRejectedValueOnce(new Error('db down'));

    const res = await request(app).get('/api/myteam');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error fetching team data' });
  });

  it('skips the Supabase lookup and falls back to env vars when Supabase is not configured', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const res = await request(app).get('/api/myteam');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      leagueId: TEST_LEAGUE_ID,
      ownerId: TEST_OWNER_ID,
    });
    expect(mockGetActiveLeagueSettings).not.toHaveBeenCalled();
  });

  it('returns 501 when the active league uses an unsupported provider', async () => {
    mockGetActiveLeagueSettings.mockResolvedValueOnce({
      userId: 'user-1',
      leagueId: 'league-1',
      provider: 'espn',
      providerLeagueId: 'espn-league-1',
      providerOwnerId: 'espn-owner-1',
      leagueName: 'ESPN League',
    });

    const res = await request(app).get('/api/myteam');

    expect(res.status).toBe(501);
    expect(res.body).toEqual({ error: 'Provider "espn" is not supported yet' });
  });
});
