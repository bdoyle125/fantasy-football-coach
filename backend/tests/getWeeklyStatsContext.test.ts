import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getWeeklyPlayerStats, getWeeklyStatsForRoster } from '../src/service-functions/getWeeklyStatsContext';
import { getSleeperState } from '../src/service-functions/getSleeperState';
import { mswServer } from './msw/server';
import { TEST_PLAYER_ID, weeklyStatsFixture } from './msw/handlers';

describe('getWeeklyPlayerStats', () => {
  it('fetches this week\'s stats', async () => {
    const state = await getSleeperState();

    const stats = await getWeeklyPlayerStats(TEST_PLAYER_ID, state);

    expect(stats).toEqual(weeklyStatsFixture);
  });

  it('degrades to null when Sleeper responds with a non-ok status', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', () => {
        return HttpResponse.json({ error: 'boom' }, { status: 500 });
      }),
    );
    const state = await getSleeperState();

    const stats = await getWeeklyPlayerStats(TEST_PLAYER_ID, state);

    expect(stats).toBeNull();
  });

  it('degrades to null on a network-level failure', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', () => {
        return HttpResponse.error();
      }),
    );
    const state = await getSleeperState();

    const stats = await getWeeklyPlayerStats(TEST_PLAYER_ID, state);

    expect(stats).toBeNull();
  });
});

describe('getWeeklyStatsForRoster', () => {
  it("one player's persistent failure does not affect other players", async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ params }) => {
        if (params.playerId === 'broken-player-id') {
          return HttpResponse.error();
        }
        return HttpResponse.json(weeklyStatsFixture);
      }),
    );
    const state = await getSleeperState();

    const statsMap = await getWeeklyStatsForRoster(['broken-player-id', TEST_PLAYER_ID], state);

    expect(statsMap.get('broken-player-id')).toBeNull();
    expect(statsMap.get(TEST_PLAYER_ID)).toEqual(weeklyStatsFixture);
  });
});
