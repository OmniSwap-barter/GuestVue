# GuestVue — Project Context for Claude Code

## What is GuestVue?
Event photo/video collection and AI highlight reel platform. Guests scan a QR code at events to upload photos/videos. The host can then generate a cinematic 9:16 highlight reel (TikTok/Reels-ready) from the uploads, customise a QR card, and build invitation cards.

Live domain: **theguestvue.com**
Repo: https://github.com/OmniSwap-barter/GuestVue

---

## Tech Stack

| Layer | Service | Notes |
|-------|---------|-------|
| Frontend + API | Next.js 14 (App Router) | Deployed on Vercel |
| Database | Supabase (Postgres) | Auth, events, uploads, reels tables |
| File storage | **Supabase Storage** (`event-uploads` bucket) | ALL uploads and reel outputs go here |
| Reel rendering | BullMQ worker on Railway | Express + BullMQ consumer, FFmpeg via `ffmpeg-static` npm package |
| Job queue | Redis on Railway | BullMQ uses ioredis |
| Legacy storage | Cloudflare R2 | Old reels only — DO NOT use for new uploads. R2 has no CORS headers, videos won't play inline |

---

## Architecture

```
Guest browser
  └─> POST /api/uploads  (Next.js on Vercel)
        └─> Supabase Storage  (event-uploads bucket)
        └─> INSERT uploads table

Host dashboard
  └─> POST /api/events/[eventId]/generate-reel  (Next.js)
        └─> BullMQ → Redis queue

Railway worker (worker/)
  └─> BullMQ consumer picks up job
  └─> Downloads media from Supabase Storage URLs
  └─> Runs FFmpeg (ffmpeg-static) to render 1080×1920 video
  └─> Uploads output to Supabase Storage
  └─> Updates reels table (status, output_url, draft_url)
```

---

## Key Decisions Made (do not reverse these)

1. **Supabase Storage only** — R2 is legacy. `app/api/uploads/route.ts` was completely rewritten to use Supabase Storage. The worker's `uploadReelOutput()` also uploads to Supabase Storage. R2 credentials may not even be available on Vercel.

2. **ffmpeg-static** — The Railway worker uses `ffmpeg-static` npm package (no system FFmpeg required). `FFMPEG_BIN = ffmpegStatic || 'ffmpeg'`. The Dockerfile also installs system ffmpeg as fallback.

3. **Video type detection** — iOS/Android sometimes store h264 video with type='photo' in the DB. Worker detects actual type from URL extension + Content-Type response header at download time, NOT from DB type field.

4. **No `crossOrigin="anonymous"` on video elements** — R2 doesn't send CORS headers. We removed `crossOrigin` so browsers play videos inline without needing CORS.

5. **Smart cover-crop for FFmpeg** — `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920` — no black bars, fills the frame.

6. **No zoompan** — Caused Railway timeout. Replaced with `scale+crop+fps=30`.

---

## Important Files

```
app/
  api/
    uploads/route.ts                          — Guest upload handler (Supabase Storage)
    events/[eventId]/
      generate-reel/route.ts                  — Submits reel job to BullMQ
      reels/route.ts                          — List reels for event
      reels/[reelId]/publish/route.ts         — Publish draft to gallery
  dashboard/events/[eventId]/
    ReelBuilderPanel.tsx                      — Full reel builder UI + Magic Button
    qr/QRCustomizer.tsx                       — QR code card designer
    invitations/InvitationBuilder.tsx         — Invitation card builder (6 themes)

worker/
  jobs/generate-reel.ts                       — Main FFmpeg rendering logic
  index.ts                                    — BullMQ consumer + Express server
  Dockerfile                                  — Railway deployment
  nixpacks.toml                               — Railway build config (ffmpeg nixpkg)
  package.json                                — includes ffmpeg-static, bullmq, ioredis
```

---

## Reel Themes (10 total)
`viral_wedding`, `birthday_bangerz`, `afrobeats_moments`, `amapiano_vibes`, `love_story`, `corporate_flex`, `party_highlights`, `glow_up_reel`, `highlife_classic`, `cinema_mode`

## Music Tracks (7 total)
`afrobeats_upbeat`, `afrobeats_chill`, `amapiano_dance`, `highlife_classic`, `pop_romantic`, `pop_energetic`, `cinematic`

---

## Environment Variables

### Vercel (Next.js)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL` — Railway Redis connection string
- `WORKER_URL` — Railway worker base URL

### Railway (worker)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL`
- `PORT` (auto-set by Railway)

---

## Known Issues / Current State

- **3 old reels in R2** — These have R2 URLs in the DB. They can be opened via the "▶ Watch" button (opens new tab) but won't play inline. New reels generated going forward use Supabase Storage and play inline fine.
- **Reel status polling** — ReelBuilderPanel polls `/api/events/[eventId]/reels` every 6 seconds while status is `queued` or `processing`.
- **Draft vs Published** — After generation, reel lands in `draft` state (only host can see). Host clicks "Publish to Event Gallery" to make it visible to guests.

---

## Coding Style / Conventions

- TypeScript throughout
- Tailwind CSS for styling
- Brand colors: `#0A4F6B` (navy), `#14B8A6` (teal), `#E8735C` (coral/orange)
- Font: `font-display font-black` for headings (custom display font)
- All new API routes use Supabase client from `@/lib/supabase`
- Worker uses `supabaseAdmin` (service role) for all DB operations
- Error handling: always return `{ error: string }` with appropriate HTTP status

---

## How Cowork + Claude Code work together

This file (`CLAUDE.md`) is the bridge. Claude Code reads it at session start and knows everything above. When working in Cowork for planning/visual tasks and Claude Code for implementation:

1. Keep this file updated with any major decisions
2. Cowork can update CLAUDE.md with new context; Claude Code will pick it up next session
3. Both work on the same git repo — push from either, pull in the other
