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

import { Queue, QueueOptions } from 'bullmq'

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

// ── Singleton connection (lazy) ───────────────────────────────────────────────
let _reelQueue: Queue<GenerateReelJobData> | null = null
let _uploadQueue: Queue<ProcessUploadJobData> | null = null

function getConnection(): QueueOptions['connection'] | null {
  const url = process.env.REDIS_URL
  if (!url) return null
  // ioredis connection from URL string — BullMQ accepts this directly
  return { url } as unknown as QueueOptions['connection']
}

function getReelQueue(): Queue<GenerateReelJobData> | null {
  if (_reelQueue) return _reelQueue
  const connection = getConnection()
  if (!connection) return null
  _reelQueue = new Queue<GenerateReelJobData>(QUEUE_GENERATE_REEL, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: { age: 86_400 }, // keep 24h
      removeOnFail: { age: 7 * 86_400 }, // keep 7 days
    },
  })
  return _reelQueue
}

function getUploadQueue(): Queue<ProcessUploadJobData> | null {
  if (_uploadQueue) return _uploadQueue
  const connection = getConnection()
  if (!connection) return null
  _uploadQueue = new Queue<ProcessUploadJobData>(QUEUE_PROCESS_UPLOAD, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { age: 3_600 },
      removeOnFail: { age: 86_400 },
    },
  })
  return _uploadQueue
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Enqueue a reel generation job.
 * Returns the BullMQ job ID, or null if Redis is not configured.
 */
export async function enqueueGenerateReel(data: GenerateReelJobData): Promise<string | null> {
  const queue = getReelQueue()
  if (!queue) return null
  try {
    const job = await queue.add('generate-reel', data, {
      jobId: `reel:${data.reelId}`, // idempotent — duplicate calls are safe
    })
    return job.id ?? null
  } catch (err) {
    console.error('[queue] enqueueGenerateReel failed:', err)
    return null
  }
}

/**
 * Enqueue an upload processing job.
 * Returns the BullMQ job ID, or null if Redis is not configured.
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
