import { ReceiverStats } from "./ReceiverStats.js";

export class WideReceiverStats extends ReceiverStats {
  receivingBonusWideReceiver: number;
  firstDownBonusWideReceiver: number;

  constructor(data: object) {
    super(data);

    this.receivingBonusWideReceiver = data["bonus_rec_wr"];
    this.firstDownBonusWideReceiver = data["bonus_fd_wr"];
  }
}
