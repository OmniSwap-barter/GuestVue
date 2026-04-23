'use client'

import { useState, useCallback, useRef } from 'react'
import type { Database } from '@/types/database'

type Event = Database['public']['Tables']['events']['Row']

interface Props {
  event: Event
  hostName: string | null
  isExpired: boolean
}

type UploadStatus = 'idle' | 'compressing' | 'uploading' | 'success' | 'error'

interface FileUpload {
  file: File
  preview: string | null
  status: UploadStatus
  progress: number
  error: string | null
  isVideo: boolean
}

const MAX_PHOTO_MB = 20
const MAX_VIDEO_MB = 100
const COMPRESS_TARGET_PX = 1600
const COMPRESS_QUALITY = 0.82

// ─── Canvas image compression ────────────────────────────────────────────────
async function compressImage(file: File): Promise<File> {
  if (file.type.startsWith('video/')) return file
  if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) return file

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img
      const max = COMPRESS_TARGET_PX
      let w = width, h = height
      if (w > max || h > max) {
        if (w > h) { h = Math.round(h * max / w); w = max }
        else { w = Math.round(w * max / h); h = max }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        blob => {
          if (!blob || blob.size >= file.size) { resolve(file); return }
          resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }))
        },
        'image/jpeg',
        COMPRESS_QUALITY
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export default function GuestUploadClient({ event, hostName, isExpired }: Props) {
  const [uploads, setUploads] = useState<FileUpload[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [allDone, setAllDone] = useState(false)
  const [isOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const brandColor = event.custom_color || '#0A4F6B'
  const isAtLimit = event.upload_count >= event.upload_limit

  // ─── File validation ─────────────────────────────────────────────────────
  function validateFile(file: File): string | null {
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) return 'Only photos and videos are accepted.'
    const maxMB = isVideo ? MAX_VIDEO_MB : MAX_PHOTO_MB
    if (file.size > maxMB * 1024 * 1024) return `File too large (max ${maxMB}MB for ${isVideo ? 'videos' : 'photos'}).`
    return null
  }

  // ─── Handle file selection ───────────────────────────────────────────────
  const handleFiles = useCallback((files: FileList | File[]) => {
    if (!isOnline) {
      setGlobalError('No internet connection. Please check your network and try again.')
      return
    }
    setGlobalError('')
    const arr = Array.from(files).slice(0, 10)
    const newUploads: FileUpload[] = arr.map(file => {
      const validationError = validateFile(file)
      const isVideo = file.type.startsWith('video/')
      const preview = !isVideo && !validationError ? URL.createObjectURL(file) : null
      return { file, preview, status: validationError ? 'error' : 'idle', progress: 0, error: validationError, isVideo }
    })
    setUploads(prev => {
      const combined = [...prev, ...newUploads]
      newUploads.forEach((u, i) => {
        if (!u.error) uploadFile(u.file, prev.length + i)
      })
      return combined
    })
  }, [isOnline]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Upload single file ──────────────────────────────────────────────────
  async function uploadFile(file: File, index: number) {
    // Compress phase
    if (!file.type.startsWith('video/')) {
      setUploads(prev => prev.map((u, i) => i === index ? { ...u, status: 'compressing', progress: 2 } : u))
      try { file = await compressImage(file) } catch { /* use original */ }
    }

    setUploads(prev => prev.map((u, i) => i === index ? { ...u, status: 'uploading', progress: 5 } : u))

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('eventId', event.id)

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 90) + 5
            setUploads(prev => prev.map((u, i) => i === index ? { ...u, progress: pct } : u))
          }
        })
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            try {
              const body = JSON.parse(xhr.responseText)
              reject(new Error(body.error || `Upload failed (${xhr.status})`))
            } catch {
              reject(new Error(`Upload failed (${xhr.status}). Please try again.`))
            }
          }
        }
        xhr.onerror = () => reject(new Error('Network error — check your connection and try again.'))
        xhr.ontimeout = () => reject(new Error('Upload timed out. Please try again on a stronger connection.'))
        xhr.timeout = 120000 // 2 min timeout
        xhr.open('POST', '/api/uploads')
        xhr.send(formData)
      })

      setUploads(prev => {
        const updated = prev.map((u, i) => i === index ? { ...u, status: 'success' as UploadStatus, progress: 100 } : u)
        const allSuccess = updated.every(u => u.status === 'success' || u.status === 'error')
        if (allSuccess && updated.some(u => u.status === 'success')) setAllDone(true)
        return updated
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.'
      setUploads(prev => prev.map((u, i) => i === index ? { ...u, status: 'error', error: msg, progress: 0 } : u))
    }
  }

  // ─── Retry ───────────────────────────────────────────────────────────────
  function retryUpload(index: number) {
    setUploads(prev => prev.map((u, i) => i === index ? { ...u, status: 'idle', error: null, progress: 0 } : u))
    const file = uploads[index]?.file
    if (file) uploadFile(file, index)
  }

  // ─── Drag & drop ─────────────────────────────────────────────────────────
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  // ─── Expired ─────────────────────────────────────────────────────────────
  if (isExpired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ background: `linear-gradient(135deg, ${brandColor} 0%, #1E5AAF 60%, #E8735C 100%)` }}>
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="font-black text-white text-2xl mb-2">Upload window closed</h1>
        <p className="text-white/70 text-sm max-w-xs leading-relaxed">
          This event&apos;s upload page has ended. Reach out to{' '}
          <span className="font-semibold text-white">{hostName ?? 'the host'}</span> if you believe this is a mistake.
        </p>
        <p className="text-white/40 text-xs mt-10">Powered by GuestVue</p>
      </div>
    )
  }

  // ─── At limit ────────────────────────────────────────────────────────────
  if (isAtLimit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ background: `linear-gradient(135deg, ${brandColor} 0%, #1E5AAF 60%, #E8735C 100%)` }}>
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="font-black text-white text-2xl mb-2">Gallery is full!</h1>
        <p className="text-white/70 text-sm max-w-xs leading-relaxed">
          This event has reached its photo limit. The host will need to upgrade their plan to accept more uploads.
        </p>
        <p className="text-white/40 text-xs mt-10">Powered by GuestVue</p>
      </div>
    )
  }

  const remaining = event.upload_limit - event.upload_count
  const pct = Math.round((event.upload_count / event.upload_limit) * 100)

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: `linear-gradient(160deg, ${brandColor} 0%, #1E5AAF 50%, #E8735C 100%)` }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-6 text-center">
        {event.custom_logo ? (
          <img src={event.custom_logo} alt={event.name} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
        <h1 className="font-black text-white text-2xl leading-tight">{event.name}</h1>
        {event.hashtag && <p className="text-white/70 text-sm mt-1">#{event.hashtag}</p>}
        {hostName && <p className="text-white/50 text-xs mt-1">Hosted by {hostName}</p>}
      </div>

      {/* Upload card */}
      <div className="flex-1 bg-white rounded-t-3xl px-5 pt-6 pb-12">

        {/* Offline banner */}
        {!isOnline && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            You appear to be offline. Please check your connection before uploading.
          </div>
        )}

        {/* Capacity bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>{event.upload_count.toLocaleString()} photos shared</span>
            <span>{remaining.toLocaleString()} spots left</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: brandColor }} />
          </div>
        </div>

        {allDone ? (
          /* SUCCESS */
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${brandColor}20` }}>
              <svg className="w-10 h-10" fill="none" stroke={brandColor} strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-black text-xl text-slate-900 mb-2">You&apos;re in the gallery!</h2>
            <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed">
              Your photos have been added to <strong>{event.name}</strong>. Thank you for sharing!
            </p>
            <button
              onClick={() => { setUploads([]); setAllDone(false) }}
              className="min-h-[48px] px-8 py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
              style={{ backgroundColor: brandColor }}
            >
              Upload more photos
            </button>
          </div>
        ) : (
          <>
            {/* Primary camera button */}
            <label className="block w-full mb-3 cursor-pointer">
              <div className="min-h-[56px] flex items-center justify-center gap-2.5 w-full rounded-2xl font-bold text-white text-base transition-all active:scale-95 shadow-lg"
                style={{ backgroundColor: brandColor }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Take a photo now
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => e.target.files && handleFiles(e.target.files)}
              />
            </label>

            {/* Drop zone / gallery picker */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              className={`relative border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all mb-4 min-h-[120px] flex flex-col items-center justify-center ${
                dragOver ? 'border-slate-400 bg-slate-50 scale-[1.01]' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={e => e.target.files && handleFiles(e.target.files)}
              />
              <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-semibold text-slate-600 text-sm mb-0.5">Choose from gallery</p>
              <p className="text-xs text-slate-400">Photos &amp; videos · Up to 10 at once</p>
            </div>

            {globalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4 flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {globalError}
              </div>
            )}

            {/* Upload list */}
            {uploads.length > 0 && (
              <div className="space-y-3">
                {uploads.map((u, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center">
                      {u.preview ? (
                        <img src={u.preview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{u.file.name}</p>
                      <p className="text-xs text-slate-400">{(u.file.size / 1024 / 1024).toFixed(1)} MB</p>
                      {(u.status === 'compressing' || u.status === 'uploading') && (
                        <>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {u.status === 'compressing' ? 'Optimising...' : `Uploading ${u.progress}%`}
                          </p>
                          <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${u.progress}%`, backgroundColor: brandColor }} />
                          </div>
                        </>
                      )}
                      {u.status === 'error' && (
                        <p className="text-xs text-red-500 mt-0.5 leading-tight">{u.error}</p>
                      )}
                    </div>
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {(u.status === 'idle' || u.status === 'compressing' || u.status === 'uploading') && (
                        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
                      )}
                      {u.status === 'success' && (
                        <div className="w-7 h-7 rounded-full bg-[#14B8A6]/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-[#14B8A6]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {u.status === 'error' && (
                        <button
                          onClick={() => retryUpload(i)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#E8735C] active:scale-90 transition-all"
                          title="Retry upload"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-xs text-slate-400 mt-6">
              Photos are automatically compressed for faster upload on 3G/4G.
            </p>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white pb-6 text-center">
        <p className="text-xs text-slate-300">Powered by GuestVue</p>
      </div>
    </div>
  )
}
