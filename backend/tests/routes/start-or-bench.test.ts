import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { mockCreate, MockOpenAI } from '../mocks/openai';

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
