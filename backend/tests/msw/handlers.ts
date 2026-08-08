import { http, HttpResponse, passthrough } from 'msw';
import { NFL_TEAM_ABBREVIATIONS } from '../../src/constants/nflTeams';

// Baseline happy-path fixtures/handlers for every Sleeper endpoint the backend calls.
// Individual test files layer failure-path overrides on top via mswServer.use(), which
// tests/setup.ts resets after each test so overrides never leak between tests.
export const TEST_OWNER_ID = 'test-owner-id';
export const TEST_LEAGUE_ID = 'test-league-id';
export const TEST_PLAYER_ID = '1234';

// Deliberately far outside any real calendar year so `/api/player/:playerId`'s and
// `/api/leagues`' own `currentYear - 1` computation can never accidentally collide
// with these and pick up a stats-context fixture meant for the new season/week flow.
export const TEST_SEASON = '9999';
export const TEST_WEEK = 5;
export const TEST_PREVIOUS_SEASON = '9998';

export const leagueUsersFixture = [
  { user_id: TEST_OWNER_ID, metadata: { team_name: 'Test Team' } },
];

export const leagueRostersFixture = [
  { owner_id: TEST_OWNER_ID, players: [TEST_PLAYER_ID] },
];

export const playersDictFixture = {
  [TEST_PLAYER_ID]: {
    full_name: 'Test Player',
    team: 'KC',
    position: 'QB',
    age: 28,
    stats: null,
    injury_status: null,
  },
};

export const playerStatsFixture = {
  pts_ppr: 12.5,
  gp: 1,
};

export const sleeperStateFixture = {
  week: TEST_WEEK,
  season: TEST_SEASON,
  season_type: 'regular',
  previous_season: TEST_PREVIOUS_SEASON,
  league_season: TEST_SEASON,
  display_week: TEST_WEEK,
};

export const weeklyStatsFixture = {
  pts_ppr: 18.2,
  gp: 1,
  week: TEST_WEEK,
};

export const seasonStatsFixture = {
  pts_ppr: 145.6,
  gp: 5,
};

export const lastSeasonStatsFixture = {
  pts_ppr: 295.68,
  gp: 14,
};

export const leaguesFixture = [
  { league_id: TEST_LEAGUE_ID, name: 'Test League' },
];

// TEST_OPPONENT must be a real Sleeper team abbreviation: getDefenseRankingsForSeason
// fetches all 32 NFL_TEAM_ABBREVIATIONS, so the projection's `opponent` needs to be one
// of them for the weekly-context flow to find a matching defense ranking.
export const TEST_OPPONENT = 'KC';

// Raw shape of GET /projections/nfl/player/:playerId — mirrors the real Sleeper response
// closely enough for getPlayerProjection's `data.stats` / `data.opponent` reads.
export const projectionFixture = {
  stats: { pts_ppr: 19.4, gp: 1 },
  opponent: TEST_OPPONENT,
};

// Raw shape of GET /stats/nfl/player/:teamAbbreviation (season-to-date, no `week`) —
// mirrors the real Sleeper response closely enough for getDefenseRankings' reads of
// data.stats.fan_pts_allow_*.
export const teamDefenseStatsFixture = {
  stats: {
    fan_pts_allow_qb: 18.2,
    fan_pts_allow_rb: 22.5,
    fan_pts_allow_wr: 30.1,
    fan_pts_allow_te: 10.4,
    fan_pts_allow_k: 8.0,
    fan_pts_allow_def: 5.5,
  },
};

export const handlers = [
  // Supertest talks to the in-process Express app over a real loopback socket;
  // let that traffic through untouched instead of treating it as an unmocked external call.
  http.all(/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?\//, () => passthrough()),
  http.get('https://api.sleeper.app/v1/league/:leagueId/users', () => {
    return HttpResponse.json(leagueUsersFixture);
  }),
  http.get('https://api.sleeper.app/v1/league/:leagueId/rosters', () => {
    return HttpResponse.json(leagueRostersFixture);
  }),
  http.get('https://api.sleeper.app/v1/players/nfl', () => {
    return HttpResponse.json(playersDictFixture);
  }),
  http.get('https://api.sleeper.app/v1/state/nfl', () => {
    return HttpResponse.json(sleeperStateFixture);
  }),
  // Branches on `week`/`season` so the weekly/season-to-date/last-season stats flow
  // gets distinct fixtures per slot, while requests that don't match the test
  // season/week constants (e.g. /api/player/:playerId's own `currentYear - 1`
  // computation) fall back to the original flat fixture unchanged. A team-abbreviation
  // playerId (used by getDefenseRankingsForSeason) short-circuits to the team-defense
  // fixture before any of that, since those calls never carry a `week` param either.
  http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ params, request }) => {
    if (NFL_TEAM_ABBREVIATIONS.includes(params.playerId as string)) {
      return HttpResponse.json(teamDefenseStatsFixture);
    }
    const url = new URL(request.url);
    const week = url.searchParams.get('week');
    const season = url.searchParams.get('season');
    if (week) {
      return HttpResponse.json(weeklyStatsFixture);
    }
    if (season === TEST_SEASON) {
      return HttpResponse.json(seasonStatsFixture);
    }
    if (season === TEST_PREVIOUS_SEASON) {
      return HttpResponse.json(lastSeasonStatsFixture);
    }
    return HttpResponse.json(playerStatsFixture);
  }),
  http.get('https://api.sleeper.app/projections/nfl/player/:playerId', () => {
    return HttpResponse.json(projectionFixture);
  }),
  http.get('https://api.sleeper.app/v1/user/:ownerId/leagues/nfl/:season', () => {
    return HttpResponse.json(leaguesFixture);
  }),
];
