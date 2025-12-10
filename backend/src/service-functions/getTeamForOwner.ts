import { Player } from "../../types/Player";

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
            p ? p.stats : {}
        );
    });

    return myPlayers;
}