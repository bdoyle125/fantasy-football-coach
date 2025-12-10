import { Player } from "@/types/Player.js";
import { PlayerStats } from "@/types/Stats.js";

export class PlayerService {

    async fetchPlayerDetails(playerId: string): Promise<Player> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/player/${playerId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch player details');
        }
        const data = await response.json();
        const playerData = data.playerData;

        const playerStats = new PlayerStats(playerData.stats);

        // Return a Player instance
        return new Player(
            playerData.player_id,
            playerData.player.first_name + ' ' + playerData.player.last_name,
            playerData.team,
            playerData.player.position,
            playerStats
        );

    }
}