import { PlayerStats } from "./PlayerStats.js";

export class KickerStats extends PlayerStats {
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalsMissed: number;
  extraPointsMade: number;
  extraPointsMissed: number;
  fieldGoalYards: number;
  fieldGoalPercentage: number;
  kickPoints: number;

  constructor(data: object) {
    super(data);

    this.fieldGoalsMade = data["fgm"];
    this.fieldGoalsAttempted = data["fga"];
    this.fieldGoalsMissed = data["fgmiss"];
    this.extraPointsMade = data["xpm"];
    this.extraPointsMissed = data["xpmiss"];
    this.fieldGoalYards = data["fgm_yds"];
    this.fieldGoalPercentage = data["fgm_pct"];
    this.kickPoints = data["kick_pts"];
  }
}
