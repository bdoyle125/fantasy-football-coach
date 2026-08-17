# Fantasy Football Coach 🏈

A lightweight web app that pulls your Sleeper fantasy football roster and stats, then
uses an AI "Coach Frank" persona (OpenAI `gpt-5-mini`) to generate team analysis,
start/bench calls, matchup previews, season summaries, and open-ended Q&A.

See [`ROADMAP.md`](./ROADMAP.md) for the project's session-by-session build history and
status.

## Repo layout

This is a monorepo with **no root-level `package.json`** — the two apps are independent,
each with its own dependencies and scripts.

```
UI/            Vue 3 SPA (Vite, TypeScript, PrimeVue)
backend/       Express 5 API (TypeScript)
bruno-calls/   Bruno collection for manually exercising the backend API
```

- **`UI/`** — Vue 3 (Options API) frontend. Pages: Roster (`/`), Player detail
  (`/player/:playerId`), Matchup Preview (`/matchup`), Leagues (`/leagues`), Ask Coach
  Anything (`/ask-coach`).
- **`backend/`** — Express API. Fetches roster/stats from the Sleeper API, calls OpenAI
  for AI features, and persists which league/owner is "active" in Supabase.

## Local setup

### 1. Backend

```
cd backend
npm install
cp .env.example .env   # fill in the values below
```

Required env vars (`backend/.env`, gitignored):

| Var | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API key for all Coach Frank AI features |
| `SLEEPER_LEAGUE_ID` / `SLEEPER_OWNER_ID` | Fallback league/owner, used only if no active league is set in Supabase yet |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase project storing the active league pointer |
| `PORT` | Optional, defaults to `5000` |

One-time Supabase setup: run the SQL in `backend/db/migrations/0001_init.sql` against
your Supabase project, then seed it from your `SLEEPER_LEAGUE_ID`/`SLEEPER_OWNER_ID`:

```
npm run db:seed
```

Then start the API:

```
npm run dev
```

Runs on `http://localhost:5000`.

### 2. Frontend

```
cd UI
npm install
cp .env.example .env   # VITE_API_URL can stay empty for local dev
npm run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:5000` (see
`UI/vite.config.ts`), so the backend must already be running.

### 3. Bruno collection (optional)

`bruno-calls/fantasy-football-coach` has a saved request for every backend route —
useful for exercising the API without the UI. Point it at `http://localhost:5000`.

## Running tests

```
cd backend
npm test
```

Vitest + Supertest + MSW; Sleeper/OpenAI/Supabase calls are all mocked, so no real
external calls happen in CI. There are no automated frontend tests — verify UI changes
manually (`npm run type-check` and `npm run lint` in `UI/` catch type/style issues).

## Deployment

The app is deployed on **Netlify** (frontend) and **Render** (backend). Both are set to
auto-deploy on push to `main`. To verify the live app after a change:

1. Roster loads on the deployed frontend URL.
2. Sidebar navigation reaches Roster, Leagues, and Ask Coach Anything without errors.
3. On the Leagues page, add a second league and switch the active league — confirms the
   Supabase round-trip works against the real project.
4. Ask Coach Anything returns a real reply — confirms the OpenAI round-trip.
5. Run Team Analysis and Season Summary from the Roster page.
6. Open the browser console on the deployed build (not just `localhost`) and confirm
   there are no errors, and no horizontal overflow on a mobile-width viewport.
