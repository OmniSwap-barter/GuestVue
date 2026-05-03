// ─── GuestVue Railway Worker ──────────────────────────────────────────────────
// Deploy this service on Railway (Node.js service).
// It receives jobs via TWO channels:
//
//   1. BullMQ (preferred) — Redis queue consumed here when REDIS_URL is set
//   2. HTTP POST — Next.js API fires directly at RAILWAY_WORKER_URL when no Redis
//
// Environment variables required:
//   WORKER_SECRET      — shared secret to authenticate HTTP dispatches
//   REDIS_URL          — Redis connection string (enables BullMQ path)
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
//   MUSIC_BASE_URL     — optional CDN base for music tracks
//   RESEND_API_KEY     — optional email notifications
//
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express'
import { Worker, type Job } from 'bullmq'
import IORedis from 'ioredis'
import { processUpload } from './jobs/process-upload'
import { generateReel, type GenerateReelArgs } from './jobs/generate-reel'

// ── Queue names (must match lib/queue.ts in Next.js app) ─────────────────────
const QUEUE_GENERATE_REEL  = 'generate-reel'
const QUEUE_PROCESS_UPLOAD = 'process-upload'

// ── Express HTTP server ───────────────────────────────────────────────────────
const app = express()
app.use(express.json({ limit: '10mb' }))

function authGuard(req: express.Request, res: express.Response, next: express.NextFunction) {
  const secret = req.headers['x-worker-secret']
  if (!secret || secret !== process.env.WORKER_SECRET) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    bullmq: !!process.env.REDIS_URL,
    version: '0.2.0',
  })
})

// HTTP: Process upload (compress image/video)
app.post('/jobs/process-upload', authGuard, async (req, res) => {
  try {
    const { uploadId, eventId, key, type, plan } = req.body
    if (!uploadId || !eventId || !key || !type) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }
    res.json({ accepted: true, uploadId })
    processUpload({ uploadId, eventId, key, type, plan }).catch((err: Error) => {
      console.error(`[worker] processUpload failed ${uploadId}:`, err.message)
    })
  } catch (err) {
    console.error('[worker] /jobs/process-upload error:', err)
    res.status(500).json({ error: 'Worker error' })
  }
})

// HTTP: Generate reel (full job data passed in body for BullMQ-parity)
app.post('/jobs/generate-reel', authGuard, async (req, res) => {
  try {
    const { reelId, eventId, type, uploadIds, musicTrack, removeWatermark,
            logoUrl, logoPosition, theme, transition, textOverlays } = req.body
    if (!reelId || !eventId) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }
    res.json({ accepted: true, reelId })
    generateReel({
      reelId, eventId,
      type: type ?? 'basic',
      uploadIds, musicTrack, removeWatermark,
      logoUrl, logoPosition, theme, transition, textOverlays,
    }).catch((err: Error) => {
      console.error(`[worker] generateReel failed ${reelId}:`, err.message)
    })
  } catch (err) {
    console.error('[worker] /jobs/generate-reel error:', err)
    res.status(500).json({ error: 'Worker error' })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`[worker] HTTP server listening on port ${PORT}`)
})

// ── BullMQ consumers (only when Redis is configured) ─────────────────────────
if (process.env.REDIS_URL) {
  console.log('[worker] REDIS_URL detected — starting BullMQ consumers')

  // Must use new IORedis(url) — passing { url } as options silently fails
  const redisUrl = process.env.REDIS_URL
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,   // required by BullMQ workers
    enableReadyCheck: false,      // required for Upstash
    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
  })
  connection.on('error', (err: Error) => {
    console.error('[bullmq] Redis connection error:', err.message)
  })

  // ── Reel generation consumer ─────────────────────────────────────────────
  const reelWorker = new Worker<GenerateReelArgs>(
    QUEUE_GENERATE_REEL,
    async (job: Job<GenerateReelArgs>) => {
      console.log(`[bullmq] Reel job ${job.id} started: reelId=${job.data.reelId}`)
      await generateReel(job.data)
    },
    {
      connection,
      concurrency: 2,                  // 2 parallel reels (FFmpeg is CPU-intensive)
      lockDuration: 10 * 60 * 1000,   // 10-min stall protection
    }
  )

  reelWorker.on('completed', (job) => {
    console.log(`[bullmq] Reel job ${job.id} completed`)
  })
  reelWorker.on('failed', (job, err) => {
    console.error(`[bullmq] Reel job ${job?.id} failed:`, err.message)
  })
  reelWorker.on('error', (err) => {
    console.error('[bullmq] Reel worker connection error:', err)
  })

  // ── Upload processing consumer ───────────────────────────────────────────
  const uploadWorker = new Worker(
    QUEUE_PROCESS_UPLOAD,
    async (job: Job) => {
      const { uploadId, eventId, key, type, plan } = job.data
      console.log(`[bullmq] Upload job ${job.id} started: uploadId=${uploadId}`)
      await processUpload({ uploadId, eventId, key, type, plan })
    },
    {
      connection,
      concurrency: 5,                  // 5 parallel uploads (I/O-bound)
      lockDuration: 5 * 60 * 1000,
    }
  )

  uploadWorker.on('completed', (job) => {
    console.log(`[bullmq] Upload job ${job.id} completed`)
  })
  uploadWorker.on('failed', (job, err) => {
    console.error(`[bullmq] Upload job ${job?.id} failed:`, err.message)
  })
  uploadWorker.on('error', (err) => {
    console.error('[bullmq] Upload worker connection error:', err)
  })

  // Graceful shutdown on Railway SIGTERM
  process.on('SIGTERM', async () => {
    console.log('[worker] SIGTERM — graceful shutdown in progress...')
    await Promise.allSettled([reelWorker.close(), uploadWorker.close()])
    console.log('[worker] Workers drained. Exiting.')
    process.exit(0)
  })

  console.log('[worker] BullMQ consumers ready (reels concurrency=2, uploads concurrency=5)')
} else {
  console.log('[worker] REDIS_URL not set — HTTP-only dispatch mode')
}

