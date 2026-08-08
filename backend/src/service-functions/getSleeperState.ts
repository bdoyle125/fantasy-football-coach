import { SleeperState } from "../../types/SleeperState";

export async function getSleeperState(): Promise<SleeperState> {
    const res = await fetch(`https://api.sleeper.app/v1/state/nfl`);
    if (!res.ok) {
        throw new Error("Failed to fetch NFL state from Sleeper API");
    }
    const data = await res.json();
    return {
        season: data.season,
        week: data.week,
        seasonType: data.season_type,
        previousSeason: data.previous_season,
    };
}
