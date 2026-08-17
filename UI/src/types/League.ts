export type League = {
    id: string;
    provider: 'sleeper' | 'espn';
    providerLeagueId: string;
    providerOwnerId: string;
    leagueName: string | null;
    isActive: boolean;
};

export type ActiveLeagueSettings = {
    userId: string;
    leagueId: string;
    provider: 'sleeper' | 'espn';
    providerLeagueId: string;
    providerOwnerId: string;
    leagueName: string | null;
};

// Raw shape of a league object from Sleeper's leagues-for-a-user endpoint
// (GET /v1/user/:ownerId/leagues/nfl/:season) -- only the fields this app uses.
export type SleeperLeagueSummary = {
    league_id: string;
    name: string;
};
