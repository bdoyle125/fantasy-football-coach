export type PositionKey = "QB" | "RB" | "WR" | "TE" | "K" | "DEF";

// rankByPosition[position] === 1 means that team allows the MOST fantasy points to that
// position league-wide (the easiest matchup); 32 means the fewest (the toughest matchup).
export type TeamDefenseRanking = {
    fantasyPointsAllowed: Record<PositionKey, number | null>;
    rankByPosition: Record<PositionKey, number | null>;
};
