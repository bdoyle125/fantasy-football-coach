export async function getTeamForOwner(leagueId: string, ownerId: string): Promise<any> {
    // fetch rosters
    const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
    const rosters = await res.json();

    if (!Array.isArray(rosters)) {
        console.error("Invalid rosters data:", rosters);
        throw new Error("Invalid rosters data");
    }

    // find the roster for your owner
    console.log('Total rosters fetched:', rosters.length);
    const myRoster = rosters.find((r: { owner_id: string }) => r.owner_id === ownerId);
    console.log('Matched roster:', myRoster);
    if (!myRoster) {
        console.error("Roster not found for owner:", ownerId);
        throw new Error("Roster not found for owner");
    }

    const playerIds = myRoster.players;  // array of player_id strings
    console.log('Player IDs:', playerIds);

    // fetch player meta-info
    console.log('Fetching player meta-info from Sleeper API');
    const playersRes = await fetch(`https://api.sleeper.app/v1/players/nfl`);
    const playersData = await playersRes.json();
    console.log('Total players fetched:', Object.keys(playersData).length);

    // map your players
    const myPlayers = playerIds.map((pid: number) => {
        const p = playersData[pid];
        return {
            id: pid,
            name: p ? p.full_name : "Unknown",
            team: p ? p.team : null,
            position: p ? p.position : null
        };
    });

    console.log('Mapped players:', myPlayers);
    return myPlayers;
}