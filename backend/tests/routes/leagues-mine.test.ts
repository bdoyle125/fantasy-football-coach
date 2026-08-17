import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { mockListLeaguesForUser, mockActivateExistingLeague, mockRemoveLeague } from '../mocks/settingsRepository';

// Must run before `createApp` is imported, same rationale as settings.test.ts: register
// the fake before server.ts (transitively) imports the real repository module.
vi.mock('../../src/repositories/settingsRepository', () => ({
  listLeaguesForUser: mockListLeaguesForUser,
  activateExistingLeague: mockActivateExistingLeague,
  removeLeague: mockRemoveLeague,
}));

import { createApp } from '../../src/server';

const sampleLeagues = [
  {
    id: 'league-1',
    provider: 'sleeper',
    providerLeagueId: 'lg-1',
    providerOwnerId: 'ow-1',
    leagueName: 'League One',
    isActive: true,
  },
  {
    id: 'league-2',
    provider: 'sleeper',
    providerLeagueId: 'lg-2',
    providerOwnerId: 'ow-2',
    leagueName: 'League Two',
    isActive: false,
  },
];

const sampleSettings = {
  userId: 'user-1',
  leagueId: 'league-2',
  provider: 'sleeper',
  providerLeagueId: 'lg-2',
  providerOwnerId: 'ow-2',
  leagueName: 'League Two',
};

describe('GET /api/leagues/mine', () => {
  const app = createApp();

  beforeEach(() => {
    mockListLeaguesForUser.mockReset();
    mockActivateExistingLeague.mockReset();
  });

  it('returns the list of leagues on the happy path', async () => {
    mockListLeaguesForUser.mockResolvedValueOnce(sampleLeagues);

    const res = await request(app).get('/api/leagues/mine');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ leagues: sampleLeagues });
  });

  it('returns 500 when the repository throws', async () => {
    mockListLeaguesForUser.mockRejectedValueOnce(new Error('db down'));

    const res = await request(app).get('/api/leagues/mine');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error listing leagues' });
  });
});

describe('PUT /api/leagues/active', () => {
  const app = createApp();

  beforeEach(() => {
    mockListLeaguesForUser.mockReset();
    mockActivateExistingLeague.mockReset();
  });

  it('activates the given league on the happy path', async () => {
    mockActivateExistingLeague.mockResolvedValueOnce(sampleSettings);

    const res = await request(app).put('/api/leagues/active').send({ leagueId: 'league-2' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(sampleSettings);
    expect(mockActivateExistingLeague).toHaveBeenCalledWith('league-2');
  });

  it('returns 400 when leagueId is missing', async () => {
    const res = await request(app).put('/api/leagues/active').send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'leagueId is required' });
    expect(mockActivateExistingLeague).not.toHaveBeenCalled();
  });

  it('returns 500 when the repository throws', async () => {
    mockActivateExistingLeague.mockRejectedValueOnce(new Error('league not found for this user'));

    const res = await request(app).put('/api/leagues/active').send({ leagueId: 'league-99' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error activating league' });
  });
});

describe('DELETE /api/leagues/:id', () => {
  const app = createApp();

  beforeEach(() => {
    mockRemoveLeague.mockReset();
  });

  it('removes the given league on the happy path', async () => {
    mockRemoveLeague.mockResolvedValueOnce(undefined);

    const res = await request(app).delete('/api/leagues/league-2');

    expect(res.status).toBe(204);
    expect(mockRemoveLeague).toHaveBeenCalledWith('league-2');
  });

  it('returns 500 when the repository throws (e.g. league not found for this user)', async () => {
    mockRemoveLeague.mockRejectedValueOnce(new Error('league not found for this user'));

    const res = await request(app).delete('/api/leagues/league-99');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error removing league' });
  });
});
