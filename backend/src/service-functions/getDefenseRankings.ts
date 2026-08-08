import { NFL_TEAM_ABBREVIATIONS } from "../constants/nflTeams";
import { PositionKey, TeamDefenseRanking } from "../../types/DefenseRankings";

const STAT_FIELD_BY_POSITION: Record<PositionKey, string> = {
    QB: "fan_pts_allow_qb",
    RB: "fan_pts_allow_rb",
    WR: "fan_pts_allow_wr",
    TE: "fan_pts_allow_te",
    K: "fan_pts_allow_k",
    DEF: "fan_pts_allow_def",
};

const POSITION_KEYS: PositionKey[] = ["QB", "RB", "WR", "TE", "K", "DEF"];

async function fetchTeamFantasyPointsAllowed(team: string, season: string): Promise<Record<PositionKey, number | null>> {
    const emptyResult: Record<PositionKey, number | null> = { QB: null, RB: null, WR: null, TE: null, K: null, DEF: null };
    try {
        const res = await fetch(`https://api.sleeper.app/stats/nfl/player/${team}?season_type=regular&season=${season}`);
        if (!res.ok) {
            return emptyResult;
        }
        const data = await res.json();
        if (!data || typeof data !== "object" || !data.stats || typeof data.stats !== "object") {
            return emptyResult;
        }
        const result: Record<PositionKey, number | null> = { ...emptyResult };
        for (const position of POSITION_KEYS) {
            const value = data.stats[STAT_FIELD_BY_POSITION[position]];
            result[position] = typeof value === "number" ? value : null;
        }
        return result;
    } catch (error) {
        return emptyResult;
    }
}

// rankByPosition[position] === 1 means that team allows the MOST fantasy points to that
// position league-wide (the easiest matchup); higher ranks mean tougher matchups.
function rankTeamsByPosition(fantasyPointsAllowedByTeam: Map<string, Record<PositionKey, number | null>>): Map<string, Record<PositionKey, number | null>> {
    const rankByTeam = new Map<string, Record<PositionKey, number | null>>();
    for (const team of fantasyPointsAllowedByTeam.keys()) {
        rankByTeam.set(team, { QB: null, RB: null, WR: null, TE: null, K: null, DEF: null });
    }

    for (const position of POSITION_KEYS) {
        const ranked = [...fantasyPointsAllowedByTeam.entries()]
            .filter(([, stats]) => stats[position] !== null)
            .sort((a, b) => (b[1][position] as number) - (a[1][position] as number));

        ranked.forEach(([team], index) => {
            rankByTeam.get(team)![position] = index + 1;
        });
    }

    return rankByTeam;
}

export async function getDefenseRankingsForSeason(season: string): Promise<Map<string, TeamDefenseRanking>> {
    const entries = await Promise.all(
        NFL_TEAM_ABBREVIATIONS.map(async (team) => {
            const fantasyPointsAllowed = await fetchTeamFantasyPointsAllowed(team, season);
            return [team, fantasyPointsAllowed] as const;
        }),
    );
    const fantasyPointsAllowedByTeam = new Map(entries);
    const rankByTeam = rankTeamsByPosition(fantasyPointsAllowedByTeam);

    const result = new Map<string, TeamDefenseRanking>();
    for (const team of NFL_TEAM_ABBREVIATIONS) {
        result.set(team, {
            fantasyPointsAllowed: fantasyPointsAllowedByTeam.get(team)!,
            rankByPosition: rankByTeam.get(team)!,
        });
    }
    return result;
}
