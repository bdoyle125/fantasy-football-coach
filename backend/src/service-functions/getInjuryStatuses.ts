import { getPlayersDict, clearPlayersDictCache } from "./lib/playersDict";

export async function getInjuryStatuses(playerIds: string[]): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();
    try {
        const playersData = await getPlayersDict();
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
    clearPlayersDictCache();
}
