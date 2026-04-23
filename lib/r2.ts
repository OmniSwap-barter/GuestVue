// ─── Cloudflare R2 utilities ──────────────────────────────────────────────────
// R2 is S3-compatible — we use the AWS SDK pointed at your R2 endpoint.
// Zero egress fees vs S3 = saves you money as uploads scale up.

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getClient(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

const BUCKET = process.env.R2_BUCKET_NAME || 'guestvue-media'
const PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://media.guestvue.com'

// ── Upload a buffer to R2 ─────────────────────────────────────────────────────
export async function uploadToR2({
  key,
  body,
  contentType,
  metadata = {},
}: {
  key: string
  body: Buffer | Uint8Array
  contentType: string
  metadata?: Record<string, string>
}): Promise<string> {
  const client = getClient()
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    })
  )
  return `${PUBLIC_URL}/${key}`
}

// ── Delete a file from R2 ─────────────────────────────────────────────────────
export async function deleteFromR2(key: string): Promise<void> {
  const client = getClient()
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

// ── Generate a signed URL for private access (e.g., download) ─────────────────
export async function getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const client = getClient()
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: expiresInSeconds }
  )
}

// ── Build the public URL for a key ───────────────────────────────────────────
export function r2PublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`
}

// ── Key builders (consistent naming across the app) ───────────────────────────
export const keys = {
  original: (eventId: string, fileId: string, ext: string) =>
    `events/${eventId}/originals/${fileId}.${ext}`,
  display: (eventId: string, fileId: string) =>
    `events/${eventId}/display/${fileId}.jpg`,
  thumbnail: (eventId: string, fileId: string) =>
    `events/${eventId}/thumbs/${fileId}.jpg`,
  qr: (eventId: string) =>
    `events/${eventId}/qr.png`,
  reel: (eventId: string, reelId: string, format: string) =>
    `events/${eventId}/reels/${reelId}_${format}.mp4`,
  compressedVideo: (eventId: string, fileId: string) =>
    `events/${eventId}/videos/${fileId}_720p.mp4`,
}
