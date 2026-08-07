# Fantasy Football Coach — Project Roadmap 🏈

**Duration:** 9–11 sessions | **Time:** ~2 hrs/session | **Total Cost:** ~$10–15
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

## 🧭 Project Status Snapshot (as of Session 4)

**Done (Sessions 1–4):** repo scaffolded, frontend + backend running, `.env` configured, deployed skeleton, Sleeper API connected, roster/stats fetched and shown in a table, `/analyze-team` backend route sends roster + stats to OpenAI and displays the summary, UI library installed, Player Card components built, per-player "Start or Bench?" AI button working, deploy problem resolved.

**Not started:** everything from Session 5 onward.

---

## 📅 Schedule to Kickoff (Sep 9, 2026)

Real-life constraints: 8–5 job (weekdays are out), Tue/Wed nights have a 7–8pm obligation, Thu/Fri nights are Pokemon, and Jul 31–Aug 4 is vacation. That leaves **Monday evenings and weekends** as the actual work windows — which is more total time per week than the original ~2hrs/session pace assumed, so there's real buffer built in below.

| Dates | Day(s) | Focus |
| --- | --- | --- |
| Jul 30 | Thu (today) | Likely Pokemon night — no work expected |
| Jul 31 – Aug 4 | Vacation | Off |
| Aug 5 | Wed | Off — travel recovery, obligation at 7pm anyway |
| **Aug 8–9** | Sat/Sun | Finish Session 4 (Start/Bench button) → start Session 5 (testing setup) |
| Aug 10 | Mon evening | Finish Session 5 (mock Sleeper/OpenAI failures) |
| **Aug 15–16** | Sat/Sun | Session 6 — Database Integration (Supabase) |
| Aug 17 | Mon evening | Buffer / polish Session 6 |
| **Aug 22–23** | Sat/Sun | Session 7 — Smarter AI Coaching (weekly + last-season stats, new system prompt) |
| Aug 24 | Mon evening | Finish Session 7 — highest-risk item, gets the extra day on purpose |
| **Aug 29–30** | Sat/Sun | Session 8 (Matchup preview) + start Session 9 (Dashboard polish) |
| Aug 31 | Mon evening | Finish Session 9 |
| **Sep 5–6** | Sat/Sun | Session 10–11 — README, deploy, final bug pass. If ahead of schedule, room for a *light* stretch item here |
| Sep 7 | Mon (Labor Day) | Bonus full day — buffer for whatever slipped |
| Sep 8 | Tue | Final smoke test after the 7pm obligation |
| **Sep 9** | Wed | 🏁 Kickoff — app should be live before 8:20pm ET |

**Priority calls if time gets tight:**
- Session 7 (AI coaching) has the most buffer because it's the biggest lift and most likely to eat extra debugging time.
- Multi-league switching and ESPN support (see [Multi-Provider Architecture](#-multi-provider--multi-league-support-stretch)) are realistically **post-kickoff** work. Only attempt the light "provider column" groundwork if Sessions 4–9 finish early — a solid Sleeper-only app beats a half-finished multi-provider one.
- Whichever of Thu/Fri isn't a Pokemon night is a natural overflow slot if a weekend runs long, but the plan above doesn't rely on it.

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

### ▶️ **Session 5 — Testing Foundations** 🆕
- [X]  Choose a backend test framework: Jest (or Vitest) + Supertest for route testing
- [X]  Add an `npm test` script and a basic CI-friendly config
- [X]  Write unit tests for the existing `/analyze-team` route (happy path)
- [X]  Mock the Sleeper API (e.g. `nock` or `msw`) and test the roster-fetch logic against timeouts, 500s, and malformed JSON
- [X]  Mock the OpenAI API and test that a failed/slow AI call fails gracefully instead of crashing the request
- [X]  Add basic error-handling middleware (if not already present) so failed external API calls return a clean JSON error, not a stack trace

**🎯 Deliverable:** A test suite covering both existing external API calls, including their failure paths
**💸 Cost:** $0 (all external calls are mocked in tests)

> **Going forward:** every new backend route added in later sessions should ship with at least one happy-path test and one failure-path test. Cheap insurance against Sleeper or OpenAI having a bad day.

---

### ▶️ **Session 6 — Database Integration** *(was Session 5)*
- [x]  Set up Supabase project
- [x]  Connect Supabase to store user settings (team, league)
- [ ]  (Optional) Log past AI analyses — skipped this session, deferred
- [x]  Design the `leagues` table to support more than one league per user, and a `provider` column (`sleeper` / `espn`) — see [Multi-Provider Architecture](#-multi-provider--multi-league-support-stretch). You don't have to build multi-league yet, just don't paint yourself into a single-league schema.

**🎯 Deliverable:** Persistent user data across sessions
**💸 Cost:** $0

> **Status:** Done and verified against a live Supabase project — `GET /api/settings` and `GET /api/myteam` both confirmed reading the seeded row (see `backend/db/migrations/0001_init.sql`, `backend/src/db/`, `backend/src/repositories/settingsRepository.ts`). Only "Log past AI analyses" remains, deliberately deferred to a later session.

---

### ▶️ **Session 7 — Smarter AI Coaching** *(was Session 6, expanded)*
- [ ]  Extend the Sleeper data fetch to pull **this session's stats** *and* **previous-season stats** for each rostered player
- [ ]  Rewrite the AI system prompt to establish a clear "expert fantasy coach" persona — confident, direct, a little personality (see [AI Prompt Engineering Guidelines](#-ai-prompt-engineering-guidelines))
- [ ]  Feed the model structured context: this-session stats, season-to-date averages, last-season totals, opponent defense ranking, injury status
- [ ]  Explicitly instruct the model to reason *beyond* the numbers you hand it — matchup trends, recent news, general fantasy strategy — not just restate stats back
- [ ]  (Optional, adds cost) enable a web-search/retrieval tool call so the model can pull current injury/news updates instead of relying only on what you feed it
- [ ]  Add opponent defenses + game projections to the context
- [ ]  Add coach-like tone and humor to responses

**🎯 Deliverable:** Personable "Coach AI" responses grounded in real weekly + historical stats, instructed to think past the raw numbers
**💸 Cost:** ~$3–5 cumulative (prompts get bigger with more stats)

---

### ▶️ **Session 8 — Matchup of the Session** *(was Session 7)*
- [ ]  Display your upcoming opponent's roster
- [ ]  Ask AI for "Matchup Preview" summary + predicted winner

**🎯 Deliverable:** Head-to-head preview card
**💸 Cost:** ~$0.50–1 per use

---

### ▶️ **Session 9 — Dashboard Polish** *(was Session 8)*
- [ ]  Add stat cards: Team Strength | Player to Watch | Trade Suggestion
- [ ]  Improve mobile layout + styling
- [ ]  Add loading spinners + error states

**🎯 Deliverable:** Clean, responsive dashboard
**💸 Cost:** ~$10 total usage

---

### ▶️ **Sessions 10–11 — Wrap-Up & Stretch** *(was Sessions 9–10, expanded)*
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
