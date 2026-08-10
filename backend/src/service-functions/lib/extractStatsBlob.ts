// Sleeper's per-player stats endpoint (`stats/nfl/player/:playerId`) wraps the actual
// box score under a `.stats` sub-field alongside bio/metadata (`.player`, `.team`, etc.)
// once a game has real data. Unwrap it when present; fall back to the raw object
// otherwise so this also works against simpler/flat mocked payloads.
export function extractStatsBlob(raw: Record<string, any> | null): Record<string, any> | null {
    if (!raw) {
        return null;
    }
    if (raw.stats && typeof raw.stats === "object") {
        return raw.stats;
    }
    return raw;
}
