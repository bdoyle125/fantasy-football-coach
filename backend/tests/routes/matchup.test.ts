import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../msw/server';
import { TEST_OWNER_ID, TEST_LEAGUE_ID, TEST_PLAYER_ID, TEST_OPPONENT_PLAYER_ID, emptyMatchupsFixture, byeMatchupsFixture, projectionFixture } from '../msw/handlers';
import { mockGetActiveLeagueSettings, mockSetActiveLeague } from '../mocks/settingsRepository';

// Must run before `createApp` is imported, same rationale as myteam.test.ts.
vi.mock('../../src/repositories/settingsRepository', () => ({
  getActiveLeagueSettings: mockGetActiveLeagueSettings,
  setActiveLeague: mockSetActiveLeague,
}));

import { createApp } from '../../src/server';

// Covers the route wiring around getMatchupForOwner (DB-vs-env resolution, status
// codes) — the exhaustive Sleeper/business-state matrix is owned by
// tests/getMatchupForOwner.test.ts, not duplicated here.
describe('GET /api/matchup', () => {
  const app = createApp();

  beforeEach(() => {
    mockGetActiveLeagueSettings.mockReset();
    mockSetActiveLeague.mockReset();
  });

  afterEach(() => {
    process.env.SLEEPER_LEAGUE_ID = TEST_LEAGUE_ID;
    process.env.SLEEPER_OWNER_ID = TEST_OWNER_ID;
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  it('returns the assembled matchup using the DB-resolved active league', async () => {
    mockGetActiveLeagueSettings.mockResolvedValueOnce({
      userId: 'user-1',
      leagueId: 'league-1',
      provider: 'sleeper',
      providerLeagueId: TEST_LEAGUE_ID,
      providerOwnerId: TEST_OWNER_ID,
      leagueName: 'Test League',
    });

    const res = await request(app).get('/api/matchup');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.myTeam.players[0].id).toBe(TEST_PLAYER_ID);
    expect(res.body.opponentTeam.players[0].id).toBe(TEST_OPPONENT_PLAYER_ID);
    expect(res.body.myTeam.players[0].projectedPoints).toBe(projectionFixture.stats.pts_ppr);
    expect(res.body.opponentTeam.players[0].projectedPoints).toBe(projectionFixture.stats.pts_ppr);
  });

  it('falls back to env vars when no active league is configured in Supabase', async () => {
    mockGetActiveLeagueSettings.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/matchup');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns 400 when neither the DB nor env vars have a league or owner ID', async () => {
    mockGetActiveLeagueSettings.mockResolvedValueOnce(null);
    delete process.env.SLEEPER_OWNER_ID;

    const res = await request(app).get('/api/matchup');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'Missing Sleeper league or owner ID in database or environment variables',
    });
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

    const res = await request(app).get('/api/matchup');

    expect(res.status).toBe(501);
    expect(res.body).toEqual({ error: 'Provider "espn" is not supported yet' });
  });

  it('returns a clean 500 when the settings repository throws', async () => {
    mockGetActiveLeagueSettings.mockRejectedValueOnce(new Error('db down'));

    const res = await request(app).get('/api/matchup');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error fetching matchup data' });
  });

  // Business states (bye/unavailable) are not errors — they pass through as 200.
  it('passes through an unavailable matchup as 200, not an error', async () => {
    mockGetActiveLeagueSettings.mockResolvedValueOnce(null);
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/matchups/:week', () => {
        return HttpResponse.json(emptyMatchupsFixture);
      }),
    );

    const res = await request(app).get('/api/matchup');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('unavailable');
  });

  it('attaches projected points to myTeam on a bye week too', async () => {
    mockGetActiveLeagueSettings.mockResolvedValueOnce(null);
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/matchups/:week', () => {
        return HttpResponse.json(byeMatchupsFixture);
      }),
    );

    const res = await request(app).get('/api/matchup');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('bye');
    expect(res.body.myTeam.players[0].projectedPoints).toBe(projectionFixture.stats.pts_ppr);
  });
});
