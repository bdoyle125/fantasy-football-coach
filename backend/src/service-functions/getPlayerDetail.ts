import { SleeperState } from "../../types/SleeperState";
import { PlayerDetail } from "../../types/PlayerDetail";
import { getPlayerBio } from "./getPlayerBio";
import { getPlayerSeasonHistory } from "./getPlayerSeasonHistory";
import { getPlayerWeeklySeries } from "./getPlayerWeeklySeries";
import { getInjuryStatuses } from "./getInjuryStatuses";

export async function getPlayerDetail(playerId: string, state: SleeperState): Promise<PlayerDetail> {
    const [bio, history, weeklyStats, injuryStatuses] = await Promise.all([
        getPlayerBio(playerId),
        getPlayerSeasonHistory(playerId, state, 3),
        getPlayerWeeklySeries(playerId, state),
        getInjuryStatuses([playerId]),
    ]);

    // A player is a rookie in state.season (years_exp === 0) even when Sleeper's dictionary
    // lacks metadata.rookie_year. Unknown (both fields absent, including a fully degraded
    // bio fetch) means "don't filter" — an unrelated infra failure shouldn't hide real stats.
    const rookieYear = bio.rookieYear ?? (bio.yearsExp === 0 ? Number(state.season) : null);
    const filteredHistory = rookieYear === null
        ? history
        : history.filter((entry) => Number(entry.season) >= rookieYear);

    // history is ordered current-season-first, so the first entry with real stats is exactly
    // "current season if it has data, else the most recent prior season that does."
    const seasonStatsEntry = filteredHistory.find((entry) => entry.stats !== null) ?? null;

    return {
        playerId,
        name: bio.name,
        team: bio.team,
        position: bio.position,
        age: bio.age,
        injuryStatus: injuryStatuses.get(playerId) ?? null,
        season: state.season,
        week: state.week,
        seasonStats: seasonStatsEntry?.stats ?? null,
        seasonStatsSeason: seasonStatsEntry?.season ?? null,
        weeklyStats,
        history: filteredHistory,
    };
}
