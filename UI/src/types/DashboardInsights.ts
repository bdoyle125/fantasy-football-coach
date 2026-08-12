import { TeamStrength } from "./TeamStrength";
import { PlayerToWatch } from "./PlayerToWatch";

export type DashboardInsights = {
    teamStrength: TeamStrength;
    playerToWatch: PlayerToWatch | null;
};
