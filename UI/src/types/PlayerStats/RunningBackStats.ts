import { RusherStats } from "./RusherStats";

export class RunningBackStats extends RusherStats {
  receivingBonusRunningBack: number;
  firstDownBonusRunningBack: number;

  constructor(data: Record<string, number>) {
    super(data);

    this.receivingBonusRunningBack = data["bonus_rec_rb"];
    this.firstDownBonusRunningBack = data["bonus_fd_rb"];
  }
}
