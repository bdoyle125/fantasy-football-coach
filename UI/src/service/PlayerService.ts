import { Player } from "@/types/Player";
import { PlayerDetail, WeeklyStatEntry, SeasonHistoryEntry } from "@/types/PlayerDetail";
import { DefenseSpecialTeamsStats } from "@/types/PlayerStats/DefenseSpecialTeamsStats";
import { KickerStats } from "@/types/PlayerStats/KickerStats";
import { PlayerStats } from "@/types/PlayerStats/PlayerStats";
import { QuarterbackStats } from "@/types/PlayerStats/QuarterbackStats";
import { RunningBackStats } from "@/types/PlayerStats/RunningBackStats";
import { TightEndStats } from "@/types/PlayerStats/TightEndStats";
import { WideReceiverStats } from "@/types/PlayerStats/WideReceiverStats";
import { extractApiErrorMessage } from "@/utils/apiError";

export class PlayerService {

    private statsFactory(position: string | null): (raw: Record<string, number> | null) => PlayerStats | null {
        return (raw) => {
            if (!raw) {
                return null;
            }
            switch (position) {
                case 'QB':
                    return new QuarterbackStats(raw);
                case 'RB':
                    return new RunningBackStats(raw);
                case 'WR':
                    return new WideReceiverStats(raw);
                case 'TE':
                    return new TightEndStats(raw);
                case 'K':
                    return new KickerStats(raw);
                case 'DEF':
                    return new DefenseSpecialTeamsStats(raw);
                default:
                    return new PlayerStats(raw);
            }
        };
    }

    async fetchPlayerDetails(playerId: string): Promise<PlayerDetail> {
        const api = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${api}api/player/${playerId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(await extractApiErrorMessage(response, 'Failed to fetch player details'));
        }
        const data = await response.json();
        const playerData = data.playerData;
        const buildStats = this.statsFactory(playerData.position);

        const player = new Player(
            playerData.playerId,
            playerData.name,
            playerData.team,
            playerData.position,
            playerData.age,
            buildStats(playerData.seasonStats) ?? new PlayerStats({}),
        );

        const weeklyStats: WeeklyStatEntry[] = playerData.weeklyStats.map((entry: { week: number; stats: Record<string, number> | null }) => ({
            week: entry.week,
            stats: buildStats(entry.stats),
        }));

        const history: SeasonHistoryEntry[] = playerData.history.map((entry: { season: string; stats: Record<string, number> | null }) => ({
            season: entry.season,
            stats: buildStats(entry.stats),
        }));

        return new PlayerDetail(
            player,
            playerData.injuryStatus,
            playerData.season,
            playerData.week,
            playerData.seasonStatsSeason,
            weeklyStats,
            history,
        );
    }
}
