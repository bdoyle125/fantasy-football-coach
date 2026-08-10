import { SleeperState } from "../../types/SleeperState";
import { WeeklyStatsEntry } from "../../types/PlayerDetail";
import { fetchStatsSlot } from "./lib/fetchStatsSlot";
import { extractStatsBlob } from "./lib/extractStatsBlob";

async function fetchWeekStats(playerId: string, state: SleeperState, week: number): Promise<Record<string, any> | null> {
    const url = `https://api.sleeper.app/stats/nfl/player/${playerId}?season_type=${state.seasonType}&season=${state.season}&week=${week}`;
    const raw = await fetchStatsSlot(url);
    return extractStatsBlob(raw);
}

export async function getPlayerWeeklySeries(playerId: string, state: SleeperState): Promise<WeeklyStatsEntry[]> {
    if (state.week <= 0) {
        return [];
    }

    const weeks = Array.from({ length: state.week }, (_, index) => index + 1);
    return Promise.all(
        weeks.map(async (week) => {
            const stats = await fetchWeekStats(playerId, state, week);
            return { week, stats };
        }),
    );
}
