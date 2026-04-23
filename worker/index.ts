// ─── GuestVue Railway Worker ──────────────────────────────────────────────────
// Deploy this separately on Railway (Node.js service).
// It receives jobs from the Next.js API and processes them asynchronously.
// NEVER run FFmpeg or Sharp on the Next.js API thread.
//
// To deploy:
//   1. Push this worker/ folder as its own Railway service
//   2. Set environment variables (same as .env.local + WORKER_SECRET)
//   3. Set start command: npx ts-node worker/index.ts
//
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express'
import { processUpload } from './jobs/process-upload'
import { generateReel } from './jobs/generate-reel'

const app = express()
app.use(express.json({ limit: '10mb' }))

// ── Auth middleware ────────────────────────────────────────────────────────────
function authGuard(req: express.Request, res: express.Response, next: express.NextFunction) {
  const secret = req.headers['x-worker-secret']
  if (!secret || secret !== process.env.WORKER_SECRET) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// ── Process upload (compress image or video) ───────────────────────────────────
app.post('/jobs/process-upload', authGuard, async (req, res) => {
  try {
    const { uploadId, eventId, key, type, plan } = req.body
    if (!uploadId || !eventId || !key || !type) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    // Fire and forget — respond immediately so Next.js API doesn't wait
    res.json({ accepted: true, uploadId })

    // Process in background
    processUpload({ uploadId, eventId, key, type, plan }).catch(err => {
      console.error(`[worker] processUpload failed for ${uploadId}:`, err.message)
    })
  } catch (err: unknown) {
    console.error('[worker] /jobs/process-upload error:', err)
    res.status(500).json({ error: 'Worker error' })
  }
})

// ── Generate reel ─────────────────────────────────────────────────────────────
app.post('/jobs/generate-reel', authGuard, async (req, res) => {
  try {
    const { reelId, eventId, type } = req.body
    if (!reelId || !eventId) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    res.json({ accepted: true, reelId })

    generateReel({ reelId, eventId, type }).catch(err => {
      console.error(`[worker] generateReel failed for ${reelId}:`, err.message)
    })
  } catch (err: unknown) {
    res.status(500).json({ error: 'Worker error' })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`[worker] GuestVue worker running on port ${PORT}`)
})
