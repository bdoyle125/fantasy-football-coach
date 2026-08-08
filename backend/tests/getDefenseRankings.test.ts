import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getDefenseRankingsForSeason } from '../src/service-functions/getDefenseRankings';
import { NFL_TEAM_ABBREVIATIONS } from '../src/constants/nflTeams';
import { mswServer } from './msw/server';
import { TEST_SEASON, teamDefenseStatsFixture } from './msw/handlers';

describe('getDefenseRankingsForSeason', () => {
  it('returns a ranking entry for all 32 teams using the season-to-date fixture', async () => {
    const rankings = await getDefenseRankingsForSeason(TEST_SEASON);

    expect(rankings.size).toBe(32);
    const anyTeam = rankings.get(NFL_TEAM_ABBREVIATIONS[0]);
    expect(anyTeam?.fantasyPointsAllowed.RB).toBe(teamDefenseStatsFixture.stats.fan_pts_allow_rb);
  });

  it('ranks teams by descending fantasy points allowed per position (rank 1 = allows the most, easiest matchup)', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ params }) => {
        const team = params.playerId as string;
        const value = NFL_TEAM_ABBREVIATIONS.indexOf(team);
        return HttpResponse.json({
          stats: {
            fan_pts_allow_qb: value,
            fan_pts_allow_rb: value,
            fan_pts_allow_wr: value,
            fan_pts_allow_te: value,
            fan_pts_allow_k: value,
            fan_pts_allow_def: value,
          },
        });
      }),
    );

    const rankings = await getDefenseRankingsForSeason(TEST_SEASON);

    const highestValueTeam = NFL_TEAM_ABBREVIATIONS[NFL_TEAM_ABBREVIATIONS.length - 1];
    const lowestValueTeam = NFL_TEAM_ABBREVIATIONS[0];
    expect(rankings.get(highestValueTeam)?.rankByPosition.RB).toBe(1);
    expect(rankings.get(lowestValueTeam)?.rankByPosition.RB).toBe(32);
  });

  it("a single team's persistent stats failure degrades that team to nulls without affecting the others' ranking", async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ params }) => {
        if (params.playerId === 'KC') {
          return HttpResponse.error();
        }
        return HttpResponse.json(teamDefenseStatsFixture);
      }),
    );

    const rankings = await getDefenseRankingsForSeason(TEST_SEASON);

    expect(rankings.get('KC')).toEqual({
      fantasyPointsAllowed: { QB: null, RB: null, WR: null, TE: null, K: null, DEF: null },
      rankByPosition: { QB: null, RB: null, WR: null, TE: null, K: null, DEF: null },
    });
    expect(rankings.get('ARI')?.rankByPosition.RB).not.toBeNull();
  });
});
