import { SleeperState } from "../../types/SleeperState";
import { fetchStatsSlot } from "./lib/fetchStatsSlot";

export async function getWeeklyPlayerStats(playerId: string, state: SleeperState): Promise<Record<string, any> | null> {
    const url = `https://api.sleeper.app/stats/nfl/player/${playerId}?season_type=regular&season=${state.season}&week=${state.week}`;
    return fetchStatsSlot(url);
}

export async function getWeeklyStatsForRoster(playerIds: string[], state: SleeperState): Promise<Map<string, Record<string, any> | null>> {
    const entries = await Promise.all(
        playerIds.map(async (id) => {
            const stats = await getWeeklyPlayerStats(id, state);
            return [id, stats] as const;
        }),
    );
    return new Map(entries);
}
