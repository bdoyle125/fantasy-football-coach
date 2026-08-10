import { getPlayersDict } from "./lib/playersDict";

export type PlayerBio = {
    name: string;
    team: string | null;
    position: string | null;
    age: number | null;
    yearsExp: number | null;
    rookieYear: number | null;
};

export async function getPlayerBio(playerId: string): Promise<PlayerBio> {
    try {
        const playersData = await getPlayersDict();
        const player = playersData?.[playerId];
        const rawRookieYear = player?.metadata?.rookie_year;
        return {
            name: player?.full_name ?? "Unknown",
            team: player?.team ?? null,
            position: player?.position ?? null,
            age: player?.age ?? null,
            yearsExp: player?.years_exp ?? null,
            rookieYear: rawRookieYear ? Number(rawRookieYear) || null : null,
        };
    } catch (error) {
        return { name: "Unknown", team: null, position: null, age: null, yearsExp: null, rookieYear: null };
    }
}
