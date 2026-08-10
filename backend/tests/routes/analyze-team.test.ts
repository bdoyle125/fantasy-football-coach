import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { http, HttpResponse } from 'msw';
import { mockCreate, MockOpenAI } from '../mocks/openai';
import { mswServer } from '../msw/server';
import { SEASON_SYSTEM_PROMPT } from '../../src/service-functions/buildCoachContext';

// Must run before `createApp` is imported: server.ts does `new OpenAI(...)` at module
// construction time, so the mock has to be registered first or the real SDK gets used.
vi.mock('openai', () => ({ default: MockOpenAI }));

import { createApp } from '../../src/server';

// The ROADMAP-required centerpiece of Session 5: happy path plus every OpenAI failure
// mode (reject, empty choices, slow-then-reject) for the one route the roadmap names
// explicitly.
describe('POST /api/analyze-team', () => {
  const app = createApp();

  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns AI analysis on the happy path', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Trade your kicker.' } }],
    });

    const res = await request(app)
      .post('/api/analyze-team')
      .send({ players: [{ name: 'Player A', position: 'QB', team: 'KC', stats: {} }] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ analysis: 'Trade your kicker.' });
  });

  it('sends the season-scoped Coach Sideline system prompt ahead of the player-context user message', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Trade your kicker.' } }],
    });

    await request(app)
      .post('/api/analyze-team')
      .send({ players: [{ id: '1234', name: 'Player A', position: 'QB', team: 'KC' }] });

    const messages = mockCreate.mock.calls[0][0].messages;
    expect(messages[0]).toEqual({ role: 'system', content: SEASON_SYSTEM_PROMPT });
    expect(messages[1].role).toBe('user');
  });

  it('includes season and last-season stats, and omits single-week matchup framing', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Trade your kicker.' } }],
    });

    await request(app)
      .post('/api/analyze-team')
      .send({ players: [{ id: '1234', name: 'Player A', position: 'QB', team: 'KC' }] });

    const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
    expect(userMessage).toContain('SEASON_STATS');
    expect(userMessage).toContain('LAST_SEASON_STATS');
    expect(userMessage).not.toContain('WEEKLY_STATS');
    expect(userMessage).not.toContain('WEEKLY_PROJECTION');
    expect(userMessage).not.toContain('OPPONENT');
  });

  // A single roster-mate's Sleeper stats endpoint failing shouldn't sink the whole
  // request — that player's context degrades to "unavailable" instead.
  it('still returns 200 when one player\'s season stats fetch fails, marking that player unavailable', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ params }) => {
        if (params.playerId === 'broken-player-id') {
          return HttpResponse.error();
        }
        return HttpResponse.json(null);
      }),
    );
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Trade your kicker.' } }],
    });

    const res = await request(app)
      .post('/api/analyze-team')
      .send({ players: [{ id: 'broken-player-id', name: 'Player A', position: 'QB', team: 'KC' }] });

    expect(res.status).toBe(200);
    const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
    expect(userMessage).toContain('Player A');
    expect(userMessage).toContain('unavailable');
  });

  it('returns 400 when players is missing or not an array', async () => {
    const res = await request(app).post('/api/analyze-team').send({ players: 'not-an-array' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid players data' });
  });

  // The catch block only ever fires for upstream/server-side failures (Sleeper/OpenAI),
  // since bad client input is already rejected by the explicit 400 checks above — so it
  // returns 500, matching every other route's convention.
  it('returns a clean JSON error when the OpenAI call rejects, not a stack trace', async () => {
    mockCreate.mockRejectedValueOnce(new Error('OpenAI is down'));

    const res = await request(app)
      .post('/api/analyze-team')
      .send({ players: [{ name: 'Player A' }] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error analyzing team' });
    expect(Object.keys(res.body)).toEqual(['error']);
  });

  // Distinct from the reject case above: this is the explicit `if (!choices...)` guard
  // inside the try block, not the catch, so it's a genuinely different status (500).
  it('returns 500 when OpenAI responds with no choices', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [] });

    const res = await request(app)
      .post('/api/analyze-team')
      .send({ players: [{ name: 'Player A' }] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'No valid response from OpenAI API' });
  });

  // Covers the ROADMAP's "slow AI call fails gracefully" requirement: a short real
  // delay (not fake timers) proves the request resolves cleanly instead of hanging.
  it('fails gracefully instead of hanging when the OpenAI call is slow and then rejects', async () => {
    mockCreate.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), 20);
        }),
    );

    const res = await request(app)
      .post('/api/analyze-team')
      .send({ players: [{ name: 'Player A' }] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error analyzing team' });
  });
});
