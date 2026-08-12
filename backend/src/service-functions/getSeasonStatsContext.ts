import { SleeperState } from "../../types/SleeperState";
import { SeasonStatsContext } from "../../types/SeasonStatsContext";
import { fetchStatsSlot } from "./lib/fetchStatsSlot";
import { extractStatsBlob } from "./lib/extractStatsBlob";

export async function getSeasonPlayerStats(playerId: string, state: SleeperState): Promise<SeasonStatsContext> {
    const base = `https://api.sleeper.app/stats/nfl/player/${playerId}`;
    const seasonUrl = `${base}?season_type=${state.seasonType}&season=${state.season}`;
    // The previous season is always complete, so its canonical totals live under
    // "regular" regardless of the current season's season_type (e.g. "pre") — same
    // convention as getPlayerSeasonHistory.ts's prior-season fetches.
    const lastSeasonUrl = `${base}?season_type=regular&season=${state.previousSeason}`;

    const [seasonStatsRaw, lastSeasonStatsRaw] = await Promise.all([
        fetchStatsSlot(seasonUrl),
        fetchStatsSlot(lastSeasonUrl),
    ]);

    return { seasonStats: extractStatsBlob(seasonStatsRaw), lastSeasonStats: extractStatsBlob(lastSeasonStatsRaw) };
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
