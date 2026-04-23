import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GuestVue — Every Moment. Every Guest. One Link.',
  description: "Nigeria's first AI-powered QR event media platform. Guests scan, upload photos and videos, you collect every memory and generate AI reels for TikTok and Instagram.",
  keywords: ['event photography', 'QR code', 'Nigeria', 'event media', 'AI reel', 'guest photos'],
  openGraph: {
    title: 'GuestVue',
    description: 'Collect guest photos from any event — no app needed.',
    images: ['/og-image.png'],
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
