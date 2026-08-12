import { SeasonStatsContext } from "../../types/SeasonStatsContext";
import { PlayerProjection } from "../../types/PlayerProjection";
import { PositionKey, TeamDefenseRanking } from "../../types/DefenseRankings";
import { TeamStrength, TeamStrengthTier } from "../../types/TeamStrength";
import { PlayerToWatch } from "../../types/PlayerToWatch";

const POSITION_KEYS: PositionKey[] = ["QB", "RB", "WR", "TE", "K", "DEF"];

function isPositionKey(position: string | null): position is PositionKey {
    return position !== null && (POSITION_KEYS as string[]).includes(position);
}

// Same favorable/tough thresholds buildCoachContext.ts's formatOpponentSlot uses for the
// Coach Frank persona, duplicated here rather than shared so this pure/no-AI helper
// doesn't need to import from the AI-prompt-building file.
function describeMatchup(rank: number): string {
    if (rank <= 10) {
        return "favorable matchup";
    }
    if (rank >= 23) {
        return "tough matchup";
    }
    return "average matchup";
}

function isUsableStats(stats: Record<string, any> | null | undefined): boolean {
    return typeof stats?.pts_ppr === "number" && typeof stats?.gp === "number";
}

export function computeTeamStrength(
    players: { id: string }[],
    statsMap: Map<string, SeasonStatsContext>,
): TeamStrength {
    const perGameValues: number[] = [];
    let usedLastSeasonFallback = false;
    for (const player of players) {
        const context = statsMap.get(player.id);
        let stats = context?.seasonStats;
        if (!isUsableStats(stats)) {
            stats = context?.lastSeasonStats;
            if (isUsableStats(stats)) {
                usedLastSeasonFallback = true;
            }
        }
        const points = stats?.pts_ppr;
        const gamesPlayed = stats?.gp;
        if (typeof points === "number" && typeof gamesPlayed === "number" && gamesPlayed > 0) {
            perGameValues.push(points / gamesPlayed);
        }
    }

    const playersCounted = perGameValues.length;
    if (playersCounted === 0) {
        return { tier: "Unknown", averagePointsPerGame: 0, playersCounted: 0, usedLastSeasonFallback: false };
    }

    const averagePointsPerGame = perGameValues.reduce((sum, v) => sum + v, 0) / playersCounted;

    let tier: TeamStrengthTier;
    if (averagePointsPerGame >= 16) {
        tier = "Elite";
    } else if (averagePointsPerGame >= 12) {
        tier = "Strong";
    } else if (averagePointsPerGame >= 8) {
        tier = "Average";
    } else if (averagePointsPerGame >= 4) {
        tier = "Below Average";
    } else {
        tier = "Weak";
    }

    return { tier, averagePointsPerGame: Math.round(averagePointsPerGame * 10) / 10, playersCounted, usedLastSeasonFallback };
}

export function computePlayerToWatch(
    players: { id: string; name: string; position: string | null }[],
    projectionMap: Map<string, PlayerProjection>,
    defenseRankings: Map<string, TeamDefenseRanking>,
    injuryMap: Map<string, string | null>,
): PlayerToWatch | null {
    let best: PlayerToWatch | null = null;

    for (const player of players) {
        if (injuryMap.get(player.id)) {
            continue;
        }
        if (!isPositionKey(player.position)) {
            continue;
        }
        const projection = projectionMap.get(player.id);
        const opponent = projection?.opponent;
        if (!opponent) {
            continue;
        }
        const ranking = defenseRankings.get(opponent);
        const rank = ranking?.rankByPosition[player.position];
        if (rank === null || rank === undefined) {
            continue;
        }
        let projectedPoints: number | null = null;
        if (typeof projection?.projectedStats?.pts_ppr === "number") {
            projectedPoints = projection.projectedStats.pts_ppr;
        }

        // Lower rank means the opponent allows MORE fantasy points to this position —
        // the easier (more favorable) matchup — see DefenseRankings.ts.
        const isBetter = !best || rank < best.defenseRank || (rank === best.defenseRank && (projectedPoints ?? 0) > (best.projectedPoints ?? 0));
        if (isBetter) {
            best = {
                playerId: player.id,
                name: player.name,
                position: player.position,
                opponent,
                defenseRank: rank,
                projectedPoints,
                reason: `${opponent} is ranked ${rank}/32 in fantasy points allowed to ${player.position} — a ${describeMatchup(rank)}.`,
            };
        }
    }

    return best;
}
