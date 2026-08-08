import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getSleeperState } from '../src/service-functions/getSleeperState';
import { mswServer } from './msw/server';
import { TEST_SEASON, TEST_WEEK, TEST_PREVIOUS_SEASON } from './msw/handlers';

describe('getSleeperState', () => {
  it('maps the Sleeper NFL state response to camelCase', async () => {
    const state = await getSleeperState();

    expect(state).toEqual({
      season: TEST_SEASON,
      week: TEST_WEEK,
      seasonType: 'regular',
      previousSeason: TEST_PREVIOUS_SEASON,
    });
  });

  it('throws when the Sleeper API responds with a non-ok status', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/state/nfl', () => {
        return HttpResponse.json({ error: 'boom' }, { status: 500 });
      }),
    );

    await expect(getSleeperState()).rejects.toThrow('Failed to fetch NFL state from Sleeper API');
  });

  it('propagates a network-level failure', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/state/nfl', () => {
        return HttpResponse.error();
      }),
    );

    await expect(getSleeperState()).rejects.toThrow();
  });
});
