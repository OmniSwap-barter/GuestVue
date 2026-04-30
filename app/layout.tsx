import type { Metadata, Viewport } from 'next'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://theguestvue.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0A4F6B',
}

export const metadata: Metadata = {
  title: {
    default: 'GuestVue — Every Moment. Every Guest. One QR Code.',
    template: '%s — GuestVue',
  },
  description: "Nigeria's first QR-code event media platform. Guests scan, upload photos and videos instantly — no app download needed. Collect every memory, run a live slideshow, and generate AI highlight reels.",
  keywords: ['event photography', 'QR code', 'Nigeria', 'event media', 'AI reel', 'guest photos', 'wedding photos', 'Lagos events', 'photo collection'],
  authors: [{ name: 'GuestVue', url: APP_URL }],
  creator: 'GuestVue',
  publisher: 'GuestVue',
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'GuestVue — Every Moment. Every Guest. One QR Code.',
    description: 'Collect guest photos from any event — no app needed. Works on every phone, even 3G.',
    url: APP_URL,
    siteName: 'GuestVue',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GuestVue — QR event media platform',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GuestVue — Every Moment. Every Guest. One QR Code.',
    description: 'Collect guest photos from any event — no app needed.',
    creator: '@guestvue',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Inject Supabase public config at runtime from the server so the browser
  // client doesn't depend on NEXT_PUBLIC_ vars being baked into the JS bundle.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__GV_SUPABASE_URL__=${JSON.stringify(supabaseUrl)};window.__GV_SUPABASE_ANON_KEY__=${JSON.stringify(supabaseAnonKey)};`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
