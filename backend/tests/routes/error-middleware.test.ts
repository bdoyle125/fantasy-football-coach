import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server';

// express.json() calls next(err) on a malformed body before any route handler runs, so
// no route's own try/catch ever sees it — this is the one gap the centralized error
// handler in server.ts actually closes (everything else already had its own try/catch).
describe('centralized error-handling middleware', () => {
  const app = createApp();

  it('returns a clean JSON 500 for a malformed JSON request body, not an HTML stack trace', async () => {
    const res = await request(app)
      .post('/api/analyze-team')
      .set('Content-Type', 'application/json')
      .send('{"players": [invalid json');

    expect(res.status).toBe(500);
    expect(res.type).toBe('application/json');
    expect(typeof res.body.error).toBe('string');
  });
});
