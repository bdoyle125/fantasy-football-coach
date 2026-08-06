import { ReceiverStats } from "./ReceiverStats";

export class TightEndStats extends ReceiverStats {
  bonusReceivingTightEnd: number;
  bonusFirstDownsTightEnd: number;

  constructor(data: Record<string, number>) {
    super(data);

    this.bonusReceivingTightEnd = data["bonus_rec_te"];
    this.bonusFirstDownsTightEnd = data["bonus_fd_te"];
  }
}
