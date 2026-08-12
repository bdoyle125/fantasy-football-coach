import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { http, HttpResponse } from 'msw';
import { mockCreate, MockOpenAI } from '../mocks/openai';
import { mswServer } from '../msw/server';
import { WEEKLY_SYSTEM_PROMPT } from '../../src/service-functions/buildCoachContext';
import { TEST_OPPONENT } from '../msw/handlers';

vi.mock('openai', () => ({ default: MockOpenAI }));

import { createApp } from '../../src/server';

// Same OpenAI-call pattern and mock plumbing as analyze-team.test.ts, added for
// consistency even though this route isn't explicitly named in the ROADMAP checklist.
describe('POST /api/start-or-bench', () => {
  const app = createApp();

  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns a recommendation on the happy path', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Start him, easy matchup.' } }],
    });

    const res = await request(app)
      .post('/api/start-or-bench')
      .send({
        player: { name: 'Player A', position: 'RB' },
        roster: [{ name: 'Player A', position: 'RB' }],
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ recommendation: 'Start him, easy matchup.' });
  });

  it('sends the weekly-scoped Coach Frank system prompt ahead of the roster-context user message', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Start him, easy matchup.' } }],
    });

    await request(app)
      .post('/api/start-or-bench')
      .send({
        player: { id: '1234', name: 'Player A', position: 'RB' },
        roster: [{ id: '1234', name: 'Player A', position: 'RB' }],
      });

    const messages = mockCreate.mock.calls[0][0].messages;
    expect(messages[0]).toEqual({ role: 'system', content: WEEKLY_SYSTEM_PROMPT });
    expect(messages[1].role).toBe('user');
  });

  it('includes the weekly opponent and defense ranking, and omits season-long framing', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Start him, easy matchup.' } }],
    });

    await request(app)
      .post('/api/start-or-bench')
      .send({
        player: { id: '1234', name: 'Player A', position: 'RB' },
        roster: [{ id: '1234', name: 'Player A', position: 'RB' }],
      });

    const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
    expect(userMessage).toContain('WEEKLY_PROJECTION');
    expect(userMessage).toContain(`OPPONENT: ${TEST_OPPONENT}`);
    expect(userMessage).not.toContain('SEASON_STATS');
    expect(userMessage).not.toContain('LAST_SEASON_STATS');
  });

  // A single roster-mate's Sleeper weekly-stats endpoint failing shouldn't sink the
  // whole request — that player's context degrades to "unavailable" instead.
  it('still returns 200 when a roster-mate\'s weekly stats fetch fails, marking them unavailable', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/stats/nfl/player/:playerId', ({ params }) => {
        if (params.playerId === 'broken-player-id') {
          return HttpResponse.error();
        }
        return HttpResponse.json(null);
      }),
    );
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Start him, easy matchup.' } }],
    });

    const res = await request(app)
      .post('/api/start-or-bench')
      .send({
        player: { id: 'broken-player-id', name: 'Player A', position: 'RB' },
        roster: [{ id: 'broken-player-id', name: 'Player A', position: 'RB' }],
      });

    expect(res.status).toBe(200);
    const userMessage = mockCreate.mock.calls[0][0].messages[1].content;
    expect(userMessage).toContain('Player A');
    expect(userMessage).toContain('unavailable');
  });

  // Unlike analyze-team's catch block, this route's catch correctly returns 500.
  it('returns a clean 500 JSON error when the OpenAI call rejects', async () => {
    mockCreate.mockRejectedValueOnce(new Error('OpenAI is down'));

    const res = await request(app)
      .post('/api/start-or-bench')
      .send({
        player: { name: 'Player A', position: 'RB' },
        roster: [{ name: 'Player A', position: 'RB' }],
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error generating start/bench recommendation' });
  });
});
