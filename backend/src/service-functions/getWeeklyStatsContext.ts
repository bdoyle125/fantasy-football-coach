import { SleeperState } from "../../types/SleeperState";
import { fetchStatsSlot } from "./lib/fetchStatsSlot";
import { extractStatsBlob } from "./lib/extractStatsBlob";

export async function getWeeklyPlayerStats(playerId: string, state: SleeperState): Promise<Record<string, any> | null> {
    const url = `https://api.sleeper.app/stats/nfl/player/${playerId}?season_type=${state.seasonType}&season=${state.season}&week=${state.week}`;
    const raw = await fetchStatsSlot(url);
    return extractStatsBlob(raw);
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
