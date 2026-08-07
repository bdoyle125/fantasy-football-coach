import dotenv from 'dotenv';
import { ensureSingleUser, setActiveLeague } from '../src/repositories/settingsRepository';

dotenv.config();

// One-time bootstrap: copies today's SLEEPER_LEAGUE_ID/SLEEPER_OWNER_ID env vars into
// Supabase as the seeded user's active league. Run manually via `npm run db:seed` after
// the 0001_init.sql migration has been applied and SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
// are set in backend/.env -- not wired into `npm run dev`/`start`.
async function main(): Promise<void> {
  const leagueId = process.env.SLEEPER_LEAGUE_ID;
  const ownerId = process.env.SLEEPER_OWNER_ID;
  if (!leagueId || !ownerId) {
    throw new Error('SLEEPER_LEAGUE_ID and SLEEPER_OWNER_ID must be set in backend/.env to seed settings');
  }

  await ensureSingleUser();
  const settings = await setActiveLeague({
    provider: 'sleeper',
    providerLeagueId: leagueId,
    providerOwnerId: ownerId,
  });

  console.log('Seeded active league settings:', settings);
}

main().catch((error: unknown) => {
  console.error('Failed to seed settings:', error);
  process.exit(1);
});
