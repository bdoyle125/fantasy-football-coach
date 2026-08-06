import { PlayerStats } from "./PlayerStats";

export class RusherStats extends PlayerStats {
  rushingAttempts: number;
  rushingYards: number;
  rushingTouchdowns: number;
  rushingFirstDowns: number;
  rushingLong: number;
  rushingYardsAfterContact: number | undefined;
  rushingYardsPerAttempt: number;
  rushingRedZoneAttempts: number;
  rushingTacklesForLoss: number;
  rushingTacklesForLossYards: number;

  constructor(data: object) {
    super(data);

    this.rushingAttempts = data["rush_att"];
    this.rushingYards = data["rush_yd"];
    this.rushingTouchdowns = data["rush_td"];
    this.rushingFirstDowns = data["rush_fd"];
    this.rushingLong = data["rush_lng"];
    this.rushingYardsAfterContact = data["rush_yac"];
    this.rushingYardsPerAttempt = data["rush_ypa"];
    this.rushingRedZoneAttempts = data["rush_rz_att"];
    this.rushingTacklesForLoss = data["rush_tkl_loss"];
    this.rushingTacklesForLossYards = data["rush_tkl_loss_yd"];
  }
}
