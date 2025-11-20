import { Player } from "../../../backend/types/Player.js";

export class TeamService {
 
    async fetchMyTeam(): Promise<Player[]> {
        const api = import.meta.env.VITE_API_URL || '';
        console.log('Using API URL:', api);
        const response = await fetch(`${api}/api/myteam`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch team data');
        }
        const data = await response.json();
        return data.players;
    }
}

