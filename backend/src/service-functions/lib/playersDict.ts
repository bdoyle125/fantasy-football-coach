import { TtlCache } from "./ttlCache";

// Sleeper's players dictionary is a multi-MB payload and several routes need it on
// every request — cache it briefly and share one fetch across all of them instead of
// each caller re-downloading it.
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

export async function getPlayersDict(): Promise<Record<string, any>> {
    return playersDictCache.getOrFetch(fetchPlayersDict);
}

export function clearPlayersDictCache(): void {
    playersDictCache.clear();
}
