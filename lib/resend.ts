// ─── Transactional emails via Resend ─────────────────────────────────────────
// Install: npm install resend
// Get key: resend.com → API Keys → Create

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'GuestVue <hello@guestvue.com>'

// ── Send QR code email to host after event creation ───────────────────────────
export async function sendQREmail({
  to,
  hostName,
  eventName,
  qrUrl,
  galleryUrl,
}: {
  to: string
  hostName: string
  eventName: string
  qrUrl: string
  galleryUrl: string
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your GuestVue QR code is ready — ${eventName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #0A4F6B, #1E5AAF); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; font-size: 24px; margin: 0;">Your QR code is ready! 🎉</h1>
        </div>
        <p>Hi ${hostName},</p>
        <p>Your event <strong>${eventName}</strong> is live. Print this QR code and place it at your venue — guests can scan it to upload their photos and videos instantly.</p>
        <div style="text-align: center; margin: 24px 0;">
          <img src="${qrUrl}" alt="QR Code" style="width: 200px; height: 200px; border-radius: 12px;" />
        </div>
        <p>Or share this link directly:</p>
        <div style="background: #F8FAFC; border-radius: 8px; padding: 12px; font-family: monospace; word-break: break-all; margin-bottom: 24px;">
          ${galleryUrl}
        </div>
        <a href="${galleryUrl}" style="display: block; background: #0A4F6B; color: white; text-align: center; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold;">
          View your event dashboard →
        </a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">Powered by GuestVue · Nigeria's AI event media platform</p>
      </div>
    `,
  })
}

// ── Notify host when AI reel is ready ─────────────────────────────────────────
export async function sendReelReadyEmail({
  to,
  hostName,
  eventName,
  reelUrl,
  dashboardUrl,
}: {
  to: string
  hostName: string
  eventName: string
  reelUrl: string
  dashboardUrl: string
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your AI Reel is ready — ${eventName} 🎬`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #0A4F6B, #E8735C); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; font-size: 24px; margin: 0;">Your AI Reel is ready! 🎬</h1>
        </div>
        <p>Hi ${hostName},</p>
        <p>Your <strong>${eventName}</strong> AI reel has been generated and is ready to download and share on TikTok or Instagram.</p>
        <div style="display: flex; gap: 12px; margin: 24px 0;">
          <a href="${reelUrl}" style="flex: 1; background: #E8735C; color: white; text-align: center; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold;">
            ↓ Download Reel
          </a>
          <a href="${dashboardUrl}" style="flex: 1; background: #0A4F6B; color: white; text-align: center; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: bold;">
            View Dashboard →
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">Powered by GuestVue · Nigeria's AI event media platform</p>
      </div>
    `,
  })
}
