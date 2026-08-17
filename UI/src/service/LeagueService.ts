import { League, ActiveLeagueSettings, SleeperLeagueSummary } from "../types/League";
import { extractApiErrorMessage } from "../utils/apiError";

export class LeagueService {
    async fetchActiveLeagueSettings(): Promise<ActiveLeagueSettings | null> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/settings`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error(await extractApiErrorMessage(response, 'Failed to fetch active league settings'));
        }
        const data = await response.json();
        return data;
    }

    async fetchSleeperLeaguesForOwner(ownerId: string): Promise<SleeperLeagueSummary[]> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/leagues?ownerId=${encodeURIComponent(ownerId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(await extractApiErrorMessage(response, 'Failed to fetch Sleeper leagues'));
        }
        const data = await response.json();
        return data.leagues;
    }

    async fetchMyLeagues(): Promise<League[]> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/leagues/mine`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(await extractApiErrorMessage(response, 'Failed to fetch leagues'));
        }
        const data = await response.json();
        return data.leagues;
    }

    async addLeague(input: {
        provider: 'sleeper' | 'espn';
        providerLeagueId: string;
        providerOwnerId: string;
        leagueName?: string;
    }): Promise<ActiveLeagueSettings> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input),
        });
        if (!response.ok) {
            throw new Error(await extractApiErrorMessage(response, 'Failed to add league'));
        }
        const data = await response.json();
        return data;
    }

    async activateLeague(leagueId: string): Promise<ActiveLeagueSettings> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/leagues/active`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ leagueId }),
        });
        if (!response.ok) {
            throw new Error(await extractApiErrorMessage(response, 'Failed to activate league'));
        }
        const data = await response.json();
        return data;
    }

    async removeLeague(leagueId: string): Promise<void> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/leagues/${encodeURIComponent(leagueId)}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(await extractApiErrorMessage(response, 'Failed to remove league'));
        }
    }
}
