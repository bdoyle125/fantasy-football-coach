import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getPlayerWeeklySeries } from '../src/service-functions/getPlayerWeeklySeries';
import { getSleeperState } from '../src/service-functions/getSleeperState';
import { mswServer } from './msw/server';
import { TEST_PLAYER_ID, TEST_WEEK, weeklyStatsFixture } from './msw/handlers';

describe('getPlayerWeeklySeries', () => {
  it('fetches weeks 1..state.week in order, and does not request state.week + 1', async () => {
    const requestedWeeks: string[] = [];
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ request }) => {
        const url = new URL(request.url);
        const week = url.searchParams.get('week');
        if (week) {
          requestedWeeks.push(week);
        }
        return HttpResponse.json(weeklyStatsFixture);
      }),
    );
    const state = await getSleeperState();

    const series = await getPlayerWeeklySeries(TEST_PLAYER_ID, state);

    expect(series.map((entry) => entry.week)).toEqual([1, 2, 3, 4, 5]);
    expect(series.every((entry) => entry.stats !== null)).toBe(true);
    expect(requestedWeeks.sort()).toEqual(['1', '2', '3', '4', '5']);
    expect(requestedWeeks).not.toContain(String(TEST_WEEK + 1));
  });

  it('degrades only the failing week to null, leaving the rest intact', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('week') === '3') {
          return HttpResponse.error();
        }
        return HttpResponse.json(weeklyStatsFixture);
      }),
    );
    const state = await getSleeperState();

    const series = await getPlayerWeeklySeries(TEST_PLAYER_ID, state);

    const weekThree = series.find((entry) => entry.week === 3);
    expect(weekThree?.stats).toBeNull();
    expect(series.filter((entry) => entry.week !== 3).every((entry) => entry.stats !== null)).toBe(true);
  });

  it('returns an empty array when state.week is 0', async () => {
    const state = await getSleeperState();

    const series = await getPlayerWeeklySeries(TEST_PLAYER_ID, { ...state, week: 0 });

    expect(series).toEqual([]);
  });
});
