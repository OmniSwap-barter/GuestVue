// ─── Transactional email helpers — worker-local copy ─────────────────────────
// The Railway worker builds in isolation (only the worker/ directory is copied
// into the Docker image). This file mirrors the relevant functions from the
// root lib/resend.ts so the worker doesn't need to cross outside its build
// context. Keep the two in sync manually when the email template changes.
//
// Requires: RESEND_API_KEY in Railway environment variables.
// npm package: resend (already in worker/package.json)

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'GuestVue <hello@theguestvue.com>'

// Brand tokens — keep in sync with CLAUDE.md design system
const COLOR = {
  deepNavy:  '#060D1A',
  oceanNavy: '#0A1628',
  teal:      '#14B8A6',
  coral:     '#E8735C',
  textMuted: '#94a3b8',
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function emailShell(headerTitle: string, headerEmoji: string, body: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${COLOR.deepNavy};font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.deepNavy};padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo row -->
        <tr>
          <td style="padding-bottom:20px;text-align:center;">
            <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Guest</span><!--
            --><span style="font-size:22px;font-weight:900;color:${COLOR.teal};letter-spacing:-0.5px;">Vue</span>
          </td>
        </tr>

        <!-- Header card -->
        <tr>
          <td style="background:linear-gradient(135deg,${COLOR.coral},${COLOR.teal});border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">${headerEmoji}</div>
            <h1 style="color:#ffffff;font-size:22px;font-weight:900;margin:0;">${headerTitle}</h1>
          </td>
        </tr>

        <!-- Body card -->
        <tr>
          <td style="background:${COLOR.oceanNavy};border-radius:0 0 16px 16px;padding:28px 32px;border:1px solid rgba(255,255,255,0.08);border-top:none;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 0;text-align:center;">
            <p style="color:${COLOR.textMuted};font-size:12px;margin:0;">
              Powered by GuestVue &middot; Nigeria's AI event media platform<br>
              <a href="https://theguestvue.com" style="color:${COLOR.teal};text-decoration:none;">theguestvue.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Notify host when AI reel is ready ─────────────────────────────────────────
export async function sendReelReadyEmail({
  to,
  hostName,
  eventName,
  reelUrl,
  dashboardUrl,
}: {
  to: string | null
  hostName: string
  eventName: string
  reelUrl: string
  dashboardUrl: string
}) {
  if (!to) return  // Guard: auth.users.email can be null

  const body = `
    <p style="color:#e2e8f0;font-size:16px;margin:0 0 16px;">Hi ${escHtml(hostName)},</p>
    <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Your <strong style="color:#ffffff;">${escHtml(eventName)}</strong> AI highlight reel has been generated
      and is ready to download and share on TikTok or Instagram Reels. 🎬
    </p>

    <!-- Preview placeholder with teal accent -->
    <div style="background:rgba(20,184,166,0.1);border:1px solid rgba(20,184,166,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:8px;">🎬</div>
      <p style="color:${COLOR.teal};font-weight:700;margin:0;font-size:15px;">${escHtml(eventName)} — Highlight Reel</p>
      <p style="color:#94a3b8;font-size:13px;margin:8px 0 0;">Tap below to watch or download</p>
    </div>

    <!-- CTA buttons -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td width="50%" style="padding-right:6px;">
          <a href="${reelUrl}"
            style="display:block;background:${COLOR.coral};color:#ffffff;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">
            ↓ Download Reel
          </a>
        </td>
        <td width="50%" style="padding-left:6px;">
          <a href="${dashboardUrl}"
            style="display:block;background:${COLOR.teal};color:#ffffff;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">
            View Dashboard →
          </a>
        </td>
      </tr>
    </table>

    <p style="color:#64748b;font-size:13px;margin:16px 0 0;line-height:1.5;">
      💡 Tip: publish your reel from the dashboard to let guests watch it on the event gallery page.
    </p>
  `

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your AI Reel is ready — ${escHtml(eventName)} 🎬`,
    html: emailShell('Your AI Reel is ready!', '🎬', body),
  })
}
