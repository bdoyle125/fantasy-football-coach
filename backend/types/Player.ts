import { PlayerStats } from "./PlayerStats/PlayerStats";

export class Player {
    id: string;
    name: string;
    team: string | null;
    position: string | null;
    age: number | null;
    stats: PlayerStats | null;
    projectedPoints: number | null = null;

    constructor(id: string, name: string, team: string | null, position: string | null, age: number | null, stats: PlayerStats | null) {
        this.id = id;
        this.name = name;
        this.team = team;
        this.position = position;
        this.age = age;
        this.stats = stats;
    }
}