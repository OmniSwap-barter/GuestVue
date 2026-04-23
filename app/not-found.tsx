import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-brand flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
        <span className="font-display font-black text-white text-2xl">GV</span>
      </div>
      <h1 className="font-display font-black text-white text-4xl mb-2">404</h1>
      <p className="text-white/70 text-sm mb-6">
        This page doesn&apos;t exist — or the event link has expired.
      </p>
      <Link href="/"
        className="bg-white text-ocean font-bold px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-2xl text-sm">
        ← Back to GuestVue
      </Link>
    </div>
  )
}
