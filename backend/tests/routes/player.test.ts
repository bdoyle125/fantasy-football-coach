import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { http, HttpResponse } from 'msw';
import { mswServer } from '../msw/server';
import {
  TEST_PLAYER_ID,
  TEST_SEASON,
  TEST_PREVIOUS_SEASON,
  TEST_SEASON_TWO_YEARS_AGO,
  TEST_WEEK,
  playersDictFixture,
  seasonStatsFixture,
  lastSeasonStatsFixture,
  seasonTwoYearsAgoStatsFixture,
} from '../msw/handlers';
import { createApp } from '../../src/server';

describe('GET /api/player/:playerId', () => {
  const app = createApp();

  it('returns the enriched player detail on the happy path', async () => {
    const res = await request(app).get(`/api/player/${TEST_PLAYER_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.playerData).toMatchObject({
      playerId: TEST_PLAYER_ID,
      name: playersDictFixture[TEST_PLAYER_ID].full_name,
      team: playersDictFixture[TEST_PLAYER_ID].team,
      position: playersDictFixture[TEST_PLAYER_ID].position,
      age: playersDictFixture[TEST_PLAYER_ID].age,
      injuryStatus: null,
      season: TEST_SEASON,
      week: TEST_WEEK,
      seasonStats: seasonStatsFixture,
      seasonStatsSeason: TEST_SEASON,
    });
    expect(res.body.playerData.weeklyStats).toHaveLength(TEST_WEEK);
    expect(res.body.playerData.history).toEqual([
      { season: TEST_SEASON, stats: seasonStatsFixture },
      { season: TEST_PREVIOUS_SEASON, stats: lastSeasonStatsFixture },
      { season: TEST_SEASON_TWO_YEARS_AGO, stats: seasonTwoYearsAgoStatsFixture },
    ]);
  });

  it('returns 500 when Sleeper state (season/week) cannot be fetched', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/state/nfl', () => {
        return HttpResponse.error();
      }),
    );

    const res = await request(app).get(`/api/player/${TEST_PLAYER_ID}`);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error fetching player details' });
  });

  it('still returns 200 with degraded fields when the players dictionary (bio/injury) fetch fails', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        return HttpResponse.error();
      }),
    );

    const res = await request(app).get(`/api/player/${TEST_PLAYER_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.playerData.name).toBe('Unknown');
    expect(res.body.playerData.injuryStatus).toBeNull();
    expect(res.body.playerData.seasonStats).toEqual(seasonStatsFixture);
  });

  it('still returns 200 with a degraded slot when one weekly/history stats call fails', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('season') === TEST_PREVIOUS_SEASON) {
          return HttpResponse.error();
        }
        const week = url.searchParams.get('week');
        const season = url.searchParams.get('season');
        if (week) {
          return HttpResponse.json({ pts_ppr: 1, gp: 1 });
        }
        if (season === TEST_SEASON) {
          return HttpResponse.json(seasonStatsFixture);
        }
        return HttpResponse.json(seasonTwoYearsAgoStatsFixture);
      }),
    );

    const res = await request(app).get(`/api/player/${TEST_PLAYER_ID}`);

    expect(res.status).toBe(200);
    const lastSeasonEntry = res.body.playerData.history.find((entry: { season: string }) => entry.season === TEST_PREVIOUS_SEASON);
    expect(lastSeasonEntry.stats).toBeNull();
    expect(res.body.playerData.seasonStats).toEqual(seasonStatsFixture);
  });
});
