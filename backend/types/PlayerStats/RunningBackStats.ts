import { RusherStats } from "./RusherStats.js";

export class RunningBackStats extends RusherStats {
  receivingBonusRunningBack: number;
  firstDownBonusRunningBack: number;

  constructor(data: Record<string, any>) {
    super(data);

    this.receivingBonusRunningBack = data["bonus_rec_rb"];
    this.firstDownBonusRunningBack = data["bonus_fd_rb"];
  }
}
