import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getSeasonPlayerStats, getSeasonStatsForRoster } from '../src/service-functions/getSeasonStatsContext';
import { getSleeperState } from '../src/service-functions/getSleeperState';
import { mswServer } from './msw/server';
import {
  TEST_PLAYER_ID,
  TEST_SEASON,
  TEST_PREVIOUS_SEASON,
  seasonStatsFixture,
  lastSeasonStatsFixture,
} from './msw/handlers';

function defaultStatsResolver(request: Request) {
  const url = new URL(request.url);
  const season = url.searchParams.get('season');
  if (season === TEST_SEASON) {
    return HttpResponse.json(seasonStatsFixture);
  }
  if (season === TEST_PREVIOUS_SEASON) {
    return HttpResponse.json(lastSeasonStatsFixture);
  }
  return HttpResponse.json(null);
}

describe('getSeasonPlayerStats', () => {
  it('fetches season-to-date and last-season stats in parallel', async () => {
    const state = await getSleeperState();

    const context = await getSeasonPlayerStats(TEST_PLAYER_ID, state);

    expect(context).toEqual({
      seasonStats: seasonStatsFixture,
      lastSeasonStats: lastSeasonStatsFixture,
    });
  });

  it('degrades a slot to null on a non-ok status, without affecting the other slot', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('season') === TEST_SEASON) {
          return HttpResponse.json({ error: 'boom' }, { status: 500 });
        }
        return defaultStatsResolver(request);
      }),
    );
    const state = await getSleeperState();

    const context = await getSeasonPlayerStats(TEST_PLAYER_ID, state);

    expect(context.seasonStats).toBeNull();
    expect(context.lastSeasonStats).toEqual(lastSeasonStatsFixture);
  });
});

describe('getSeasonStatsForRoster', () => {
  it("one player's persistent stats failure does not affect other players' contexts", async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ params, request }) => {
        if (params.playerId === 'broken-player-id') {
          return HttpResponse.error();
        }
        return defaultStatsResolver(request);
      }),
    );
    const state = await getSleeperState();

    const statsMap = await getSeasonStatsForRoster(['broken-player-id', TEST_PLAYER_ID], state);

    expect(statsMap.get('broken-player-id')).toEqual({ seasonStats: null, lastSeasonStats: null });
    expect(statsMap.get(TEST_PLAYER_ID)).toEqual({
      seasonStats: seasonStatsFixture,
      lastSeasonStats: lastSeasonStatsFixture,
    });
  });
});
