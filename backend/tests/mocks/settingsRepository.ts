import { vi } from 'vitest';

// Shared fakes for `vi.mock('../../src/repositories/settingsRepository', ...)`. Route
// tests script per-test return values/rejections instead of touching Supabase, which
// has its own fetch/retry internals that would fight network-level mocking (same
// rationale as tests/mocks/openai.ts).
export const mockGetActiveLeagueSettings = vi.fn();
export const mockSetActiveLeague = vi.fn();
export const mockListLeaguesForUser = vi.fn();
export const mockActivateExistingLeague = vi.fn();
export const mockRemoveLeague = vi.fn();
