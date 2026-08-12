export type TeamStrengthTier = "Elite" | "Strong" | "Average" | "Below Average" | "Weak" | "Unknown";

export type TeamStrength = {
    tier: TeamStrengthTier;
    averagePointsPerGame: number;
    playersCounted: number;
    usedLastSeasonFallback: boolean;
};
