import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getPlayerDetail } from '../src/service-functions/getPlayerDetail';
import { getSleeperState } from '../src/service-functions/getSleeperState';
import { mswServer } from './msw/server';
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
  weeklyStatsFixture,
} from './msw/handlers';

describe('getPlayerDetail', () => {
  it('assembles bio, injury status, current-season stats, weekly series, and history in one shape', async () => {
    const state = await getSleeperState();

    const detail = await getPlayerDetail(TEST_PLAYER_ID, state);

    expect(detail.playerId).toBe(TEST_PLAYER_ID);
    expect(detail.name).toBe(playersDictFixture[TEST_PLAYER_ID].full_name);
    expect(detail.team).toBe(playersDictFixture[TEST_PLAYER_ID].team);
    expect(detail.position).toBe(playersDictFixture[TEST_PLAYER_ID].position);
    expect(detail.age).toBe(playersDictFixture[TEST_PLAYER_ID].age);
    expect(detail.injuryStatus).toBeNull();
    expect(detail.season).toBe(TEST_SEASON);
    expect(detail.week).toBe(TEST_WEEK);
    expect(detail.seasonStats).toEqual(seasonStatsFixture);
    expect(detail.seasonStatsSeason).toBe(TEST_SEASON);
    expect(detail.weeklyStats).toHaveLength(TEST_WEEK);
    expect(detail.history).toEqual([
      { season: TEST_SEASON, stats: seasonStatsFixture },
      { season: TEST_PREVIOUS_SEASON, stats: lastSeasonStatsFixture },
      { season: TEST_SEASON_TWO_YEARS_AGO, stats: seasonTwoYearsAgoStatsFixture },
    ]);
  });

  it('derives seasonStats from history[0] without an extra Sleeper call for current-season stats', async () => {
    let currentSeasonRequestCount = 0;
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ request }) => {
        const url = new URL(request.url);
        const week = url.searchParams.get('week');
        const season = url.searchParams.get('season');
        if (week) {
          return HttpResponse.json(weeklyStatsFixture);
        }
        if (season === TEST_SEASON) {
          currentSeasonRequestCount++;
          return HttpResponse.json(seasonStatsFixture);
        }
        if (season === TEST_PREVIOUS_SEASON) {
          return HttpResponse.json(lastSeasonStatsFixture);
        }
        return HttpResponse.json(seasonTwoYearsAgoStatsFixture);
      }),
    );
    const state = await getSleeperState();

    const detail = await getPlayerDetail(TEST_PLAYER_ID, state);

    expect(detail.seasonStats).toEqual(seasonStatsFixture);
    expect(currentSeasonRequestCount).toBe(1);
  });

  it('degrades individual slots instead of throwing when Sleeper calls fail', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        return HttpResponse.error();
      }),
    );
    const state = await getSleeperState();

    const detail = await getPlayerDetail(TEST_PLAYER_ID, state);

    expect(detail.name).toBe('Unknown');
    expect(detail.injuryStatus).toBeNull();
    expect(detail.seasonStats).toEqual(seasonStatsFixture);
    // Bio failure means rookieYear can't be determined — degrade to "show every row"
    // rather than hiding a real player's real stats because of an unrelated failure.
    expect(detail.history).toHaveLength(3);
  });

  it('falls back to the most recent prior season with stats when the current season has none yet', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ request }) => {
        const url = new URL(request.url);
        const week = url.searchParams.get('week');
        const season = url.searchParams.get('season');
        if (week) {
          return HttpResponse.json(weeklyStatsFixture);
        }
        if (season === TEST_SEASON) {
          return HttpResponse.json(null);
        }
        if (season === TEST_PREVIOUS_SEASON) {
          return HttpResponse.json(lastSeasonStatsFixture);
        }
        return HttpResponse.json(seasonTwoYearsAgoStatsFixture);
      }),
    );
    const state = await getSleeperState();

    const detail = await getPlayerDetail(TEST_PLAYER_ID, state);

    expect(detail.seasonStats).toEqual(lastSeasonStatsFixture);
    expect(detail.seasonStatsSeason).toBe(TEST_PREVIOUS_SEASON);
  });

  it('seasonStats and seasonStatsSeason are both null when no season in history has stats', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ request }) => {
        const url = new URL(request.url);
        const week = url.searchParams.get('week');
        if (week) {
          return HttpResponse.json(weeklyStatsFixture);
        }
        return HttpResponse.json(null);
      }),
    );
    const state = await getSleeperState();

    const detail = await getPlayerDetail(TEST_PLAYER_ID, state);

    expect(detail.seasonStats).toBeNull();
    expect(detail.seasonStatsSeason).toBeNull();
  });

  it("omits history rows before a rookie's first season", async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        return HttpResponse.json({
          [TEST_PLAYER_ID]: { ...playersDictFixture[TEST_PLAYER_ID], years_exp: 0 },
        });
      }),
    );
    const state = await getSleeperState();

    const detail = await getPlayerDetail(TEST_PLAYER_ID, state);

    expect(detail.history).toHaveLength(1);
    expect(detail.history[0]?.season).toBe(TEST_SEASON);
  });

  it("keeps a season row for a metadata.rookie_year even if years_exp would suggest otherwise", async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        return HttpResponse.json({
          [TEST_PLAYER_ID]: { ...playersDictFixture[TEST_PLAYER_ID], years_exp: 3, metadata: { rookie_year: TEST_PREVIOUS_SEASON } },
        });
      }),
    );
    const state = await getSleeperState();

    const detail = await getPlayerDetail(TEST_PLAYER_ID, state);

    expect(detail.history.map((entry) => entry.season)).toEqual([TEST_SEASON, TEST_PREVIOUS_SEASON]);
  });
});
