import { Stats } from "./Stats.js";

export class Player {
    id: string;
    name: string;
    team: string | null;
    position: string | null;
    stats: Stats;

    constructor(id: string, name: string, team: string | null, position: string | null, stats: Stats) {
        this.id = id;
        this.name = name;
        this.team = team;
        this.position = position;
        this.stats = stats;
    }
}