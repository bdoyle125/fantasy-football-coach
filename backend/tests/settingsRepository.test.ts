import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { mswServer } from './msw/server';
import {
  getActiveLeagueSettings,
  setActiveLeague,
  ensureSingleUser,
} from '../src/repositories/settingsRepository';

// Exercises the repository directly against msw-mocked PostgREST responses (the HTTP
// surface Supabase-js talks to at {SUPABASE_URL}/rest/v1/<table>), the same way
// tests/getTeamForOwner.test.ts exercises Sleeper calls directly.
//
// Two response shapes matter here, mirroring what real PostgREST sends back:
//   - `.maybeSingle()` calls (isMaybeSingle) still request the array representation --
//     postgrest-js unwraps it client-side -- so those mocks return a JSON array.
//   - `.single()` calls set `Accept: application/vnd.pgrst.object+json`, so PostgREST
//     (and these mocks) return the row as a bare JSON object, not wrapped in an array.
const SUPABASE_URL = 'https://test.supabase.co';

describe('getActiveLeagueSettings', () => {
  it('returns the active league on the happy path', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/rest/v1/user_settings`, () => {
        return HttpResponse.json([
          {
            user_id: 'user-1',
            leagues: {
              id: 'league-1',
              provider: 'sleeper',
              provider_league_id: 'lg-1',
              provider_owner_id: 'ow-1',
              league_name: 'My League',
            },
          },
        ]);
      }),
    );

    const settings = await getActiveLeagueSettings();

    expect(settings).toEqual({
      userId: 'user-1',
      leagueId: 'league-1',
      provider: 'sleeper',
      providerLeagueId: 'lg-1',
      providerOwnerId: 'ow-1',
      leagueName: 'My League',
    });
  });

  it('returns null when no user_settings row exists yet', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/rest/v1/user_settings`, () => {
        return HttpResponse.json([]);
      }),
    );

    await expect(getActiveLeagueSettings()).resolves.toBeNull();
  });

  it('returns null when the row exists but has no active league set', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/rest/v1/user_settings`, () => {
        return HttpResponse.json([{ user_id: 'user-1', leagues: null }]);
      }),
    );

    await expect(getActiveLeagueSettings()).resolves.toBeNull();
  });

  it('throws a wrapped error when the request fails', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/rest/v1/user_settings`, () => {
        return HttpResponse.json({ message: 'connection refused' }, { status: 500 });
      }),
    );

    await expect(getActiveLeagueSettings()).rejects.toThrow('Failed to load active league settings');
  });
});

describe('setActiveLeague', () => {
  const input = { provider: 'sleeper' as const, providerLeagueId: 'lg-2', providerOwnerId: 'ow-2' };

  it('upserts the league and active setting on the happy path', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/rest/v1/users`, () => {
        return HttpResponse.json([{ id: 'user-1' }]);
      }),
      http.post(`${SUPABASE_URL}/rest/v1/leagues`, () => {
        return HttpResponse.json({
          id: 'league-2',
          provider: 'sleeper',
          provider_league_id: 'lg-2',
          provider_owner_id: 'ow-2',
          league_name: null,
        });
      }),
      http.post(`${SUPABASE_URL}/rest/v1/user_settings`, () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const settings = await setActiveLeague(input);

    expect(settings).toEqual({
      userId: 'user-1',
      leagueId: 'league-2',
      provider: 'sleeper',
      providerLeagueId: 'lg-2',
      providerOwnerId: 'ow-2',
      leagueName: null,
    });
  });

  it('throws when no user exists yet', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/rest/v1/users`, () => {
        return HttpResponse.json([]);
      }),
    );

    await expect(setActiveLeague(input)).rejects.toThrow('No user found');
  });

  it('throws a wrapped error when the user lookup fails', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/rest/v1/users`, () => {
        return HttpResponse.json({ message: 'boom' }, { status: 500 });
      }),
    );

    await expect(setActiveLeague(input)).rejects.toThrow('Failed to look up user');
  });

  it('throws a wrapped error when saving the league fails', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/rest/v1/users`, () => {
        return HttpResponse.json([{ id: 'user-1' }]);
      }),
      http.post(`${SUPABASE_URL}/rest/v1/leagues`, () => {
        return HttpResponse.json({ message: 'constraint violation' }, { status: 400 });
      }),
    );

    await expect(setActiveLeague(input)).rejects.toThrow('Failed to save league');
  });

  it('omits league_name from the upsert payload when leagueName is not provided, preserving the existing name', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/rest/v1/users`, () => {
        return HttpResponse.json([{ id: 'user-1' }]);
      }),
      http.post(`${SUPABASE_URL}/rest/v1/leagues`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        const leagueName = 'league_name' in body ? null : 'Existing Name';
        return HttpResponse.json({
          id: 'league-2',
          provider: 'sleeper',
          provider_league_id: 'lg-2',
          provider_owner_id: 'ow-2',
          league_name: leagueName,
        });
      }),
      http.post(`${SUPABASE_URL}/rest/v1/user_settings`, () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const settings = await setActiveLeague(input);

    expect(settings.leagueName).toBe('Existing Name');
  });

  it('includes league_name in the upsert payload when leagueName is explicitly provided', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/rest/v1/users`, () => {
        return HttpResponse.json([{ id: 'user-1' }]);
      }),
      http.post(`${SUPABASE_URL}/rest/v1/leagues`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body).toHaveProperty('league_name', 'New Name');
        return HttpResponse.json({
          id: 'league-2',
          provider: 'sleeper',
          provider_league_id: 'lg-2',
          provider_owner_id: 'ow-2',
          league_name: 'New Name',
        });
      }),
      http.post(`${SUPABASE_URL}/rest/v1/user_settings`, () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const settings = await setActiveLeague({ ...input, leagueName: 'New Name' });

    expect(settings.leagueName).toBe('New Name');
  });

  it('throws a wrapped error when updating the active setting fails', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/rest/v1/users`, () => {
        return HttpResponse.json([{ id: 'user-1' }]);
      }),
      http.post(`${SUPABASE_URL}/rest/v1/leagues`, () => {
        return HttpResponse.json({
          id: 'league-2',
          provider: 'sleeper',
          provider_league_id: 'lg-2',
          provider_owner_id: 'ow-2',
          league_name: null,
        });
      }),
      http.post(`${SUPABASE_URL}/rest/v1/user_settings`, () => {
        return HttpResponse.json({ message: 'boom' }, { status: 500 });
      }),
    );

    await expect(setActiveLeague(input)).rejects.toThrow('Failed to update active league');
  });
});

describe('ensureSingleUser', () => {
  it('returns the existing user id without creating a new row', async () => {
    let insertCalled = false;
    mswServer.use(
      http.get(`${SUPABASE_URL}/rest/v1/users`, () => {
        return HttpResponse.json([{ id: 'user-1' }]);
      }),
      http.post(`${SUPABASE_URL}/rest/v1/users`, () => {
        insertCalled = true;
        return HttpResponse.json({ id: 'user-should-not-be-created' });
      }),
    );

    const userId = await ensureSingleUser();

    expect(userId).toBe('user-1');
    expect(insertCalled).toBe(false);
  });

  it('creates a user row when none exists yet', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/rest/v1/users`, () => {
        return HttpResponse.json([]);
      }),
      http.post(`${SUPABASE_URL}/rest/v1/users`, () => {
        return HttpResponse.json({ id: 'new-user-1' });
      }),
    );

    const userId = await ensureSingleUser();

    expect(userId).toBe('new-user-1');
  });

  it('throws a wrapped error when user creation fails', async () => {
    mswServer.use(
      http.get(`${SUPABASE_URL}/rest/v1/users`, () => {
        return HttpResponse.json([]);
      }),
      http.post(`${SUPABASE_URL}/rest/v1/users`, () => {
        return HttpResponse.json({ message: 'boom' }, { status: 500 });
      }),
    );

    await expect(ensureSingleUser()).rejects.toThrow('Failed to create user');
  });
});
