import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { attachProjectedPoints } from '../src/service-functions/attachProjectedPoints';
import { Player } from '../types/Player';
import { mswServer } from './msw/server';
import { TEST_PLAYER_ID, TEST_SEASON, TEST_WEEK, TEST_PREVIOUS_SEASON, projectionFixture } from './msw/handlers';

const state = { season: TEST_SEASON, week: TEST_WEEK, seasonType: 'regular', previousSeason: TEST_PREVIOUS_SEASON };

describe('attachProjectedPoints', () => {
  it("sets each player's projectedPoints from their weekly projection", async () => {
    const players = [new Player(TEST_PLAYER_ID, 'Test Player', 'KC', 'QB', 28, null)];

    await attachProjectedPoints(players, state);

    expect(players[0].projectedPoints).toBe(projectionFixture.stats.pts_ppr);
  });

  it('defaults to null when no projection is available for a player', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/projections/nfl/player/:playerId', () => {
        return HttpResponse.json(null);
      }),
    );
    const players = [new Player(TEST_PLAYER_ID, 'Test Player', 'KC', 'QB', 28, null)];

    await attachProjectedPoints(players, state);

    expect(players[0].projectedPoints).toBeNull();
  });

  it('handles multiple players independently', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/projections/nfl/player/:playerId', ({ params }) => {
        if (params.playerId === 'no-projection-id') {
          return HttpResponse.json(null);
        }
        return HttpResponse.json(projectionFixture);
      }),
    );
    const players = [
      new Player(TEST_PLAYER_ID, 'Test Player', 'KC', 'QB', 28, null),
      new Player('no-projection-id', 'Other Player', 'BUF', 'RB', 24, null),
    ];

    await attachProjectedPoints(players, state);

    expect(players[0].projectedPoints).toBe(projectionFixture.stats.pts_ppr);
    expect(players[1].projectedPoints).toBeNull();
  });
});
