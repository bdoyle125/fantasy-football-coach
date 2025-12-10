import { PlayerStats } from "@/types/Stats.js";

export class PlayerService {

    async fetchPlayerStats(playerId: string): Promise<PlayerStats> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/stats/${playerId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch player stats');
        }
        const data = await response.json();
        return data.stats;
    }
}