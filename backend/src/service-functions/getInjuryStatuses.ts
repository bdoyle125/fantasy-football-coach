export async function getInjuryStatuses(playerIds: string[]): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();
    try {
        const res = await fetch(`https://api.sleeper.app/v1/players/nfl`);
        if (!res.ok) {
            for (const id of playerIds) {
                result.set(id, null);
            }
            return result;
        }
        const playersData = await res.json();
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
