import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { mockCreate, MockOpenAI } from '../mocks/openai';

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

  it('returns 400 when players is missing or not an array', async () => {
    const res = await request(app).post('/api/analyze-team').send({ players: 'not-an-array' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid players data' });
  });

  // Route's catch block returns 400 here (unlike every other route's 500) — that's
  // existing behavior, asserted as-is rather than "fixed" as part of this test suite.
  it('returns a clean JSON error when the OpenAI call rejects, not a stack trace', async () => {
    mockCreate.mockRejectedValueOnce(new Error('OpenAI is down'));

    const res = await request(app)
      .post('/api/analyze-team')
      .send({ players: [{ name: 'Player A' }] });

    expect(res.status).toBe(400);
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

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Error analyzing team' });
  });
});
