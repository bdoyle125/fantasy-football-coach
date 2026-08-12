import { beforeAll, afterAll, afterEach } from 'vitest';
import { mswServer } from './msw/server';
import { clearInjuryStatusesCache } from '../src/service-functions/getInjuryStatuses';
import { clearDefenseRankingsCache } from '../src/service-functions/getDefenseRankings';
import { clearMatchupCache } from '../src/service-functions/getMatchupForOwner';

// Runs before any test file (see vitest.config.mts's setupFiles). dotenv.config() in
// server.ts never overrides already-set process.env vars, and this file runs before
// server.ts is ever imported, so these dummy values win even on a dev machine with a
// populated backend/.env — tests never touch real secrets.
process.env.OPENAI_API_KEY = 'test-key';
process.env.SLEEPER_LEAGUE_ID = 'test-league-id';
process.env.SLEEPER_OWNER_ID = 'test-owner-id';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// onUnhandledRequest: 'error' makes any accidentally-unmocked external call fail the
// test loudly instead of silently hitting live Sleeper/OpenAI endpoints.
beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  mswServer.resetHandlers();
  // Both caches are module-level singletons; clear them so one test's cached response
  // (e.g. a fetch-failure override) can't leak into the next test's assertions.
  clearInjuryStatusesCache();
  clearDefenseRankingsCache();
  clearMatchupCache();
});
afterAll(() => mswServer.close());
