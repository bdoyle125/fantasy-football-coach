"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamForOwner = getTeamForOwner;
async function getTeamForOwner(leagueId, ownerId) {
    // fetch rosters
    const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
    const rosters = await res.json();
    if (!Array.isArray(rosters)) {
        console.error("Invalid rosters data:", rosters);
        throw new Error("Invalid rosters data");
    }
    // find the roster for your owner
    console.log('Total rosters fetched:', rosters.length);
    const myRoster = rosters.find((r) => r.owner_id === ownerId);
    console.log('Matched roster:', myRoster);
    if (!myRoster) {
        console.error("Roster not found for owner:", ownerId);
        throw new Error("Roster not found for owner");
    }
    const playerIds = myRoster.players; // array of player_id strings
    console.log('Player IDs:', playerIds);
    // fetch player meta-info
    console.log('Fetching player meta-info from Sleeper API');
    const playersRes = await fetch(`https://api.sleeper.app/v1/players/nfl`);
    const playersData = await playersRes.json();
    console.log('Total players fetched:', Object.keys(playersData).length);
    // map your players
    const myPlayers = playerIds.map((pid) => {
        const p = playersData[pid];
        return {
            id: pid,
            name: p ? p.full_name : "Unknown",
            team: p ? p.team : null,
            position: p ? p.position : null,
            stats: null, // to be filled later
        };
    });
    for (const player of myPlayers) {
        const stats = await fetch(`https://api.sleeper.app/stats/nfl/player/${player.id}?season_type=regular&season=2025`); // TODO: make season dynamic
        if (!stats.ok) {
            console.error(`Failed to fetch stats for player ${player.id}:`, stats.statusText);
            player.stats = null;
            continue;
        }
        const statsData = await stats.json();
        player.stats = statsData;
    }
    console.log('Mapped players:', myPlayers);
    return myPlayers;
}
//# sourceMappingURL=getTeamForOwner.js.map