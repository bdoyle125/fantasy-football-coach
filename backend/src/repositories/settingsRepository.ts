import { getSupabaseClient } from '../db/supabaseClient';

export interface ActiveLeagueSettings {
  userId: string;
  leagueId: string;
  provider: 'sleeper' | 'espn';
  providerLeagueId: string;
  providerOwnerId: string;
  leagueName: string | null;
}

interface LeagueRow {
  id: string;
  provider: 'sleeper' | 'espn';
  provider_league_id: string;
  provider_owner_id: string;
  league_name: string | null;
}

interface UserSettingsRow {
  user_id: string;
  leagues: LeagueRow | null;
}

export async function getActiveLeagueSettings(): Promise<ActiveLeagueSettings | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('user_settings')
    .select('user_id, leagues(id, provider, provider_league_id, provider_owner_id, league_name)')
    .maybeSingle<UserSettingsRow>();

  if (error) {
    throw new Error(`Failed to load active league settings: ${error.message}`);
  }
  if (!data || !data.leagues) {
    return null;
  }

  return {
    userId: data.user_id,
    leagueId: data.leagues.id,
    provider: data.leagues.provider,
    providerLeagueId: data.leagues.provider_league_id,
    providerOwnerId: data.leagues.provider_owner_id,
    leagueName: data.leagues.league_name,
  };
}

export async function setActiveLeague(input: {
  provider: 'sleeper' | 'espn';
  providerLeagueId: string;
  providerOwnerId: string;
  leagueName?: string;
}): Promise<ActiveLeagueSettings> {
  const supabase = getSupabaseClient();

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (userError) {
    throw new Error(`Failed to look up user: ${userError.message}`);
  }
  if (!userRow) {
    throw new Error('No user found. Run "npm run db:seed" before setting the active league.');
  }
  const userId = userRow.id;

  const { data: league, error: leagueError } = await supabase
    .from('leagues')
    .upsert(
      {
        user_id: userId,
        provider: input.provider,
        provider_league_id: input.providerLeagueId,
        provider_owner_id: input.providerOwnerId,
        updated_at: new Date().toISOString(),
        ...(input.leagueName !== undefined ? { league_name: input.leagueName } : {}),
      },
      { onConflict: 'user_id,provider,provider_league_id,provider_owner_id' },
    )
    .select('id, provider, provider_league_id, provider_owner_id, league_name')
    .single<LeagueRow>();
  if (leagueError || !league) {
    throw new Error(`Failed to save league: ${leagueError?.message ?? 'unknown error'}`);
  }

  const { error: settingsError } = await supabase.from('user_settings').upsert(
    {
      user_id: userId,
      active_league_id: league.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (settingsError) {
    throw new Error(`Failed to update active league: ${settingsError.message}`);
  }

  return {
    userId,
    leagueId: league.id,
    provider: league.provider,
    providerLeagueId: league.provider_league_id,
    providerOwnerId: league.provider_owner_id,
    leagueName: league.league_name,
  };
}

// Seed-script only: returns the single user's ID, creating the row if none exists yet.
export async function ensureSingleUser(email?: string): Promise<string> {
  const supabase = getSupabaseClient();

  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (existingError) {
    throw new Error(`Failed to check for existing user: ${existingError.message}`);
  }
  if (existing) {
    return existing.id;
  }

  const { data: created, error: createError } = await supabase
    .from('users')
    .insert({ email: email ?? null })
    .select('id')
    .single<{ id: string }>();
  if (createError || !created) {
    throw new Error(`Failed to create user: ${createError?.message ?? 'unknown error'}`);
  }
  return created.id;
}
