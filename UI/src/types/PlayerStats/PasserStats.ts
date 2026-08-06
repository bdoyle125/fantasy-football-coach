import { PlayerStats } from "./PlayerStats";

export class PasserStats extends PlayerStats {
  passAttempts: number;
  passCompletions: number;
  passYards: number;
  passTouchdowns: number;
  passInterceptions: number;
  passRating: number;
  passYardsPerAttempt: number;
  passYardsPerCompletion: number;
  passLong: number;
  passSacks: number;
  passSackYards: number;
  passRedZoneAttempts: number;
  passAirYards: number;
  completionPercentage: number;

  constructor(data: Record<string, number>) {
    super(data);

    this.passAttempts = data["pass_att"];
    this.passCompletions = data["pass_cmp"];
    this.passYards = data["pass_yd"];
    this.passTouchdowns = data["pass_td"];
    this.passInterceptions = data["pass_int"];
    this.passRating = data["pass_rtg"];
    this.passYardsPerAttempt = data["pass_ypa"];
    this.passYardsPerCompletion = data["pass_ypc"];
    this.passLong = data["pass_lng"];
    this.passSacks = data["pass_sack"];
    this.passSackYards = data["pass_sack_yds"];
    this.passRedZoneAttempts = data["pass_rz_att"];
    this.passAirYards = data["pass_air_yd"];
    this.completionPercentage = data["cmp_pct"];
  }
}
