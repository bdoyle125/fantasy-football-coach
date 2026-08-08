import { SleeperState } from "../../types/SleeperState";
import { SeasonStatsContext } from "../../types/SeasonStatsContext";
import { fetchStatsSlot } from "./lib/fetchStatsSlot";

export async function getSeasonPlayerStats(playerId: string, state: SleeperState): Promise<SeasonStatsContext> {
    const base = `https://api.sleeper.app/stats/nfl/player/${playerId}`;
    const seasonUrl = `${base}?season_type=regular&season=${state.season}`;
    const lastSeasonUrl = `${base}?season_type=regular&season=${state.previousSeason}`;

    const [seasonStats, lastSeasonStats] = await Promise.all([
        fetchStatsSlot(seasonUrl),
        fetchStatsSlot(lastSeasonUrl),
    ]);

    return { seasonStats, lastSeasonStats };
}

export async function getSeasonStatsForRoster(playerIds: string[], state: SleeperState): Promise<Map<string, SeasonStatsContext>> {
    const entries = await Promise.all(
        playerIds.map(async (id) => {
            const context = await getSeasonPlayerStats(id, state);
            return [id, context] as const;
        }),
    );
    return new Map(entries);
}
