import { PlayerStats } from "./PlayerStats";

export class ReceiverStats extends PlayerStats {
  receptions: number;
  receivingYards: number;
  receivingTouchdowns: number;
  receivingTargets: number;
  receivingYardsAfterCatch: number | undefined;
  receivingAirYards: number;
  receivingYardsPerTarget: number;
  receivingYardsPerReception: number;
  receivingFirstDowns: number;
  receivingLong: number;
  receivingRedZoneTargets: number;
  receivingDrops: number;

  constructor(data: Record<string, any>) {
    super(data);

    this.receptions = data["rec"];
    this.receivingYards = data["rec_yd"] ?? data["rec_yar"];
    this.receivingTouchdowns = data["rec_td"];
    this.receivingTargets = data["rec_tgt"];
    this.receivingYardsAfterCatch = data["rec_yac"];
    this.receivingAirYards = data["rec_air_yd"];
    this.receivingYardsPerTarget = data["rec_ypt"];
    this.receivingYardsPerReception = data["rec_ypr"];
    this.receivingFirstDowns = data["rec_fd"];
    this.receivingLong = data["rec_lng"];
    this.receivingRedZoneTargets = data["rec_rz_tgt"];
    this.receivingDrops = data["rec_drop"];
  }
}
