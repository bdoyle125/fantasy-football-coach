import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { mockGetActiveLeagueSettings, mockSetActiveLeague } from '../mocks/settingsRepository';

// Must run before `createApp` is imported, same rationale as the OpenAI mock: register
// the fake before server.ts (transitively) imports the real repository module.
vi.mock('../../src/repositories/settingsRepository', () => ({
  getActiveLeagueSettings: mockGetActiveLeagueSettings,
  setActiveLeague: mockSetActiveLeague,
}));

import { createApp } from '../../src/server';

const sampleSettings = {
  userId: 'user-1',
  leagueId: 'league-1',
  provider: 'sleeper',
  providerLeagueId: 'test-league-id',
  providerOwnerId: 'test-owner-id',
  leagueName: 'Test League',
};

describe('GET /api/settings', () => {
  const app = createApp();

  beforeEach(() => {
    mockGetActiveLeagueSettings.mockReset();
    mockSetActiveLeague.mockReset();
  });

  it('returns the active league settings on the happy path', async () => {
    mockGetActiveLeagueSettings.mockResolvedValueOnce(sampleSettings);

    const res = await request(app).get('/api/settings');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(sampleSettings);
  });

  it('returns 404 when no active league is configured', async () => {
    mockGetActiveLeagueSettings.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/settings');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'No active league configured' });
  });

  it('returns 500 when the repository throws', async () => {
    mockGetActiveLeagueSettings.mockRejectedValueOnce(new Error('db down'));

    const res = await request(app).get('/api/settings');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error fetching settings' });
  });
});

describe('PUT /api/settings', () => {
  const app = createApp();

  beforeEach(() => {
    mockGetActiveLeagueSettings.mockReset();
    mockSetActiveLeague.mockReset();
  });

  it('updates the active league on the happy path', async () => {
    mockSetActiveLeague.mockResolvedValueOnce(sampleSettings);

    const res = await request(app)
      .put('/api/settings')
      .send({ provider: 'sleeper', providerLeagueId: 'new-league-id', providerOwnerId: 'new-owner-id' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(sampleSettings);
    expect(mockSetActiveLeague).toHaveBeenCalledWith({
      provider: 'sleeper',
      providerLeagueId: 'new-league-id',
      providerOwnerId: 'new-owner-id',
      leagueName: undefined,
    });
  });

  it('passes leagueName through when provided', async () => {
    mockSetActiveLeague.mockResolvedValueOnce(sampleSettings);

    await request(app).put('/api/settings').send({
      provider: 'sleeper',
      providerLeagueId: 'new-league-id',
      providerOwnerId: 'new-owner-id',
      leagueName: 'My League',
    });

    expect(mockSetActiveLeague).toHaveBeenCalledWith(
      expect.objectContaining({ leagueName: 'My League' }),
    );
  });

  it('returns 400 when provider is missing or invalid', async () => {
    const res = await request(app)
      .put('/api/settings')
      .send({ providerLeagueId: 'new-league-id', providerOwnerId: 'new-owner-id' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'provider must be "sleeper" or "espn"' });
    expect(mockSetActiveLeague).not.toHaveBeenCalled();
  });

  it('returns 400 when providerLeagueId is missing', async () => {
    const res = await request(app)
      .put('/api/settings')
      .send({ provider: 'sleeper', providerOwnerId: 'new-owner-id' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'providerLeagueId is required' });
  });

  it('returns 400 when providerOwnerId is missing', async () => {
    const res = await request(app)
      .put('/api/settings')
      .send({ provider: 'sleeper', providerLeagueId: 'new-league-id' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'providerOwnerId is required' });
  });

  it('returns 500 when the repository throws', async () => {
    mockSetActiveLeague.mockRejectedValueOnce(new Error('db down'));

    const res = await request(app)
      .put('/api/settings')
      .send({ provider: 'sleeper', providerLeagueId: 'new-league-id', providerOwnerId: 'new-owner-id' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error updating settings' });
  });
});
