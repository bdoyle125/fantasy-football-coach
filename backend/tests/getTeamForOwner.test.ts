import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getTeamForOwner } from '../src/service-functions/getTeamForOwner';
import { mswServer } from './msw/server';
import {
  TEST_OWNER_ID,
  TEST_LEAGUE_ID,
  TEST_PLAYER_ID,
  leagueUsersFixture,
  leagueRostersFixture,
} from './msw/handlers';

// Exercises getTeamForOwner() directly (not through an HTTP route) against msw-mocked
// Sleeper endpoints, covering the happy path plus every throw/fallback branch in the
// function's three sequential fetch calls: league users, rosters, and the players dict.
describe('getTeamForOwner', () => {
  it('assembles a Team from the league users, rosters, and players endpoints', async () => {
    const team = await getTeamForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID);

    expect(team.id).toBe(TEST_OWNER_ID);
    expect(team.name).toBe('Test Team');
    expect(team.leagueId).toBe(TEST_LEAGUE_ID);
    expect(team.ownerId).toBe(TEST_OWNER_ID);
    expect(team.players).toHaveLength(1);
    expect(team.players[0]).toMatchObject({
      id: TEST_PLAYER_ID,
      name: 'Test Player',
      team: 'KC',
      position: 'QB',
      age: 28,
    });
  });

  // Per-test mswServer.use() overrides layer on top of the baseline handlers for just
  // this test, then reset automatically after (see tests/setup.ts's afterEach).
  it('throws when the league users response is not an array', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/users', () => {
        return HttpResponse.json({ not: 'an array' });
      }),
    );

    await expect(getTeamForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID)).rejects.toThrow(
      'Invalid league users data',
    );
  });

  it('throws when the rosters response is not an array', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/rosters', () => {
        return HttpResponse.json({ not: 'an array' });
      }),
    );

    await expect(getTeamForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID)).rejects.toThrow(
      'Invalid rosters data',
    );
  });

  it('throws when the owner is not found among the league users', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/users', () => {
        return HttpResponse.json([{ user_id: 'someone-else', metadata: {} }]);
      }),
    );

    await expect(getTeamForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID)).rejects.toThrow(
      'User not found in league',
    );
  });

  it('throws when the owner has no roster', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/rosters', () => {
        return HttpResponse.json([{ owner_id: 'someone-else', players: [] }]);
      }),
    );

    await expect(getTeamForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID)).rejects.toThrow(
      'Roster not found for owner',
    );
  });

  // Documents existing, intentional-looking behavior: an unrecognized player ID doesn't
  // throw, it just maps to a Player with placeholder fields.
  it('falls back to Unknown/null fields for a roster player missing from the players dictionary', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/users', () => {
        return HttpResponse.json(leagueUsersFixture);
      }),
      http.get('https://api.sleeper.app/v1/league/:leagueId/rosters', () => {
        return HttpResponse.json([{ owner_id: TEST_OWNER_ID, players: ['unknown-player-id'] }]);
      }),
    );

    const team = await getTeamForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID);

    expect(team.players).toHaveLength(1);
    expect(team.players[0]).toMatchObject({
      id: 'unknown-player-id',
      name: 'Unknown',
      team: null,
      position: null,
      age: null,
      stats: null,
    });
  });

  // getTeamForOwner has no try/catch of its own around any fetch call, so a rejected
  // fetch (simulated here via msw's HttpResponse.error()) should just propagate up.
  it('propagates a network-level failure from one of the Sleeper endpoints', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        return HttpResponse.error();
      }),
    );

    await expect(getTeamForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID)).rejects.toThrow();
  });

  // Same as above, but the failure comes from `.json()` throwing a SyntaxError on an
  // invalid body rather than the fetch itself rejecting.
  it('propagates a malformed JSON body from one of the Sleeper endpoints', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/rosters', () => {
        return new HttpResponse('not valid json', {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );

    await expect(getTeamForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID)).rejects.toThrow();
  });
});
