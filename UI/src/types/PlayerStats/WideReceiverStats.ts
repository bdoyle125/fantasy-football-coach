import { ReceiverStats } from "./ReceiverStats";

export class WideReceiverStats extends ReceiverStats {
  receivingBonusWideReceiver: number;
  firstDownBonusWideReceiver: number;
  rushingAttempts: number;
  rushingYards: number;
  rushingTouchdowns: number;
  rushingYardsPerAttempt: number;

  constructor(data: Record<string, number>) {
    super(data);

    this.receivingBonusWideReceiver = data["bonus_rec_wr"];
    this.firstDownBonusWideReceiver = data["bonus_fd_wr"];
    this.rushingAttempts = data["rush_att"];
    this.rushingYards = data["rush_yd"];
    this.rushingTouchdowns = data["rush_td"];
    this.rushingYardsPerAttempt = data["rush_ypa"];
  }
}
