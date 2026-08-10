import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { getPlayerBio } from '../src/service-functions/getPlayerBio';
import { getInjuryStatuses } from '../src/service-functions/getInjuryStatuses';
import { mswServer } from './msw/server';
import { TEST_PLAYER_ID, TEST_PREVIOUS_SEASON, playersDictFixture } from './msw/handlers';

describe('getPlayerBio', () => {
  it('reads name/team/position/age from the players dictionary', async () => {
    const bio = await getPlayerBio(TEST_PLAYER_ID);

    expect(bio).toEqual({
      name: playersDictFixture[TEST_PLAYER_ID].full_name,
      team: playersDictFixture[TEST_PLAYER_ID].team,
      position: playersDictFixture[TEST_PLAYER_ID].position,
      age: playersDictFixture[TEST_PLAYER_ID].age,
      yearsExp: playersDictFixture[TEST_PLAYER_ID].years_exp,
      rookieYear: null,
    });
  });

  it('returns a degraded bio for a player missing from the dictionary', async () => {
    const bio = await getPlayerBio('unknown-player-id');

    expect(bio).toEqual({ name: 'Unknown', team: null, position: null, age: null, yearsExp: null, rookieYear: null });
  });

  it('returns a degraded bio, without throwing, when the dictionary fetch fails', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        return HttpResponse.error();
      }),
    );

    const bio = await getPlayerBio(TEST_PLAYER_ID);

    expect(bio).toEqual({ name: 'Unknown', team: null, position: null, age: null, yearsExp: null, rookieYear: null });
  });

  it('derives rookieYear from metadata.rookie_year when present', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        return HttpResponse.json({
          [TEST_PLAYER_ID]: { ...playersDictFixture[TEST_PLAYER_ID], years_exp: 1, metadata: { rookie_year: TEST_PREVIOUS_SEASON } },
        });
      }),
    );

    const bio = await getPlayerBio(TEST_PLAYER_ID);

    expect(bio.rookieYear).toBe(Number(TEST_PREVIOUS_SEASON));
  });

  it('exposes yearsExp without inferring rookieYear itself when metadata.rookie_year is absent', async () => {
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        return HttpResponse.json({
          [TEST_PLAYER_ID]: { ...playersDictFixture[TEST_PLAYER_ID], years_exp: 0 },
        });
      }),
    );

    const bio = await getPlayerBio(TEST_PLAYER_ID);

    expect(bio.yearsExp).toBe(0);
    expect(bio.rookieYear).toBeNull();
  });

  it('shares one cached players-dictionary fetch with getInjuryStatuses', async () => {
    let requestCount = 0;
    mswServer.use(
      http.get('https://api.sleeper.app/v1/players/nfl', () => {
        requestCount++;
        return HttpResponse.json(playersDictFixture);
      }),
    );

    await getInjuryStatuses([TEST_PLAYER_ID]);
    await getPlayerBio(TEST_PLAYER_ID);

    expect(requestCount).toBe(1);
  });
});
