import { SleeperState } from "../../types/SleeperState";
import { SeasonHistoryEntry } from "../../types/PlayerDetail";
import { fetchStatsSlot } from "./lib/fetchStatsSlot";
import { extractStatsBlob } from "./lib/extractStatsBlob";

const DEFAULT_SEASONS_BACK = 3;

export async function getPlayerSeasonHistory(playerId: string, state: SleeperState, seasonsBack: number = DEFAULT_SEASONS_BACK): Promise<SeasonHistoryEntry[]> {
    const currentSeason = Number(state.season);
    const seasons = Array.from({ length: seasonsBack }, (_, index) => String(currentSeason - index));

    return Promise.all(
        seasons.map(async (season, index) => {
            // The current season may still be in progress, so it uses whatever season_type
            // Sleeper reports (e.g. "regular"/"post"). Prior seasons are always complete, so
            // their canonical totals live under "regular" regardless of that current value.
            const seasonType = index === 0 ? state.seasonType : "regular";
            const url = `https://api.sleeper.app/stats/nfl/player/${playerId}?season_type=${seasonType}&season=${season}`;
            const raw = await fetchStatsSlot(url);
            const stats = extractStatsBlob(raw);
            return { season, stats };
        }),
    );
}
