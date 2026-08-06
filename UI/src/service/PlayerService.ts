import { Player } from "@/types/Player";
import { DefenseSpecialTeamsStats } from "@/types/PlayerStats/DefenseSpecialTeamsStats";
import { KickerStats } from "@/types/PlayerStats/KickerStats";
import { PlayerStats } from "@/types/PlayerStats/PlayerStats";
import { QuarterbackStats } from "@/types/PlayerStats/QuarterbackStats";
import { RunningBackStats } from "@/types/PlayerStats/RunningBackStats";
import { TightEndStats } from "@/types/PlayerStats/TightEndStats";
import { WideReceiverStats } from "@/types/PlayerStats/WideReceiverStats";

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

        // Assuming playerStats is part of the response
        const position = playerData.player.position;
        let playerStats: PlayerStats;
        switch (position) {
            case 'QB':
                playerStats = new QuarterbackStats(playerData.stats);
                break;
            case 'RB':
                playerStats = new RunningBackStats(playerData.stats);
                break;
            case 'WR':
                playerStats = new WideReceiverStats(playerData.stats);
                break;
            case 'TE':
                playerStats = new TightEndStats(playerData.stats);
                break;
            case 'K':
                playerStats = new KickerStats(playerData.stats);
                break;
            case 'DEF':
                playerStats = new DefenseSpecialTeamsStats(playerData.stats);
                break;
            default:
                playerStats = new PlayerStats(playerData.stats);
        }

        // Return a Player instance
        return new Player(
            playerData.player_id,
            playerData.player.first_name + ' ' + playerData.player.last_name,
            playerData.team,
            playerData.player.position,
            playerData.player.age,
            playerStats
        );

    }
}