import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          DEFAULT: '#0A4F6B',
          400: '#0D6687',
          600: '#083e55',
        },
        cobalt: '#1E5AAF',
        coral: {
          DEFAULT: '#E8735C',
          400: '#ed8a77',
          600: '#d4604a',
        },
        teal: '#14B8A6',
        cloud: '#F8FAFC',
        midnight: {
          DEFAULT: '#0F172A',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0A4F6B 0%, #1E5AAF 50%, #E8735C 100%)',
      },
    },
  },
  plugins: [],
}

export default config
