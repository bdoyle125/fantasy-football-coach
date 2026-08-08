import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getPlayerProjection, getProjectionsForRoster } from '../src/service-functions/getPlayerProjection';
import { getSleeperState } from '../src/service-functions/getSleeperState';
import { mswServer } from './msw/server';
import { TEST_PLAYER_ID, TEST_OPPONENT, projectionFixture } from './msw/handlers';

describe('getPlayerProjection', () => {
  it('fetches the projected stat line and upcoming opponent', async () => {
    const state = await getSleeperState();

    const projection = await getPlayerProjection(TEST_PLAYER_ID, state);

    expect(projection).toEqual({
      projectedStats: projectionFixture.stats,
      opponent: TEST_OPPONENT,
    });
  });

  it('degrades to nulls when Sleeper responds with a non-ok status', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/projections/nfl/player/:playerId', () => {
        return HttpResponse.json({ error: 'boom' }, { status: 500 });
      }),
    );
    const state = await getSleeperState();

    const projection = await getPlayerProjection(TEST_PLAYER_ID, state);

    expect(projection).toEqual({ projectedStats: null, opponent: null });
  });

  it('degrades to nulls on a network-level failure', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/projections/nfl/player/:playerId', () => {
        return HttpResponse.error();
      }),
    );
    const state = await getSleeperState();

    const projection = await getPlayerProjection(TEST_PLAYER_ID, state);

    expect(projection).toEqual({ projectedStats: null, opponent: null });
  });
});

describe('getProjectionsForRoster', () => {
  it("one player's persistent projection failure does not affect other players", async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/projections/nfl/player/:playerId', ({ params }) => {
        if (params.playerId === 'broken-player-id') {
          return HttpResponse.error();
        }
        return HttpResponse.json(projectionFixture);
      }),
    );
    const state = await getSleeperState();

    const projectionMap = await getProjectionsForRoster(['broken-player-id', TEST_PLAYER_ID], state);

    expect(projectionMap.get('broken-player-id')).toEqual({ projectedStats: null, opponent: null });
    expect(projectionMap.get(TEST_PLAYER_ID)).toEqual({
      projectedStats: projectionFixture.stats,
      opponent: TEST_OPPONENT,
    });
  });
});
