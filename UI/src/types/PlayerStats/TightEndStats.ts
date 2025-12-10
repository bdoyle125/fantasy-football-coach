import { ReceiverStats } from "./ReceiverStats.js";

export class TightEndStats extends ReceiverStats {
  bonusReceivingTightEnd: number;
  bonusFirstDownsTightEnd: number;

  constructor(data: object) {
    super(data);

    this.bonusReceivingTightEnd = data["bonus_rec_te"];
    this.bonusFirstDownsTightEnd = data["bonus_fd_te"];
  }
}
