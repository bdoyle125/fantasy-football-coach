# Fantasy Football Coach — Project Roadmap 🏈

**Duration:** 12 sessions | **Time:** ~2 hrs/session | **Total Cost:** ~$10–15
**🏁 Ship-by date:** Wednesday, September 9, 2026 (2026 NFL regular season kickoff)

**Goal:** Build a lightweight web app that analyzes your fantasy football roster and generates AI-powered advice.

> 📄 **What this file is:** This is `ROADMAP.md`, a companion doc to `CLAUDE.md` that lives at the root of the repo. Unlike `CLAUDE.md`, Claude Code does **not** load this file automatically each session — check it manually (or follow the pointer in `CLAUDE.md`) for current status, the schedule, and what's next.

> ⚠️ **Rule for Claude Code:** Everything checked off below reflects code that already exists and works. Don't refactor, rename, restructure, or "improve" completed work unless a task explicitly calls for it. Build forward from where things stand.

---

## ⚙️ Tech Stack & Costs

**Frontend:** Vue (or React)
**Backend:** Express (Node.js)
**Database:** Supabase (free tier)
**AI:** OpenAI (GPT-4-mini or GPT-4-turbo)
**Sports API:** Sleeper API (free), with ESPN Fantasy planned as a second provider (see [Multi-Provider Architecture](#-multi-provider--multi-league-support-stretch))
**Hosting:** Netlify + Render (free)

💰 **Estimated total project cost:** $10 – 15

---

## 🧭 Project Status Snapshot (as of Aug 11)

**Done (Sessions 1–10):** repo scaffolded, frontend + backend running and deployed (Netlify + Render, deploy issue resolved), Sleeper API connected, roster/stats fetched and shown in a table, `/analyze-team` route with OpenAI summary, Player Cards with per-player "Start or Bench?" AI button, backend test suite (mocked Sleeper/OpenAI failure paths), Supabase project connected and storing user settings, `leagues` table designed with a `provider` column for future multi-provider support, "Coach Frank" AI persona with route-scoped context (season-long stats for team analysis, weekly stats + opponent/defense ranking + projections for start/bench calls), Player Card redesigned as a scannable scouting report (headline tiles, curated/categorized stat tiles, inline injury status) plus 3-year season history and current-season weekly stats with rookie-aware filtering, fantasy-matchup opponent resolution + AI "Matchup Preview" page, dashboard stat cards (heuristic Team Strength/Player to Watch + AI-reused Trade Suggestion), a mobile/loading/error-state polish pass across all three pages, a real Session-7 stats-unwrapping bug fix plus a last-season fallback for stats/defense rankings, and an expanded `/api/analyze-team` (now includes projection/matchup data too).

**Not started:** everything from Sessions 11–12 onward.

> "(Optional) Log past AI analyses" was deliberately skipped this session and deferred — noted in Session 6 below.

---

## 📅 Schedule to Kickoff (Sep 9, 2026)

Real-life constraints: 8–5 job (weekdays are out), Tue/Wed nights have a 7–8pm obligation, Thu/Fri nights are Pokemon. Same work windows as always — **Monday evenings and weekends** — but Sessions 4–6 landing early on Aug 6 buys back roughly two full weekends of slack.

| Dates | Day(s) | Focus |
| --- | --- | --- |
| Aug 6 | Thu | 🎉 Sessions 4–6 wrapped early |
| Aug 7 | Fri | Likely Pokemon night — off |
| **Aug 8** | Sat | 🎉 Session 7 — Smarter AI Coaching wrapped same-day |
| **Aug 9** | Sun | 🎉 Session 8 — Player View Redesign wrapped same-day (scope grew mid-session — see Session 8 notes below) |
| **Aug 10–11** | Mon evening–Tue | 🎉 Sessions 9 & 10 (Matchup Preview + Dashboard Polish, merged into one build) wrapped, plus a same-day follow-up pass — AI data-quality bug fixes, expanded `/api/analyze-team`, "Coach Frank" rename, completed Bruno collection (see Session 9 notes below) |
| Aug 15 | Sat | Freed up — was reserved as a Session 9 finish-up buffer, no longer needed |
| Aug 16 | Sun | Freed up — extra slack; available for an early start on Sessions 11–12 or a stretch goal |
| Aug 17 | Mon evening | Start Sessions 11–12 (README, deploy prep, bug pass) |
| **Aug 22–23** | Sat/Sun | Continue/finish Sessions 11–12 |
| Aug 24 | Mon evening | Continue wrap-up |
| **Aug 29–30** | Sat/Sun | Finish wrap-up. First real shot at a stretch goal if things stay smooth (see priority notes) |
| Aug 31 | Mon evening | Buffer |
| **Sep 5–6** | Sat/Sun | Full buffer weekend — final polish, or deeper stretch work |
| Sep 7 | Mon (Labor Day) | Bonus full day — buffer for whatever slipped |
| Sep 8 | Tue | Final smoke test after the 7pm obligation |
| **Sep 9** | Wed | 🏁 Kickoff — app should be live before 8:20pm ET |

**Priority calls, updated now that Sessions 7–10 are all done:**
- Session 7 (AI coaching) is done — it was the biggest, riskiest lift, and it wrapped same-day, which is exactly what freed up Aug 9–10 for the new Session 8 (Player View Redesign) without touching the kickoff date.
- Session 8 also wrapped same-day (Aug 9). Sessions 9 and 10 (merged) then wrapped by Aug 11, including a same-day follow-up pass beyond the original scope — which frees the *entire* Aug 15–16 weekend that had been reserved as a Session 9 finish-up buffer.
- With Sessions 7–10 done ahead of the per-session pacing, Sessions 11–12 can start as early as Aug 15–16 instead of waiting for Aug 17, if there's appetite to get further ahead rather than bank the slack.
- With three full weekends now in reserve (some mix of Aug 15–16, Aug 29–30, and Sep 5–6, depending how much of Sessions 11–12 gets pulled forward), **multi-league switching** is realistically attemptable — it's the lighter of the two stretch goals since it's mostly schema + UI, no external auth quirks.
- **ESPN support stays post-kickoff.** The cookie-based auth (`SWID`/`espn_s2`) is the kind of thing that eats a whole weekend on its own; not worth risking the ship date over.
- Whichever of Thu/Fri isn't a Pokemon night remains a natural overflow slot, still not relied on in the plan above.

---

## 🔧 Quick Reference (fill in / update as the project evolves)

- Frontend dev server: `npm run dev` *(from /frontend — confirm path)*
- Backend dev server: `npm run dev` *(from /backend — confirm path)*
- Backend tests: `npm test` *(from /backend — added in Session 5)*
- Env vars needed: `OPENAI_API_KEY`, `SLEEPER_LEAGUE_ID` *(see `.env.example`)*

---

## 🗓️ Session-by-Session Checklist

### ▶️ **Session 1 — Setup & Foundation**
- [x]  Initialize GitHub repo
- [x]  Scaffold frontend (Vue/React) and backend (Express)
- [x]  Create landing page with "Fantasy Football Coach" header
- [x]  Configure `.env` for API keys (OpenAI + Sports API)
- [x]  Deploy basic "Hello World" on Netlify (frontend) + Render (backend)

**🎯 Deliverable:** Live skeleton app online
**💸 Cost:** $0

---

### ▶️ **Session 2 — Sports API Integration**
- [x]  Connect to Sleeper API
- [x]  Fetch fantasy roster and basic player stats
- [x]  Display team on dashboard (table format)

**🎯 Deliverable:** "My Team" table with player names + stats
**💸 Cost:** $0

---

### ▶️ **Session 3 — Basic AI Team Analysis**
- [x]  Add backend route `/analyze-team`
- [x]  Send roster + stats to OpenAI → receive summary
- [x]  Display AI response below roster

**🎯 Deliverable:** Button ➡ "Analyze My Team" shows AI summary
**💸 Cost:** ~$1–2

---

### ▶️ **Session 4 — UI Polish + Player Advice**
- [x]  Install UI library (PrimeVue / Bootstrap)
- [x]  Create "Player Card" components (name, team, stats)
- [x]  Add AI button per player → "Start or Bench?"
- [x]  Resolve deploy problem blocking release

**🎯 Deliverable:** Interactive player cards with AI feedback
**💸 Cost:** ~$2 total

---

### ▶️ **Session 5 — Testing Foundations** ✅
- [x]  Choose a backend test framework: Jest (or Vitest) + Supertest for route testing
- [x]  Add an `npm test` script and a basic CI-friendly config
- [x]  Write unit tests for the existing `/analyze-team` route (happy path)
- [x]  Mock the Sleeper API (e.g. `nock` or `msw`) and test the roster-fetch logic against timeouts, 500s, and malformed JSON
- [x]  Mock the OpenAI API and test that a failed/slow AI call fails gracefully instead of crashing the request
- [x]  Add basic error-handling middleware (if not already present) so failed external API calls return a clean JSON error, not a stack trace

**🎯 Deliverable:** A test suite covering both existing external API calls, including their failure paths
**💸 Cost:** $0 (all external calls are mocked in tests)

> **Going forward:** every new backend route added in later sessions should ship with at least one happy-path test and one failure-path test. Cheap insurance against Sleeper or OpenAI having a bad day.

---

### ▶️ **Session 6 — Database Integration** ✅
- [x]  Set up Supabase project
- [x]  Connect Supabase to store user settings (team, league)
- [ ]  (Optional) Log past AI analyses — skipped this session, deferred
- [x]  Design the `leagues` table to support more than one league per user, and a `provider` column (`sleeper` / `espn`) — see [Multi-Provider Architecture](#-multi-provider--multi-league-support-stretch). You don't have to build multi-league yet, just don't paint yourself into a single-league schema.

**🎯 Deliverable:** Persistent user data across sessions
**💸 Cost:** $0

> **Status:** Done and verified against a live Supabase project — `GET /api/settings` and `GET /api/myteam` both confirmed reading the seeded row (see `backend/db/migrations/0001_init.sql`, `backend/src/db/`, `backend/src/repositories/settingsRepository.ts`). Only "Log past AI analyses" remains, deliberately deferred to a later session.

---

### ▶️ **Session 7 — Smarter AI Coaching** ✅
- [x]  Extend the Sleeper data fetch to pull **this session's stats** *and* **previous-season stats** for each rostered player
- [x]  Rewrite the AI system prompt to establish a clear "expert fantasy coach" persona — confident, direct, a little personality (see [AI Prompt Engineering Guidelines](#-ai-prompt-engineering-guidelines))
- [x]  Feed the model structured context: this-session stats, season-to-date averages, last-season totals, opponent defense ranking, injury status
- [x]  Explicitly instruct the model to reason *beyond* the numbers you hand it — matchup trends, recent news, general fantasy strategy — not just restate stats back
- [ ]  (Optional, adds cost) enable a web-search/retrieval tool call so the model can pull current injury/news updates instead of relying only on what you feed it — optional, deferred
- [x]  Add opponent defenses + game projections to the context
- [x]  Add coach-like tone and humor to responses

**🎯 Deliverable:** Personable "Coach AI" responses grounded in real weekly + historical stats, instructed to think past the raw numbers
**💸 Cost:** ~$3–5 cumulative (prompts get bigger with more stats)

> **Status:** Done and test-covered (80 backend tests passing) — see `backend/src/service-functions/getWeeklyStatsContext.ts`, `getSeasonStatsContext.ts`, `getPlayerProjection.ts`, `getDefenseRankings.ts`, and the "Coach Frank" persona/prompts in `buildCoachContext.ts`. One deviation from the original wording: rather than one shared context blob per player, the context is now deliberately scoped per route — `/api/start-or-bench` gets weekly stats, projection, and opponent/defense ranking (no season data), while `/api/analyze-team` gets season + last-season stats (no matchup data) — since one is a single-week decision and the other is a season-long team-construction question. Only the optional web-search/retrieval tool call remains undone.

---

### ▶️ **Session 8 — Player View Redesign** ✅
- [x]  Redesign the player detail page (`UI/src/pages/PlayerCard.vue`) to lead with the stats that actually drive a start/bench call — fantasy points, position rank, games played — instead of a flat, mostly-alphabetical two-column stat dump
- [x]  Hide or collapse stat fields that render `N/A` for a given player/position instead of always showing the full ~18-field "Base Stats" list regardless of relevance (e.g. defensive/special-teams snaps on a WR)
- [x]  Surface injury status inline on the page itself (the backend already tracks it via `getInjuryStatuses`), rather than only inside the AI's Start/Bench response text
- [x]  Move the long tail of raw box-score stats (today's "Additional Stats" card) behind a collapsible/expandable section so the page reads as a summary first, full detail on demand
- [x]  Pass over layout/visual hierarchy so the headline stats are scannable at a glance, not just another dense `<dl>` list

**🎯 Deliverable:** A player page that reads as a quick scouting-report summary instead of a raw stat dump, without losing access to the full data underneath
**💸 Cost:** $0 (frontend-only, no new API/AI calls)

> **Status:** Done and verified live — hit the real Sleeper API directly (catching and fixing a real bug where mocked test fixtures didn't match Sleeper's actual nested response shape) and screenshot-tested the actual UI in a browser across light/dark mode and desktop/mobile widths. 108 backend tests passing. See `UI/src/pages/PlayerCard.vue` and the backend's `getPlayerDetail.ts`/`getPlayerSeasonHistory.ts`/`getPlayerWeeklySeries.ts`/`getPlayerBio.ts`.
>
> Scope grew substantially beyond the original 5 items based on live feedback mid-session: added 3 years of season history and current-season weekly stats (originally scoped as "frontend-only, no new API calls" — this is no longer true, though dollar cost is still $0 since Sleeper's API is free), a season-stats fallback + label for the preseason (when the current season has no data yet), rookie-aware history filtering (hides seasons before a player's debut), and fixed a data-model gap where QB/RB/WR/TE were each missing a stat category (e.g. QB rushing, RB receiving) even though Sleeper always tracked it.
>
> Two deviations from the original wording, both requested directly: the "collapsible/expandable" ask became an **always-visible**, curated stat display on the Summary tab instead (once it became the primary content, a collapsed-by-default toggle just added friction) — meaning "without losing access to the full data underneath" is only partially true, since trimmed fields (rate stats, long-play records, advanced diagnostics) are no longer shown *anywhere* in the UI, not merely collapsed. (The **History** tab's per-season detail *is* collapsible — added later, as part of the extended scope.) If full raw-stat access is wanted later, a "show everything" escape hatch would be a small follow-up.

---

### ▶️ **Session 9 — Matchup of the Session** ✅
- [x]  Display your upcoming opponent's roster
- [x]  Ask AI for "Matchup Preview" summary + predicted winner

**🎯 Deliverable:** Head-to-head preview card
**💸 Cost:** ~$0.50–1 per use

> **Status:** Done and verified live against the real (already-drafted) 2026 league — `GET /api/matchup` resolves the current-week opponent via Sleeper's `matchups/{week}` endpoint (new: `backend/src/service-functions/getMatchupForOwner.ts`), returning an `ok`/`bye`/`unavailable` business state rather than erroring on bye weeks or a not-yet-scheduled season. `POST /api/matchup-preview` feeds both rosters' weekly stats/projections/defense rankings/injury status into a new `MATCHUP_SYSTEM_PROMPT` (`buildCoachContext.ts`) for a head-to-head "Coach Frank" preview ending in a labeled Predicted Winner line. New frontend page `UI/src/pages/MatchupPreview.vue`, reached via a "This Week's Matchup" button on the roster page. 136 backend tests passing.
>
> **Follow-up work (same day):**
> - Found and fixed a real bug dating back to Session 7: `getSeasonStatsContext.ts`/`getWeeklyStatsContext.ts` never unwrapped Sleeper's `.stats` sub-field the way `getPlayerSeasonHistory.ts` already did, so `SEASON_STATS`/`LAST_SEASON_STATS`/`WEEKLY_STATS` had silently been the wrong shape (a wrapped object instead of a flat stat line) the whole time — this broke every `pts_ppr`/`gp` lookup downstream, including the new dashboard cards. Fixed to match the established `extractStatsBlob` pattern. Also fixed `getSeasonStatsContext.ts` querying last season with the *current* season's `season_type` (e.g. `"pre"`) instead of `"regular"`.
> - Added `getDefenseRankingsWithFallback`: falls back to last season's defense rankings whenever the current season has zero games played yet (all-null), used everywhere matchup difficulty is fetched (`start-or-bench`, `matchup-preview`, `dashboard-insights`, `analyze-team`).
> - `POST /api/analyze-team` now also receives this week's projection + defense-matchup data (previously season-only stats/injury, per the original Session 7 design) — its prompt explains how to weigh that alongside season stats without over-indexing on one week, is told never to end with a question (it's a one-shot report, the user can't reply), and its `TRADE SUGGESTION:` line is now name(s)-only instead of a paragraph.
> - Team Strength now falls back to last season's per-player stats when the current season has none yet, with an "Includes last season's stats" label (mirrors `PlayerCard.vue`'s existing "Showing {season} stats" pattern).
> - Renamed the AI persona "Coach Sideline" → "Coach Frank" everywhere (prompt text, browser tab title, docs).
> - Filled out the Bruno collection (`bruno-calls/`) to cover all 12 backend routes — 6 were missing a saved request.
>
> **Tried and reverted:** a "Projected Points (PPR)" column was briefly added to both roster tables (`Player.projectedPoints`, populated by pulling `pts_ppr` off Sleeper's `/projections/nfl/player/:id` response), then removed — it looks like Sleeper calculates that number internally rather than exposing a simple pass-through value, so the naive read wasn't trustworthy. Backed out entirely (type field, backend wiring, tests, and the UI columns). Worth revisiting later if a reliable source for it turns up.

---

### ▶️ **Session 10 — Dashboard Polish** ✅
- [x]  Add stat cards: Team Strength | Player to Watch | Trade Suggestion
- [x]  Improve mobile layout + styling
- [x]  Add loading spinners + error states

**🎯 Deliverable:** Clean, responsive dashboard
**💸 Cost:** ~$10 total usage

> **Status:** Done — merged into the same session as Session 9 since the matchup page needed new shared UI (see deviation note below). Team Strength and Player to Watch are computed heuristically with zero added AI cost (new `POST /api/dashboard-insights`, `backend/src/service-functions/computeDashboardInsights.ts`) and auto-load on every dashboard visit; Trade Suggestion instead reuses the existing `/api/analyze-team` call (one added line in `SEASON_SYSTEM_PROMPT` asking for a labeled `TRADE SUGGESTION:` section) and stays gated behind the existing "Analyze Team" button so it never fires an extra paid call on its own. New shared `UI/src/components/LoadingSpinner.vue`/`ErrorState.vue` (extracted from duplicated markup, now used on all three pages) give every fetch a real error state with retry for the first time — previously failures only logged to the console. Mobile pass: all `DataTable`s wrapped in `.table-responsive`, both `PrimeDialog`s got responsive `:breakpoints`, and header rows that used to wrap awkwardly now stack on narrow viewports. Verified with headless-Chrome screenshots at desktop and 375px widths (zero horizontal page overflow, zero console errors) since no browser-automation tool was preinstalled in this environment — screenshots plus a small CDP-based scroll-width/console-error check stood in for interactive manual testing.
>
> One deviation from the original plan, requested directly: Session 10 was pulled forward and merged into Session 9 rather than run separately, since Session 9's "head-to-head preview card" deliverable required a new page and there was no reason to build page-level loading/error patterns twice.

---

### ▶️ **Sessions 11–12 — Wrap-Up & Stretch**
- [ ]  Add Logo & Header to Website
- [ ]  "Ask Coach Anything" chat feature
- [ ]  Multi-league switching — see below
- [ ]  Sidebar to choose from multiple screens (Roster, Leagues, Ask Coach Anything, Profile, etc)
- [ ]  (Optional) Add Supabase Auth login
- [ ]  (Optional) "Season Summary" AI report
- [ ]  (Stretch) ESPN Fantasy support — see below
- [ ]  (Stretch) Adding a league through the UI
- [ ]  Write README and final deployment

**🎯 Deliverable:** Full working app + documentation
**💸 Cost:** +$5 if adding chat

---

## 🤖 AI Prompt Engineering Guidelines

Belongs to Session 7, but documented here since it's a bigger lift than a checkbox.

**Data to pass the model per player:**
1. `WEEKLY_STATS` — this session's box score / projection
2. `SEASON_STATS` — season-to-date averages
3. `LAST_SEASON_STATS` — full prior-season totals, for a consistency/trend baseline
4. Opponent defense ranking + injury designation, once available

**Sample system prompt to start from:**

```
You are "Coach Frank," a sharp, slightly witty fantasy football expert.

You will be given, per player:
1. WEEKLY_STATS — this week's box score/projection
2. SEASON_STATS — season-to-date averages
3. LAST_SEASON_STATS — full prior-season totals, for trend context

Use these numbers as your foundation, but don't stop there. Factor in
matchup difficulty, injury designations, recent news, and general fantasy
strategy the way a human analyst would. If the stats point one way but
context points another (e.g. a great matchup on a short week, or a
committee backfield), say so and explain your reasoning — never hand back
a bare stat line with no interpretation. End every player recommendation
with a clear START / BENCH / TRADE verdict.
```

**Key instruction to keep in every version of the prompt:** explicitly tell the model to reason past the supplied stats rather than only summarizing them — that's what makes it feel like a coach instead of a stat sheet.

---

## 🔌 Multi-Provider & Multi-League Support (Stretch)

Two related stretch goals — worth designing for early, not necessarily building early:

**Multi-league switching:**
- [ ]  Add a `leagues` table in Supabase: one user → many leagues, each with a `provider` field
- [ ]  Add a league switcher to the UI
- [ ]  Update `/analyze-team` and related routes to take `provider` + `leagueId` params instead of assuming a single hardcoded league

**ESPN Fantasy support:**
- [ ]  Abstract the current Sleeper calls behind a common interface — something like `getRoster()`, `getPlayerStats()`, `getMatchup()`, `getLeagueSettings()` — so Sleeper is just one implementation of it, not baked into the routes
- [ ]  Add an ESPN provider implementing the same interface
- [ ]  ⚠️ Heads up: ESPN's fantasy API is unofficial/undocumented, and private leagues require session cookies (`SWID` + `espn_s2`) rather than a simple API key — budget extra time here

This doesn't need to happen now. The main thing worth doing *today* is not hardcoding "Sleeper" so deep into the routes/schema that this becomes a rewrite later — the Session 6 note above (add a `provider` column even before you need it) is the low-cost version of this.

---

## 💰 Cost Summary

| Category | Est. Cost | Notes |
| --- | --- | --- |
| OpenAI API (GPT-4-mini) | $10 – 15 | ~10–15 per-session calls × $0.001–0.005 |
| Sports API (Sleeper) | $0 | Free endpoints |
| Supabase (DB) | $0 | Free tier up to 500 MB |
| Hosting (Netlify + Render) | $0 | Free personal tier |
| **Total Estimate** | **$10 – 15** | For entire project lifetime |

---

## 🌟 Future Upgrades (After Season)

- [ ]  **Trade Analyzer:** AI rates two trade offers
- [ ]  **Weekly Email Summaries:** "Your Coach Report" via Supabase Edge Functions
- [ ]  **League Comparison:** Friends add their teams for ranked AI analysis
- [ ]  **Historical Weekly Stats:** Week-by-week stat breakdowns for a player's *prior* seasons (today, weekly data only exists for the current season — `getPlayerWeeklySeries.ts` would need a season parameter, plus new backend fetching and UI)
