import { Player } from "../../types/Player";
import { Team } from "../../types/Team";

export async function getTeamForOwner(leagueId: string, ownerId: string): Promise<Team> {
    // get team information
    const leagueRes = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`);
    const leagueUsers = await leagueRes.json();
    if (!Array.isArray(leagueUsers)) {
        console.error("Invalid league users data:", leagueUsers);
        throw new Error("Invalid league users data");
    }

    const teamInformation = leagueUsers.find((u: { user_id: string }) => u.user_id === ownerId);
    if (!teamInformation) {
        console.error("User not found in league:", ownerId);
        throw new Error("User not found in league");
    }
    const teamName = teamInformation.metadata?.team_name || "Unnamed Team";

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
            p ? p.age : null,
            p?.stats ?? null
        );
    });

    // Construct and return a Team instance
    return new Team(
        teamInformation.user_id,
        teamName,
        leagueId,
        ownerId,
        myPlayers
    );
}