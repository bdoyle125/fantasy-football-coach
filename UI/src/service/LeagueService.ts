import { League, ActiveLeagueSettings, SleeperLeagueSummary } from "../types/League";

export class LeagueService {
    async fetchSleeperLeaguesForOwner(ownerId: string): Promise<SleeperLeagueSummary[]> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/leagues?ownerId=${encodeURIComponent(ownerId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch Sleeper leagues');
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
            throw new Error('Failed to fetch leagues');
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
            throw new Error('Failed to add league');
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
            throw new Error('Failed to activate league');
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
            throw new Error('Failed to remove league');
        }
    }
}
