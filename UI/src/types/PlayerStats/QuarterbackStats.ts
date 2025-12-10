import { PasserStats } from "./PasserStats.js";

export class QuarterbackStats extends PasserStats {
  rushingLongestTouchdown: number;
  rushingYardsFromReceiving: number;
  bonusFirstDownQuarterback: number;
  bonusPassCompletions25Plus: number;

  constructor(data: object) {
    super(data);

    this.rushingLongestTouchdown = data["rush_td_lng"];
    this.rushingYardsFromReceiving = data["rush_rec_yd"];
    this.bonusFirstDownQuarterback = data["bonus_fd_qb"];
    this.bonusPassCompletions25Plus = data["bonus_pass_cmp_25"];
  }
}
