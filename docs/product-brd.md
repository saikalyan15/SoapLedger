# BRD — SoapLedger as a Product

**Date:** 2026-09-17
**Status:** Exploratory — no build committed yet
**Related:** `market-validation-research.md` (March 2026 conversation-research findings; this doc should not contradict that positioning)
**Build decision:** the product described here will be built in a **new, separate repository** — not by extending this SoapLedger codebase. SoapLedger stays as-is for healingsoil.in. Everywhere below that references "the current stack" or "what's already built," read it as **the working reference implementation to build from and improve on**, not code that gets reused or a database that gets shared. This changes a few cost estimates below — see Sections 5, 7, and 8.

---

## 1. Problem Statement

Small handmade-soap and bath-and-body makers run their business across notebooks, disconnected spreadsheets, and Etsy/Instagram/WhatsApp DMs. Existing tools split into two camps — recipe/lye-calculators (SoapCalc, SoapMaker) and inventory/COGS trackers (Craftybase) — and neither camp owns the **order → fulfilment → shipping label → revenue/expense visibility** loop. That's the gap SoapLedger already fills for one business (healingsoil.in).

This is consistent with the March 2026 research: the real underserved need isn't inventory or recipes, it's **"am I actually making money?"** — revenue-first clarity, not production-first tooling.

## 2. Target Customer

Solo or 1–2 person handmade soap/bath-and-body makers doing direct-to-consumer sales (own website, Instagram, Etsy), **primarily outside India** — roughly $1k–$15k/year revenue. Too small for Craftybase's higher tiers or an ERP, too order-heavy for a bare spreadsheet. Price-sensitive relative to their revenue, but has real discretionary dollars to spend on the business, unlike the Indian solo-maker segment.

**US-first, not "US/UK/EU/Australia" evenly:** every community actually named in the research is US-based or US-dominated — HSCG (Handcrafted Soap and Cosmetic Guild) is a US organization, Saponification Nation and the other large Facebook groups skew US, r/soapmaking and r/EtsySellers are majority-US audiences, and Craftybase/LatherForge both build for the US market first. Spreading initial outreach evenly across UK/EU/Australia dilutes effort across markets the research doesn't actually cover. There's also a concrete compliance reason to not lead with the EU specifically: selling to EU consumers brings GDPR obligations (a privacy policy and data-subject-rights process are needed regardless, but actively targeting the EU can trigger needing an Article 27 EU representative) on top of the India/US tax questions already in Section 11 — one new jurisdiction's compliance homework at a time. Treat UK/EU/Australia as "happy to take the signup if someone shows up," not a first-wave outreach target.

**Why not India:** the founder's own market context (running healingsoil.in) is that Indian solo soap makers are themselves financially stretched — a recurring software subscription competes directly with ingredient and packaging costs they're already tight on. It's also where the actual evidence points: the competitive research (Craftybase, LatherForge, r/soapmaking, r/EtsySellers) is overwhelmingly US/international to begin with, so pricing in USD for that market aligns with where the demand signal was actually found, instead of fighting an uphill battle in a price-sensitive domestic one.

**Pushback on fully excluding India, though:** none of the research actually done (March 2026 conversations, or this document's own competitor research) tested Indian willingness to pay specifically — the "Indian makers won't pay" reasoning is the founder's own read on the market, not an evidenced finding, and it's worth being honest that it hasn't been tested the way the rest of this document insists on testing everything else. Two things cut against closing the door entirely:
- **$5/month (~₹420) isn't obviously unaffordable** — it's below what many Indian consumers already pay for Canva or a mid-tier OTT subscription. The claim deserves the same deposit-based test in Section 10, not an assumption baked into the plan before anyone's asked.
- **Going all-in on cold outreach to foreign communities discards the founder's actual advantage.** In US/UK/EU soap-maker groups, the founder is an anonymous outsider pitching software with no track record. In Indian maker communities, "I run a real soap brand and built this for myself first" is a genuine trust asset the research playbook depends on ("what you're listening for" signals land better from a peer than a stranger). Writing off the one market where credibility is free is worth a second look, even if it ends up priced or messaged differently than the international push.

This isn't a reason to abandon the international pricing move — the cost and competitive analysis in this document support it. It's a reason to let Section 10's validation actually include India rather than deciding the answer in advance.

Serves **both melt-and-pour (M&P) and cold-process (CP) makers** — the two dominant soap-making methods, with very different production workflows (M&P: no cure time, no lye handling, fast turnaround; CP: 4–6 week cure period, lye/NaOH safety, slower batch cycles). The order/fulfilment/label/dashboard core is already process-agnostic; only the future batch-costing feature needs to branch by process type (see Essential Features).

## 3. Design Principle: Simple Enough for a Non-Technical Founder

The primary user is a maker, not an operator — usually running the business solo, with no background in software, accounting, or inventory management. Every feature decision should be judged against: **would a first-time, non-technical founder understand this without reading a manual?**

Concrete rules:
- No jargon in the UI. Say "cost to make one soap," not "COGS." Say "orders waiting to ship," not "fulfilment queue."
- The dashboard's first, largest number always answers "am I making money?" — charts, trends, and breakdowns are secondary and collapsible. This directly echoes the March 2026 finding that a detailed dashboard felt overwhelming to someone who "just wanted to know the answer."
- Onboarding must work start-to-finish with zero external documentation — sensible defaults over configuration screens.
- Anything cold-process-specific (cure tracking, lye/NaOH notes) must be optional and hidden for melt-and-pour makers, and vice versa — neither group should wade through fields that don't apply to them.

## 4. Goals

- Validate whether SoapLedger's existing order/fulfilment/label/dashboard combination is worth productizing beyond one business
- Define an MVP feature set that's honest about what's built vs. what's missing
- Decide a delivery/pricing model before any multi-tenancy work starts (that's the expensive, hard-to-reverse step)

## 5. Essential Features

### Proven in SoapLedger — port the thinking, rebuild the code

These exist and work in the SoapLedger codebase today, running on real orders for healingsoil.in. They're the spec for the new repo, not code to copy-paste — reimplementing them is real work, just low-risk work, since the UX and business logic are already validated on a live business rather than guessed at.

- Order capture & status pipeline (Placed → Payment → Manufacturing → Dispatch) — process-agnostic, works the same for melt-and-pour and cold-process sellers
- Shipping & product label printing
- Expense tracking with categories (recurring vs. one-time)
- Revenue + expense dashboard with unit economics (cost/soap, operating result)
- Customer/order history, repeat-customer and quiet-customer tracking

### New in the fresh repo, not present in SoapLedger at all

- Basic inventory/stock deduction on sale (raw materials → finished goods) — table stakes competitors all have
- Lightweight batch/recipe costing (just "cost per batch," not a full lye calculator) so it doesn't feel incomplete next to Craftybase. **Must branch by soap-making method**: cold process gets a 4–6 week cure-time tracker and optional lye/NaOH notes; melt-and-pour skips cure tracking entirely and never sees lye fields. Don't force one workflow onto both — this is the concrete test case for the simplicity principle above.
- Etsy/Shopify order import — most target users sell there too, not just their own site
- Self-serve onboarding, per-shop settings (currency, categories, label size, soap-making method)
- Mobile-usable UI — checking orders/dashboard from a phone at a market stall is a real use case

### Design-in-from-day-one, don't repeat SoapLedger's mistake

- **Multi-tenancy from the start.** A fresh repo means this is a schema design decision, not a migration — every table gets a `business_id`/`tenant_id` column from its first version. This is the one place the new-repo decision makes things *easier* than the earlier plan assumed, since there's no existing single-tenant data to retrofit.
- **Currency and locale must be configurable from day one, full stop.** SoapLedger hardcodes ₹ and `en-IN` number formatting directly in at least 16 files (dashboard, orders, products, catalog, wholesale pricing, expenses, settings, and more) — that's the exact trap to not walk into again in a new codebase built for a USD-first, international market (Section 9). This is now a much smaller risk than it was when the plan involved retrofitting SoapLedger itself — building it right from the start costs little; finding and fixing it in 16 files after the fact was the expensive version. Also decide unit-of-weight display (grams vs. oz) up front — US/UK makers describe soap batches differently than the Indian-market assumptions baked into SoapLedger's UI.

### Explicitly out of scope for v1
- Full lye/recipe formulation engine — partner-with or link to SoapCalc-style tools instead of rebuilding
- Multi-channel warehouse/production scheduling (Katana/MRPeasy territory — wrong customer size)
- Accounting/GST compliance suite

## 6. Competitive Stack-Up

| | **SoapLedger** | Craftybase | LatherForge (pre-launch) | SoapMaker/SM3 | SoapCalc/LyeCalc | Spreadsheets/Ardent |
|---|---|---|---|---|---|---|
| Recipe / lye calculator | No | No | Yes (AI-generated) | Yes | Yes (only this) | No |
| Batch/production tracking | Order-status only | Yes | Yes | Yes | No | Manual |
| Inventory & COGS | Not yet | Yes (core) | Yes | Yes | No | Manual |
| **Order capture & fulfilment workflow** | **Yes — core strength** | Weak/generic | Unclear (Etsy-listing focus) | No | No | Manual |
| **Shipping/product label printing** | **Yes — core strength** | No | No | No | No | No |
| **Revenue + expense dashboard** | **Yes — core strength** | Yes (COGS-angled) | Unclear | Basic reports | No | Manual |
| Platform | Web | Web | Web | Windows desktop | Web | Excel/Sheets |
| Pricing | $5/mo or $49/yr (proposed) | $9–49+/mo, up to "$1,000/yr" complaints | TBD, waitlist | One-time purchase | Free–cheap, one-time | Free–$20 templates |

**Read on this table:** nobody else bundles order pipeline + labels + owner-facing dashboard. That's the wedge. But SoapLedger is missing inventory and any batch costing, which is the first thing a soap maker will ask about since Craftybase and LatherForge both lead with it.

**On the pricing pivot to USD (Section 2, Section 9):** every real competitor in this table — Craftybase, LatherForge, even SoapMaker/SM3 — already prices and operates in USD for a US/international customer base. Pricing SoapLedger in USD isn't a departure from this field, it's matching it; the earlier ₹-denominated draft of this pricing was actually the outlier next to the rest of this table, not the other way around.

## 7. Tech Stack & Operational Cost

**SoapLedger's stack is a proven, cheap choice — worth reusing in the new repo, as a fresh install, not a shared deployment:**
- Framework: Next.js 16 (App Router), React 19 — free, open source
- Database: Neon Postgres (serverless, autosuspend on idle) — **a new, separate Neon project**, not the same database as SoapLedger/healingsoil.in. Sharing infrastructure between an internal business tool and a customer-facing product is a needless blast-radius risk for no real cost saving (Neon's free tier alone covers the new repo's early stage).
- Auth: NextAuth v5, self-hosted — no per-user cost, and the auth-guarded route pattern from SoapLedger is worth replicating even though the code itself isn't shared
- AI: Google Gemini 2.5 Flash, if the AI-generated note feature carries over — usage-based, effectively negligible at low volume
- Payments: Dodo Payments for the new repo's own SaaS billing (Section 8) — not Razorpay; that's specific to SoapLedger's own order-checkout flow and isn't part of this new build
- Charts/maps: Recharts, d3-geo — free, client-side
- Hosting: Vercel, same reasoning as before — pairs naturally with Next.js + Neon

**Real, not-yet-built cost for the new repo:**
- Vercel's free Hobby tier explicitly disallows commercial use — charging other shop owners means Vercel Pro (~$20/month base) at minimum, on the new repo's own Vercel project
- Dodo Payments as merchant-of-record — handles checkout, renewals/dunning, and tax compliance so a solo founder doesn't build that logic in-house. Fee is a percentage of each transaction, higher than a plain payment gateway since it includes tax handling — check the current fee schedule before committing to final pricing
- Transactional email (magic-link auth, order notifications) — e.g., Resend or Postmark; free tier covers early scale, then roughly $10–20/month
- Per-shop subdomain or custom domain support (`shopname.soapledger.app`, or whatever the new product is named) — supported natively by Vercel, cost scales mildly with domain count
- Object storage for label/photo uploads — Vercel Blob or S3, pennies at this scale

**Rough monthly cost by stage** (estimates — verify against current Vercel/Neon pricing before committing):

| Stage | Shops | Estimated monthly cost |
|---|---|---|
| Today (internal use) | 1 | ~$0 (free tiers) |
| Beta / early validation | 5–20 | ~$20–40 (Vercel Pro + Neon's paid tier + free-tier email) |
| Early growth | 20–200 | ~$70–150 (Neon scales with storage/compute, email tier increases) |
| Payment processing | any | ~2% per transaction — scales with revenue, not a fixed line item |

The honest takeaway: this is a cheap stack to run at beta scale (tens of dollars a month), which matters given the target customer is price-sensitive and the business itself needs to prove revenue before costs scale with it.

## 8. Solo-Founder Feasibility & Lean Scope

This has to work as a side build for one person, alongside actually running healingsoil.in. That constrains scope hard — here's the lean version of each gap from Section 5:

- **Rebuilding the proven core (Section 5's first list) is the real starting cost now.** Because this is a new repo, order capture, labels, expenses, and the dashboard aren't "already built" anymore — they're "already designed and validated," which is genuinely valuable, but every screen still needs to be written. Reading SoapLedger's source while building the new one is fine and sensible (it's a working spec, not a black box) — the build decision is about not sharing the deployment/database/codebase, not about pretending SoapLedger doesn't exist as a reference.
- **Multi-tenancy from day one, and it's actually easier this way.** In a greenfield schema, every table just gets a `business_id`/`tenant_id` column from its first migration — there's no existing single-tenant data to retrofit, and no risk of missing a table partway through a migration. This is the one piece of the plan that got strictly cheaper when the build decision changed.
- **Currency/locale, same story.** Build every number-formatting call configurable per shop from the first commit, instead of hardcoding one currency the way SoapLedger did. This avoids the exact 16-file cleanup problem entirely — it's now a design discipline to hold during development, not a remediation project afterward.
- **Billing:** don't build billing infrastructure for the first 10–20 customers. Take payment manually (UPI/bank transfer, or a one-off payment link) and flip a `plan_active` flag by hand. Move to Dodo Payments once manual invoicing is actually the bottleneck — as merchant-of-record it handles checkout, renewals, and tax compliance without building any of that logic in-house.
- **Etsy/Shopify import:** defer past MVP. A manual "paste your last week of orders" CSV importer is enough to onboard early customers; build the real integration only once 20–30 paying customers justify the engineering time.
- **Support:** one WhatsApp Business number or shared inbox, not a helpdesk tool. At this price point, with a jargon-free product (Section 3), one person can realistically support several dozen customers without a support team.
- **Onboarding:** a short recorded walkthrough video instead of 1:1 demo calls — time is the scarcest resource for a solo founder, and a non-technical buyer needs a walkthrough, not a sales pitch.

**Net effect of the "new repo" decision on scope:** multi-tenancy and currency both got *cheaper* (greenfield beats retrofit for both). What got *more expensive* is that the core feature set is no longer free — it has to be rebuilt, even though it's a known, validated spec rather than a guess. Honest read: probably still less total work than the earlier "SoapLedger + big retrofit" plan, since a clean rebuild of validated features is more predictable than hunting down 16 hardcoded files inside a live production app — but don't carry over the old "few days" estimate wholesale. Size the MVP as: rebuild Section 5's proven core (the biggest chunk) + inventory/batch costing (the "new" gaps) + multi-tenancy and currency built in from the start (cheap, if done from day one) + manual billing/onboarding (near-zero).

### Affordability check: every feature has to earn its cost

At $5/month, margin is thin by design — Section 7's cost table puts beta hosting at ~$20–40/month total, which stays comfortably covered by even 10–15 customers, but only if new features don't quietly add cost *per customer* on top of that fixed base. Before adding anything beyond what's in Section 5, ask: does this feature cost roughly the same whether there are 5 customers or 500, or does its cost scale with usage?

- **Cheap by nature — safe to add:** more database rows (inventory counts, batch records, order history), more UI screens, more report views. These use the same Neon/Vercel base cost regardless of feature count.
- **Costs money per action — add only if the price supports it:** SMS/WhatsApp notifications (per-message fees), per-image AI processing, any third-party sync API that charges per call or per record. The existing AI handnote feature (Gemini Flash) is cheap enough to keep as-is, but a new AI feature isn't automatically cheap just because that one is — check per-call pricing before adding another one.
- **Rule of thumb:** if a feature's cost scales with the number of customers using it, its price needs to be built into what those customers pay — don't fold a variable cost into a flat $5/month without checking the math first.

This is the same discipline as Section 8's lean scope, applied continuously rather than just at MVP: affordability for the customer and sustainable margin for a solo founder are the same constraint, not a trade-off to revisit later.

## 9. Delivery Model: Desktop one-time-fee vs. SaaS

**Recommendation: SaaS, priced deliberately low and annual-first — not the monthly-subscription-everyone-hates model, but not a desktop rewrite either.**

Reasoning:
- **The actual complaint in the research is price, not delivery model.** Nobody said "I hate that Craftybase is cloud-based" — they said "$49/month is too much" and "I shouldn't pay $1,000/year for basic auto-deduct." Undercutting on price solves the real objection without an expensive architecture pivot.
- **The current stack is already cloud-native** (Neon Postgres, Next.js). A desktop rewrite means either a local DB with sync headaches, or Electron wrapping a web app — real engineering cost for a niche that isn't commercially validated yet.
- **The use case needs multi-device access.** Makers check orders and print labels from a laptop at home and a phone at a market stall. A desktop-only app (like SoapMaker/SM3) regresses this, and SM3's own reviews complain about exactly that — OS-compatibility and interface friction. Desktop trades one pain for another; it doesn't remove pain.
- **Etsy/Shopify/payment webhooks are much harder to do well from a desktop app.** Real-time order sync is a SaaS-native pattern.
- **The market is voting SaaS even now:** LatherForge, the newest and most direct competitor, chose SaaS despite launching straight into the same pricing backlash. That's a signal the delivery model isn't the blocker.

**Tactical hybrid worth considering:** offer an early "founder's lifetime license" (pay once, e.g., 3–5x the monthly price) to the first cohort of users, to build initial cashflow and trust with a community that's openly subscription-fatigued — then move all new signups to a low annual SaaS plan once there's a base. This targets the "free Craftybase alternative" sentiment directly without committing to a desktop product long-term.

### Proposed Pricing

One plan per phase, not a tiered ladder — fewer decisions for a non-technical buyer, and no feature-gating code to build or maintain at this stage. The price is tied to what's actually built, in two phases:

**Phase 1 — validation pricing (wedge-only feature set, Section 5's "proven in SoapLedger" list, rebuilt in the new repo):**
- $5/month, or $49/year — cheap enough that the order/label/dashboard wedge alone justifies it, without inventory or batch costing
- Founder's lifetime license: $129 one-time, capped to the first 15–20 customers
- This is the number to test in Section 10's deposit-based waitlist while the feature set is still wedge-only

**Phase 2 — steady-state pricing, once inventory + batch costing ship: $19–20/month, or ~$190–200/year**

**Does $20/month work out? Checking the math against Section 7's cost table:**
- Fixed hosting at beta scale: ~$20–40/month, regardless of customer count up to ~20 shops
- At $20/customer, minus Dodo Payments' merchant-of-record fee (roughly 5% — confirm exact rate): ~$19 net per customer
- **Break-even is 2–3 paying customers** — versus 4–8 needed at $5/month. At $20 customers (top of the beta band), that's ~$400/month revenue against ~$60/month in costs — a margin that's actually worth a solo founder's ongoing support time, which $5/month barely covers
- **The catch:** $20/month sits inside Craftybase's own $9–35/month range, not below it. At that price a buyer directly compares feature-for-feature rather than choosing SoapLedger for being cheap. **This makes basic inventory/stock deduction and lightweight batch costing (Section 5's "gaps to close") load-bearing, not optional** — charging $20/month for the wedge alone, without them, risks landing as "expensive and incomplete" rather than "the simple alternative." The market-validation research's own numbers support $20 as inside this niche's proven willingness-to-pay band (Craftybase runs $9–34.99/month) — but only for a feature-complete tool, not the current MVP.
- $20/month also strengthens the case for excluding India (a genuine recurring $20/month cost is a harder sell there than $5), which cuts against the pushback in Section 2 — worth being aware that raising the price and reopening the India question pull in opposite directions, not deciding both without noticing the tension.

**Recommendation:** validate at $5/month with the wedge-only MVP first — it's the faster, cheaper test and doesn't require building inventory/batch costing before finding out if anyone will pay at all. If that clears the Go/No-Go bar in Section 12, build inventory + batch costing next and move steady-state pricing to $19–20/month once they ship, rather than charging $20 for what exists today.

Billed in USD via Dodo Payments in both phases.

## 10. Go-to-Market: Demand Testing & Sales/Marketing

**Yes — build a lightweight landing page, but treat it as the destination for warm conversations, not a cold ad funnel.** This market is too small and too niche for paid acquisition to be efficient. The March 2026 research already identified exactly where the target customers are (Soapmaking Forum's business section, HSCG, Soapah Community, Saponification Nation and other Facebook groups, r/soapmaking) and how to open a conversation without pitching. A landing page's job is to convert warm interest into a measurable signal — it doesn't generate that interest on its own.

**On following LatherForge's exact model — partially, not fully.** LatherForge's actual play is a free waitlist with a "3 months free at launch" incentive: zero friction, no payment, pure email capture. That's good for maximizing top-of-funnel signups, but on its own it doesn't answer the one question this document keeps insisting on testing — will anyone actually pay. Recommendation: run a hybrid.
- **Wide funnel, matching LatherForge:** free waitlist signup on the landing page, no payment required, to keep the barrier as low as theirs and not lose signups to friction.
- **Layered on top, going further than LatherForge:** an optional "skip the line / lock in founder pricing" step for anyone who wants it — the $10 deposit or the $129 lifetime license from Section 9. This is the subset that actually answers the Go/No-Go question in Section 12; the free-signup count alone won't.

**Sequencing:**
1. Run the conversation playbook already written in `market-validation-research.md` in the identified communities — lead with the profitability question, not the product.
2. When someone shows a strong-signal response (per that doc's "what you're listening for" list), share the landing page: the problem statement, real screenshots of the order/label/dashboard flow (from healingsoil.in, anonymized), the $5/month validation-phase price from Section 9, and the free waitlist plus optional paid lock-in above — including a clear note that it supports **both melt-and-pour and cold-process** makers, since that's a real segmentation question people will ask about immediately.
3. Track both numbers separately: total free waitlist signups (interest) versus paid lock-ins (real signal). Section 12's Go/No-Go bar is about the second number, not the first.
4. Offer the first 10–20 committed people the "founder's lifetime license" from the Delivery Model section, in exchange for being real early users and, if it goes well, a testimonial or case study for the landing page.

**If skipping a landing page entirely:** the fallback is direct, manual sales — DMs and comments in the same communities, demoing the live product over a call, closing people one at a time. That works for the first 10 customers but doesn't scale and collects no passive signal while you're not actively reaching out. A landing page costs almost nothing to build (one static page, no backend needed for a waitlist) and removes that ceiling — there's little reason not to have one even if manual conversations do the actual convincing.

## 11. Open Questions / Risks

- Multi-tenancy and currency/locale are both unbuilt, but both are now day-one design decisions in a fresh repo rather than retrofits — lower risk than the earlier plan, but still the first things to get right in Section 8's build, not an assumption that they'll stay simple by default
- Addressable market is small (soap/bath-and-body only); March 2026 research suggests skincare-beyond-soap and cottage-food producers may be stronger adjacent verticals if this validates
- Proposed pricing (Section 9) is a hypothesis, not tested against real willing-to-pay makers — that's what Section 10's deposit-based waitlist is for
- LatherForge is a live competitive threat with a Jan 2027 launch target — timing matters if pursuing this
- This is a side project running alongside healingsoil.in itself — no fixed time budget has been set, which makes it easy for outreach to quietly stall without a clear deadline attached to the Go/No-Go check below
- **Excluding India from the target market is the founder's own read, not a tested finding** (see Section 2's pushback) — worth validating rather than assuming, especially since it discards the founder's strongest asset (peer credibility as a real practitioner) in exchange for markets where there's none
- **The core feature set (order pipeline, labels, expenses, dashboard) has to be rebuilt from scratch in the new repo** — it's a validated spec, not free code, and this is the piece of scope that got bigger when the build decision moved away from extending SoapLedger directly
- **Billing international customers from India needs a compliance check, not just a payment gateway:** export-of-services tax treatment (GST LUT for zero-rated export, income tax on foreign earnings) and how the receiving bank account handles FIRC for foreign remittance. Dodo Payments as merchant-of-record likely absorbs most of this, but it should be confirmed with an accountant before the first real dollar changes hands, not after
- **Cold outreach into US/UK/EU/Australia maker communities is unproven for this founder** — the community playbook in Section 10 was written assuming a warm, credible voice; an outsider with no track record in those specific groups may convert differently than the playbook assumes

## 12. Go / No-Go Decision

**Conditional GO — proceed with validation now, hold off on multi-tenancy engineering until there's a real money signal.**

**Do now, low-cost and reversible:**
- Run the community conversation playbook (Section 10) alongside normal healingsoil.in work
- Ship the lightweight landing page with the proposed pricing (Section 9) and a deposit-based waitlist
- Keep it a side project — this validation step needs conversations and a static page, not engineering time

**GO signal — build the lean MVP from Section 8:** at least 15 people put down a real deposit or buy the founder's lifetime license within roughly 6–8 weeks of starting outreach. Money committed, not an email address or a "sounds cool, let me know when it's ready."

**NO-GO / pause signal:** genuine outreach in the identified communities produces plenty of "I'd try that if it were free" interest but no real pre-payment. This matches the risk the March 2026 research already flagged — soap makers are price-sensitive and a meaningful segment will always prefer free. If that's what happens, don't force it: keep SoapLedger as an internal tool, and consider re-running the same playbook against the stronger adjacent verticals research already ranked higher (skincare-beyond-soap, cottage food) instead of pushing further into an unproven niche.

**Why conditional rather than a straight yes:** the wedge (order + labels + dashboard) is real, and the engineering lift is genuinely small for a solo founder if scoped per Section 8. But nothing in this document is actual money from a stranger yet — that's the one signal worth gating the real build on.
