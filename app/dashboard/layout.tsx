// ─── Dashboard Layout ─────────────────────────────────────────────────────────
// Mobile-first layout with fixed bottom navigation bar (Deep Obsidian + Brushed Gold).
// Matches the Engineering Directive's premium mobile-first aesthetic.
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: HomeIcon,
    exact: true,
  },
  {
    href: '/dashboard/events',
    label: 'Events',
    icon: CalendarIcon,
    exact: false,
  },
  {
    href: '/dashboard/events/new',
    label: 'New',
    icon: PlusIcon,
    exact: true,
    primary: true, // gold accent pill
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: SettingsIcon,
    exact: false,
  },
  {
    href: '/dashboard/affiliate',
    label: 'Earn',
    icon: StarIcon,
    exact: false,
  },
]

// ── SVG icon components ───────────────────────────────────────────────────────
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function PlusIcon({ active: _ }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

function StarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(item: typeof NAV_ITEMS[0]) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {/* Main content — bottom padding on mobile so content isn't hidden by nav */}
      <main className="pb-20 sm:pb-0">
        {children}
      </main>

      {/* ── Fixed bottom nav (mobile only) ──────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(11,11,11,0.97) 0%, #0B0B0B 100%)',
          borderTop: '1px solid rgba(212,175,55,0.18)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-end justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item)

            if (item.primary) {
              // New Event — floating gold pill button
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center -mt-5 relative"
                >
                  <span
                    className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #D4AF37 0%, #b8941e 100%)',
                      boxShadow: '0 0 20px rgba(212,175,55,0.4), 0 4px 16px rgba(0,0,0,0.4)',
                    }}
                  >
                    <item.icon active={active} />
                  </span>
                  <span
                    className="text-[10px] font-semibold mt-1"
                    style={{ color: '#D4AF37' }}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[52px] transition-all active:scale-95"
              >
                {/* Active indicator dot */}
                <span
                  className="transition-all duration-200"
                  style={{
                    color: active ? '#D4AF37' : 'rgba(255,255,255,0.45)',
                  }}
                >
                  <item.icon active={active} />
                </span>
                <span
                  className="text-[10px] font-medium transition-colors"
                  style={{
                    color: active ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {item.label}
                </span>
                {/* Active pip */}
                {active && (
                  <span
                    className="absolute -top-px w-6 h-0.5 rounded-full"
                    style={{ background: '#D4AF37' }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
