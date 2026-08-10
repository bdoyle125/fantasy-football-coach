import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getPlayerSeasonHistory } from '../src/service-functions/getPlayerSeasonHistory';
import { getSleeperState } from '../src/service-functions/getSleeperState';
import { mswServer } from './msw/server';
import {
  TEST_PLAYER_ID,
  TEST_SEASON,
  TEST_PREVIOUS_SEASON,
  TEST_SEASON_TWO_YEARS_AGO,
  seasonStatsFixture,
  lastSeasonStatsFixture,
  seasonTwoYearsAgoStatsFixture,
} from './msw/handlers';

describe('getPlayerSeasonHistory', () => {
  it('fetches the current season plus 2 prior seasons by default', async () => {
    const state = await getSleeperState();

    const history = await getPlayerSeasonHistory(TEST_PLAYER_ID, state);

    expect(history).toEqual([
      { season: TEST_SEASON, stats: seasonStatsFixture },
      { season: TEST_PREVIOUS_SEASON, stats: lastSeasonStatsFixture },
      { season: TEST_SEASON_TWO_YEARS_AGO, stats: seasonTwoYearsAgoStatsFixture },
    ]);
  });

  it('respects a seasonsBack override', async () => {
    const state = await getSleeperState();

    const history = await getPlayerSeasonHistory(TEST_PLAYER_ID, state, 1);

    expect(history).toEqual([{ season: TEST_SEASON, stats: seasonStatsFixture }]);
  });

  it('requests prior seasons with season_type=regular even when the current seasonType differs', async () => {
    const seasonTypesRequested: Record<string, string | null> = {};
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ request }) => {
        const url = new URL(request.url);
        const season = url.searchParams.get('season')!;
        seasonTypesRequested[season] = url.searchParams.get('season_type');
        return HttpResponse.json(seasonStatsFixture);
      }),
    );
    const state = await getSleeperState();

    await getPlayerSeasonHistory(TEST_PLAYER_ID, { ...state, seasonType: 'post' });

    expect(seasonTypesRequested[TEST_SEASON]).toBe('post');
    expect(seasonTypesRequested[TEST_PREVIOUS_SEASON]).toBe('regular');
    expect(seasonTypesRequested[TEST_SEASON_TWO_YEARS_AGO]).toBe('regular');
  });

  it('degrades only the failing season to null, leaving the rest intact', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('season') === TEST_PREVIOUS_SEASON) {
          return HttpResponse.error();
        }
        const season = url.searchParams.get('season');
        if (season === TEST_SEASON) {
          return HttpResponse.json(seasonStatsFixture);
        }
        return HttpResponse.json(seasonTwoYearsAgoStatsFixture);
      }),
    );
    const state = await getSleeperState();

    const history = await getPlayerSeasonHistory(TEST_PLAYER_ID, state);

    expect(history.find((entry) => entry.season === TEST_PREVIOUS_SEASON)?.stats).toBeNull();
    expect(history.find((entry) => entry.season === TEST_SEASON)?.stats).toEqual(seasonStatsFixture);
    expect(history.find((entry) => entry.season === TEST_SEASON_TWO_YEARS_AGO)?.stats).toEqual(seasonTwoYearsAgoStatsFixture);
  });

  // Sleeper's real API wraps the box score under `.stats` alongside `.player`/`.team`
  // metadata once a season has real data (confirmed against the live API), unlike this
  // suite's simplified flat fixtures — verify that shape unwraps correctly too.
  it('unwraps a realistically-nested Sleeper response (box score under .stats, plus bio metadata)', async () => {
    const nestedResponse = {
      stats: { pts_ppr: 305.06, gp: 17 },
      player: { first_name: 'Jared', last_name: 'Goff' },
      team: 'DET',
      season: TEST_SEASON,
      season_type: 'regular',
    };
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', () => {
        return HttpResponse.json(nestedResponse);
      }),
    );
    const state = await getSleeperState();

    const history = await getPlayerSeasonHistory(TEST_PLAYER_ID, state, 1);

    expect(history).toEqual([{ season: TEST_SEASON, stats: { pts_ppr: 305.06, gp: 17 } }]);
  });
});
