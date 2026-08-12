import { Player } from "../../types/Player";
import { Team } from "../../types/Team";
import { SleeperState } from "../../types/SleeperState";
import { MatchupResult } from "../../types/Matchup";
import { getPlayersDict } from "./lib/playersDict";
import { TtlCache } from "./lib/ttlCache";

type SleeperRosterEntry = { roster_id: number; owner_id: string; players: string[] | null };
type SleeperUserEntry = { user_id: string; metadata?: { team_name?: string } };
type SleeperMatchupEntry = { roster_id: number; matchup_id: number | null; players: string[] | null };

async function fetchMatchupsForWeek(leagueId: string, week: number): Promise<unknown> {
    try {
        const res = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`);
        if (!res.ok) {
            return null;
        }
        return await res.json();
    } catch (error) {
        // A network failure or malformed body here means "treat this week as
        // unavailable," not a hard error — the same graceful-degradation style used by
        // getPlayerProjection.ts for this-week Sleeper data.
        return null;
    }
}

// Live per-week data (unlike the season-long defense rankings), so a short TTL — just
// enough to dedupe bursts of requests without serving stale data across the week.
const MATCHUPS_TTL_MS = 5 * 60 * 1000;
const matchupsCacheByKey = new Map<string, TtlCache<unknown>>();

async function getMatchupsForWeek(leagueId: string, week: number): Promise<unknown> {
    const key = `${leagueId}:${week}`;
    let cache = matchupsCacheByKey.get(key);
    if (!cache) {
        cache = new TtlCache<unknown>(MATCHUPS_TTL_MS);
        matchupsCacheByKey.set(key, cache);
    }
    return cache.getOrFetch(() => fetchMatchupsForWeek(leagueId, week));
}

export function clearMatchupCache(): void {
    matchupsCacheByKey.clear();
}

function buildTeamFromRoster(
    roster: SleeperRosterEntry,
    users: SleeperUserEntry[],
    playersDict: Record<string, any>,
    leagueId: string,
): Team {
    const userInfo = users.find((u) => u.user_id === roster.owner_id);
    const teamName = userInfo?.metadata?.team_name || "Unnamed Team";

    const playerIds = roster.players ?? [];
    const players: Player[] = playerIds.map((pid) => {
        const p = playersDict[pid];
        return new Player(
            pid,
            p ? p.full_name : "Unknown",
            p ? p.team : null,
            p ? p.position : null,
            p ? p.age : null,
            p?.stats ?? null,
        );
    });

    return new Team(roster.owner_id, teamName, leagueId, roster.owner_id, players);
}

export async function getMatchupForOwner(leagueId: string, ownerId: string, state: SleeperState): Promise<MatchupResult> {
    const [usersRes, rostersRes, matchupsData] = await Promise.all([
        fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`),
        fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`),
        getMatchupsForWeek(leagueId, state.week),
    ]);

    const users = await usersRes.json();
    if (!Array.isArray(users)) {
        console.error("Invalid league users data:", users);
        throw new Error("Invalid league users data");
    }

    const rosters = await rostersRes.json();
    if (!Array.isArray(rosters)) {
        console.error("Invalid rosters data:", rosters);
        throw new Error("Invalid rosters data");
    }

    const myRoster = rosters.find((r: SleeperRosterEntry) => r.owner_id === ownerId);
    if (!myRoster) {
        console.error("Roster not found for owner:", ownerId);
        throw new Error("Roster not found for owner");
    }

    // Sleeper returns [] (or a malformed body, normalized to null above) before matchups
    // are scheduled for the season — that's a normal preseason state, not an error.
    if (!Array.isArray(matchupsData) || matchupsData.length === 0) {
        return { status: "unavailable", week: state.week };
    }
    const matchups = matchupsData as SleeperMatchupEntry[];

    const myMatchupEntry = matchups.find((m) => m.roster_id === myRoster.roster_id);
    const playersDict = await getPlayersDict();

    // A missing entry or a null matchup_id both mean "no opponent this week" (bye).
    if (!myMatchupEntry || myMatchupEntry.matchup_id === null) {
        return { status: "bye", week: state.week, myTeam: buildTeamFromRoster(myRoster, users, playersDict, leagueId) };
    }

    const opponentEntry = matchups.find(
        (m) => m.matchup_id === myMatchupEntry.matchup_id && m.roster_id !== myRoster.roster_id,
    );
    if (!opponentEntry) {
        return { status: "unavailable", week: state.week };
    }

    const opponentRoster = rosters.find((r: SleeperRosterEntry) => r.roster_id === opponentEntry.roster_id);
    if (!opponentRoster) {
        return { status: "unavailable", week: state.week };
    }

    return {
        status: "ok",
        week: state.week,
        myTeam: buildTeamFromRoster(myRoster, users, playersDict, leagueId),
        opponentTeam: buildTeamFromRoster(opponentRoster, users, playersDict, leagueId),
    };
}
