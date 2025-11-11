import { Stats } from "./Stats";

export class Player {
    id: string;
    name: string;
    team: string | null;
    position: string | null;
    stats: Stats; // You can define a more specific type based on the stats structure

    constructor(id: string, name: string, team: string | null, position: string | null, stats: Stats) {
        this.id = id;
        this.name = name;
        this.team = team;
        this.position = position;
        this.stats = stats;
    }
}