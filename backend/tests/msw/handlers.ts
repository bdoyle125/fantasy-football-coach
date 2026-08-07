import { http, HttpResponse, passthrough } from 'msw';

// Baseline happy-path fixtures/handlers for every Sleeper endpoint the backend calls.
// Individual test files layer failure-path overrides on top via mswServer.use(), which
// tests/setup.ts resets after each test so overrides never leak between tests.
export const TEST_OWNER_ID = 'test-owner-id';
export const TEST_LEAGUE_ID = 'test-league-id';
export const TEST_PLAYER_ID = '1234';

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
  },
};

export const playerStatsFixture = {
  pts_ppr: 12.5,
  gp: 1,
};

export const leaguesFixture = [
  { league_id: TEST_LEAGUE_ID, name: 'Test League' },
];

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
  http.get('https://api.sleeper.app/stats/nfl/player/:playerId', () => {
    return HttpResponse.json(playerStatsFixture);
  }),
  http.get('https://api.sleeper.app/v1/user/:ownerId/leagues/nfl/:season', () => {
    return HttpResponse.json(leaguesFixture);
  }),
];
