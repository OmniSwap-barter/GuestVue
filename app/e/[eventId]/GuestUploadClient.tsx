'use client'

import { useState, useCallback, useRef } from 'react'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']

interface Props {
  event: Event
  hostName: string | null
  isExpired: boolean
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface FileUpload {
  file: File
  preview: string | null
  status: UploadStatus
  progress: number
  error: string | null
}

const MAX_PHOTO_MB = 20
const MAX_VIDEO_MB = 200
const ACCEPTED = 'image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm'

export default function GuestUploadClient({ event, hostName, isExpired }: Props) {
  const [uploads, setUploads] = useState<FileUpload[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [allDone, setAllDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const brandColor = event.custom_color || '#0A4F6B'
  const isAtLimit = event.upload_count >= event.upload_limit

  // ─── FILE VALIDATION ────────────────────────────────────────────────────────
  function validateFile(file: File): string | null {
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) return 'Only photos and videos are accepted.'
    const maxMB = isVideo ? MAX_VIDEO_MB : MAX_PHOTO_MB
    if (file.size > maxMB * 1024 * 1024) return `File too large (max ${maxMB}MB).`
    return null
  }

  // ─── HANDLE FILE SELECTION ───────────────────────────────────────────────────
  const handleFiles = useCallback((files: FileList | File[]) => {
    setGlobalError('')
    const arr = Array.from(files).slice(0, 10) // max 10 at a time

    const newUploads: FileUpload[] = arr.map(file => {
      const validationError = validateFile(file)
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      return {
        file,
        preview,
        status: validationError ? 'error' : 'idle',
        progress: 0,
        error: validationError,
      }
    })

    setUploads(prev => [...prev, ...newUploads])
    // Auto-upload valid files
    newUploads.forEach((u, i) => {
      if (!u.error) uploadFile(u.file, uploads.length + i)
    })
  }, [uploads.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── UPLOAD SINGLE FILE ──────────────────────────────────────────────────────
  async function uploadFile(file: File, index: number) {
    setUploads(prev =>
      prev.map((u, i) => (i === index ? { ...u, status: 'uploading', progress: 5 } : u))
    )

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('eventId', event.id)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 90) + 5
          setUploads(prev =>
            prev.map((u, i) => (i === index ? { ...u, progress: pct } : u))
          )
        }
      })

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            try {
              const body = JSON.parse(xhr.responseText)
              reject(new Error(body.error || `Upload failed (${xhr.status})`))
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`))
            }
          }
        }
        xhr.onerror = () => reject(new Error('Network error — check your connection.'))
        xhr.open('POST', '/api/uploads')
        xhr.send(formData)
      })

      setUploads(prev =>
        prev.map((u, i) => (i === index ? { ...u, status: 'success', progress: 100 } : u))
      )

      // Check if all done
      setUploads(prev => {
        const allSuccess = prev.every(u => u.status === 'success' || u.status === 'error')
        if (allSuccess && prev.some(u => u.status === 'success')) setAllDone(true)
        return prev
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.'
      setUploads(prev =>
        prev.map((u, i) => (i === index ? { ...u, status: 'error', error: msg, progress: 0 } : u))
      )
    }
  }

  // ─── DRAG & DROP ────────────────────────────────────────────────────────────
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  // ─── EXPIRED STATE ───────────────────────────────────────────────────────────
  if (isExpired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ background: `linear-gradient(135deg, ${brandColor} 0%, #1E5AAF 60%, #E8735C 100%)` }}>
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <span className="text-3xl">⏰</span>
        </div>
        <h1 className="font-display font-black text-white text-2xl mb-2">Event Ended</h1>
        <p className="text-white/70 text-sm max-w-xs">
          This event&apos;s upload page has closed. Reach out to{' '}
          <span className="font-semibold text-white">{hostName ?? 'the host'}</span> if you think
          this is a mistake.
        </p>
        <p className="text-white/40 text-xs mt-8">Powered by GuestVue</p>
      </div>
    )
  }

  // ─── AT LIMIT ────────────────────────────────────────────────────────────────
  if (isAtLimit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ background: `linear-gradient(135deg, ${brandColor} 0%, #1E5AAF 60%, #E8735C 100%)` }}>
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <span className="text-3xl">📸</span>
        </div>
        <h1 className="font-display font-black text-white text-2xl mb-2">Gallery Full!</h1>
        <p className="text-white/70 text-sm max-w-xs">
          This event has reached its photo limit. The host will need to upgrade to accept more uploads.
        </p>
        <p className="text-white/40 text-xs mt-8">Powered by GuestVue</p>
      </div>
    )
  }

  const remaining = event.upload_limit - event.upload_count
  const pct = Math.round((event.upload_count / event.upload_limit) * 100)

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: `linear-gradient(160deg, ${brandColor} 0%, #1E5AAF 50%, #E8735C 100%)` }}>

      {/* Header */}
      <div className="px-5 pt-10 pb-6 text-center">
        {event.custom_logo ? (
          <img src={event.custom_logo} alt={event.name} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <span className="font-display font-black text-white text-2xl">GV</span>
          </div>
        )}
        <h1 className="font-display font-black text-white text-2xl leading-tight">{event.name}</h1>
        {event.hashtag && (
          <p className="text-white/70 text-sm mt-1">#{event.hashtag}</p>
        )}
        {hostName && (
          <p className="text-white/50 text-xs mt-1">Hosted by {hostName}</p>
        )}
      </div>

      {/* Upload card */}
      <div className="flex-1 bg-white rounded-t-3xl px-5 pt-6 pb-10">

        {/* Capacity bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-midnight-500 mb-1.5">
            <span>{event.upload_count.toLocaleString()} photos shared</span>
            <span>{remaining.toLocaleString()} spots left</span>
          </div>
          <div className="h-1.5 bg-midnight-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: brandColor }}
            />
          </div>
        </div>

        {allDone ? (
          /* SUCCESS SCREEN */
          <div className="text-center py-10">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${brandColor}15` }}>
              <span className="text-4xl">🎉</span>
            </div>
            <h2 className="font-display font-bold text-xl text-midnight-900 mb-2">You&apos;re in the gallery!</h2>
            <p className="text-sm text-midnight-500 mb-6">Your photos have been added to {event.name}. The host will receive them shortly.</p>
            <button
              onClick={() => {
                setUploads([])
                setAllDone(false)
              }}
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style={{ backgroundColor: brandColor }}
            >
              Upload more photos
            </button>
          </div>
        ) : (
          <>
            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-4 ${
                dragOver
                  ? 'border-ocean bg-ocean/5 scale-[1.01]'
                  : 'border-midnight-200 hover:border-midnight-300 hover:bg-midnight-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED}
                className="hidden"
                onChange={e => e.target.files && handleFiles(e.target.files)}
              />
              <div className="text-4xl mb-3">📷</div>
              <p className="font-semibold text-midnight-800 text-sm mb-1">
                Tap to add photos & videos
              </p>
              <p className="text-xs text-midnight-400">
                JPEG, PNG, HEIC, MP4, MOV · Max {MAX_PHOTO_MB}MB photo / {MAX_VIDEO_MB}MB video
              </p>
            </div>

            {globalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
                {globalError}
              </div>
            )}

            {/* Upload list */}
            {uploads.length > 0 && (
              <div className="space-y-3">
                {uploads.map((u, i) => (
                  <div key={i} className="flex items-center gap-3 bg-midnight-50 rounded-xl p-3">
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-midnight-100 flex-shrink-0 flex items-center justify-center">
                      {u.preview ? (
                        <img src={u.preview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🎬</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-midnight-800 truncate">{u.file.name}</p>
                      <p className="text-xs text-midnight-400">
                        {(u.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      {u.status === 'uploading' && (
                        <div className="mt-1.5 h-1 bg-midnight-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${u.progress}%`, backgroundColor: brandColor }}
                          />
                        </div>
                      )}
                      {u.status === 'error' && (
                        <p className="text-xs text-red-500 mt-0.5">{u.error}</p>
                      )}
                    </div>

                    {/* Status icon */}
                    <div className="flex-shrink-0 text-lg">
                      {u.status === 'idle' && <span className="text-midnight-300">⏳</span>}
                      {u.status === 'uploading' && (
                        <span className="animate-spin inline-block">⏳</span>
                      )}
                      {u.status === 'success' && <span>✅</span>}
                      {u.status === 'error' && (
                        <button
                          onClick={() => uploadFile(u.file, i)}
                          title="Retry"
                          className="text-coral hover:text-coral-600"
                        >
                          🔄
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Camera shortcut on mobile */}
            <label className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-midnight-200 text-midnight-600 text-sm font-semibold cursor-pointer hover:bg-midnight-50 transition-all">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => e.target.files && handleFiles(e.target.files)}
              />
              <span>📸</span> Take a photo right now
            </label>
          </>
        )}
      </div>

      {/* Footer */}
      {!event.custom_logo && (
        <div className="bg-white pb-4 text-center">
          <p className="text-xs text-midnight-300">Powered by GuestVue</p>
        </div>
      )}
    </div>
  )
}
