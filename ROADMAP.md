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

## 🧭 Project Status Snapshot (as of Aug 8)

**Done (Sessions 1–7):** repo scaffolded, frontend + backend running and deployed (Netlify + Render, deploy issue resolved), Sleeper API connected, roster/stats fetched and shown in a table, `/analyze-team` route with OpenAI summary, Player Cards with per-player "Start or Bench?" AI button, backend test suite (mocked Sleeper/OpenAI failure paths), Supabase project connected and storing user settings, `leagues` table designed with a `provider` column for future multi-provider support, "Coach Sideline" AI persona with route-scoped context (season-long stats for team analysis, weekly stats + opponent/defense ranking + projections for start/bench calls).

**Not started:** everything from Session 8 onward.

> "(Optional) Log past AI analyses" was deliberately skipped this session and deferred — noted in Session 6 below.

---

## 📅 Schedule to Kickoff (Sep 9, 2026)

Real-life constraints: 8–5 job (weekdays are out), Tue/Wed nights have a 7–8pm obligation, Thu/Fri nights are Pokemon. Same work windows as always — **Monday evenings and weekends** — but Sessions 4–6 landing early on Aug 6 buys back roughly two full weekends of slack.

| Dates | Day(s) | Focus |
| --- | --- | --- |
| Aug 6 | Thu | 🎉 Sessions 4–6 wrapped early |
| Aug 7 | Fri | Likely Pokemon night — off |
| **Aug 8** | Sat (today) | 🎉 Session 7 — Smarter AI Coaching wrapped same-day |
| **Aug 9** | Sun | Session 8 — Player View Redesign (start) |
| Aug 10 | Mon evening | Finish Session 8 |
| **Aug 15–16** | Sat/Sun | Session 9 (Matchup preview) |
| Aug 17 | Mon evening | Start Session 10 (Dashboard polish) |
| **Aug 22–23** | Sat/Sun | Finish Session 10 → start Sessions 11–12 (README, deploy prep, bug pass) |
| Aug 24 | Mon evening | Continue wrap-up |
| **Aug 29–30** | Sat/Sun | Finish wrap-up. First real shot at a stretch goal if things stay smooth (see priority notes) |
| Aug 31 | Mon evening | Buffer |
| **Sep 5–6** | Sat/Sun | Full buffer weekend — final polish, or deeper stretch work |
| Sep 7 | Mon (Labor Day) | Bonus full day — buffer for whatever slipped |
| Sep 8 | Tue | Final smoke test after the 7pm obligation |
| **Sep 9** | Wed | 🏁 Kickoff — app should be live before 8:20pm ET |

**Priority calls, updated for the extra buffer:**
- Session 7 (AI coaching) is done — it was the biggest, riskiest lift, and it wrapped same-day, which is exactly what freed up Aug 9–10 for the new Session 8 (Player View Redesign) without touching the kickoff date.
- With two extra weekends now in reserve (Aug 29–30 and Sep 5–6), **multi-league switching** is realistically attemptable if Sessions 7–10 land on schedule — it's the lighter of the two stretch goals since it's mostly schema + UI, no external auth quirks.
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

> **Status:** Done and test-covered (80 backend tests passing) — see `backend/src/service-functions/getWeeklyStatsContext.ts`, `getSeasonStatsContext.ts`, `getPlayerProjection.ts`, `getDefenseRankings.ts`, and the "Coach Sideline" persona/prompts in `buildCoachContext.ts`. One deviation from the original wording: rather than one shared context blob per player, the context is now deliberately scoped per route — `/api/start-or-bench` gets weekly stats, projection, and opponent/defense ranking (no season data), while `/api/analyze-team` gets season + last-season stats (no matchup data) — since one is a single-week decision and the other is a season-long team-construction question. Only the optional web-search/retrieval tool call remains undone.

---

### ▶️ **Session 8 — Player View Redesign**
- [ ]  Redesign the player detail page (`UI/src/pages/PlayerCard.vue`) to lead with the stats that actually drive a start/bench call — fantasy points, position rank, games played — instead of a flat, mostly-alphabetical two-column stat dump
- [ ]  Hide or collapse stat fields that render `N/A` for a given player/position instead of always showing the full ~18-field "Base Stats" list regardless of relevance (e.g. defensive/special-teams snaps on a WR)
- [ ]  Surface injury status inline on the page itself (the backend already tracks it via `getInjuryStatuses`), rather than only inside the AI's Start/Bench response text
- [ ]  Move the long tail of raw box-score stats (today's "Additional Stats" card) behind a collapsible/expandable section so the page reads as a summary first, full detail on demand
- [ ]  Pass over layout/visual hierarchy so the headline stats are scannable at a glance, not just another dense `<dl>` list

**🎯 Deliverable:** A player page that reads as a quick scouting-report summary instead of a raw stat dump, without losing access to the full data underneath
**💸 Cost:** $0 (frontend-only, no new API/AI calls)

---

### ▶️ **Session 9 — Matchup of the Session**
- [ ]  Display your upcoming opponent's roster
- [ ]  Ask AI for "Matchup Preview" summary + predicted winner

**🎯 Deliverable:** Head-to-head preview card
**💸 Cost:** ~$0.50–1 per use

---

### ▶️ **Session 10 — Dashboard Polish**
- [ ]  Add stat cards: Team Strength | Player to Watch | Trade Suggestion
- [ ]  Improve mobile layout + styling
- [ ]  Add loading spinners + error states

**🎯 Deliverable:** Clean, responsive dashboard
**💸 Cost:** ~$10 total usage

---

### ▶️ **Sessions 11–12 — Wrap-Up & Stretch**
- [ ]  (Optional) Add Supabase Auth login
- [ ]  (Optional) "Ask Coach Anything" chat feature
- [ ]  (Optional) "Season Summary" AI report
- [ ]  (Stretch) Multi-league switching — see below
- [ ]  (Stretch) ESPN Fantasy support — see below
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
You are "Coach Sideline," a sharp, slightly witty fantasy football expert.

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
