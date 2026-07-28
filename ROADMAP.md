# Fantasy Football Coach — Project Roadmap

**Duration:** 8–10 weeks | **Time:** ~2 hrs/week | **Total Cost:** ~$10–15

**Goal:** Build a lightweight web app that analyzes your fantasy football roster and generates AI-powered advice.

---

## Tech Stack & Costs

- **Frontend:** Vue (or React)
- **Backend:** Express (Node.js)
- **Database:** Supabase (free tier)
- **AI:** OpenAI (GPT-4-mini or GPT-4-turbo)
- **Sports API:** Sleeper API (free)
- **Hosting:** Netlify + Render (free)

**Estimated total project cost:** $10 – 15

---

## Week-by-Week Checklist

### Week 1 — Setup & Foundation

- [x] Initialize GitHub repo
- [x] Scaffold frontend (Vue/React) and backend (Express)
- [x] Create landing page with "Fantasy Football Coach" header
- [x] Configure `.env` for API keys (OpenAI + Sports API)
- [x] Deploy basic "Hello World" on Netlify (frontend) + Render (backend)

**Deliverable:** Live skeleton app online
**Cost:** $0

---

### Week 2 — Sports API Integration

- [x] Connect to Sleeper API
- [x] Fetch fantasy roster and basic player stats
- [x] Display team on dashboard (table format)

**Deliverable:** "My Team" table with player names + stats
**Cost:** $0

---

### Week 3 — Basic AI Team Analysis

- [x] Add backend route `/analyze-team`
- [x] Send roster + stats to OpenAI → receive summary
- [x] Display AI response below roster

**Deliverable:** Button → "Analyze My Team" shows AI summary
**Cost:** ~$1–2

---

### Week 4 — UI Polish + Player Advice

- [x] Install UI library (PrimeVue / Bootstrap)
- [x] Create "Player Card" components (name, team, stats)
- [x] Add AI button per player → "Start or Bench?"

**Deliverable:** Interactive player cards with AI feedback
**Cost:** ~$2 total

---

### Week 5 — Database Integration

- [ ] Set up Supabase project
- [ ] Connect Supabase to store user settings (team, league)
- [ ] (Optional) Log past AI analyses

**Deliverable:** Persistent user data across sessions
**Cost:** $0

---

### Week 6 — Smarter AI Coaching

- [ ] Improve prompts (add opponent defenses, projections)
- [ ] Add coach-like tone and humor to responses

**Deliverable:** Personable "Coach AI" responses
**Cost:** ~$3 cumulative

---

### Week 7 — Matchup of the Week

- [ ] Display your upcoming opponent's roster
- [ ] Ask AI for "Matchup Preview" summary + predicted winner

**Deliverable:** Head-to-head preview card
**Cost:** ~$0.50–1 per use

---

### Week 8 — Dashboard Polish

- [ ] Add stat cards: Team Strength | Player to Watch | Trade Suggestion
- [ ] Improve mobile layout + styling
- [ ] Add loading spinners + error states

**Deliverable:** Clean, responsive dashboard
**Cost:** ~$10 total usage

---

### Weeks 9–10 — Wrap-Up & Stretch

- [ ] (Optional) Add Supabase Auth login
- [ ] (Optional) "Ask Coach Anything" chat feature
- [ ] (Optional) "Season Summary" AI report
- [ ] Write README and final deployment

**Deliverable:** Full working app + documentation
**Cost:** +$5 if adding chat

---

## Cost Summary

| Category | Est. Cost | Notes |
| --- | --- | --- |
| OpenAI API (GPT-4-mini) | $10 – 15 | 10–15 weekly calls × $0.001–0.005 |
| Sports API (Sleeper) | $0 | Free endpoints |
| Supabase (DB) | $0 | Free tier up to 500 MB |
| Hosting (Netlify + Render) | $0 | Free personal tier |
| **Total Estimate** | **$10 – 15** | For entire project lifetime |

---

## Future Upgrades (After Season)

- [ ] **Trade Analyzer:** AI rates two trade offers
- [ ] **Weekly Email Summaries:** "Your Coach Report" via Supabase Edge Functions
- [ ] **League Comparison:** Friends add their teams for ranked AI analysis
