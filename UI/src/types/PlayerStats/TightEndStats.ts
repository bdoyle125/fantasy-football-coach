import { ReceiverStats } from "./ReceiverStats";

export class TightEndStats extends ReceiverStats {
  bonusReceivingTightEnd: number;
  bonusFirstDownsTightEnd: number;
  rushingAttempts: number;
  rushingYards: number;
  rushingTouchdowns: number;
  rushingYardsPerAttempt: number;

  constructor(data: Record<string, number>) {
    super(data);

    this.bonusReceivingTightEnd = data["bonus_rec_te"];
    this.bonusFirstDownsTightEnd = data["bonus_fd_te"];
    this.rushingAttempts = data["rush_att"];
    this.rushingYards = data["rush_yd"];
    this.rushingTouchdowns = data["rush_td"];
    this.rushingYardsPerAttempt = data["rush_ypa"];
  }
}
