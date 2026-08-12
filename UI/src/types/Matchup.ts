import { Team } from "./Team";

export type MatchupResult =
    | { status: "ok"; week: number; myTeam: Team; opponentTeam: Team }
    | { status: "bye"; week: number; myTeam: Team }
    | { status: "unavailable"; week: number };
