// ─── GuestVue BullMQ Queue ────────────────────────────────────────────────────
// Publishes jobs from the Next.js API to Redis so the Railway worker can
// consume them asynchronously via BullMQ.
//
// If REDIS_URL is not set, all enqueue calls are no-ops and return null,
// so callers fall back to direct Railway HTTP dispatch.
//
// Usage:
//   const jobId = await enqueueGenerateReel({ reelId, eventId, type, ... })
//   if (!jobId) { /* fallback: Railway HTTP */ }
//
// ─────────────────────────────────────────────────────────────────────────────

import { Queue } from 'bullmq'
import IORedis from 'ioredis'

// ── Queue names ───────────────────────────────────────────────────────────────
export const QUEUE_GENERATE_REEL    = 'generate-reel'
export const QUEUE_PROCESS_UPLOAD   = 'process-upload'

// ── Job data shapes ───────────────────────────────────────────────────────────
export interface GenerateReelJobData {
  reelId: string
  eventId: string
  type: 'basic' | 'advanced'
  uploadIds: string[]
  musicTrack: string | null
  removeWatermark: boolean
  logoUrl: string | null
  logoPosition: 'throughout' | 'outro'
  theme: string | null
  transition: string
  textOverlays: { title?: string; caption?: string; outro?: string } | null
}

export interface ProcessUploadJobData {
  uploadId: string
  eventId: string
  key: string
  type: 'photo' | 'video'
  plan: string
}

// ── Singleton IORedis connection (lazy) ───────────────────────────────────────
// BullMQ requires the URL to be passed as a constructor argument to IORedis,
// NOT as a `{ url }` options object — that silently fails.
// maxRetriesPerRequest: null is required by BullMQ.
// enableReadyCheck: false is recommended for Upstash.
let _redis: IORedis | null = null

function getRedis(): IORedis | null {
  if (_redis) return _redis
  const url = process.env.REDIS_URL
  if (!url) return null
  try {
    _redis = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 6_000,   // give up connecting after 6 s — prevents Vercel fn hangs
      commandTimeout: 8_000,   // per-command deadline
      tls: url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    })
    _redis.on('error', (err) => {
      console.error('[queue] Redis connection error:', err.message)
    })
    return _redis
  } catch (err) {
    console.error('[queue] Failed to create Redis connection:', err)
    return null
  }
}

// ── Singleton queues (lazy) ───────────────────────────────────────────────────
let _reelQueue: Queue<GenerateReelJobData> | null = null
let _uploadQueue: Queue<ProcessUploadJobData> | null = null

function getReelQueue(): Queue<GenerateReelJobData> | null {
  if (_reelQueue) return _reelQueue
  const connection = getRedis()
  if (!connection) return null
  _reelQueue = new Queue<GenerateReelJobData>(QUEUE_GENERATE_REEL, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: { age: 86_400 },     // keep 24 h
      removeOnFail:     { age: 7 * 86_400 }, // keep 7 days
    },
  })
  return _reelQueue
}

function getUploadQueue(): Queue<ProcessUploadJobData> | null {
  if (_uploadQueue) return _uploadQueue
  const connection = getRedis()
  if (!connection) return null
  _uploadQueue = new Queue<ProcessUploadJobData>(QUEUE_PROCESS_UPLOAD, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { age: 3_600 },
      removeOnFail:     { age: 86_400 },
    },
  })
  return _uploadQueue
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Enqueue a reel generation job.
 * Returns the BullMQ job ID, or null if Redis is not configured / unreachable.
 */
export async function enqueueGenerateReel(data: GenerateReelJobData): Promise<string | null> {
  const queue = getReelQueue()
  if (!queue) return null
  try {
    const job = await queue.add('generate-reel', data, {
      jobId: `reel:${data.reelId}`, // idempotent — safe to retry
    })
    return job.id ?? null
  } catch (err) {
    console.error('[queue] enqueueGenerateReel failed:', err)
    return null
  }
}

/**
 * Enqueue an upload processing job.
 * Returns the BullMQ job ID, or null if Redis is not configured / unreachable.
 */
export async function enqueueProcessUpload(data: ProcessUploadJobData): Promise<string | null> {
  const queue = getUploadQueue()
  if (!queue) return null
  try {
    const job = await queue.add('process-upload', data, {
      jobId: `upload:${data.uploadId}`,
    })
    return job.id ?? null
  } catch (err) {
    console.error('[queue] enqueueProcessUpload failed:', err)
    return null
  }
}

/**
 * Is Redis configured?  Use this to decide which dispatch path to take.
 */
export function isQueueAvailable(): boolean {
  return !!process.env.REDIS_URL
}
