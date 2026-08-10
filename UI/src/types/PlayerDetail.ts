import { Player } from "./Player";
import { PlayerStats } from "./PlayerStats/PlayerStats";

export type WeeklyStatEntry = {
    week: number;
    stats: PlayerStats | null;
};

export type SeasonHistoryEntry = {
    season: string;
    stats: PlayerStats | null;
};

export class PlayerDetail {
    player: Player;
    injuryStatus: string | null;
    season: string;
    week: number;
    seasonStatsSeason: string | null;
    weeklyStats: WeeklyStatEntry[];
    history: SeasonHistoryEntry[];

    constructor(
        player: Player,
        injuryStatus: string | null,
        season: string,
        week: number,
        seasonStatsSeason: string | null,
        weeklyStats: WeeklyStatEntry[],
        history: SeasonHistoryEntry[],
    ) {
        this.player = player;
        this.injuryStatus = injuryStatus;
        this.season = season;
        this.week = week;
        this.seasonStatsSeason = seasonStatsSeason;
        this.weeklyStats = weeklyStats;
        this.history = history;
    }
}
