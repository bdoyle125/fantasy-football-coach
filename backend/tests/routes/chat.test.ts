import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { mockCreate, MockOpenAI } from '../mocks/openai';
import { CHAT_SYSTEM_PROMPT } from '../../src/service-functions/buildChatContext';

// Must run before `createApp` is imported, same rationale as analyze-team.test.ts.
vi.mock('openai', () => ({ default: MockOpenAI }));

import { createApp } from '../../src/server';

describe('POST /api/chat', () => {
  const app = createApp();

  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns the AI reply on the happy path', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Sure, here is my take.' } }],
    });

    const res = await request(app)
      .post('/api/chat')
      .send({
        messages: [{ role: 'user', content: 'Should I start my RB2 this week?' }],
        players: [{ id: '1234', name: 'Player A', position: 'RB', team: 'KC' }],
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reply: 'Sure, here is my take.' });
  });

  it('sends the chat system prompt with roster context, followed by the conversation history', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Sure, here is my take.' } }],
    });

    await request(app)
      .post('/api/chat')
      .send({
        messages: [
          { role: 'user', content: 'What do you think of my WRs?' },
          { role: 'assistant', content: 'They look solid.' },
          { role: 'user', content: 'Any trade advice?' },
        ],
        players: [{ id: '1234', name: 'Player A', position: 'WR', team: 'KC' }],
      });

    const messages = mockCreate.mock.calls[0][0].messages;
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain(CHAT_SYSTEM_PROMPT);
    expect(messages[0].content).toContain('Player A');
    expect(messages.slice(1)).toEqual([
      { role: 'user', content: 'What do you think of my WRs?' },
      { role: 'assistant', content: 'They look solid.' },
      { role: 'user', content: 'Any trade advice?' },
    ]);
  });

  it('returns 400 when messages is missing or not an array', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ messages: 'not-an-array', players: [] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid messages data' });
  });

  it('returns 400 when messages is an empty array', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [], players: [] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid messages data' });
  });

  it('returns 400 when a message entry is malformed', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'system', content: 'not allowed from client' }], players: [] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid messages data' });
  });

  it('returns 400 when players is missing or not an array', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'hi' }], players: 'not-an-array' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid players data' });
  });

  it('returns a clean JSON error when the OpenAI call rejects, not a stack trace', async () => {
    mockCreate.mockRejectedValueOnce(new Error('OpenAI is down'));

    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'hi' }], players: [] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error generating chat response' });
  });

  it('returns 500 when OpenAI responds with no choices', async () => {
    mockCreate.mockResolvedValueOnce({ choices: [] });

    const res = await request(app)
      .post('/api/chat')
      .send({ messages: [{ role: 'user', content: 'hi' }], players: [] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'No valid response from OpenAI API' });
  });
});
