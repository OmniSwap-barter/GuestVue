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

7. **Remotion is planned but not yet implemented** — Remotion (React-based video renderer) is the target upgrade for the rendering engine in Phase 3+. When added, the architecture will be: Remotion renders the silent visual track (animated titles, motion graphics, CapCut-style transitions) → FFmpeg mixes in audio and does final MP4 encoding. They work together. Do NOT add Remotion until Phase 2 is fully complete and the core product is stable. When you do add it, keep FFmpeg — don't replace it.

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

---

## Full Feature Roadmap

Build in phase order — each phase depends on the one before it.

### Phase 1 — Guest Experience Foundation (build first)
Everything else depends on guests having a real destination after they upload.

| Feature | What it is | Key files to create |
|---------|-----------|-------------------|
| **Guest gallery page** | `/e/[eventId]` becomes a photo wall — guests browse all approved uploads, see the published reel | `app/e/[eventId]/page.tsx`, `app/e/[eventId]/GalleryView.tsx` |
| **Photo download** | Guests can download individual photos or a ZIP of all event photos | `app/api/events/[eventId]/download/route.ts` |
| **Guest identity** | Guest enters their name on upload — stored with the upload record | Add `guest_name` column to `uploads` table |

**DB migration needed:**
```sql
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS approved boolean DEFAULT true;
```

---

### Phase 2 — Host Control (builds on Phase 1)
Gives hosts power over what guests see.

| Feature | What it is | Key files to create |
|---------|-----------|-------------------|
| **Photo moderation** | Host approves/rejects individual uploads before they appear in gallery/reel | `app/dashboard/events/[eventId]/moderation/page.tsx`, `app/api/events/[eventId]/uploads/[uploadId]/approve/route.ts` |
| **"Reel ready" notification** | Email host when reel finishes rendering | Add email call in worker after status → complete. Use Resend or Supabase email. Add `RESEND_API_KEY` to Railway env |
| **Event analytics** | Scans, uploads, gallery views, reel plays — simple counts on dashboard | `app/api/events/[eventId]/analytics/route.ts`, new `event_analytics` table |

**DB migration needed:**
```sql
CREATE TABLE IF NOT EXISTS event_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id),
  metric text NOT NULL,  -- 'scan', 'upload', 'gallery_view', 'reel_play'
  created_at timestamptz DEFAULT now()
);
```

---

### Phase 3 — Viral Growth (builds on Phase 1 + 2)
Features that make GuestVue spread at events.

| Feature | What it is | Key files to create |
|---------|-----------|-------------------|
| **WhatsApp share** | One-tap button on dashboard and gallery — opens WhatsApp with pre-filled message + gallery link | UI only — `https://wa.me/?text=...` deep link |
| **Custom event landing page** | Host sets welcome message, accent colour, their logo on the guest upload page | Add `landing_config jsonb` column to `events` table. Update `app/e/[eventId]/page.tsx` |
| **"Find my photos"** | Guest types their name → filtered view of photos tagged with that name | Filter on `guest_name` column added in Phase 1 |
| **Multiple reels** | Host can generate a short highlights reel AND a full-length version from same event | Already partially supported — just expose it properly in ReelBuilderPanel |

**DB migration needed:**
```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS landing_config jsonb;
-- landing_config shape: { welcome_msg, accent_color, logo_url, show_guest_count }
```

---

### Phase 4 — Monetisation (builds on everything)
The pricing logic exists in code — this phase makes it real.

| Feature | What it is | Key files to create |
|---------|-----------|-------------------|
| **Paystack pricing page** | Proper `/pricing` page with plan cards, feature comparison, Paystack checkout | `app/pricing/page.tsx`, `app/api/billing/checkout/route.ts` |
| **Per-event white-label** | One-time ₦10,000 add-on: removes GuestVue branding from guest upload page + reel watermark for that event | `app/api/events/[eventId]/addon/route.ts` (already exists for watermark — extend it) |
| **Plan upgrade flow** | In-app upgrade modal → Paystack → webhook updates `profiles.plan_type` | `app/api/billing/webhook/route.ts` |

---

### Build order within each phase
1. DB migration first (Supabase dashboard or `supabase migration`)
2. API route
3. UI component
4. Wire up to existing pages

### Phase 5 — Remotion Rendering Upgrade (after Phase 2 is stable)
This is the planned upgrade to the video rendering engine. Do not start this until Phases 1 and 2 are fully shipped and stable.

| What | Details |
|------|---------|
| **Remotion renders visual track** | Animated title cards, beat-synced transitions, motion graphics, CapCut-style templates — all built as React components |
| **FFmpeg handles audio + final encode** | Remotion outputs a silent MP4. FFmpeg mixes in background music, ducks audio on video clips, outputs final 1080×1920 MP4 |
| **New worker structure** | `renderRemotionComposition(manifest)` → silent MP4 → `ffmpegMergeAudioVisual(silentMp4, musicUrl)` → final reel |
| **Output still goes to Supabase Storage** | R2 is never used |
| **New DB column** | Add `remotion_manifest JSONB` to `reels` table when this phase starts — stores the programmatic edit instructions |
| **New env vars needed** | `REMOTION_SERVE_URL` on Railway worker |

### Never build out of order
- Don't build analytics before the gallery page (nothing to track yet)
- Don't build WhatsApp share before the gallery page (nothing to link to)
- Don't build the pricing page before moderation (hosts won't pay for a product they can't control)

---

## CRITICAL BUG: Broken Subscription / Payment Loop

### What's broken
Paying for Business, Vendor, or any recurring subscription plan does three wrong things:
1. Treats the payment as a single free-tier event instead of upgrading the user's account
2. Logs the user out and redirects to `/pricing` → `/signup` instead of back to dashboard
3. Asks them to pay again because their plan was never updated in the database

### Root cause
The Paystack webhook handler does not differentiate between a one-off event payment and a subscription payment. It processes everything as an event creation. `profiles.plan_type` is never updated when a subscription is purchased.

### The fix (implement in this order)

**Step 1 — Run the DB migration** (safe SQL, ALTER TABLE only — see roadmap section below)

**Step 2 — Fix Paystack checkout initialization**
When launching a subscription checkout, pass metadata so the webhook knows what type of payment it is:
```typescript
// app/api/billing/initialize/route.ts
body: JSON.stringify({
  email: user.email,
  plan: planCode,  // Paystack plan code
  metadata: {
    user_id: user.id,
    purchase_type: 'subscription',  // 'subscription' | 'one_off_event'
    target_tier: tierName,          // e.g. 'business', 'flex', 'pro'
  }
})
```

**Step 3 — Fix the webhook handler**
File: `app/api/webhooks/paystack/route.ts`
```typescript
// Read purchase_type from metadata to route correctly
const purchaseType = data.metadata?.purchase_type
const targetTier   = data.metadata?.target_tier
const userId       = data.metadata?.user_id

if (purchaseType === 'subscription') {
  // Update profiles table (existing) with new plan
  await supabaseAdmin
    .from('profiles')
    .update({ plan_type: targetTier })
    .eq('id', userId)

  // Also upsert into user_entitlements (new table)
  await supabaseAdmin
    .from('user_entitlements')
    .upsert({
      user_id: userId,
      current_plan_id: targetTier,
      subscription_status: 'active',
      is_unlimited_events: ['business', 'corporate'].includes(targetTier),
      payment_customer_id: data.customer?.customer_code,
    })
  
  // Redirect back to dashboard, NOT pricing or signup
  return redirect('/dashboard')
}

if (purchaseType === 'one_off_event') {
  // existing event creation logic stays here
}
```

**Step 4 — Session preservation**
Authenticated users must NEVER be routed to `/pricing` or `/signup` during or after a payment. After Paystack callback, check session first — if session exists, redirect to `/dashboard`, not to auth pages.

**Step 5 — Add middleware entitlement gate**
File: `middleware.ts`
Check `user_entitlements` before allowing access to `/create-event`. If user has `subscription_status: 'active'` or `event_credits > 0`, bypass pricing entirely.

### What NOT to do
- Do NOT create a new `users` table — Supabase Auth owns users via `auth.users`
- Do NOT reference `media_uploads` or `ai_reels` tables — they don't exist, use `uploads` and `reels`
- Do NOT add Remotion — FFmpeg pipeline works, Remotion would be a months-long rewrite
- Do NOT use R2 for new storage — Supabase Storage only

---

## Safe DB Migration (run in Supabase SQL Editor)

```sql
-- Add plan-aware columns to existing events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_status TEXT DEFAULT 'upcoming';
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_permanent_qr BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS active_page_expiry TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS storage_expiry TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS upload_limit_total INTEGER DEFAULT 50;

-- Add guest identity columns to existing uploads table
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS guest_session_id TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT TRUE;

-- Add error visibility to existing reels table
ALTER TABLE reels ADD COLUMN IF NOT EXISTS error_msg TEXT;

-- NEW: User entitlements (fixes subscription bug)
CREATE TABLE IF NOT EXISTS user_entitlements (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_plan_id TEXT DEFAULT 'free',
  event_credits INTEGER DEFAULT 1,
  is_unlimited_events BOOLEAN DEFAULT FALSE,
  subscription_status TEXT DEFAULT 'inactive',
  payment_customer_id TEXT,
  plan_expiry_date TIMESTAMPTZ,
  ai_reel_generations_remaining INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- NEW: Analytics (Phase 2)
CREATE TABLE IF NOT EXISTS event_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NEW: Affiliate program (future)
CREATE TABLE IF NOT EXISTS affiliate_program (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  referral_code TEXT UNIQUE NOT NULL,
  commission_rate_percentage NUMERIC DEFAULT 20.0,
  paid_referrals_count INTEGER DEFAULT 0,
  total_earnings_kobo BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Current Build Status

| Phase | Feature | Status |
|-------|---------|--------|
| ✅ Core | Guest upload (QR → Supabase Storage) | Done |
| ✅ Core | Reel generation (BullMQ → FFmpeg → Supabase) | Done |
| ✅ Core | 10 themes, 7 music tracks, Magic Button | Done |
| ✅ Core | QR card designer | Done |
| ✅ Core | Invitation card builder (6 themes) | Done |
| ✅ Core | Draft → Publish workflow | Done |
| 🔲 Phase 1 | Guest gallery page | Not started |
| 🔲 Phase 1 | Photo download | Not started |
| 🔲 Phase 1 | Guest name on upload | Not started |
| 🔲 Phase 2 | Photo moderation | Not started |
| 🔲 Phase 2 | Reel ready notification | Not started |
| 🔲 Phase 2 | Event analytics | Not started |
| 🔲 Phase 3 | WhatsApp share | Not started |
| 🔲 Phase 3 | Custom landing page | Not started |
| 🔲 Phase 3 | Find my photos | Not started |
| 🔲 Phase 4 | Paystack pricing page | Not started |
| 🔲 Phase 4 | Per-event white-label | Not started |
| 🔲 Phase 4 | Plan upgrade flow | Not started |

---

## Brand Design System (implement everywhere, no exceptions)

The live site at `guest-vue.vercel.app` does NOT match the intended design. Claude Code must apply this spec consistently across every page, component, and new feature.

### Core Color Tokens

```typescript
// Use these exact values — do not invent alternatives
const brand = {
  deepNavy:  '#060D1A',  // Page backgrounds, sidebar, dark cards
  oceanNavy: '#0A1628',  // Card surfaces, elevated containers
  teal:      '#14B8A6',  // PRIMARY accent — CTAs, links, icons, active states
  coral:     '#E8735C',  // Secondary accent — badges, gradient ends, highlights
}
```

**Tailwind equivalents to use in className strings:**
- Deep Navy background → `style={{ background: '#060D1A' }}` (no Tailwind class — use inline)
- Teal text → `style={{ color: '#14B8A6' }}` or Tailwind `text-teal-400` (close enough)
- Teal border → `border-teal-500`
- Teal button → `bg-teal-500 hover:bg-teal-600`
- Coral badge → `style={{ background: '#E8735C' }}`
- White text on dark → `text-white` or `text-white/80` for secondary

### Page & Layout Rules

- **Every page background**: `#060D1A` (deep navy) — never white, never gray-900
- **Dashboard sidebar**: `#0A1628` with teal left-border on active item
- **Card surfaces**: `background: '#0A1628'`, border `1px solid rgba(255,255,255,0.08)`
- **No light mode** — GuestVue is dark-only. Never add `bg-white` or `bg-gray-50` to full-page layouts.

### Typography Rules

```css
/* Headings — bold display font */
font-family: var(--font-display), sans-serif;
font-weight: 900; /* font-black */

/* Body — clean sans */
font-family: var(--font-sans), sans-serif;
font-weight: 400–600;
```

- Page titles: `text-white font-black text-3xl` (or larger)
- Section headings: `text-white font-bold text-xl`
- Labels / captions: `text-white/60 text-sm`
- Links / interactive text: `color: #14B8A6` (teal)

### Logo Rules

The GuestVue logo has two parts:
1. **Icon** — Camera lens ring (circle with inner circle + 4 corner dots), rendered in `#14B8A6` teal on `#060D1A` background
2. **Wordmark** — "Guest" in white + "Vue" in `#14B8A6` teal, font-black, no space between words

When implementing in code:
```tsx
<span className="font-black text-white">Guest</span>
<span className="font-black" style={{ color: '#14B8A6' }}>Vue</span>
```

Do NOT use a single color for the wordmark. Do NOT render it in all-white or all-teal.

### Button Styles

**Primary CTA (most important action on screen):**
```tsx
// Coral-to-teal gradient — use for "Create Event", "Generate Reel", "Get Started"
className="px-6 py-3 rounded-xl font-bold text-white"
style={{ background: 'linear-gradient(135deg, #E8735C, #14B8A6)' }}
```

**Secondary action:**
```tsx
// Teal solid — use for "Publish", "Download", "Watch Reel"
className="px-5 py-2.5 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 transition-colors"
```

**Ghost / outline:**
```tsx
// For destructive or low-priority actions
className="px-5 py-2.5 rounded-xl font-semibold text-white/70 border border-white/20 hover:border-white/40 transition-colors"
```

**Never use:**
- `bg-blue-*` — off-brand
- `bg-purple-*` — off-brand
- `bg-gray-*` on buttons — invisible on dark bg
- `bg-green-*` — use teal instead

### Badge / Pill Styles

```tsx
// Status badge — active/live
<span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
  style={{ background: '#14B8A6' }}>Live</span>

// Count badge
<span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
  style={{ background: '#E8735C' }}>24 uploads</span>

// Neutral badge
<span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white/60 bg-white/10">Draft</span>
```

### Event Card Component Pattern

```tsx
// Standard event card on dashboard — replicate this pattern
<div className="rounded-2xl overflow-hidden border"
  style={{ background: '#0A1628', borderColor: 'rgba(255,255,255,0.08)' }}>

  {/* Top accent bar — always teal */}
  <div className="h-1 w-full" style={{ background: '#14B8A6' }} />

  {/* Card body */}
  <div className="p-5">
    <h3 className="text-white font-bold text-lg">Event Name</h3>
    <p className="text-white/50 text-sm mt-1">Date · Location</p>

    {/* Stats row */}
    <div className="flex gap-4 mt-4">
      <div className="text-center">
        <p className="text-white font-black text-2xl">42</p>
        <p className="text-white/50 text-xs">Uploads</p>
      </div>
      {/* ...more stats */}
    </div>

    {/* Action buttons */}
    <div className="flex gap-2 mt-5">
      <button className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-teal-500 hover:bg-teal-600 transition-colors">
        Manage
      </button>
    </div>
  </div>
</div>
```

### Guest Upload Page (`/e/[eventId]`) Rules

- Background: `#060D1A`
- Upload zone: dashed border in teal (`border-2 border-dashed border-teal-500/50`), teal camera icon
- CTA button: coral-to-teal gradient
- "Powered by GuestVue" footer link: small, `text-white/30`, never intrusive

### Anti-Patterns — Never Do These

| ❌ Wrong | ✅ Right |
|---------|---------|
| `bg-white` on full page | `style={{ background: '#060D1A' }}` |
| `text-gray-900` on dark bg | `text-white` or `text-white/80` |
| Blue/purple CTAs | Teal (`#14B8A6`) or coral-to-teal gradient |
| All-white logo wordmark | "Guest" white + "Vue" teal |
| Light card backgrounds | `#0A1628` with subtle white border |
| `bg-gray-800` cards | `style={{ background: '#0A1628' }}` |
| Random accent colors | Only teal and coral — nothing else |
