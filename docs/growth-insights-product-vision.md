# Growth Insights — Product Vision

**Date:** 2026-04-03

**Starting point:** Growth Insights is being built for healingsoil.in inside SoapLedger. The question is whether the same tool can serve other websites — either just your own, or as a product for other people.

---

## Honest framing first

There are two completely different things this could be:

**Vision A — Personal multi-site dashboard**
Just your own sites. One tool, multiple GSC/GA4 properties. No auth, no billing, no infrastructure changes. Built inside SoapLedger or as a companion tool.

**Vision B — SaaS product for other small business owners**
Other people sign up, connect their own GSC/GA4, get actionable prompts. A real product with auth, billing, support, and onboarding.

These are not variations of the same idea. Vision A is a small extension. Vision B is a startup. The rest of this doc covers both honestly.

---

## All sites share the same tech stack

All four sites are Next.js App Router with MDX blog and the same Metadata API pattern. This matters because:

- Blog prompts always output the same MDX frontmatter format — no per-site variation
- SEO fix prompts always reference the same file structure (`/src/app/[page]/page.tsx`) and Metadata API
- Reel Builder (separate plan) works identically across sites that have media libraries
- The only thing that varies per site is: business context fed into the AI, and which prompt types are active

Repos: `healing-soil`, `pet-groomer-web`, `sai-web`, `deepa-web`

---

## Your four sites — what the tool needs per site

### healingsoil.in — repo: `healing-soil`
- Type: D2C product brand (handcrafted soap, Goa India)
- Growth goal: organic product discovery, content-to-sale conversion
- Applicable prompt types: SEO fix ✓, blog ✓, reel ✓, WhatsApp ✓
- Existing blog: 8 MDX posts (known titles)
- Special context: product photos available, Instagram-first, WhatsApp checkout

### onsitepetgrooming.com — repo: `pet-groomer-web`
- Type: national pet groomer directory (B2B marketplace, US)
- Growth goal: state-level organic traffic, more groomer listing sign-ups
- Applicable prompt types: SEO fix ✓, blog ✓ (location guides, grooming tips)
- NOT applicable: WhatsApp (US market, not conversational order flow), reels (directory, not a content brand)
- Special context: no blog yet, location-based keywords, schema markup for directory pages is high value
- Note: "growth" here means discovery page traffic and groomer sign-ups — the AI must know this or it'll suggest product-style CTAs that don't fit

### saikalyanakunuri.com — repo: `sai-web`
- Type: personal thought leadership blog (responsible AI, software engineering)
- Growth goal: niche authority, readership, potential consulting or speaking visibility
- Applicable prompt types: blog ✓
- NOT applicable: WhatsApp, reels, local SEO (global technical audience)
- Special context: long-form technical content, global audience, different tone from the other sites

### deepanjalinaik.com — repo: `deepa-web`
- Type: freelance writer portfolio (sustainability, wellness, slow fashion)
- Growth goal: qualified client inquiries from conscious brands seeking a sustainability writer
- Applicable prompt types: SEO fix ✓, blog ✓
- NOT applicable: WhatsApp (client acquisition doesn't work that way), reels (maybe later if she builds Instagram presence)
- Special context: 8 existing blog posts on sustainability, slow fashion, Ayurveda, mindfulness. Tone is deeply values-driven — prompts must not sound salesy or generic. Target audience is brands, not consumers.
- Interesting overlap: her niche (sustainability, wellness, conscious living) directly aligns with healingsoil.in. Cross-linking between the two sites is a low-effort SEO win worth flagging in the AI context.

**Key takeaway:** The core pipeline (GSC → AI → prompts) is identical across all four. Shared stack means prompt output format is the same everywhere. What changes is business context and which prompt types are switched on.

---

## Vision A — Personal Multi-Site Tool

### What changes from the current plan

Minimal. The Growth Insights architecture already supports this with two additions:

**1. A `sites` config table in Neon:**
```sql
CREATE TABLE growth_sites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,          -- "Healing Soil"
  url          TEXT NOT NULL,          -- "https://healingsoil.in/"
  gsc_url      TEXT NOT NULL,          -- exact GSC property URL
  ga4_id       TEXT,                   -- GA4 property ID (optional)
  business_context TEXT NOT NULL,      -- what to tell the AI about this site
  prompt_types TEXT[] NOT NULL,        -- ["seo","blog","reel","whatsapp"]
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

**2. A site selector on the /growth page**

Instead of one hardcoded site, a dropdown at the top. Selecting a site loads that site's stored insights (or shows "no analysis yet"). The "Run Analysis" button fetches that site's GSC data and runs the AI with that site's context.

Everything else — the GSC API route, the Gemini prompt, the insights storage table — stays the same. The insights table just gets a `site_id` foreign key added.

### Difficulty: 1/5 incremental over what's already planned
### Extra time: ~half a day
### Cost: $0

### Site configs to set up once

**healingsoil.in**
```
gsc_url: https://healingsoil.in/
prompt_types: seo, blog, reel, whatsapp
business_context: Small-batch natural soap brand, Goa India, D2C,
  Instagram-first, MDX blog, 8 existing posts [titles...]
```

**onsitepetgrooming.com**
```
gsc_url: https://onsitepetgrooming.com/
prompt_types: seo, blog
business_context: US pet groomer directory, national coverage,
  location-based keywords, no blog yet, goal is state-level
  organic traffic and groomer listing sign-ups
```

**saikalyanakunuri.com**
```
gsc_url: https://saikalyanakunuri.com/
prompt_types: blog
business_context: Personal thought leadership blog, AI governance
  and responsible software engineering, global technical audience,
  long-form content, goal is niche authority and readership
```

**Verdict: Do this. It is almost free to add and makes the tool genuinely useful across your portfolio.**

---

## Vision B — SaaS Product for Other People

### The actual differentiator

Every major SEO tool (Ahrefs, Semrush, Moz, Surfer, SearchPilot) shows you data and leaves you to figure out what to do. They assume you have an SEO team or agency. They cost $99–$400/month.

This tool does something none of them do: it looks at your data and outputs a ready-to-paste prompt you hand to ChatGPT or Gemini to fix or create something immediately. No interpretation required.

The target user is a solo founder or small business owner who:
- Has GSC and GA4 set up (the data exists)
- Looks at the charts but doesn't know what to do with them
- Can't afford an SEO agency or content team
- Is already using ChatGPT or Gemini for other things

That user exists in large numbers. The pain is real and validated — it's exactly the problem this tool was conceived to solve for healingsoil.in.

### What building a SaaS actually requires

| Component | What it means | Difficulty |
|---|---|---|
| Auth | Google OAuth so users connect their own GSC/GA4 | 3/5 |
| Multi-tenancy | Each user's data is isolated, sites table scoped per user | 2/5 |
| OAuth token management | Access tokens expire, need refresh token rotation and storage | 4/5 |
| Billing | Stripe subscription, free trial, usage limits | 3/5 |
| Onboarding | User connects GSC, grants service account access (the non-obvious step) | 3/5 |
| Site-type detection | Directory vs blog vs product brand → different prompt types | 2/5 |
| Support | People will have GSC setup questions, broken integrations | ongoing |
| Landing page | Separate marketing site | 2/5 |

**Honest difficulty: 4/5. Honest time: 3-4 months for a v1 that you'd charge for.**

### The OAuth problem specifically

The current plan uses a service account (one JSON key, Sai grants it access). This works only for your own sites.

For a SaaS, each user needs to grant access to their own GSC/GA4. This requires Google OAuth2 with offline access (to get a refresh token). Refresh tokens expire if the app stays in "testing" mode — which it will until Google verifies the app (a submission process with a privacy policy, terms, and a demo). This is the highest-friction part of building this as a SaaS. It's solvable but it is not fast.

### Revenue model

| Model | Price | At 100 users | At 1,000 users |
|---|---|---|---|
| Free tier (3 sites, weekly limit) + paid | $0/$15/mo | $1,500/mo | $15,000/mo |
| Flat fee | $9/mo | $900/mo | $9,000/mo |
| Per-site | $5/site/mo | depends | depends |

The numbers are interesting at scale. Getting to 100 paying users is the hard part — requires marketing, which is time.

### Competitive risk

The differentiator (actionable prompts vs data) is real today. But it is easy to copy. Any of the existing SEO tools could add a "generate content brief" button. Some already have AI features (Semrush ContentShake, Surfer AI). The window where this is meaningfully differentiated is probably 12-18 months.

### My honest assessment

**The idea is sound. The timing question is whether you want to run a SaaS business.**

Building it is not the hard part. Distribution is. Getting small business owners to find the tool, trust it, and pay for it requires sustained marketing effort — content, SEO, social, community. That is a second full-time job on top of running healingsoil.in and onsitepetgrooming.com.

If the goal is learning and experimenting: Vision A (personal multi-site) captures 80% of the personal value with 5% of the effort. Build Vision A first, use it across your own sites, and see if the output is genuinely useful enough that you'd pay for it. If yes — that's the validation signal for Vision B.

---

## Recommended path

**Now:** Build Growth Insights for healingsoil.in (current plan).

**Immediately after (half a day):** Extend to Vision A — add the sites table, add a site selector, configure onsitepetgrooming.com and saikalyanakunuri.com. Done.

**3-6 months from now:** If you're using the tool regularly across your own sites and finding the outputs genuinely useful — revisit Vision B. The SaaS infrastructure is buildable, the market is real, but it deserves a deliberate decision, not a feature creep.

---

## If you do pursue Vision B — what to validate first

Before writing a line of SaaS infrastructure:

1. **Does the output quality hold across site types?** Run the tool on onsitepetgrooming.com manually. Is the AI prompt output as specific and useful as it is for healingsoil.in? If not, fix the prompts first.

2. **Would anyone pay $9/month?** Find 5 people who match the target profile (solo founder, has GSC, doesn't know what to do with it). Show them a demo. Ask if they'd pay. Don't build until you have 3 of 5 say yes.

3. **Can you handle the Google OAuth verification process?** Google requires a privacy policy, terms of service, and a working demo before approving OAuth apps with GSC scope. Estimate 2-4 weeks for this process alone. Know this going in.
