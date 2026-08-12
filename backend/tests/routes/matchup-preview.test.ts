import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { http, HttpResponse } from 'msw';
import { mockCreate, MockOpenAI } from '../mocks/openai';
import { mswServer } from '../msw/server';
import { MATCHUP_SYSTEM_PROMPT } from '../../src/service-functions/buildCoachContext';
import { TEST_OPPONENT } from '../msw/handlers';

vi.mock('openai', () => ({ default: MockOpenAI }));

import { createApp } from '../../src/server';

describe('POST /api/matchup-preview', () => {
  const app = createApp();

  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns a preview on the happy path', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Predicted Winner: Your Team.' } }],
    });

    const res = await request(app)
      .post('/api/matchup-preview')
      .send({
        myTeam: { name: 'Team A', players: [{ id: '1', name: 'Player A', position: 'RB' }] },
        opponentTeam: { name: 'Team B', players: [{ id: '2', name: 'Player B', position: 'WR' }] },
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ preview: 'Predicted Winner: Your Team.' });
  });

  it('sends the matchup-scoped Coach Frank system prompt ahead of the two-team context', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Predicted Winner: Your Team.' } }],
    });

    await request(app)
      .post('/api/matchup-preview')
      .send({
        myTeam: { name: 'Team A', players: [{ id: '1', name: 'Player A', position: 'RB' }] },
        opponentTeam: { name: 'Team B', players: [{ id: '2', name: 'Player B', position: 'WR' }] },
      });

    const messages = mockCreate.mock.calls[0][0].messages;
    expect(messages[0]).toEqual({ role: 'system', content: MATCHUP_SYSTEM_PROMPT });
    expect(messages[1].role).toBe('user');
  });

  it('includes both team labels and both rosters in the context, with weekly matchup framing', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Predicted Winner: Your Team.' } }],
    });

    await request(app)
      .post('/api/matchup-preview')
      .send({
        myTeam: { name: 'Team A', players: [{ id: '1', name: 'Player A', position: 'RB' }] },
        opponentTeam: { name: 'Team B', players: [{ id: '2', name: 'Player B', position: 'WR' }] },
      });

    const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
    expect(userMessage).toContain('Team A (YOUR TEAM)');
    expect(userMessage).toContain('Team B (OPPONENT)');
    expect(userMessage).toContain('Player A');
    expect(userMessage).toContain('Player B');
    expect(userMessage).toContain('WEEKLY_PROJECTION');
    expect(userMessage).toContain(`OPPONENT: ${TEST_OPPONENT}`);
  });

  // A single roster-mate's Sleeper weekly-stats endpoint failing shouldn't sink the
  // whole request — that player's context degrades to "unavailable" instead.
  it("still returns 200 when one player's weekly stats fetch fails, marking them unavailable", async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ params }) => {
        if (params.playerId === 'broken-player-id') {
          return HttpResponse.error();
        }
        return HttpResponse.json(null);
      }),
    );
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Predicted Winner: Your Team.' } }],
    });

    const res = await request(app)
      .post('/api/matchup-preview')
      .send({
        myTeam: { name: 'Team A', players: [{ id: 'broken-player-id', name: 'Player A', position: 'RB' }] },
        opponentTeam: { name: 'Team B', players: [{ id: '2', name: 'Player B', position: 'WR' }] },
      });

    expect(res.status).toBe(200);
    const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
    expect(userMessage).toContain('Player A');
    expect(userMessage).toContain('unavailable');
  });

  it('returns 400 when myTeam.players is missing or empty', async () => {
    const res = await request(app)
      .post('/api/matchup-preview')
      .send({ myTeam: { name: 'Team A', players: [] }, opponentTeam: { name: 'Team B', players: [{ id: '2', name: 'Player B' }] } });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid myTeam data' });
  });

  it('returns 400 when opponentTeam is missing', async () => {
    const res = await request(app)
      .post('/api/matchup-preview')
      .send({ myTeam: { name: 'Team A', players: [{ id: '1', name: 'Player A' }] } });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid opponentTeam data' });
  });

  it('returns a clean 500 JSON error when the OpenAI call rejects', async () => {
    mockCreate.mockRejectedValueOnce(new Error('OpenAI is down'));

    const res = await request(app)
      .post('/api/matchup-preview')
      .send({
        myTeam: { name: 'Team A', players: [{ id: '1', name: 'Player A' }] },
        opponentTeam: { name: 'Team B', players: [{ id: '2', name: 'Player B' }] },
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error generating matchup preview' });
  });
});
