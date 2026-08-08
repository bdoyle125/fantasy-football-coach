// Single-entry in-memory cache: serves a fresh value for `ttlMs`, dedupes concurrent
// refetches into one in-flight request, and falls back to the last-known value if a
// refetch fails (instead of surfacing the failure when a perfectly usable value is
// already on hand).
export class TtlCache<T> {
    private cached: { value: T; expiresAt: number } | null = null;
    private inFlight: Promise<T> | null = null;

    constructor(private readonly ttlMs: number) {}

    async getOrFetch(fetcher: () => Promise<T>): Promise<T> {
        if (this.cached && this.cached.expiresAt > Date.now()) {
            return this.cached.value;
        }
        if (this.inFlight) {
            return this.inFlight;
        }

        this.inFlight = fetcher()
            .then((value) => {
                this.cached = { value, expiresAt: Date.now() + this.ttlMs };
                return value;
            })
            .catch((error) => {
                if (this.cached) {
                    return this.cached.value;
                }
                throw error;
            })
            .finally(() => {
                this.inFlight = null;
            });

        return this.inFlight;
    }

    clear(): void {
        this.cached = null;
        this.inFlight = null;
    }
}
