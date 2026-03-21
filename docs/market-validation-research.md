# Market Validation Research — Solo Maker Business Software

*March 2026*

---

## Part 0: The Founding Insight

This product started with a simple observation. A soap maker — orders coming in over WhatsApp, batches being made on weekends, customers happy — had no idea if she was profitable. Not because she was careless. Because she was busy making things.

The orders lived in WhatsApp. She'd mentally note them and tell herself she'd total them up later. Later rarely came. When asked "are you making money?", the honest answer was "I think so." When the numbers were finally pulled together and shown to her, she was surprised — and impressed. But the dashboard felt overwhelming. The graphs, the KPIs, the trend lines. She just wanted to know the answer.

She didn't want inventory software. She could *see* her inventory — the oils on the shelf, the moulds, the finished bars. She didn't need reorder alerts. She didn't want to log every 500g of shea butter. What she wanted was simple:

> *"Am I making money? And if not, what's eating into it?"*

That's the gap. Not inventory. Not recipes. Not compliance. Just: **revenue clarity for people who are building a product, not running a company.**

The bigger insight is this — most solo artisans start as hobbyists. For it to become a real business, they need a revenue-first mindset. Without that, a busy season feels like success even when it isn't. They keep going because they love making things, not because the numbers work. And at some point, that catches up.

The current version of this software has detailed dashboards, charts, and trend lines. That's useful *after* someone is bought in. The harder, more important problem is the person who isn't bought in yet — who finds numbers intimidating — and needs something gentle enough to not feel like admin, but clear enough to actually change how they think about their business.

**The real customer:** someone who has decided (or is deciding) that this is a business, not just a hobby — but who is overwhelmed by the gap between making things and running a company.

---

## Part 1: Soap Makers

### Honest Summary

**Worth talking to people. Not worth building a full-stack competitor to CraftyBase — unless you go narrow and different.**

The market is not saturated at the tool level, but it is noisy. There are real gaps, and the angle SoapLedger already takes — financial clarity, profitability tracking, order management — is genuinely different from what the main players offer. The risk is not too many competitors. It's that the market is small and fragmented, and buyers are cost-sensitive hobbyist-to-micro-business owners.

---

### The Competitive Landscape

**CraftyBase** — Market leader, cloud-based, $9–$35/month, ~3,000 users
- Strong: ingredient inventory, bills of materials, batch tracking, Etsy/Shopify sync
- Weak: financial analysis, profitability trends, order-focused views, accounting integration
- User complaints: no banking integration, tedious setup, cumbersome gift set tracking

**SoapMaker 3** — Veteran desktop app, one-time purchase
- Strong: soap chemistry (lye calculator, oil properties, recipe sizing)
- Weak: everything business — no customer management, no e-commerce, no financial reporting
- Legacy UX, no cloud sync

**Inventora** — Lighter inventory-focused alternative, freemium
- Focused on COGS tracking, low-stock alerts, supplier management

**The gap:** BatchMaster, Katana, Cin7 start at $500+/month. Most mid-growth makers stitch together CraftyBase + spreadsheets + a separate accounting tool and none of it talks together cleanly.

---

### Where SoapLedger Sits Differently

CraftyBase and SoapMaker 3 are **production-first** — they think from the batch outward.

SoapLedger is **revenue-first** — it thinks from the order inward. Monthly profitability, break-even tracking, surplus/deficit trends, cost-per-soap. None of the dedicated soap tools do this. That's the real gap.

The differentiation angle: **"the financial brain for your soap business"** — not competing with CraftyBase on inventory, but being the thing that tells you whether your business is actually working.

---

### Risk Assessment

**Against:**
- Addressable market is small. 10,000 paying users × $15/month = $1.8M ARR. Viable for indie, thin for anything else.
- Soap makers are price-sensitive. Many balk at CraftyBase's $20/month.
- CraftyBase could ship better financial reporting any quarter.
- Serious makers eventually graduate to Shopify + QuickBooks.

**For:**
- Simplicity is a feature. CraftyBase is complex; many want something lighter.
- Business-analytics angle is genuinely underserved and unowned.
- Going domain-specific (soap/bath & body only) creates trust that generic tools can't.
- Market growing 5–7% annually; more hobbyists professionalising.

---

### Where to Talk to Soap Makers

**Highest signal (business-minded):**
| Community | Where |
|-----------|-------|
| Soapmaking Forum — Business section | soapmakingforum.com |
| Handcrafted Soap and Cosmetic Guild (HSCG) | soapguild.org |
| Soapah Community — Business section | soapahapp.com/community |

**Good signal (large, active):**
| Community | Where |
|-----------|-------|
| Saponification Nation (45k+ members) | Facebook |
| Soap Making and Business Coaching | Facebook |
| r/soapmaking | Reddit |

---

### What to Ask

Don't lead with "I'm building software." Lead with curiosity.

> *"Trying to understand how soap business owners manage the money side — not the recipes, but the orders, pricing, and figuring out if you're actually profitable month to month. What do you use right now, and what's the most painful part of it?"*

**Listen for:**
- "I have no idea if I'm making money" → strong signal
- "I use spreadsheets and it's a nightmare" → strong signal
- "CraftyBase does everything I need" → weak signal for this angle
- "I'm just a hobby seller" → not the customer

---

## Part 2: Other Solo Maker Verticals

The same core problem exists across nearly every handmade product business. Here's an honest ranking of which verticals are genuinely underserved vs. already well-covered.

---

### Underserved — Worth Pursuing

#### Cottage Food Producers (Jam, Pickle, Preserve Makers)
**Signal strength: HIGH**

- All 50 US states now have cottage food laws; estimated 50,000–100,000+ active producers
- Most are selling at farmers markets, direct, or small online stores
- **No strong dedicated software exists** — they use free tools (Homegrown for ordering, BakeProfit calculator, Wave for accounting) that don't talk to each other
- Core pain: they guess at costs and guess wrong. Most don't account for jars, labels, platform fees, or their time
- Regulatory complexity (state-by-state rules) would be a natural moat for software that understands it
- **Closest to the soap maker profile**: solo, starting out, taking direct orders, no idea if they're profitable

#### Handmade Skincare Beyond Soap (Serums, Balms, Lotions)
**Signal strength: HIGH**

- Very few dedicated solutions for solo makers — existing software targets large beauty brands using fulfillment centres
- Same pain points as soap: batching, COGS, custom formulations, compliance labelling
- Batch tracking + expiry dates add complexity spreadsheets can't handle
- Market growing fast (clean beauty, indie skincare is booming)
- A natural extension from soap — many soap makers already make balms and lotions

---

### Moderate Signal — Worth Exploring

#### Handmade Jewelry Makers (Custom Orders)
**Signal strength: MEDIUM**

- Craftybase, Sumtracker, Jewel360 exist — but they focus on inventory
- The gap is specifically in **custom order profitability**: tracking whether a bespoke piece actually made money (time + materials + packaging vs. price charged)
- Enormous community (jewelry is one of the largest Etsy categories)
- Risk: Craftybase has strong mindshare here

#### Handmade Clothing / Sewists (Custom Pieces)
**Signal strength: MEDIUM**

- Orderry exists for tailors but is very niche
- Most solo sewists use Google Forms + email + spreadsheets
- Core pain: pricing custom work is hard (time-based? complexity-based?) and tracking whether any order made money is nearly impossible
- Smaller addressable market than jewelry or food

#### Micro Embroidery / Cricut / Vinyl Businesses (under 20 orders/month)
**Signal strength: MEDIUM-LOW**

- Printavo and Teesom serve professional shops well
- Teesom has a free tier for under 20 orders/month — so the sub-20 segment is somewhat covered
- Gap exists only for the smallest operators (1–5 orders/month) who are still figuring out if this can be a business
- Narrow window before they either grow into Teesom or quit

---

### Well-Served — Avoid

#### Home Bakers & Custom Cake Makers
**Strong existing software.** BakeSmart, CakeBoss, Bakesy, FoodStorm — all purpose-built, all reasonably good. The pain is real (most undercharge badly) but the tools exist. Would need a very specific angle to compete.

#### Candle Makers
**Craftybase and Inventora dominate and are well-regarded.** Candle making is frequently cited as a model use case for both platforms. Market is served. Moving on.

#### Pottery / Ceramics
**Craftybase, Classly, CeramicSys all exist.** CeramicSys is even free. The pain exists but the software gap doesn't.

---

## Part 3: The Cross-Cutting Insight

Every one of these verticals shares the same root problem:

> **"I don't know if I'm actually making money."**

Because they're not tracking:
- True material costs (forget hidden items, bulk buying variation)
- Their own time/labour (especially critical for custom work)
- Overhead (platform fees, packaging, shipping supplies)
- Which specific products or orders are profitable

And spreadsheets fail them as they grow because:
- Manual entry is error-prone and slow
- No auto-update when ingredient costs change
- Can't handle multi-component "recipes" (a gift set with 4 soaps + a candle + a card)
- No integration with Etsy, Shopify, WhatsApp orders

The opportunity isn't to build an inventory system. It's to build something that answers **"how is my business actually doing?"** in a way that a solo maker can understand without an accounting degree.

---

## Part 4: The Shortlist

If you're going to test this beyond soap, here's the priority order based on market need, software gap, and similarity to what SoapLedger already does:

| Vertical | Market Gap | Similarity to Soap | Community Size | Verdict |
|----------|-----------|-------------------|----------------|---------|
| Handmade skincare (beyond soap) | High | Very high | Medium | **Start here** |
| Cottage food (jam, pickle, preserve) | High | Medium-high | Large | **Strong second** |
| Custom jewelry | Medium | Medium | Very large | Worth validating |
| Custom sewists | Medium | Low-medium | Small | Lower priority |
| Candles | Low | High | Large | Skip |
| Bakers/cakes | Low | Medium | Large | Skip |

---

## Communities to Post In (Beyond Soap)

| Vertical | Community | Where |
|----------|-----------|-------|
| Skincare makers | r/DIYBeauty, Indie Beauty Brands Facebook group | Reddit, Facebook |
| Cottage food | Cottage Food Community (Facebook, 25k+), Forrager community | Facebook, forrager.com |
| Jewelry | r/jewelrymaking, Jewelry Making & Selling (Facebook) | Reddit, Facebook |
| Sewists | r/sewing, Sewing Business Owners (Facebook) | Reddit, Facebook |

**Same opening question works across all of them:**

> *"For those of you selling your [product] — how do you manage the business side? Specifically, do you actually know which products or orders are profitable for you, and how do you track that?"*

---

---

## Part 5: The Conversation Playbook

### Philosophy

The goal of these conversations is not to validate a product. It's to find out if the *feeling* is real — that specific anxiety of being busy but not knowing if it's working financially. Let them describe it in their own words.

- Don't mention software, apps, or tools in the opening
- Ask about their *experience*, not their *process*
- Resist the urge to suggest solutions — you're listening, not pitching
- If they open up, go slow. The best signal comes from follow-ups, not openers

---

### Opening Messages

Adapt the tone to the community. Formal forums need a different voice than WhatsApp groups or Reddit.

**Version A — casual and personal** *(Facebook groups, Reddit, Instagram DMs)*
> "Question for those of you who sell your [soaps / candles / jams] — do you actually know if you're making money? Not just covering costs, but genuinely profitable. I've been thinking about this a lot lately and curious how others handle the money side when you're doing everything yourself."

**Version B — direct and practical** *(business-focused forums, HSCG communities)*
> "For solo makers who are selling — how do you track your revenue? Not inventory or recipes, just the money coming in and whether it's actually worth it. Do you have a system, or is it more of a 'I'll figure it out at the end of the month' situation?"

**Version C — story-led and empathetic** *(WhatsApp groups, close communities, DMs)*
> "Honest question — if someone asked you right now 'is your [soap / candle / jam] business profitable?', would you know the answer? I've been talking to a few makers about this and I think it's more common than people admit to not really know."

---

### Follow-Up Questions

Don't rush through these. Pick two or three based on where the conversation goes naturally.

**On financial awareness:**
- "At the end of the month, do you know roughly how much you made — or is it always a bit of a surprise when you sit down to count?"
- "Have you ever had a really busy month and then wondered where all the money went?"

**On where orders live:**
- "Where do most of your orders come from — WhatsApp, Instagram DMs, in person at markets? How do you keep track of them all?"
- "Do you ever have to ask a customer to remind you what they ordered, or chase up a payment you forgot about?"

**On pricing:**
- "How did you decide what to charge? Did you sit down and work out the actual cost of making it, or did you start from what felt right and go from there?"
- "Have you ever finished a big order and felt like you probably undercharged — but weren't sure by how much?"

**On the emotional experience** *(these get the most honest answers):*
- "Does the money/business side of things stress you out, or is it something you've got sorted?"
- "If you could change one thing about how you run the business side — not the making side — what would it be?"
- "When things are going well, how do you know? Is it a feeling, or do you have something that shows you the numbers?"

---

### What You're Listening For

**Strong signal — this person has the pain:**
- "Honestly I have no idea, I just know money comes in"
- "My orders are all over the place, mostly WhatsApp"
- "I keep saying I'll total it up at the end of the month but I never actually do"
- "I've been meaning to set up a spreadsheet but..."
- "I think I'm making money but I'm not sure"
- "We had a really busy Diwali / Christmas and I still don't know if we actually profited"
- "Numbers really aren't my thing"
- "My husband helps me with the accounts" *(means they've outsourced the pain, not solved it)*

**Weak signal — this person has a system or doesn't feel the gap:**
- "I use [specific software] and it works well for me"
- "I have a spreadsheet I update every week"
- "I know my cost per unit pretty precisely"
- "I only sell at markets so it's easy to track"

**Not the customer:**
- "I'm not really trying to make money from it"
- "It's more of a hobby right now"
- "My day job covers everything, this is just for fun"

---

### The Question to Sit With After 10–15 Conversations

> *Does this person want to understand their business — or do they want to be reassured their hobby is okay?*

The product only works for the first group. People who have already decided (or are deciding) that this is a real business, but who are drowning in the space between making things and running a company. The second group won't pay for clarity they're not ready to face — and you can't sell them into it.

If most conversations are landing in the second group, that's useful information too: the market might be there, but the timing (hobby → business transition) is harder to reach than expected.

---

*Sources: CraftyBase, SoapMaker 3, Inventora, BakeSmart, Printavo, Teesom, Homegrown, Forrager, Soapmaking Forum, HSCG, r/soapmaking, market size reports (Grand View Research, Verified Market Research), Etsy statistics 2026*
