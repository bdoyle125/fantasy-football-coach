import { SleeperState } from "../../types/SleeperState";
import { PlayerProjection } from "../../types/PlayerProjection";

export async function getPlayerProjection(playerId: string, state: SleeperState): Promise<PlayerProjection> {
    const url = `https://api.sleeper.app/projections/nfl/player/${playerId}?season_type=regular&season=${state.season}&week=${state.week}`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            return { projectedStats: null, opponent: null };
        }
        const data = await res.json();
        if (!data || typeof data !== "object") {
            return { projectedStats: null, opponent: null };
        }
        return {
            projectedStats: data.stats ?? null,
            opponent: data.opponent ?? null,
        };
    } catch (error) {
        return { projectedStats: null, opponent: null };
    }
}

export async function getProjectionsForRoster(playerIds: string[], state: SleeperState): Promise<Map<string, PlayerProjection>> {
    const entries = await Promise.all(
        playerIds.map(async (id) => {
            const projection = await getPlayerProjection(id, state);
            return [id, projection] as const;
        }),
    );
    return new Map(entries);
}
