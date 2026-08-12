import { Player } from "../../types/Player";
import { SleeperState } from "../../types/SleeperState";
import { getProjectionsForRoster } from "./getPlayerProjection";

// Mutates each player in place with this week's projected fantasy points (PPR),
// matching the pts_ppr field the rest of the app already uses for scoring everywhere
// else (season stats, weekly stats, defense rankings).
export async function attachProjectedPoints(players: Player[], state: SleeperState): Promise<void> {
    const projectionMap = await getProjectionsForRoster(players.map((p) => p.id), state);
    for (const player of players) {
        const projectedStats = projectionMap.get(player.id)?.projectedStats;
        player.projectedPoints = null;
        if (typeof projectedStats?.pts_ppr === "number") {
            player.projectedPoints = projectedStats.pts_ppr;
        }
    }
}
