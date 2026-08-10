import { PasserStats } from "./PasserStats";

export class QuarterbackStats extends PasserStats {
  rushingLongestTouchdown: number;
  rushingYardsFromReceiving: number;
  bonusFirstDownQuarterback: number;
  bonusPassCompletions25Plus: number;
  rushingAttempts: number;
  rushingYards: number;
  rushingTouchdowns: number;
  rushingYardsPerAttempt: number;

  constructor(data: Record<string, number>) {
    super(data);

    this.rushingLongestTouchdown = data["rush_td_lng"];
    this.rushingYardsFromReceiving = data["rush_rec_yd"];
    this.bonusFirstDownQuarterback = data["bonus_fd_qb"];
    this.bonusPassCompletions25Plus = data["bonus_pass_cmp_25"];
    this.rushingAttempts = data["rush_att"];
    this.rushingYards = data["rush_yd"];
    this.rushingTouchdowns = data["rush_td"];
    this.rushingYardsPerAttempt = data["rush_ypa"];
  }
}
