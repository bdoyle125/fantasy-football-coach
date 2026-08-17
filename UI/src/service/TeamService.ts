import { Team } from "@/types/Team";
import { Player } from "../../../backend/types/Player";
import { DashboardInsights } from "@/types/DashboardInsights";

export class TeamService {
    async fetchMyTeam(): Promise<Team> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/myteam`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch team data');
        }
        const data = await response.json();
        return data;
    }

    async analyzeTeam(players: Player[]): Promise<string> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/analyze-team`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ players }),
        });
        if (!response.ok) {
            throw new Error('Failed to analyze team');
        }
        const data = await response.json();
        return data.analysis;
    }

    async startOrBench(player: Player, roster: Player[]): Promise<string> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/start-or-bench`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ player, roster }),
        });
        if (!response.ok) {
            throw new Error('Failed to get start/bench recommendation');
        }
        const data = await response.json();
        return data.recommendation;
    }

    async fetchSeasonSummary(players: Player[]): Promise<string> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/season-summary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ players }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch season summary');
        }
        const data = await response.json();
        return data.summary;
    }

    async fetchDashboardInsights(players: Player[]): Promise<DashboardInsights> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/dashboard-insights`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ players }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard insights');
        }
        const data = await response.json();
        return data;
    }
}

