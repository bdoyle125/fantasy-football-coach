import { Player } from "./types/Player";
import { Stats } from "./types/Stats";

export async function getTeamForOwner(leagueId: string, ownerId: string): Promise<Player[]> {
    // fetch rosters
    const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
    const rosters = await res.json();

    if (!Array.isArray(rosters)) {
        console.error("Invalid rosters data:", rosters);
        throw new Error("Invalid rosters data");
    }

    // find the roster for your owner
    const myRoster = rosters.find((r: { owner_id: string }) => r.owner_id === ownerId);
    if (!myRoster) {
        console.error("Roster not found for owner:", ownerId);
        throw new Error("Roster not found for owner");
    }

    const playerIds = myRoster.players;  // array of player_id strings

    // fetch player meta-info
    const playersRes = await fetch(`https://api.sleeper.app/v1/players/nfl`);
    const playersData = await playersRes.json();

    // map your players
    const myPlayers: Player[] = playerIds.map((pid: string) => {
        const p = playersData[pid];
        return new Player(
            pid,
            p ? p.full_name : "Unknown",
            p ? p.team : null,
            p ? p.position : null,
            new Stats({}) // Initialize with empty stats, will be updated later
        );
    });

    for (const player of myPlayers) {
        const stats = await fetch(`https://api.sleeper.app/stats/nfl/player/${player.id}?season_type=regular&season=2025`); // TODO: make season dynamic
        if (!stats.ok) {
            console.error(`Failed to fetch stats for player ${player.id}:`, stats.statusText);
            player.stats = new Stats({}); // Assign empty stats on failure
            continue;
        }
        const statsData = await stats.json();
        player.stats = new Stats(statsData.stats);
    }

    return myPlayers;
}