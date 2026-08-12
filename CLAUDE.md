# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project overview

Fantasy football coaching app: a Vue frontend and an Express/TypeScript backend. The backend pulls a user's roster and player stats from the Sleeper fantasy API and uses OpenAI (`gpt-5-mini`) to generate team-improvement suggestions, which the frontend displays.

See `ROADMAP.md` (repo root) for the current project status, schedule, and session-by-session checklist — it's not auto-loaded like this file, so check it directly when picking up work.

## Repo layout

This is a monorepo with **no root-level `package.json`** — the two apps are independent, each with its own dependencies and scripts.

```
UI/            Vue 3 SPA (Vite, TypeScript)
backend/       Express 5 API (TypeScript)
bruno-calls/   Bruno collection for manually exercising the backend API
myteam.json    Sample saved output of GET /api/myteam (not code)
```

## Backend (`backend/`)

- **Stack**: Express 5, TypeScript (`module: nodenext`, `target: esnext`, strict mode), run via `ts-node` in dev.
- **Scripts**: `npm run dev` (ts-node, port 5000), `npm run build` (tsc → `dist/`), `npm start` (`node dist/src/server.js`), `npm run db:seed` (one-time: copies `SLEEPER_LEAGUE_ID`/`SLEEPER_OWNER_ID` into Supabase as the seeded user's active league — see `src/db/`/`src/repositories/` below).
- **Architecture**: mostly everything in one place — there's no `routes/`/`controllers/`/`models/` split yet, but Session 6 introduced two small folders for the Supabase integration.
  - `src/server.ts` — a `Server` class that owns the Express app, the OpenAI client, middleware (`cors()`, `express.json()`), and every route, registered inline in `configureRoutes()`.
  - `src/service-functions/getTeamForOwner.ts` — fetches league users/rosters/players from Sleeper and assembles a `Team` of `Player`s.
  - `src/db/supabaseClient.ts` — lazy singleton `getSupabaseClient()`, built from `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`.
  - `src/repositories/settingsRepository.ts` — `getActiveLeagueSettings()`, `setActiveLeague()`, `ensureSingleUser()` (seed-script only); reads/writes the `users`/`leagues`/`user_settings` tables (schema in `db/migrations/0001_init.sql`).
  - `scripts/seedSettings.ts` — the `db:seed` one-time bootstrap script.
  - `types/` — `Player.ts`, `Team.ts`, and a `PlayerStats/` hierarchy (base `PlayerStats` plus position-specific subclasses: `QuarterbackStats`, `RunningBackStats`, `WideReceiverStats`, `TightEndStats`, `KickerStats`, `DefenseSpecialTeamsStats`, composed from `PasserStats`/`RusherStats`/`ReceiverStats`), mapping Sleeper's raw snake_case stat keys to typed fields.
- **Routes** (all in `src/server.ts`):

  | Method | Path | Purpose |
  |---|---|---|
  | GET | `/` | Health check; warns in console if Sleeper env vars are missing |
  | POST | `/api/openai-test` | Sanity-checks OpenAI connectivity |
  | GET | `/api/myteam` | Returns the roster for the active league/owner. Resolved from Supabase (`settingsRepository.getActiveLeagueSettings()`) first, falling back to `SLEEPER_LEAGUE_ID`/`SLEEPER_OWNER_ID` env vars if no active league is configured yet |
  | GET | `/api/settings` | Returns the active league settings stored in Supabase, or 404 if none configured |
  | PUT | `/api/settings` | Body `{ provider, providerLeagueId, providerOwnerId, leagueName? }` — upserts the league and marks it active |
  | GET | `/api/player/:playerId` | Proxies Sleeper's player-stats endpoint (hardcoded to last year — see `TODO` in source) |
  | GET | `/api/leagues` | Proxies Sleeper's leagues-for-user endpoint (also hardcoded to last year — see `TODO`) |
  | POST | `/api/analyze-team` | Takes `players[]` in the body, prompts OpenAI for team-improvement suggestions |

- **External integrations**:
  - **Sleeper API** (`api.sleeper.app`) — no key required, called with raw `fetch` (no axios).
  - **OpenAI API** — via the official `openai` SDK, model `gpt-5-mini`; requires `OPENAI_API_KEY`.
  - **Supabase** (Postgres) — via `@supabase/supabase-js`, accessed only from the backend with the `service_role` key (bypasses Row Level Security, which is intentionally left off since there's no per-user auth yet). Stores which league/owner is "active" so it persists across restarts instead of living only in env vars. Schema: `users` (single seeded row, no auth this session), `leagues` (one user → many, with a `provider` column for future ESPN support), `user_settings` (one row per user pointing at the active `leagues` row). See `backend/db/migrations/0001_init.sql`.
- **Env vars** (`backend/.env`, gitignored — not committed; see `backend/.env.example`): `OPENAI_API_KEY`, `SLEEPER_LEAGUE_ID`, `SLEEPER_OWNER_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Tests**: Vitest + Supertest + MSW under `backend/tests/`, run via `npm test`. New Supabase-touching code is tested by mocking `settingsRepository` at the module level in route tests, and against MSW-mocked PostgREST responses in `tests/settingsRepository.test.ts` directly — no real Supabase call happens in CI, no DB service container needed.

### Supabase schema

Added in Session 6 (migration: `backend/db/migrations/0001_init.sql`) to persist which Sleeper league/owner the app should use, replacing what used to live only in `SLEEPER_LEAGUE_ID`/`SLEEPER_OWNER_ID`. It stores **only that pointer** — no roster, player, or AI-analysis data is persisted anywhere; those are still fetched live from Sleeper/OpenAI on every request (see `getTeamForOwner.ts` and the `/api/analyze-team`/`/api/start-or-bench` routes). Row Level Security is off everywhere — the backend only ever connects with the `service_role` key, which bypasses it.

- **`users`** — one row per user. No auth exists yet (Supabase Auth is an optional Sessions 10–11 stretch item), so today there's exactly one row, created by `ensureSingleUser()` in `scripts/seedSettings.ts` on first run.
  | Column | Type | Notes |
  |---|---|---|
  | `id` | `uuid`, PK | `gen_random_uuid()` default |
  | `email` | `text`, unique, nullable | Unset by the seed script; a placeholder for future Auth |
  | `display_name` | `text`, nullable | Unset by the seed script |
  | `created_at` | `timestamptz` | |

- **`leagues`** — one user → many leagues (schema supports multi-league even though nothing in the UI/routes uses more than one yet). `provider`/`provider_league_id`/`provider_owner_id` are deliberately generic (not `sleeper_*`) so adding ESPN support later needs no rename — see [Multi-Provider Architecture](../ROADMAP.md#-multi-provider--multi-league-support-stretch) in `ROADMAP.md`.
  | Column | Type | Notes |
  |---|---|---|
  | `id` | `uuid`, PK | |
  | `user_id` | `uuid`, FK → `users.id` | `on delete cascade` |
  | `provider` | `text` | `check (provider in ('sleeper', 'espn'))`, defaults to `'sleeper'` |
  | `provider_league_id` | `text` | Opaque external ID (Sleeper's `league_id`) |
  | `provider_owner_id` | `text` | Opaque external ID (Sleeper's `user_id`/owner) |
  | `league_name` | `text`, nullable | Optional display label; `null` unless set via `PUT /api/settings` |
  | `created_at` / `updated_at` | `timestamptz` | |
  | *unique* | `(user_id, provider, provider_league_id, provider_owner_id)` | What `setActiveLeague()`'s upsert conflicts on |

- **`user_settings`** — one row per user, pointing at which `leagues` row is currently active. A separate table rather than an `is_active` flag on `leagues`, so "one active league per user" holds by construction (the PK *is* `user_id`) instead of needing a partial unique index.
  | Column | Type | Notes |
  |---|---|---|
  | `user_id` | `uuid`, PK, FK → `users.id` | `on delete cascade` |
  | `active_league_id` | `uuid`, nullable, FK → `leagues.id` | `on delete set null` |
  | `created_at` / `updated_at` | `timestamptz` | |

`GET /api/settings` reads this pointer chain (`user_settings` joined to `leagues`) via `settingsRepository.getActiveLeagueSettings()`; `PUT /api/settings` writes it via `setActiveLeague()`, which upserts the `leagues` row and repoints `user_settings.active_league_id` at it.

## Frontend (`UI/`)

- **Stack**: Vue 3.5 using the **Options API** (`defineComponent`, typed `data()`) throughout — not `<script setup>`. Match this style in new components. Built with Vite 7, TypeScript, PrimeVue 4 (Aura theme) for widgets plus Bootstrap 5 utility classes for layout. `vue-router` 4 for routing. No state management library (Pinia/Vuex) — state is local to components.
- **Scripts**: `npm run dev` (Vite dev server), `npm run build` (type-check + build), `npm run preview`, `npm run type-check` (`vue-tsc --build`), `npm run lint`, `npm run format` (Prettier).
- **Structure**:
  - `src/pages/` — `TeamList.vue` (home: roster table + "Analyze Team" button opening a dialog with the AI analysis) and `PlayerCard.vue` (player detail view, split into "Base Stats" and dynamically-rendered "Additional Stats").
  - `src/router/index.ts` — `/` → `TeamList`, `/player/:playerId` → `PlayerCard`, both lazy-loaded.
  - `src/service/` — the entire API layer: `TeamService.ts` and `PlayerService.ts`, plain classes using native `fetch` (no axios), reading `VITE_API_URL` from env.
  - `src/types/` — `Player`, `Team`, and a `PlayerStats/` hierarchy mirroring the backend's, as TS **classes** (not interfaces) with constructors that map raw API JSON to typed fields.
- **Dev proxy**: Vite proxies `/api` → `http://localhost:5000` (`vite.config.ts`), so the backend must be running on port 5000 for the frontend to fetch data.
- **Env**: `UI/.env` → `VITE_API_URL`.
- **Path alias**: `@/*` → `src/*`, used inconsistently — some files (e.g. `PlayerCard.vue`, `PlayerService.ts`) use it, others (`TeamList.vue`, `TeamService.ts`) use relative imports instead.
- **Known tech debt**: `UI/src/service/TeamService.ts` imports `Player` directly from `../../../backend/types/Player.js` — a cross-package import into the sibling `backend/` project — rather than `UI/src/types/Player.ts`. `UI/tsconfig.json` sets `rootDir: "../"` specifically to allow this. As a result there are **two divergent `Player`/`Team` type definitions** (one under `UI/src/types`, one under `backend/types`); be aware of which one a given file actually uses before editing either.
- **No automated tests exist** in the frontend.

## Running locally

1. `backend/`: copy env vars into `backend/.env` (including the Supabase ones — see `backend/.env.example`), run the SQL in `backend/db/migrations/0001_init.sql` against the Supabase project once, then `npm run db:seed` once to migrate `SLEEPER_LEAGUE_ID`/`SLEEPER_OWNER_ID` into the DB, then `npm run dev` (serves on port 5000).
2. `UI/`: `npm run dev` (Vite dev server; proxies `/api/*` calls to the backend).
3. `bruno-calls/` holds a Bruno collection (`fantasy-football-coach`) with saved requests against `http://localhost:5000` for manually exercising the API — one request per route: **Health Check** (`GET /`), **OpenAI Test** (`POST /api/openai-test`), **My Team** (`GET /api/myteam`), **Matchup** (`GET /api/matchup`), **Get Settings** (`GET /api/settings`), **Update Settings** (`PUT /api/settings`), **Player Detail** (`GET /api/player/:playerId`), **Leagues** (`GET /api/leagues`), **Analyze Team** (`POST /api/analyze-team`), **Start or Bench** (`POST /api/start-or-bench`), **Dashboard Insights** (`POST /api/dashboard-insights`), **Matchup Preview** (`POST /api/matchup-preview`).

## Notes for future work

- The backend has no routes/controllers/models split — if that changes, update this file. `src/db/` and `src/repositories/` (Session 6) are the first departures from "everything in `server.ts`".
- Two of the Sleeper-backed routes (`/api/player/:playerId`, `/api/leagues`) are hardcoded to "last year" per `TODO` comments in `server.ts`.
- No frontend UI exists yet for changing the active league/owner — it's managed via `GET`/`PUT /api/settings` (Bruno/curl) or the `db:seed` script. `UI/src/service/TeamService.ts` still calls `GET /api/myteam` with no params.
- No Supabase Auth/login exists yet — `users` currently has exactly one seeded row. If Auth is added (an optional Sessions 10–11 stretch item), Row Level Security should be turned on and the backend's Supabase reads scoped per-user.

## Coding style

Applies to all TypeScript in this repo (`backend/`, `UI/src/**/*.ts`, and `<script>` blocks in `UI/src/**/*.vue`).

- **Opening braces on the same line** as `if`, `else`, `for`, `while`, `for...of`, `for...in`, methods, classes, etc. (K&R / "Egyptian" style).
- **Always use braces** for `if`, `else`, `for`, `while`, `for...of`, `for...in` — even for single-line bodies. No braceless one-liners.
- **No multi-line ternary (`?:`) expressions.** A ternary that doesn't fit comfortably on one line is hard to read — rewrite it as an `if`/`else` (with braces). Single-line ternaries for short, simple value selection are fine. This also applies to nested ternaries (`a ? b : c ? d : e`) — never nest, always use `if`/`else` or a `switch`.

```ts
// Correct
if (condition) {
  doSomething();
} else {
  doOtherThing();
}

// Correct — short single-line ternary
const label = isActive ? "Active" : "Inactive";

// Wrong — missing braces
if (condition) doSomething();

// Wrong — brace on next line
if (condition)
{
  doSomething();
}

// Wrong — multi-line ternary; rewrite as if/else
const session = matched.relatedSessionId
  ? sessions.find((s) => s.sessionId === matched.relatedSessionId)
  : null;

// Correct — same logic as if/else
let session: Session | null = null;
if (matched.relatedSessionId) {
  session = sessions.find((s) => s.sessionId === matched.relatedSessionId) ?? null;
}

// Wrong — multi-line ternary narrowing a value via typeof
const projectedPoints = typeof projection?.projectedStats?.pts_ppr === "number"
  ? projection.projectedStats.pts_ppr
  : null;

// Correct — same logic as if/else
let projectedPoints: number | null = null;
if (typeof projection?.projectedStats?.pts_ppr === "number") {
  projectedPoints = projection.projectedStats.pts_ppr;
}

// Wrong — nested ternary
const tier = score > 90 ? "gold" : score > 50 ? "silver" : "bronze";
```

**No multi-line boolean (`&&`/`||`) expressions.** A boolean/logical expression assigned to a variable should stay on one line, even if that makes the line long — don't split each `&&`/`||` clause onto its own line.

```ts
// Wrong — logical expression split across lines
const isBetter = !best
  || rank < best.defenseRank
  || (rank === best.defenseRank && (projectedPoints ?? 0) > (best.projectedPoints ?? 0));

// Correct — kept on one line
const isBetter = !best || rank < best.defenseRank || (rank === best.defenseRank && (projectedPoints ?? 0) > (best.projectedPoints ?? 0));
```

**No ternaries that conditionally call a function (especially an `async`/`await`'d one) instead of selecting between two plain values.** A ternary should pick between two already-available values. If either branch invokes a function — particularly one with side effects like a DB/network call — the conditional is doing control flow, not value selection, and belongs in an `if`/`else` even if it fits on one line.

```ts
// Wrong — ternary conditionally decides whether to make a DB call
const settings = isSupabaseConfigured() ? await getActiveLeagueSettings() : null;

// Correct — same logic as if/else
let settings: ActiveLeagueSettings | null = null;
if (isSupabaseConfigured()) {
  settings = await getActiveLeagueSettings();
}
```

### Markup / template formatting

An element's content should be on its own line, separate from its tags — unless the whole element (tags + content) fits comfortably on one line. If attributes push the opening tag onto multiple lines, don't collapse the content onto the closing tag's line. Applies to Vue templates generally, not just one component.

```html
<!-- Wrong — content crammed onto the closing tag when attributes are multi-line -->
<div
  class="font-semibold text-3xl mb-6"
  v-if="showSalesData"
>Admin Dashboard</div>

<!-- Correct — content on its own line -->
<div
  class="font-semibold text-3xl mb-6"
  v-if="showSalesData"
>
  Admin Dashboard
</div>

<!-- Also correct — fits on one line -->
<div class="font-semibold text-3xl mb-6">Admin Dashboard</div>
```

An element with a single attribute/directive may stay on one line with the tag. An element with **two or more** attributes/directives must put each one on its own line — regardless of whether they'd fit together on one line — with the closing `>` (or self-closing `/>`) on its own line as well.

```html
<!-- Wrong — multiple attributes sharing lines, even though they'd fit -->
<Column field="name" header="Name" :sortable="true" :filter="true" />

<!-- Correct — one attribute per line -->
<Column
  field="name"
  header="Name"
  :sortable="true"
  :filter="true"
/>

<!-- Correct — single attribute stays inline -->
<DataTable :value="myteam.players">
```
