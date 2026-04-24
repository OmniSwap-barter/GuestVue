import { NextRequest, NextResponse } from 'next/server'
import { createServerClient_server, createAdminClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
}

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  const supabase = await createServerClient_server()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Verify user owns this event
  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', params.eventId)
    .eq('host_id', user.id)
    .single()

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Logo must be under 2 MB' }, { status: 400 })
  }

  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG, JPG, WebP images allowed' }, { status: 400 })
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const key = `logos/${params.eventId}/${randomUUID()}.${ext}`
  const bucket = process.env.R2_BUCKET_NAME || 'claude-guestvue'

  const buffer = Buffer.from(await file.arrayBuffer())

  const r2 = getR2Client()
  await r2.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: file.type,
    CacheControl: 'public, max-age=31536000',
  }))

  const baseUrl = process.env.R2_PUBLIC_URL || `${process.env.R2_ENDPOINT}/${bucket}`
  const url = `${baseUrl}/${key}`

  return NextResponse.json({ url })
}
