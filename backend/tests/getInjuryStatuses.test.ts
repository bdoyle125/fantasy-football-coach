import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getInjuryStatuses } from '../src/service-functions/getInjuryStatuses';
import { mswServer } from './msw/server';
import { TEST_PLAYER_ID } from './msw/handlers';

describe('getInjuryStatuses', () => {
  it('maps a rostered player to their injury_status from the players dictionary', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        return HttpResponse.json({
          [TEST_PLAYER_ID]: { full_name: 'Test Player', injury_status: 'Questionable' },
        });
      }),
    );

    const statuses = await getInjuryStatuses([TEST_PLAYER_ID]);

    expect(statuses.get(TEST_PLAYER_ID)).toBe('Questionable');
  });

  it('maps a player missing from the dictionary to null', async () => {
    const statuses = await getInjuryStatuses(['unknown-player-id']);

    expect(statuses.get('unknown-player-id')).toBeNull();
  });

  it('maps every requested player to null when the dictionary fetch fails, without throwing', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        return HttpResponse.error();
      }),
    );

    const statuses = await getInjuryStatuses([TEST_PLAYER_ID, 'another-player-id']);

    expect(statuses.get(TEST_PLAYER_ID)).toBeNull();
    expect(statuses.get('another-player-id')).toBeNull();
  });

  it('maps every requested player to null when the dictionary responds with a non-ok status', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        return HttpResponse.json({ error: 'boom' }, { status: 500 });
      }),
    );

    const statuses = await getInjuryStatuses([TEST_PLAYER_ID]);

    expect(statuses.get(TEST_PLAYER_ID)).toBeNull();
  });

  it('caches the players dictionary so a second call does not refetch it', async () => {
    let requestCount = 0;
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        requestCount++;
        return HttpResponse.json({ [TEST_PLAYER_ID]: { injury_status: 'Out' } });
      }),
    );

    await getInjuryStatuses([TEST_PLAYER_ID]);
    const statuses = await getInjuryStatuses([TEST_PLAYER_ID]);

    expect(statuses.get(TEST_PLAYER_ID)).toBe('Out');
    expect(requestCount).toBe(1);
  });

  it('falls back to the last cached dictionary when a later refetch fails', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        return HttpResponse.json({ [TEST_PLAYER_ID]: { injury_status: 'Out' } });
      }),
    );
    await getInjuryStatuses([TEST_PLAYER_ID]);

    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        return HttpResponse.error();
      }),
    );
    const statuses = await getInjuryStatuses([TEST_PLAYER_ID]);

    expect(statuses.get(TEST_PLAYER_ID)).toBe('Out');
  });
});
