import { RusherStats } from "./RusherStats";

export class RunningBackStats extends RusherStats {
  receivingBonusRunningBack: number;
  firstDownBonusRunningBack: number;
  receptions: number;
  receivingTargets: number;
  receivingYards: number;
  receivingTouchdowns: number;
  receivingYardsPerReception: number;

  constructor(data: Record<string, number>) {
    super(data);

    this.receivingBonusRunningBack = data["bonus_rec_rb"];
    this.firstDownBonusRunningBack = data["bonus_fd_rb"];
    this.receptions = data["rec"];
    this.receivingTargets = data["rec_tgt"];
    this.receivingYards = data["rec_yd"] ?? data["rec_yar"];
    this.receivingTouchdowns = data["rec_td"];
    this.receivingYardsPerReception = data["rec_ypr"];
  }
}
