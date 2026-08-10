export type WeeklyStatsEntry = {
    week: number;
    stats: Record<string, any> | null;
};

export type SeasonHistoryEntry = {
    season: string;
    stats: Record<string, any> | null;
};

export type PlayerDetail = {
    playerId: string;
    name: string;
    team: string | null;
    position: string | null;
    age: number | null;
    injuryStatus: string | null;
    season: string;
    week: number;
    seasonStats: Record<string, any> | null;
    seasonStatsSeason: string | null;
    weeklyStats: WeeklyStatsEntry[];
    history: SeasonHistoryEntry[];
};
