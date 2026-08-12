import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getMatchupForOwner } from '../src/service-functions/getMatchupForOwner';
import { mswServer } from './msw/server';
import { SleeperState } from '../types/SleeperState';
import {
  TEST_OWNER_ID,
  TEST_OPPONENT_OWNER_ID,
  TEST_LEAGUE_ID,
  TEST_PLAYER_ID,
  TEST_OPPONENT_PLAYER_ID,
  TEST_ROSTER_ID,
  TEST_WEEK,
  TEST_SEASON,
  TEST_PREVIOUS_SEASON,
  byeMatchupsFixture,
  emptyMatchupsFixture,
} from './msw/handlers';

const state: SleeperState = {
  season: TEST_SEASON,
  week: TEST_WEEK,
  seasonType: 'regular',
  previousSeason: TEST_PREVIOUS_SEASON,
};

// Exercises getMatchupForOwner() directly against msw-mocked Sleeper endpoints, covering
// the happy path plus every business-state (bye/unavailable) and throw/fallback branch.
describe('getMatchupForOwner', () => {
  it('resolves both rosters when an opponent shares my matchup_id', async () => {
    const result = await getMatchupForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID, state);

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') {
      throw new Error('expected status ok');
    }
    expect(result.week).toBe(TEST_WEEK);
    expect(result.myTeam.name).toBe('Test Team');
    expect(result.myTeam.players.map((p) => p.id)).toEqual([TEST_PLAYER_ID]);
    expect(result.opponentTeam.name).toBe('Opponent Team');
    expect(result.opponentTeam.players.map((p) => p.id)).toEqual([TEST_OPPONENT_PLAYER_ID]);
  });

  it('returns a bye status with only myTeam when my matchup_id is null', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/matchups/:week', () => {
        return HttpResponse.json(byeMatchupsFixture);
      }),
    );

    const result = await getMatchupForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID, state);

    expect(result.status).toBe('bye');
    if (result.status !== 'bye') {
      throw new Error('expected status bye');
    }
    expect(result.myTeam.players.map((p) => p.id)).toEqual([TEST_PLAYER_ID]);
  });

  it('returns unavailable when the matchups response is an empty array (preseason)', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/matchups/:week', () => {
        return HttpResponse.json(emptyMatchupsFixture);
      }),
    );

    const result = await getMatchupForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID, state);

    expect(result).toEqual({ status: 'unavailable', week: TEST_WEEK });
  });

  it('returns unavailable, not a throw, when the matchups response is non-OK', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/matchups/:week', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const result = await getMatchupForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID, state);

    expect(result).toEqual({ status: 'unavailable', week: TEST_WEEK });
  });

  it('returns unavailable, not a throw, when the matchups response body is malformed', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/matchups/:week', () => {
        return new HttpResponse('not valid json', {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );

    const result = await getMatchupForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID, state);

    expect(result).toEqual({ status: 'unavailable', week: TEST_WEEK });
  });

  it('returns unavailable when no other roster shares my matchup_id', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/matchups/:week', () => {
        return HttpResponse.json([{ roster_id: TEST_ROSTER_ID, matchup_id: 999, players: [TEST_PLAYER_ID] }]);
      }),
    );

    const result = await getMatchupForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID, state);

    expect(result).toEqual({ status: 'unavailable', week: TEST_WEEK });
  });

  it('throws when my own roster is missing (settings misconfiguration)', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/rosters', () => {
        return HttpResponse.json([{ roster_id: 2, owner_id: TEST_OPPONENT_OWNER_ID, players: [TEST_OPPONENT_PLAYER_ID] }]);
      }),
    );

    await expect(getMatchupForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID, state)).rejects.toThrow(
      'Roster not found for owner',
    );
  });

  it("falls back to 'Unnamed Team' when the opponent's owner is missing from the users list", async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/league/:leagueId/users', () => {
        return HttpResponse.json([{ user_id: TEST_OWNER_ID, metadata: { team_name: 'Test Team' } }]);
      }),
    );

    const result = await getMatchupForOwner(TEST_LEAGUE_ID, TEST_OWNER_ID, state);

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') {
      throw new Error('expected status ok');
    }
    expect(result.opponentTeam.name).toBe('Unnamed Team');
  });
});
