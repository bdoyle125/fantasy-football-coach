import { SeasonStatsContext } from "../../types/SeasonStatsContext";
import { PlayerProjection } from "../../types/PlayerProjection";
import { PositionKey, TeamDefenseRanking } from "../../types/DefenseRankings";

const POSITION_KEYS: PositionKey[] = ["QB", "RB", "WR", "TE", "K", "DEF"];

function isPositionKey(position: string | null): position is PositionKey {
    return position !== null && (POSITION_KEYS as string[]).includes(position);
}

const COACH_PERSONA_PREAMBLE = `You are "Coach Sideline," a sharp, slightly witty fantasy football expert.

Use the numbers you ARE given as your foundation, but don't stop there. Factor in
injury designations, recent news, bye weeks, and general fantasy strategy the way a
human analyst would. If the stats point one way but context points another, say so
and explain your reasoning — never hand back a bare stat line with no interpretation.`;

export const WEEKLY_SYSTEM_PROMPT = `${COACH_PERSONA_PREAMBLE}

You are being asked about a SINGLE UPCOMING WEEK, not the player's season as a whole.
You will be given, per player:
1. WEEKLY_STATS — this week's box score, if the game has already been played
2. WEEKLY_PROJECTION — this week's projected stat line
3. OPPONENT — this week's opponent, plus that opponent's defensive ranking against the
   player's position (rank 1 means that defense allows the MOST fantasy points to that
   position league-wide — the easiest matchup; rank 32 means the toughest)
4. INJURY_STATUS — the player's current injury designation, if any

You DO have real opponent and defensive-matchup data this time — use it as a genuine
input to your reasoning rather than hedging about not knowing the matchup. Do not pull
in season-long trends or last-season stats; stay focused on this one week. End every
recommendation with a clear Start / Bench call.`;

export const SEASON_SYSTEM_PROMPT = `${COACH_PERSONA_PREAMBLE}

You are being asked to evaluate a roster over the course of the SEASON, not a single
upcoming week — think trade targets, droppable players, and depth concerns, not
"who do I start this week." You will be given, per player:
1. SEASON_STATS — season-to-date totals
2. LAST_SEASON_STATS — full prior-season totals, for trend context
3. INJURY_STATUS — the player's current injury designation, if any

You do NOT have this week's opponent, matchup, or defensive-ranking data. Do not invent
specific matchup numbers, defensive rankings, or "vs. [team]" stats you weren't given.
Where matchups matter, reason about them qualitatively using your own general
knowledge of the teams/players involved, and say plainly when you're speculating
rather than citing a number you were handed. End every player recommendation with a
clear verdict: a START / BENCH / TRADE call.`;

function formatStatsSlot(label: string, stats: Record<string, any> | null): string {
    if (!stats) {
        return `${label}: unavailable`;
    }
    return `${label}: ${JSON.stringify(stats)}`;
}

function formatPlayerHeader(player: { name: string; position: string | null; team: string | null }): string {
    return `Player: ${player.name} (${player.position || "Unknown Position"}, ${player.team || "Unknown Team"})`;
}

function formatOpponentSlot(
    projection: PlayerProjection | undefined,
    position: string | null,
    defenseRankings: Map<string, TeamDefenseRanking>,
): string {
    const opponent = projection?.opponent;
    if (!opponent) {
        return "OPPONENT: unavailable";
    }

    const ranking = defenseRankings.get(opponent);
    if (!ranking || !isPositionKey(position) || ranking.rankByPosition[position] === null) {
        return `OPPONENT: ${opponent} (defense ranking unavailable)`;
    }

    const rank = ranking.rankByPosition[position] as number;
    let descriptor = "average matchup";
    if (rank <= 10) {
        descriptor = "favorable matchup";
    } else if (rank >= 23) {
        descriptor = "tough matchup";
    }
    return `OPPONENT: ${opponent} (ranked ${rank}/32 fantasy points allowed to ${position} — ${descriptor})`;
}

export function buildWeeklyPlayerContextBlock(
    player: { id: string; name: string; position: string | null; team: string | null },
    weeklyStats: Record<string, any> | null | undefined,
    projection: PlayerProjection | undefined,
    defenseRankings: Map<string, TeamDefenseRanking>,
    injuryStatus: string | null | undefined,
): string {
    const lines = [
        formatPlayerHeader(player),
        `INJURY_STATUS: ${injuryStatus || "Healthy"}`,
        formatStatsSlot("WEEKLY_STATS", weeklyStats ?? null),
        formatStatsSlot("WEEKLY_PROJECTION", projection?.projectedStats ?? null),
        formatOpponentSlot(projection, player.position, defenseRankings),
    ];
    return lines.join("\n");
}

export function buildWeeklyRosterContextText(
    players: { id: string; name: string; position: string | null; team: string | null }[],
    weeklyStatsMap: Map<string, Record<string, any> | null>,
    projectionMap: Map<string, PlayerProjection>,
    defenseRankings: Map<string, TeamDefenseRanking>,
    injuryMap: Map<string, string | null>,
): string {
    return players
        .map((p) => buildWeeklyPlayerContextBlock(p, weeklyStatsMap.get(p.id), projectionMap.get(p.id), defenseRankings, injuryMap.get(p.id)))
        .join("\n\n");
}

export function buildSeasonPlayerContextBlock(
    player: { id: string; name: string; position: string | null; team: string | null },
    statsContext: SeasonStatsContext | undefined,
    injuryStatus: string | null | undefined,
): string {
    const stats = statsContext ?? { seasonStats: null, lastSeasonStats: null };
    const lines = [
        formatPlayerHeader(player),
        `INJURY_STATUS: ${injuryStatus || "Healthy"}`,
        formatStatsSlot("SEASON_STATS", stats.seasonStats),
        formatStatsSlot("LAST_SEASON_STATS", stats.lastSeasonStats),
    ];
    return lines.join("\n");
}

export function buildSeasonRosterContextText(
    players: { id: string; name: string; position: string | null; team: string | null }[],
    statsMap: Map<string, SeasonStatsContext>,
    injuryMap: Map<string, string | null>,
): string {
    return players
        .map((p) => buildSeasonPlayerContextBlock(p, statsMap.get(p.id), injuryMap.get(p.id)))
        .join("\n\n");
}
