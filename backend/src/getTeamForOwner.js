"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamForOwner = getTeamForOwner;
async function getTeamForOwner(leagueId, ownerId) {
    // fetch rosters
    const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
    const rosters = await res.json();
    // find the roster for your owner
    debugger;
    const myRoster = rosters.find((r) => r.owner_id === ownerId);
    if (!myRoster) {
        throw new Error("Roster not found for owner");
    }
    const playerIds = myRoster.players; // array of player_id strings
    // fetch player meta-info
    const playersRes = await fetch(`https://api.sleeper.app/v1/players/nfl`);
    const playersData = await playersRes.json();
    // map your players
    const myPlayers = playerIds.map((pid) => {
        const p = playersData[pid];
        return {
            id: pid,
            name: p ? p.full_name : "Unknown",
            team: p ? p.team : null,
            position: p ? p.position : null
        };
    });
    return myPlayers;
}
//# sourceMappingURL=getTeamForOwner.js.map