import { SeasonStatsContext } from "../../types/SeasonStatsContext";
import { PlayerProjection } from "../../types/PlayerProjection";
import { PositionKey, TeamDefenseRanking } from "../../types/DefenseRankings";

const POSITION_KEYS: PositionKey[] = ["QB", "RB", "WR", "TE", "K", "DEF"];

function isPositionKey(position: string | null): position is PositionKey {
    return position !== null && (POSITION_KEYS as string[]).includes(position);
}

const COACH_PERSONA_PREAMBLE = `You are "Coach Frank," a sharp, slightly witty fantasy football expert.

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
3. WEEKLY_PROJECTION — the upcoming week's projected stat line
4. OPPONENT — the player's real-life NFL opponent this week, plus that opponent's
   defensive ranking against the player's position (rank 1 means that defense allows
   the MOST fantasy points to that position league-wide — the easiest matchup; rank 32
   means the toughest)
5. INJURY_STATUS — the player's current injury designation, if any

Treat WEEKLY_PROJECTION and OPPONENT as one supporting data point among several, not the
basis for a season-long verdict — a single week's matchup shouldn't by itself flip a
trade, drop, or keep decision that season-long production and trend otherwise support.
Weigh it more heavily only when it reinforces a pattern already visible in SEASON_STATS
or LAST_SEASON_STATS, and say so explicitly when you do. Do not invent matchup numbers,
defensive rankings, or "vs. [team]" stats beyond what you were given. End every player
recommendation with a clear verdict: a START / BENCH / TRADE call.

This is a one-shot report — the user cannot reply. Never end with a question or an offer
to help further ("Want me to look at trade options?", "Let me know if..."); give complete,
decisive recommendations instead.

After the per-player recommendations, add a final line formatted EXACTLY as
"TRADE SUGGESTION: [Player Name]" (or "TRADE SUGGESTION: [Player A], [Player B]" if more
than one player is involved) — just the player name(s) to look at trading, and nothing
else on that line. Any reasoning for the suggestion belongs earlier, in the per-player
recommendations, not on the TRADE SUGGESTION line itself.`;

export const MATCHUP_SYSTEM_PROMPT = `${COACH_PERSONA_PREAMBLE}

You are previewing a single upcoming HEAD-TO-HEAD FANTASY MATCHUP between two full
rosters, labeled YOUR TEAM and OPPONENT TEAM below — that is the fantasy-league
opponent, a person's whole roster. Do not confuse this with each individual player's
OPPONENT field, which is still that player's real-life NFL opponent this week (used for
the defensive matchup rating, exactly as in a normal start/bench call).

You will be given, per player on both rosters:
1. WEEKLY_STATS — this week's box score, if the game has already been played
2. WEEKLY_PROJECTION — this week's projected stat line
3. OPPONENT — that player's real NFL opponent this week, plus that opponent's defensive
   ranking against the player's position
4. INJURY_STATUS — the player's current injury designation, if any

Compare the two rosters as a whole — depth, injuries, and matchup advantages — not just
a player-by-player recap. End with a clearly labeled "Predicted Winner:" line naming one
of the two teams by name, plus a one-line read on how confident that call is.`;

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
    projection: PlayerProjection | undefined,
    defenseRankings: Map<string, TeamDefenseRanking>,
): string {
    const stats = statsContext ?? { seasonStats: null, lastSeasonStats: null };
    const lines = [
        formatPlayerHeader(player),
        `INJURY_STATUS: ${injuryStatus || "Healthy"}`,
        formatStatsSlot("SEASON_STATS", stats.seasonStats),
        formatStatsSlot("LAST_SEASON_STATS", stats.lastSeasonStats),
        formatStatsSlot("WEEKLY_PROJECTION", projection?.projectedStats ?? null),
        formatOpponentSlot(projection, player.position, defenseRankings),
    ];
    return lines.join("\n");
}

export function buildSeasonRosterContextText(
    players: { id: string; name: string; position: string | null; team: string | null }[],
    statsMap: Map<string, SeasonStatsContext>,
    injuryMap: Map<string, string | null>,
    projectionMap: Map<string, PlayerProjection>,
    defenseRankings: Map<string, TeamDefenseRanking>,
): string {
    return players
        .map((p) => buildSeasonPlayerContextBlock(p, statsMap.get(p.id), injuryMap.get(p.id), projectionMap.get(p.id), defenseRankings))
        .join("\n\n");
}

export function buildMatchupContextText(
    myTeamLabel: string,
    myTeamPlayers: { id: string; name: string; position: string | null; team: string | null }[],
    opponentTeamLabel: string,
    opponentTeamPlayers: { id: string; name: string; position: string | null; team: string | null }[],
    weeklyStatsMap: Map<string, Record<string, any> | null>,
    projectionMap: Map<string, PlayerProjection>,
    defenseRankings: Map<string, TeamDefenseRanking>,
    injuryMap: Map<string, string | null>,
): string {
    const myTeamText = buildWeeklyRosterContextText(myTeamPlayers, weeklyStatsMap, projectionMap, defenseRankings, injuryMap);
    const opponentTeamText = buildWeeklyRosterContextText(opponentTeamPlayers, weeklyStatsMap, projectionMap, defenseRankings, injuryMap);
    return `=== ${myTeamLabel} (YOUR TEAM) ===\n${myTeamText}\n\n=== ${opponentTeamLabel} (OPPONENT) ===\n${opponentTeamText}`;
}
