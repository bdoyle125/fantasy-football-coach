import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { mockCreate, MockOpenAI } from '../mocks/openai';
import { SEASON_SUMMARY_SYSTEM_PROMPT } from '../../src/service-functions/buildCoachContext';

// Must run before `createApp` is imported, same rationale as analyze-team.test.ts.
vi.mock('openai', () => ({ default: MockOpenAI }));

import { createApp } from '../../src/server';

describe('POST /api/season-summary', () => {
  const app = createApp();

  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns the season summary on the happy path', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Your season has been a rollercoaster.' } }],
    });

    const res = await request(app)
      .post('/api/season-summary')
      .send({ players: [{ id: '1234', name: 'Player A', position: 'QB', team: 'KC' }] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ summary: 'Your season has been a rollercoaster.' });
  });

  it('sends the season-summary Coach Frank system prompt ahead of the player-context user message', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Your season has been a rollercoaster.' } }],
    });

    await request(app)
      .post('/api/season-summary')
      .send({ players: [{ id: '1234', name: 'Player A', position: 'QB', team: 'KC' }] });

    const messages = mockCreate.mock.calls[0][0].messages;
    expect(messages[0]).toEqual({ role: 'system', content: SEASON_SUMMARY_SYSTEM_PROMPT });
    expect(messages[1].role).toBe('user');
  });

  it('returns 400 when players is missing or not an array', async () => {
    const res = await request(app).post('/api/season-summary').send({ players: 'not-an-array' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid players data' });
  });

  it('returns a clean JSON error when the OpenAI call rejects, not a stack trace', async () => {
    mockCreate.mockRejectedValueOnce(new Error('OpenAI is down'));

    const res = await request(app)
      .post('/api/season-summary')
      .send({ players: [{ name: 'Player A' }] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error generating season summary' });
  });

  it('returns 500 when OpenAI responds with no choices', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [] });

    const res = await request(app)
      .post('/api/season-summary')
      .send({ players: [{ name: 'Player A' }] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'No valid response from OpenAI API' });
  });
});
