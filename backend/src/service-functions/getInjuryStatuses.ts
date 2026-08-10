import { TtlCache } from "./lib/ttlCache";

// Sleeper's players dictionary is a multi-MB payload and both AI routes call this on
// every request — cache it briefly instead of re-downloading it per request.
const PLAYERS_DICT_TTL_MS = 60 * 60 * 1000;
const playersDictCache = new TtlCache<Record<string, any>>(PLAYERS_DICT_TTL_MS);

async function fetchPlayersDict(): Promise<Record<string, any>> {
    const res = await fetch(`https://api.sleeper.app/v1/players/nfl`);
    if (!res.ok) {
        throw new Error("Failed to fetch Sleeper players dictionary");
    }
    const data = await res.json();
    if (!data || typeof data !== "object") {
        throw new Error("Sleeper players dictionary response was not an object");
    }
    return data;
}

export async function getInjuryStatuses(playerIds: string[]): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();
    try {
        const playersData = await playersDictCache.getOrFetch(fetchPlayersDict);
        for (const id of playerIds) {
            result.set(id, playersData?.[id]?.injury_status ?? null);
        }
    } catch (error) {
        for (const id of playerIds) {
            result.set(id, null);
        }
    }
    return result;
}

export function clearInjuryStatusesCache(): void {
    playersDictCache.clear();
}
