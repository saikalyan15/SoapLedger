# Growth Insights Feature — Plan for healingsoil.in

**Date:** 2026-04-03  
**Goal:** Add a `/growth` page to SoapLedger that pulls data from Google Search Console and Google Analytics 4, feeds it to Claude AI, and generates actionable recommendations to increase traffic and conversions for healingsoil.in.

---

## Honest Assessment: Should You Build This?

Before committing, understand the trade-off.

**The no-code alternative:**  
Google Looker Studio (free) connects directly to GSC and GA4 with zero code. It gives you tables, charts, and date filters in ~2 hours. It cannot generate AI recommendations — that part is genuinely custom and only achievable by building.

| Approach | Time to value | Maintenance | AI recommendations |
|---|---|---|---|
| Looker Studio | 2–3 hours | Near zero | No |
| Build this feature | 3–5 days | Moderate | Yes |

**Verdict:** If the AI layer (blog ideas, reel ideas, SEO fixes, ad copy grounded in your actual data) is the primary reason — build it. If you only want to see charts and numbers, use Looker Studio and skip the build entirely.

---

## Context

- **Website:** healingsoil.in — custom built, not Shopify/WordPress
- **GSC + GA4:** Already set up and collecting data
- **App:** SoapLedger (Next.js 16, React 19, PostgreSQL/Neon, Tailwind CSS, Recharts)
- **Usage:** On-demand, single user (Sai)
- **Output location:** New `/growth` page inside SoapLedger

---

## Authentication Decision: Service Account (Not OAuth2)

**Use a Google Service Account. Do not use OAuth2.**

OAuth2 requires a redirect URI, consent screen, and refresh token rotation — 1–2 extra days of work with zero benefit for a single-user app.

A service account downloads as a JSON key file. You extract two env vars and you're done. It never expires unless manually revoked.

**One non-obvious step:** GSC does not accept service accounts via its normal "add account" flow. You must go to GSC → Property Settings → Users and Permissions → Add the service account email as a "Full" user. This trips up most people the first time. It does work — just not obvious.

---

## Phase 1 — Google Cloud Setup

**What:** Create GCP project, enable APIs, create service account, grant permissions.

**Steps:**
1. Create a Google Cloud project
2. Enable: "Google Search Console API" and "Google Analytics Data API"
3. Create a Service Account, download the JSON key
4. Store `client_email` and `private_key` in env vars
5. In GSC: grant service account email as "Full" user
6. In GA4: grant service account email as "Viewer"

**New packages:** `googleapis`, `google-auth-library`

**New env vars:**
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GSC_SITE_URL=https://healingsoil.in/
GA4_PROPERTY_ID=123456789
ANTHROPIC_API_KEY=sk-ant-...
```

**Critical gotcha:** `GOOGLE_PRIVATE_KEY` stored in `.env` has literal `\n` characters. When using it in code you must do:
```js
process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
```
Forgetting this causes a cryptic "invalid_grant" error.

**Difficulty: 2/5**  
**Skippable:** No — everything depends on this.  
**Time:** ~45 minutes

---

## Phase 2 — GSC API Route

**What:** `app/api/growth/gsc/route.ts`

**Data to fetch** (last 28 days):
- Top 25 search queries: clicks, impressions, CTR, position
- Top 10 pages: clicks, impressions, CTR, position

**Critical gotcha:** The `siteUrl` parameter must exactly match how the property is registered in GSC — including the trailing slash. If GSC shows `https://healingsoil.in/` use that exact string. If it's a domain property (`sc-domain:healingsoil.in`), the API call format differs.

**Note:** GSC has a 2–3 day data lag. Always set end date to `today - 3 days` to avoid incomplete data.

**Difficulty: 2/5**  
**Skippable:** Deferrable to v2, but GSC queries are the most valuable input for the AI prompt.  
**Time:** ~2 hours

---

## Phase 3 — GA4 Data API Route

**What:** `app/api/growth/ga4/route.ts`

**Data to fetch** (last 28 days):
- Sessions by traffic channel (Organic, Direct, Social, etc.)
- Bounce rate, average session duration per channel
- Top 10 pages by views

**Critical gotchas:**
- GA4's API returns dimensions and metrics as parallel arrays — you must zip them together manually; the SDK doesn't do this for you
- GA4 changed bounce rate in 2023: it now means "sessions that were NOT engaged." An 80% GA4 bounce rate is alarming; the same number in old Universal Analytics was normal
- `averageSessionDuration` is in seconds — divide by 60 before displaying

**Difficulty: 3/5**  
**Skippable:** Yes — defer to v2. GSC + Claude gives 80% of the value. Add GA4 once the pipeline is validated.  
**Time:** ~3 hours

---

## Phase 4 — Claude AI Integration

**What:** `app/api/growth/analyze/route.ts`

**New package:** `@anthropic-ai/sdk`

**Recommended model:** `claude-opus-4-6` for depth of analysis. For an on-demand feature used a few times a week, the quality difference over Sonnet is worth the cost (~$0.02–0.05 per analysis run — negligible).

**Prompt structure:**
The prompt should include business context (product types, market, platforms) + the GSC/GA4 data, and request a **JSON response** with these sections:
- `summary` — 2–3 sentence diagnosis of what the data is saying
- `seoFixes` — priority-tagged actions with reasoning
- `blogIdeas` — titles with target keyword + rationale from the data
- `reelIdeas` — concept + hook (first 3 seconds) + rationale
- `adCopy` — by platform (Google, Instagram, Meta)
- `quickWins` — things to do this week

Forcing a JSON response with `rationale` fields makes Claude ground recommendations in the actual data rather than giving generic advice.

**UX recommendation:** Use streaming so the analysis appears word-by-word rather than making the user wait 10–15 seconds for a blank screen to suddenly fill. If streaming is deferred, add a clear progress message ("Analyzing your data with Claude...").

**Critical:** Never put `ANTHROPIC_API_KEY` in a client component. All Claude calls must go through the server-side API route.

**Difficulty: 3/5**  
**Skippable:** No — this is the entire point of building instead of using Looker Studio.  
**Time:** ~3 hours (including prompt iteration)

---

## Phase 5 — `/growth` Page

**What:** `app/growth/page.jsx` + `app/growth/GrowthClient.jsx`

**Page layout:**
```
Header: "Growth Insights" — healingsoil.in — last 28 days

[Run Analysis] button

Section 1: Raw Stats (appears after fetch)
├── KPI row: Clicks | Impressions | Avg Position | Avg CTR
├── KPI row: Sessions | New Users | Top Channel
├── Bar chart: Top 10 search queries by clicks
└── Pie/bar chart: Traffic by channel

Section 2: AI Strategy (streams in after stats)
├── Summary — paragraph card
├── Quick Wins — bulleted list, gold accent border
├── SEO Fixes — priority-badged list (high / medium / low)
├── Blog Ideas — cards with title + target keyword
├── Reel Ideas — cards with concept + hook line
└── Ad Copy — tabbed by platform
```

**State flow:**
```
idle → loading_data → data_loaded → loading_ai → complete | error
```

GSC and GA4 fetches run in parallel (`Promise.all`), then the combined data is sent to the Claude route.

**Sidebar update:** Add one entry to `navItems` in `components/Sidebar.jsx`:
```js
{ label: 'Growth Insights', href: '/growth', icon: TrendingUp }
```

**Difficulty: 3/5**  
**Skippable:** No — it's the page itself. Streaming can be deferred.  
**Time:** ~4 hours

---

## Minimum Viable Version (3 days, not 5)

Skip GA4 entirely in v1. Build:
- Phase 1 (GCP setup)
- Phase 2 (GSC only)
- Phase 4 (Claude AI)
- Phase 5 (page with GSC data + AI output)

This delivers the AI recommendation layer with real search query data. GA4 behavioral data is additive — add it in v2 once you've validated the output is actually useful.

---

## Difficulty Summary

| Phase | What | Difficulty | Skippable | Time |
|---|---|---|---|---|
| 1 | GCP setup + service account | 2/5 | No | 45 min |
| 2 | GSC API route | 2/5 | Deferrable | 2 hrs |
| 3 | GA4 API route | 3/5 | Yes (defer to v2) | 3 hrs |
| 4 | Claude AI integration | 3/5 | No | 3 hrs |
| 5 | /growth page + UI | 3/5 | No | 4 hrs |

**Full build (all 5 phases): 3–5 focused days**  
**MVP (phases 1, 2, 4, 5): ~2 days**

---

## Critical Files to Modify

| File | Change |
|---|---|
| `components/Sidebar.jsx` | Add Growth Insights nav item |
| `app/dashboard/DashboardClient.jsx` | Reference for KPI card + chart patterns to reuse |
| `.env.local` | Add 5 new environment variables |
| `app/globals.css` | Reference for design tokens (colors, fonts) |

**New files to create:**
- `app/api/growth/gsc/route.ts`
- `app/api/growth/ga4/route.ts`
- `app/api/growth/analyze/route.ts`
- `app/growth/page.jsx`
- `app/growth/GrowthClient.jsx`

---

## Alternative Features Worth Considering

If the goal is increasing traffic and conversions, here are adjacent features ranked by impact-to-effort:

1. **Webhook from healingsoil.in → SoapLedger** — The app already has `/api/orders/incoming`. If the website fires this webhook on order placement, SoapLedger gets real-time conversion data. This closes the loop between traffic (GSC/GA4) and actual orders. **Difficulty: 2/5. High value.**

2. **Content calendar** — A simple table inside SoapLedger where you log planned blogs, reels, and ads with their target keywords and publish dates. Could be seeded from the AI recommendations. **Difficulty: 2/5. Low maintenance.**

3. **Order source tagging** — Add a "source" field to orders (Instagram DM, website, WhatsApp, referral). Over time this tells you which channel actually converts, not just which drives traffic. **Difficulty: 1/5. Very high signal.**

4. **Monthly growth report email** — Auto-generate a summary email (GSC + GA4 + AI) on the 1st of each month via a cron job. Sends to your inbox without you having to open the app. **Difficulty: 3/5. Good for accountability.**

---

## Verification Plan

1. After Phase 1: Confirm service account can authenticate by calling the GSC API from a local test script and seeing real data returned
2. After Phase 2: Hit `/api/growth/gsc` in browser and confirm JSON response with real healingsoil.in query data
3. After Phase 3: Hit `/api/growth/ga4` in browser and confirm session + page data
4. After Phase 4: POST sample GSC/GA4 data to `/api/growth/analyze` and verify Claude returns structured JSON with specific (not generic) recommendations
5. After Phase 5: Click "Run Analysis" on the `/growth` page and confirm the full flow end-to-end: stats appear, then AI analysis streams in within 15 seconds
