import { Player } from "../../../backend/types/Player";

export class TeamService {

    async fetchMyTeam(): Promise<Player[]> {
        const response = await fetch('/api/myteam', {
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

