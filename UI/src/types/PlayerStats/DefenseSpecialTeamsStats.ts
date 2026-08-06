import { PlayerStats } from "./PlayerStats";

export class DefenseSpecialTeamsStats extends PlayerStats {
  sacks: number;
  sackYards: number;
  interceptions: number;
  forcedFumbles: number;
  fumbleRecoveries: number;
  touchdowns: number;
  tackles: number;
  soloTackles: number;
  assistedTackles: number;
  qbHits: number;
  pointsAllowed: number;
  yardsAllowed: number;

  constructor(data: Record<string, any>) {
    super(data);

    this.sacks = data["sack"];
    this.sackYards = data["sack_yd"];
    this.interceptions = data["int"];
    this.forcedFumbles = data["ff"];
    this.fumbleRecoveries = data["fum_rec"];
    this.touchdowns = data["td"];
    this.tackles = data["tkl"];
    this.soloTackles = data["tkl_solo"];
    this.assistedTackles = data["tkl_ast"];
    this.qbHits = data["qb_hit"];
    this.pointsAllowed = data["pts_allow"];
    this.yardsAllowed = data["yds_allow"];
  }
}
