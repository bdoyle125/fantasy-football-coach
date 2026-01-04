import { Player } from "../types/Player";

export class Team {
    id: string;
    name: string;
    leagueId: string;
    ownerId: string;
    players: Player[];

    constructor(id: string, name: string, leagueId: string, ownerId: string, players: Player[]) {
        this.id = id;
        this.name = name;
        this.leagueId = leagueId;
        this.ownerId = ownerId;
        this.players = players;
    }
}
