# Reel Builder — Plan for healingsoil.in

**Date:** 2026-04-03

**Core problem:** You have a large library of product photos and videos but no efficient way to turn them into a narrative reel. The bottleneck is not the media — it is the story structure and assembly.

**What this is not:** AI image generation. All visuals come from your existing library.

**Connection to Growth Insights:** Growth Insights identifies *what* to make a reel about (based on GSC and order data). Reel Builder takes that topic and produces an actual MP4 using your media. The two features connect but are built independently.

---

## The workflow

```
Topic (from Growth Insights or manual input)
        ↓
Gemini Flash generates a 5-6 scene script
Each scene has: text overlay + shot type needed + duration
        ↓
For each scene, system picks a file from your media library
matching the shot type (product / process / ingredients /
lifestyle / lather)
        ↓
Optional: TTS voiceover for the script narration
        ↓
FFmpeg assembles:
  - clip/photo per scene at correct duration
  - text overlay timed to each scene
  - fade transitions between scenes
  - background music (from your free music folder)
  - voiceover track (if used)
        ↓
Output: 9:16 MP4 ready to upload to Instagram
```

---

## Narrative structure Gemini produces

Reels that work in this category follow a consistent shape. The prompt instructs Gemini to always return this structure:

| Scene | Duration | Purpose | Typical shot type |
|---|---|---|---|
| 1 | 3s | Hook — surprising or specific statement | lifestyle or ingredient |
| 2 | 4s | Problem or context | lifestyle |
| 3 | 5s | Your product / process as the answer | process or product |
| 4 | 5s | Key benefit, specific detail | ingredient or lather |
| 5 | 5s | Result or feel | lifestyle |
| 6 | 3s | Brand name + soft CTA | product or packaging |

Total: ~25s. Fits Instagram Reel sweet spot.

Gemini returns JSON:
```json
{
  "topic": "goat milk soap benefits for sensitive skin",
  "scenes": [
    {
      "scene": 1,
      "duration": 3,
      "text": "Most soaps strip your skin. This one feeds it.",
      "shot_type": "lifestyle",
      "direction": "close shot of soap in hands, warm light"
    },
    ...
  ],
  "music_mood": "calm, warm, acoustic"
}
```

The `direction` field is a note for you when you manually select the clip — it is not used programmatically in v1.

---

## The prerequisite: media organisation

**This is the only thing that needs doing before any code is written.**

Organise your existing photos and videos into folders by shot type. Everything else depends on this.

```
/media
  /product       finished bars, packaging, flat lays
  /process       pouring, mixing, cutting, curing
  /ingredients   raw materials, oils, botanicals, herbs
  /lifestyle     soap in hands, bathroom shelf, gifting, unwrapping
  /lather        soap in use, bubbles, texture, water
  /music         royalty-free tracks organised by mood (calm, upbeat, etc.)
```

Rules:
- Videos and photos can both live in the same folder — FFmpeg handles both
- Each folder should have at least 5-8 files before automating that shot type
- File names don't matter — the system picks randomly within the folder unless you add tags later

**Time to organise: 1-2 hours one-time. Everything after this is automated.**

---

## Phases

### Phase 1 — Media Library + Script Generation (1 day, difficulty 2/5)

**What:**
- Set up the folder structure above and populate it
- Build `app/api/reels/script/route.ts` in SoapLedger
- Receives a topic string, calls Gemini Flash, returns the scene JSON

**Gemini prompt sent:**
```
You are creating an Instagram Reel script for Healing Soil
(healingsoil.in), a small-batch natural soap brand from Goa, India.
Products: Goat Milk, Shea Butter, Glycerine, Loofah, Travel soaps.
Brand tone: warm, honest, unhurried. Not salesy.
Platform: Instagram Reels. Content auto-crosses to Facebook — create
for Instagram only. Do not adjust for Facebook.

Topic: [topic from Growth Insights or manual input]

Return a 5-6 scene reel script as JSON. Each scene needs:
- duration (seconds, total reel 20-28s)
- text (the overlay text, max 8 words, punchy)
- shot_type (one of: product, process, ingredients, lifestyle, lather)
- direction (brief note describing the ideal shot)

Also return: music_mood (calm / upbeat / emotional)
```

**Cost:** ~$0 (Gemini free tier)
**Packages needed:** none new — Gemini SDK already in Growth Insights

---

### Phase 2 — FFmpeg Assembly (1.5 days, difficulty 3/5)

**What:** `app/api/reels/build/route.ts`

Receives the scene JSON. For each scene:
1. Picks a random file from `/media/[shot_type]/`
2. If it's a photo: converts to video clip at the scene duration using FFmpeg
3. If it's a video: trims to the scene duration
4. Adds text overlay (white text, bottom third, readable font)
5. Adds fade transition between scenes
6. Mixes in music track at low volume
7. Outputs 9:16 MP4

**FFmpeg is the right tool here.** It is free, handles photos and videos uniformly, runs server-side, and is well-documented for this exact use case (slideshow with overlays).

**Key FFmpeg operations needed:**
- `loop` filter for photos (hold a still image for N seconds)
- `drawtext` filter for text overlays
- `xfade` filter for transitions between clips
- `amix` for combining voiceover + music
- Scale and crop to 1080x1920 (9:16)

**Running FFmpeg in Next.js:** Use `child_process.spawn` in the API route. FFmpeg must be installed on the server. On Vercel this is a problem (Vercel functions don't have FFmpeg). Two options:
- Run a small separate Node server for FFmpeg (could be a free Railway/Render instance)
- Or trigger FFmpeg locally via a script and upload the result — simpler for now

**Difficulty: 3/5** — FFmpeg command construction is the hardest part. The filters chain gets complex when combining photos, video, text, and audio. Plan for debugging time.

**Cost:** $0

---

### Phase 3 — Voiceover (optional, 0.5 days, difficulty 1/5)

**What:** Add TTS narration track.

The script text from each scene is concatenated and sent to a TTS API. The audio is mixed under the text overlays.

**Options:**
| Provider | Cost | Quality |
|---|---|---|
| Google Cloud TTS | Free tier (1M chars/month) | Good |
| OpenAI TTS | $15/1M chars (~$0.01/reel) | Excellent |
| ElevenLabs | Free tier (10k chars/month) | Best, most natural |

For a 25-second reel with ~50 words of narration: all three are effectively free at your volume.

**Note:** Many successful natural brand reels use music-only with text overlays — no voiceover. Don't add this until you've validated the music-only version works.

**Cost:** ~$0

---

### Phase 4 — SoapLedger UI (1 day, difficulty 2/5)

**What:** A `/reels` page in SoapLedger.

```
/reels

[+ New Reel] button → opens topic input

Recent Reels:
┌─────────────────────────────────────────┐
│ Goat Milk Soap Benefits                 │
│ Generated: Apr 3, 2026                  │
│ 6 scenes · 26 seconds                  │
│ [Preview Script] [Download MP4] [Regen] │
└─────────────────────────────────────────┘
```

Topics can come from:
1. Growth Insights → "Generate Reel" button on a reel card (passes topic automatically)
2. Manual input on the /reels page

Store generated reels in a `reels` table in Neon:
```sql
CREATE TABLE reels (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic        TEXT NOT NULL,
  script       JSONB NOT NULL,
  mp4_path     TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_sec INTEGER
);
```

**Sidebar:** add to `components/Sidebar.jsx`:
```js
{ label: 'Reels', href: '/reels', icon: Video }
```

---

## Difficulty Summary

| Phase | What | Difficulty | Time |
|---|---|---|---|
| 0 | Organise media into folders | 1/5 | 1-2 hrs (one-time) |
| 1 | Script generation (Gemini) | 2/5 | 1 day |
| 2 | FFmpeg assembly | 3/5 | 1.5 days |
| 3 | TTS voiceover (optional) | 1/5 | 0.5 days |
| 4 | SoapLedger /reels UI | 2/5 | 1 day |

**Total: 3-4 days of build after media is organised**

---

## Cost summary

| Component | Cost |
|---|---|
| Gemini Flash (script) | $0 |
| FFmpeg (assembly) | $0 |
| Music (free library) | $0 |
| TTS (optional) | ~$0.01/reel |
| Hosting (FFmpeg server) | $0 if local; ~$0/month on free Railway tier |

**Per reel cost: ~$0**

---

## The Vercel problem (important)

Vercel serverless functions cannot run FFmpeg — no binary support, 50MB limit, 10s timeout. Three ways around this:

1. **Run FFmpeg locally via a script** — simplest for v1. You trigger the build from SoapLedger, it calls a local Node script on your machine, output drops into a folder. Not automated but gets you validating the output quickly.

2. **Separate lightweight server** — a small Node/Express server on Railway (free tier) that has FFmpeg installed and exposes one endpoint. SoapLedger calls it. This is the right long-term architecture.

3. **Move the app off Vercel** — not worth it just for this.

**Recommendation:** Start with option 1 (local script) to validate the output looks good. Move to option 2 once you're happy with the reel quality.

---

## New files

- `app/api/reels/script/route.ts` — Gemini script generation
- `app/api/reels/build/route.ts` — triggers FFmpeg assembly
- `app/reels/page.jsx`
- `app/reels/ReelsClient.jsx`
- `scripts/build-reel.js` — local FFmpeg script (v1)
- `db-schema/migration_v10.sql` — reels table

## Files to modify

| File | Change |
|---|---|
| `components/Sidebar.jsx` | Add Reels nav item |
| Growth Insights action cards | Add "Generate Reel" button on reel-type cards |

---

## What to do first (before writing any code)

1. Organise your media into the 5 folder structure above
2. Pick 3-5 tracks from a free music library (Pixabay Audio, Free Music Archive) and put them in `/media/music/calm/` and `/media/music/upbeat/`
3. Run the Phase 1 script generation manually (call Gemini with a test topic) and check if the scene breakdown feels right for your content
4. Only then build the FFmpeg assembly

The media organisation and the script quality check are the two things that determine whether the rest of the build is worth doing.
