export async function fetchStatsSlot(url: string): Promise<Record<string, any> | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            return null;
        }
        const data = await res.json();
        if (!data || typeof data !== "object") {
            return null;
        }
        return data;
    } catch (error) {
        return null;
    }
}
