export class PlayerStats {
  gamesPlayed: number;
  gamesActive: number;
  positionRankStandard: number;
  positionRankHalfPpr: number;
  positionRankPpr: number;
  rankStandard: number;
  rankHalfPpr: number;
  rankPpr: number;
  pointsStandard: number;
  pointsHalfPpr: number;
  pointsPpr: number;
  teamDefensiveSnaps: number;
  teamOffensiveSnaps: number;
  teamSpecialTeamsSnaps: number;
  offensiveSnaps: number;
  specialTeamsSnaps: number;
  penalties: number;
  penaltyYards: number;

  constructor(data: Record<string, number>) {
    this.gamesPlayed = data["gp"];
    this.gamesActive = data["gms_active"];
    this.positionRankStandard = data["pos_rank_std"];
    this.positionRankHalfPpr = data["pos_rank_half_ppr"];
    this.positionRankPpr = data["pos_rank_ppr"];
    this.rankStandard = data["rank_std"];
    this.rankHalfPpr = data["rank_half_ppr"];
    this.rankPpr = data["rank_ppr"];
    this.pointsStandard = data["pts_std"];
    this.pointsHalfPpr = data["pts_half_ppr"];
    this.pointsPpr = data["pts_ppr"];
    this.teamDefensiveSnaps = data["tm_def_snp"];
    this.teamOffensiveSnaps = data["tm_off_snp"];
    this.teamSpecialTeamsSnaps = data["tm_st_snp"];
    this.offensiveSnaps = data["off_snp"];
    this.specialTeamsSnaps = data["st_snp"];
    this.penalties = data["penalty"];
    this.penaltyYards = data["penalty_yd"];
  }
}
