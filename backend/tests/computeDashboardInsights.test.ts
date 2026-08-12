import { describe, it, expect } from 'vitest';
import { computeTeamStrength } from '../src/service-functions/computeDashboardInsights';
import { SeasonStatsContext } from '../types/SeasonStatsContext';

// Pure/no-AI logic, so exercised directly against hand-built Maps rather than through
// MSW+HTTP — see backend/tests/routes/dashboard-insights.test.ts for the route-level
// happy-path/error coverage.
describe('computeTeamStrength', () => {
  it('uses seasonStats directly when it is usable, without falling back', () => {
    const statsMap = new Map<string, SeasonStatsContext>([
      ['1', { seasonStats: { pts_ppr: 100, gp: 5 }, lastSeasonStats: { pts_ppr: 999, gp: 17 } }],
    ]);

    const result = computeTeamStrength([{ id: '1' }], statsMap);

    expect(result.usedLastSeasonFallback).toBe(false);
    expect(result.averagePointsPerGame).toBe(20);
    expect(result.playersCounted).toBe(1);
  });

  it('falls back to lastSeasonStats when seasonStats has no usable data yet', () => {
    const statsMap = new Map<string, SeasonStatsContext>([
      ['1', { seasonStats: null, lastSeasonStats: { pts_ppr: 170, gp: 17 } }],
    ]);

    const result = computeTeamStrength([{ id: '1' }], statsMap);

    expect(result.usedLastSeasonFallback).toBe(true);
    expect(result.averagePointsPerGame).toBe(10);
    expect(result.playersCounted).toBe(1);
  });

  it('flags the fallback even when only one player in a mixed roster needed it', () => {
    const statsMap = new Map<string, SeasonStatsContext>([
      ['1', { seasonStats: { pts_ppr: 80, gp: 4 }, lastSeasonStats: null }],
      ['2', { seasonStats: null, lastSeasonStats: { pts_ppr: 68, gp: 17 } }],
    ]);

    const result = computeTeamStrength([{ id: '1' }, { id: '2' }], statsMap);

    expect(result.usedLastSeasonFallback).toBe(true);
    expect(result.playersCounted).toBe(2);
  });

  it('returns an Unknown tier with no fallback flag when neither season has usable data', () => {
    const statsMap = new Map<string, SeasonStatsContext>([
      ['1', { seasonStats: null, lastSeasonStats: null }],
    ]);

    const result = computeTeamStrength([{ id: '1' }], statsMap);

    expect(result).toEqual({ tier: 'Unknown', averagePointsPerGame: 0, playersCounted: 0, usedLastSeasonFallback: false });
  });
});
