import { MatchupResult } from "../types/Matchup";
import { Team } from "../types/Team";

export class MatchupService {
    async fetchMatchup(): Promise<MatchupResult> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/matchup`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch matchup data');
        }
        const data = await response.json();
        return data;
    }

    async fetchMatchupPreview(myTeam: Team, opponentTeam: Team): Promise<string> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/matchup-preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ myTeam, opponentTeam }),
        });
        if (!response.ok) {
            throw new Error('Failed to generate matchup preview');
        }
        const data = await response.json();
        return data.preview;
    }
}
