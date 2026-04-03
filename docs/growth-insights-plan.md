# Growth Insights Feature — Plan for healingsoil.in

**Date:** 2026-04-03

**Core problem:** Data is visible in GSC but not actionable. The gap is not more charts — it is having someone look at the data and produce a concrete instruction you can act on immediately.

**What this feature actually is:** An AI that reads your GSC data and your actual order data, identifies specific problems or opportunities, and generates ready-to-use Claude prompts — one per action — that you paste directly into Claude Code or Claude.ai to fix a page on healingsoil.in or create content.

---

## What the output looks like

No charts. No raw data tables. Just a list of prompts, each scoped to one action.

```
GENERATED: April 3, 2026

── READY TO USE ────────────────────────────────────────

[1] SEO FIX — Goat Milk Soap page is losing 850 searches/month
    Signal: 890 impressions, position 14, 4.7% CTR
    ┌─ CLAUDE PROMPT ────────────────────────────────────
    │  You are improving the SEO of healingsoil.in, a
    │  natural handcrafted soap brand in India (Goa).
    │  The /products/goat-milk-soap page gets 890 monthly
    │  impressions for "goat milk soap" but ranks position
    │  14 with only 42 clicks. The site is Next.js.
    │
    │  Rewrite the page's <title>, meta description, and H1
    │  to target "goat milk soap benefits india". Keep the
    │  brand voice warm and natural. Current H1: [paste it].
    └────────────────────────────────────────────────────
    [Copy Prompt]

[2] CONTENT — Blog post that could rank for a near-miss keyword
    Signal: "benefits of goat milk for skin" — 1,200 impressions,
    position 11, you have no blog post targeting this
    ┌─ CLAUDE PROMPT ────────────────────────────────────
    │  Write a 700-word blog post for healingsoil.in.
    │  Target keyword: "benefits of goat milk for skin"
    │  Brand: small-batch natural soap maker in Goa, India.
    │  H1: "5 Benefits of Goat Milk for Skin (And Why We
    │  Use It in Every Bar)"
    │  Tone: warm, knowledgeable, not clinical.
    │  End with a soft CTA linking to the product page.
    └────────────────────────────────────────────────────
    [Copy Prompt]

[3] REEL SCRIPT — High-search topic with no social content
    Signal: "handmade soap india" — 320 impressions, no reel
    exists covering this search intent
    ┌─ CLAUDE PROMPT ────────────────────────────────────
    │  Write a 30-second Instagram Reel script for
    │  Healing Soil (healingsoil.in), handcrafted soap from
    │  Goa. Hook must land in the first 3 seconds.
    │  Topic: why handmade soap is different from commercial.
    │  Hook idea: "This took 6 weeks to make. Yours took
    │  30 seconds on a machine."
    │  Tone: calm confidence, not salesy. End on the product.
    └────────────────────────────────────────────────────
    [Copy Prompt]

── FROM YOUR ORDERS (last 60 days) ─────────────────────
Instagram: 7 orders   Website: 2 orders   WhatsApp: 4 orders
→ Instagram converts best. Prompts above are weighted toward
  Instagram content.
```

---

## Why this works better than charts

GSC already shows you position 14. That doesn't tell you what to do.

This feature:
1. Reads the GSC data
2. Reads your actual SoapLedger orders by source (which channel converts)
3. Identifies the highest-leverage action (near-miss keyword, thin page, gap in content)
4. Writes the Claude prompt scoped to healingsoil.in's exact context so you don't have to

You open the page, copy a prompt, paste it into ChatGPT or Gemini, and get something you can act on immediately — a complete MDX file to push, a rewritten metadata export to paste, a reel script to record, or a WhatsApp message to send. That's the full loop.

---

## Four types of prompts generated

All prompts are fully self-contained — all context baked in. Copy and paste directly into ChatGPT or Gemini. No setup, no follow-up needed.

### 1. SEO fix prompts
For pages with weak titles, bad meta descriptions, or thin content.
Paste into: **ChatGPT or Gemini**

Signals that trigger this:
- High impressions + low CTR → title or meta description problem
- Position 11–20 with decent impressions → on-page copy needs work

Output references the **actual file path** in healing-soil repo. Example:
> *"You are improving SEO for healingsoil.in. The shop page (`/src/app/shop/page.tsx`) ranks position 14 for 'natural handmade soap india' (890 impressions, 4.7% CTR). The site uses Next.js App Router with the Metadata API. Rewrite the `metadata` export — title, description, and OpenGraph fields — to improve CTR. Brand tone: warm, natural, small-batch. Keep under 60 chars for title, 155 for description."*

### 2. Blog post prompts
For new posts targeting near-miss keywords. Output is a complete MDX file ready to drop into `/content/blog/[slug].mdx` and push to GitHub. Vercel deploys automatically.
Paste into: **ChatGPT or Gemini**

Signals that trigger this:
- Keywords with impressions but no existing post targeting them
- Position 8–15 where one focused post could push to page 1

Output format the prompt asks for:
```
---
title: "..."
date: "YYYY-MM-DD"
slug: "..."
excerpt: "..."
category: "..."
author: "Healing Soil"
---

[full post body in MDX]
```

The AI is told the 8 existing post titles upfront so it never suggests duplicate content:
1. Glycerin vs Goat Milk Soap
2. Goat Milk Soap for Sensitive Skin
3. Natural Soap for Eczema & Dry Skin
4. Neem Tulsi Soap Benefits
5. Shea Butter Soap Benefits
6. What Makes Soap Chemical-Free
7. Why Handmade Soap Lasts Longer
8. Why We Make Soap in Small Batches

### 3. Reel / social prompts
For Instagram Reels scripts targeting search topics with existing demand.
Paste into: **ChatGPT or Gemini**

Signals that trigger this:
- High-search queries with no Reel covering the topic
- Instagram is consistently the top converting channel → more content justified

### 4. WhatsApp broadcast prompts
WhatsApp drives direct orders and is a first-class channel on healingsoil.in (it has a built-in WhatsApp deep-link checkout flow). A broadcast to existing customers is often the fastest path to a sale.
Paste into: **ChatGPT or Gemini**

Signals that trigger this:
- WhatsApp is a top order source in the last 60 days
- New batch ready / seasonal moment / low recent order volume

Output: a short WhatsApp message (under 200 words) with a product focus, a reason to act now, and a soft CTA. No hard sell — the brand tone is warm and conversational.

---

## Data inputs

### GSC (API — primary input)
- Top 50 queries: clicks, impressions, CTR, position
- Top 20 pages: same
- Date range: last 28 days

What Claude looks for:
- Position 8-20 with decent impressions = near-miss, high priority
- High impressions + low CTR = title/meta fix
- Impressions but zero clicks = page doesn't exist yet

**GSC errors — known gap:**
The GSC API does not expose bulk error data (coverage issues, Core Web Vitals failures, mobile usability, 404s). The crawl errors API was removed by Google in 2019. The only programmatic option is inspecting URLs one by one — too slow to be practical.

The tool handles this by including a fixed reminder in every output:
```
⚠ ALSO CHECK MANUALLY
GSC Coverage report: https://search.google.com/search-console/index?resource_id=https%3A%2F%2Fhealingsoil.in%2F
GSC Core Web Vitals: https://search.google.com/search-console/core-web-vitals?resource_id=https%3A%2F%2Fhealingsoil.in%2F
Fixing errors here has high SEO impact and is not visible in this tool.
```

This link is hardcoded per site from the `growth_sites` config — no API call needed.

### SoapLedger orders by source (DB — free, already built)
```sql
SELECT source, COUNT(*) as orders, SUM(order_value) as revenue
FROM orders
WHERE order_date >= NOW() - INTERVAL '60 days'
  AND source IS NOT NULL
GROUP BY source ORDER BY orders DESC
```
This tells Claude which channel to weight recommendations toward.

### GA4 (optional — v2)
Adds session duration per page. Useful for identifying pages where traffic arrives but people leave immediately. Add after MVP is validated.

---

## What the AI receives in the prompt

```
BUSINESS CONTEXT
Brand: Healing Soil (healingsoil.in)
Description: Small-batch handcrafted natural soap, Goa, India. Founded 2023.
Products: Goat Milk, Shea Butter, Glycerine, Loofah, Travel soaps.
Market: India, D2C. Primary social channel: Instagram Reels.
Instagram posts are automatically cross-posted to Facebook. Facebook
is NOT a separate content strategy — do not suggest Facebook-specific
tactics. Create for Instagram; Facebook gets it as a passive benefit.
Discovery channel is Instagram. Purchase channel is often WhatsApp
(customer sees a reel, DMs on Instagram or WhatsApps directly).
These are two steps in the same journey, not two separate channels.

SITE STRUCTURE (Next.js App Router, TypeScript, Tailwind, MDX blog)
Live pages: /, /shop, /blog, /blog/[slug], /our-story, /contact,
            /order, /cart, /faq, /eco-picks, /reviews, /returns
SEO metadata: Next.js Metadata API in each page's layout/page.tsx
Blog files: /content/blog/[slug].mdx with YAML frontmatter
            (fields: title, date, slug, excerpt, category, author)

EXISTING BLOG POSTS (do not suggest duplicates):
1. Glycerin vs Goat Milk Soap
2. Goat Milk Soap for Sensitive Skin
3. Natural Soap for Eczema & Dry Skin
4. Neem Tulsi Soap Benefits
5. Shea Butter Soap Benefits
6. What Makes Soap Chemical-Free
7. Why Handmade Soap Lasts Longer
8. Why We Make Soap in Small Batches

RECENT ORDER SOURCES (last 60 days):
Instagram: 7 orders | WhatsApp: 4 orders | Website: 2 orders

GOOGLE SEARCH CONSOLE — TOP QUERIES (last 28 days):
[query] | [clicks] | [impressions] | [CTR] | [position]
goat milk soap | 42 | 890 | 4.7% | 14.2
natural soap india | 18 | 640 | 2.8% | 19.1
...

GSC TOP LANDING PAGES:
[page] | [clicks] | [impressions] | [CTR] | [position]
/shop | 38 | 720 | 5.3% | 12.1
...

TASK
Identify the 3-5 highest-leverage actions based on the data above.
For each action produce a fully self-contained prompt the user can
paste directly into ChatGPT or Gemini to execute it. No placeholders
— bake all context into the prompt itself.

Prompt types allowed:
- seo: rewrite metadata for a specific page. Reference the actual
  file path (e.g. /src/app/shop/page.tsx) and the Metadata API pattern.
- blog: output a complete MDX file with frontmatter ready to save
  as /content/blog/[slug].mdx. Must not duplicate existing posts above.
- reel: Instagram Reel script with hook (first 3s), body, close.
- whatsapp: short broadcast message (<200 words) for existing customers.

Return JSON:
{
  "actions": [
    {
      "type": "seo|blog|reel|whatsapp",
      "signal": "one sentence: what data triggered this",
      "title": "short label shown on the card",
      "prompt": "the full ready-to-paste prompt"
    }
  ]
}
```

---

## Authentication: Service Account (not OAuth2)

Use a Google Service Account. OAuth2 requires redirect URIs, consent screens, and refresh token rotation — unnecessary for a single-user app.

Service account = one JSON key file, two env vars, never expires.

**Non-obvious step:** GSC doesn't surface service accounts in its UI. You must manually add the service account email:
GSC → Property Settings → Users and Permissions → Add user → paste email → Full

**Critical gotcha:** `.env` stores `GOOGLE_PRIVATE_KEY` with literal `\n`. In code:
```js
process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
```
Missing this causes a silent `invalid_grant` error.

---

## Phases

### Phase 1 — GCP Setup (45 min, difficulty 2/5)
1. Create Google Cloud project
2. Enable: "Google Search Console API"
3. Create Service Account, download JSON key
4. Extract `client_email` + `private_key` → env vars
5. In GSC: add service account email as "Full" user

New env vars:
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
GSC_SITE_URL=https://healingsoil.in/
ANTHROPIC_API_KEY=sk-ant-...
```

New packages: `googleapis`, `google-auth-library`, `@anthropic-ai/sdk`

### Phase 2 — GSC API Route (2 hrs, difficulty 2/5)
`app/api/growth/gsc/route.ts`

Fetches top 50 queries and top 20 pages. End date = today minus 3 days (GSC lag). `siteUrl` must exactly match GSC registration including trailing slash.

### Phase 3 — Orders by Source Route (15 min, difficulty 1/5)
`app/api/growth/orders/route.ts`

Single SQL query against existing DB. Returns source breakdown for last 60 days. No new dependencies.

### Phase 3b — Insights Storage (30 min, difficulty 1/5)

Store generated insights in Neon so the page loads instantly on every visit. Only call the AI when you explicitly trigger a regeneration. Purge at will.

**Migration** — add to `db-schema/migration_v9.sql`:
```sql
CREATE TABLE growth_insights (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_from    DATE NOT NULL,   -- GSC start date used
  data_to      DATE NOT NULL,   -- GSC end date used
  actions      JSONB NOT NULL,  -- array of action cards from AI
  raw_input    JSONB            -- GSC + orders data fed in (for debugging)
);
```

One row = one generation run. The page always reads the latest row. Old rows are kept until you delete them — useful for comparing what changed between runs.

**Two API routes replace the single analyze route:**

`GET /api/growth/insights` — reads latest row from `growth_insights`. Returns the stored actions instantly, no AI call. If table is empty, returns `{ actions: null }` so the page shows the "Run Analysis" button.

`POST /api/growth/insights` — triggers a fresh generation: fetch GSC + orders → call AI → insert new row → return new actions. This is the expensive call. Only happens when you click "Regenerate".

`DELETE /api/growth/insights` — deletes all rows (purge). Or scope to a specific `id` to delete one run.

**Page behaviour:**
```
On load    → GET /api/growth/insights
             → has data: show stored cards instantly
                         header shows "Generated: 3 Apr 2026, 2:14 PM"
                         + "Regenerate" button
             → empty:    show "No analysis yet" + "Run Analysis" button

Click "Run Analysis" / "Regenerate"
           → POST /api/growth/insights (may take 10-15 seconds)
           → replace displayed cards + update the generated timestamp
```

The `generated_at` timestamp is stored in the DB row and displayed prominently so you always know how fresh the data is. The GSC date range used (`data_from` / `data_to`) is also stored, so you can see exactly what window the analysis covers — e.g. "Based on data: 6 Mar – 31 Mar 2026".

No wasted tokens on page refresh. The AI is only invoked when you explicitly ask for it.

### Phase 4 — AI Prompt Generator (3 hrs, difficulty 3/5)
`app/api/growth/analyze/route.ts`

Receives GSC + orders data, calls the configured AI model, returns array of action objects each containing a ready-to-use prompt string.

**Model choice:** Do not use Claude API for this. The reason is not cost per token — it is rate limits. Claude has hourly and weekly usage windows, and since Claude Code is already being used heavily for development on this project, adding Claude API calls for the growth feature compounds the problem and causes disruptions at the worst times.

Use Gemini or OpenAI instead. They have independent rate limits with no overlap.

| Model | Cost per run | Rate limits | Recommendation |
|---|---|---|---|
| Gemini 1.5 Flash | ~$0 (free tier) | Generous free quota | **Default — start here** |
| Gemini 1.5 Pro | ~$0.004 | Paid, high limits | Upgrade if Flash output is too shallow |
| GPT-4o-mini | ~$0.002 | High limits | Good alternative |
| GPT-4o | ~$0.03 | High limits | If you want best quality |

Add to env:
```
AI_PROVIDER=gemini          # gemini | openai (not anthropic)
GEMINI_API_KEY=...
# OPENAI_API_KEY=...        # alternative
```

The route checks `AI_PROVIDER` and calls the appropriate SDK. Switching later = change one env var.

Difficulty is in prompt iteration — getting the model to write specific, usable prompts rather than generic advice. Plan for 1-2 rounds of refinement regardless of model.

### Phase 5 — /growth Page (4 hrs, difficulty 3/5)
`app/growth/page.jsx` + `app/growth/GrowthClient.jsx`

UI:
- Single "Run Analysis" button
- List of action cards, each showing: type badge (CODE / CONTENT / REEL), signal summary, full prompt in a code block with a Copy button
- No charts
- Small collapsible section at the bottom showing the raw GSC numbers used

Sidebar: add to `components/Sidebar.jsx`:
```js
{ label: 'Growth', href: '/growth', icon: TrendingUp }
```

---

## Difficulty Summary

| Phase | What | Difficulty | Skippable | Time |
|---|---|---|---|---|
| 1 | GCP + service account | 2/5 | No | 45 min |
| 2 | GSC API route | 2/5 | No | 2 hrs |
| 3 | Orders by source | 1/5 | No (high value, free) | 15 min |
| 3b | Insights storage table + GET/POST/DELETE routes | 1/5 | No | 30 min |
| 4 | AI prompt generator | 3/5 | No — it's the product | 3 hrs |
| 5 | /growth page + copy button | 2/5 | No | 4 hrs |

**Total MVP: ~2 days**

GA4 is not in the MVP. Add it in v2 if you want page-level behaviour data.

---

## New files

- `app/api/growth/gsc/route.ts`
- `app/api/growth/orders/route.ts`
- `app/api/growth/insights/route.ts` — GET (load stored), POST (generate + save), DELETE (purge)
- `app/growth/page.jsx`
- `app/growth/GrowthClient.jsx`
- `db-schema/migration_v9.sql` — `growth_insights` table

## Files to modify

| File | Change |
|---|---|
| `components/Sidebar.jsx` | Add Growth nav item |
| `.env.local` | Add 4 new env vars |

---

## Verification

1. GCP done: run a local script that calls GSC API and returns real healingsoil.in query data
2. `/api/growth/gsc`: hit in browser, see real queries with positions
3. `/api/growth/orders`: returns source breakdown matching what you know from SoapLedger
4. `/api/growth/analyze`: POST sample data, verify each action has a usable `prompt` field — specific to healingsoil.in, not generic
5. Full page: click Run Analysis, see prompt cards appear. Copy the blog prompt and paste into ChatGPT/Gemini — verify it outputs a complete MDX file with correct frontmatter. Copy the SEO prompt — verify it references the actual file path and Metadata API pattern, not generic advice.
