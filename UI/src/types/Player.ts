import { PlayerStats } from "./PlayerStats/PlayerStats.js";

export class Player {
    id: string;
    name: string;
    team: string | null;
    position: string | null;
    age: number | null;
    stats: PlayerStats;

    constructor(id: string, name: string, team: string | null, position: string | null, age: number | null, stats: PlayerStats) {
        this.id = id;
        this.name = name;
        this.team = team;
        this.position = position;
        this.age = age;
        this.stats = stats;
    }
}