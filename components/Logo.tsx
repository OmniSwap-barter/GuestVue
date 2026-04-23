import Image from 'next/image'

interface LogoProps {
  variant?: 'color' | 'white'
  size?: number
  showText?: boolean
  className?: string
}

export default function Logo({ variant = 'color', size = 36, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src={variant === 'white' ? '/logo-white.svg' : '/logo.svg'}
        alt="GuestVue"
        width={size}
        height={size}
        priority
      />
      {showText && (
        <span className={`font-display font-black text-lg tracking-tight ${
          variant === 'white' ? 'text-white' : 'text-[#0A4F6B]'
        }`}>
          GuestVue
        </span>
      )}
    </div>
  )
}
