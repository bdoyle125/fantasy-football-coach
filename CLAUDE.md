# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project overview

Fantasy football coaching app: a Vue frontend and an Express/TypeScript backend. The backend pulls a user's roster and player stats from the Sleeper fantasy API and uses OpenAI (`gpt-5-mini`) to generate team-improvement suggestions, which the frontend displays.

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
- **Scripts**: `npm run dev` (ts-node, port 5000), `npm run build` (tsc → `dist/`), `npm start` (`node dist/src/server.js`). No `test` script.
- **Architecture**: everything is in one place — there's no `routes/`/`controllers/`/`models/` split yet.
  - `src/server.ts` — a `Server` class that owns the Express app, the OpenAI client, middleware (`cors()`, `express.json()`), and every route, registered inline in `configureRoutes()`.
  - `src/service-functions/getTeamForOwner.ts` — fetches league users/rosters/players from Sleeper and assembles a `Team` of `Player`s.
  - `types/` — `Player.ts`, `Team.ts`, and a `PlayerStats/` hierarchy (base `PlayerStats` plus position-specific subclasses: `QuarterbackStats`, `RunningBackStats`, `WideReceiverStats`, `TightEndStats`, `KickerStats`, `DefenseSpecialTeamsStats`, composed from `PasserStats`/`RusherStats`/`ReceiverStats`), mapping Sleeper's raw snake_case stat keys to typed fields.
- **Routes** (all in `src/server.ts`):

  | Method | Path | Purpose |
  |---|---|---|
  | GET | `/` | Health check; warns in console if Sleeper env vars are missing |
  | POST | `/api/openai-test` | Sanity-checks OpenAI connectivity |
  | GET | `/api/myteam` | Returns the roster for `SLEEPER_OWNER_ID` (optional `leagueId` query param) |
  | GET | `/api/player/:playerId` | Proxies Sleeper's player-stats endpoint (hardcoded to last year — see `TODO` in source) |
  | GET | `/api/leagues` | Proxies Sleeper's leagues-for-user endpoint (also hardcoded to last year — see `TODO`) |
  | POST | `/api/analyze-team` | Takes `players[]` in the body, prompts OpenAI for team-improvement suggestions |

- **External integrations**:
  - **Sleeper API** (`api.sleeper.app`) — no key required, called with raw `fetch` (no axios).
  - **OpenAI API** — via the official `openai` SDK, model `gpt-5-mini`; requires `OPENAI_API_KEY`.
- **Env vars** (`backend/.env`, gitignored — not committed): `OPENAI_API_KEY`, `SLEEPER_LEAGUE_ID`, `SLEEPER_OWNER_ID`.
- **No automated tests exist** in the backend.

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

1. `backend/`: copy env vars into `backend/.env`, then `npm run dev` (serves on port 5000).
2. `UI/`: `npm run dev` (Vite dev server; proxies `/api/*` calls to the backend).
3. `bruno-calls/` holds a Bruno collection (`fantasy-football-coach`) with four saved requests against `http://localhost:5000` for manually exercising the API: **OpenAI Test** (`POST /api/openai-test`), **My Team** (`GET /api/myteam`), **Analyze Team** (`POST /api/analyze-team`), **Leagues** (`GET /api/leagues`). There's no saved request for `GET /` or `GET /api/player/:playerId`.

## Notes for future work

- No automated tests exist anywhere in this repo today — don't assume a test suite to run; if adding one, there's no existing convention to follow yet.
- The backend has no routes/controllers/models split — if that changes, update this file.
- Two of the Sleeper-backed routes (`/api/player/:playerId`, `/api/leagues`) are hardcoded to "last year" per `TODO` comments in `server.ts`.
