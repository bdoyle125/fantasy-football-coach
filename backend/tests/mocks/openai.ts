import { vi } from 'vitest';

// Shared fake for `vi.mock('openai', () => ({ default: MockOpenAI }))`. Each route test
// file imports mockCreate to script per-test responses (mockResolvedValueOnce,
// mockRejectedValueOnce, etc.) instead of hitting the real OpenAI SDK, which has its
// own retry/backoff logic that would fight with network-level mocking.
export const mockCreate = vi.fn();

export class MockOpenAI {
  chat = {
    completions: {
      create: mockCreate,
    },
  };
}
