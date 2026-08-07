import { beforeAll, afterAll, afterEach } from 'vitest';
import { mswServer } from './msw/server';

// Runs before any test file (see vitest.config.mts's setupFiles). dotenv.config() in
// server.ts never overrides already-set process.env vars, and this file runs before
// server.ts is ever imported, so these dummy values win even on a dev machine with a
// populated backend/.env — tests never touch real secrets.
process.env.OPENAI_API_KEY = 'test-key';
process.env.SLEEPER_LEAGUE_ID = 'test-league-id';
process.env.SLEEPER_OWNER_ID = 'test-owner-id';

// onUnhandledRequest: 'error' makes any accidentally-unmocked external call fail the
// test loudly instead of silently hitting live Sleeper/OpenAI endpoints.
beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mswServer.resetHandlers());
afterAll(() => mswServer.close());
