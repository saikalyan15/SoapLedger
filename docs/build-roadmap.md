# Build Roadmap

**Date:** 2026-04-03  
**Purpose:** What to build, in what order, and what to leave alone. References the detailed plans but does not repeat them.

---

## What's already done

- **Order source tagging** — `source` column on orders, dropdown in the form, webhook updated, migration_v8.sql written. One remaining action: **run migration_v8.sql against Neon** (5 minutes in the Neon SQL editor). Do this before anything else.

---

## Build order

### 1. Growth Insights — healingsoil.in only
**Time: ~2 days | Plan: `growth-insights-plan.md`**

This is the foundation. Everything else (multi-site, reel builder) either feeds from it or depends on its output being validated first.

What you're building: pull GSC data + SoapLedger orders by source → Gemini Flash generates 3-5 ready-to-paste prompts (SEO fix, blog MDX, reel script, WhatsApp broadcast) → stored in Neon → displayed on a `/growth` page with copy buttons.

Do this for healingsoil.in only. Don't add multi-site yet.

**The one manual prerequisite before writing code:**  
GCP service account setup (45 min). Steps are in `growth-insights-plan.md`. This cannot be done in code — it's clicks in Google's console.

**Stop and validate before moving on:**  
Run it. Copy one of the generated prompts. Paste it into ChatGPT or Gemini. Does the output feel specific and immediately usable? If yes, continue. If the prompts feel generic, fix the AI context before building anything else — everything downstream depends on prompt quality.

---

### 2. Multi-site extension
**Time: ~half a day | Plan: `growth-insights-product-vision.md`**

Once Growth Insights is working for healingsoil.in, extend it to the other three sites. This is a small addition: a `growth_sites` config table, a site selector on the `/growth` page, and four site configs.

No new API routes. No new packages. Just configuration.

Sites: healingsoil.in, onsitepetgrooming.com, saikalyanakunuri.com, deepanjalinaik.com  
All share the same Next.js stack so prompt output format is identical across all four.

**Don't do this before step 1 is validated.** If the prompt quality isn't good, fixing it for one site is easier than fixing it for four.

---

### 3. Media library organisation (parallel, not blocked)
**Time: 1-2 hours | No code**

This is the prerequisite for Reel Builder and can be done independently of steps 1 and 2 — even while code is being written. Organise existing photos and videos into five folders:

```
/media/product, /process, /ingredients, /lifestyle, /lather, /music
```

Aim for at least 5-8 files per folder before Reel Builder is useful. Music tracks (royalty-free) go in `/media/music/calm/` and `/media/music/upbeat/`.

---

### 4. Reel Builder
**Time: 3-4 days | Plan: `reel-builder-plan.md`**

Build only after:
- Growth Insights is live and generating useful topics
- Media library is organised

The topic input comes directly from Growth Insights — when a reel card is generated, a "Build Reel" button passes the topic straight to Reel Builder.

**Important:** Start with a local FFmpeg script (runs on your machine), not a cloud server. Get the output looking good before investing in server infrastructure. The Vercel limitation (no FFmpeg) means a separate server is eventually needed, but that decision should be based on validated reel quality first.

---

## What not to tackle

### Vision B — SaaS product for other people
The idea is sound but it is a different project entirely, not a feature. It requires Google OAuth (with a verification process), multi-tenancy, billing, and sustained marketing effort. Revisit in 3-6 months if you're using the personal multi-site version regularly and finding it genuinely useful enough to pay for. Not now.

### GA4 integration
Deferred to v2 of Growth Insights. GSC + orders data gives Claude enough to generate specific, grounded prompts. GA4 adds page-level behaviour context (how long people stay on each page) which is useful but not essential for a first pass. Add it after the MVP is validated.

### TTS voiceover in Reel Builder
Text overlays with music work fine for natural product reels. Many top-performing brands in this category use no voiceover at all. Build and test music-only first. Add TTS in v2 only if you find yourself consistently wanting narration.

### AI image generation
Explicitly ruled out. Existing photos are more authentic and cost nothing. The narrative and assembly are the actual problems to solve.

### Admin features on healingsoil.in
SoapLedger is the admin tool. healingsoil.in is the customer-facing site. These responsibilities should not cross over.

### Paid SEO tools (Ahrefs, Semrush, etc.)
The Growth Insights feature replaces the need for these for your use case. They give you data but no action. This tool gives you the action. Don't pay for data you won't know what to do with.

---

## Full timeline at a glance

| Step | What | Time | Blocked on |
|---|---|---|---|
| Now | Run migration_v8.sql | 5 min | Nothing |
| 1 | GCP service account setup | 45 min | Nothing |
| 2 | Build Growth Insights (healingsoil.in) | 2 days | Step 1 |
| 3 | Validate prompt quality | 1 session | Step 2 |
| 4 | Multi-site extension | 0.5 days | Step 3 |
| 5 | Organise media library | 1-2 hrs | Nothing (can run in parallel) |
| 6 | Build Reel Builder | 3-4 days | Steps 3 + 5 |

**Total: ~7 days of focused build work**

---

## The three documents this roadmap references

- `growth-insights-plan.md` — full technical plan for Growth Insights
- `reel-builder-plan.md` — full technical plan for Reel Builder
- `growth-insights-product-vision.md` — multi-site extension + SaaS vision assessment
