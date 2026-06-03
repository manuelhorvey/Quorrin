/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#08090c',
          50: '#0c0d12',
          100: '#111318',
          150: '#141620',
          200: '#161820',
        },
        border: {
          DEFAULT: '#1a1d28',
          50: '#222633',
          100: '#2a3040',
        },
        'gov-green': {
          DEFAULT: '#22c55e',
          muted: 'rgba(34, 197, 94, 0.12)',
          muted2: 'rgba(34, 197, 94, 0.06)',
        },
        'gov-yellow': {
          DEFAULT: '#eab308',
          muted: 'rgba(234, 179, 8, 0.12)',
          muted2: 'rgba(234, 179, 8, 0.06)',
        },
        'gov-red': {
          DEFAULT: '#ef4444',
          muted: 'rgba(239, 68, 68, 0.12)',
          muted2: 'rgba(239, 68, 68, 0.06)',
        },
        'gov-init': {
          DEFAULT: '#64748b',
          muted: 'rgba(100, 116, 139, 0.12)',
          muted2: 'rgba(100, 116, 139, 0.06)',
        },
        'accent-emerald': '#34d399',
        'accent-blue': '#60a5fa',
        'accent-purple': '#a78bfa',
        'accent-amber': '#fbbf24',
        'accent-indigo': '#818cf8',
        'accent-pink': '#f472b6',
        'chart-rose': '#fb7185',
        'chart-teal': '#2dd4bf',
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.35)',
        card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 32px rgba(0,0,0,0.4)',
        modal: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 80px rgba(0,0,0,0.6)',
        tooltip: '0 4px 20px rgba(0,0,0,0.5)',
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '12px',
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-up': 'slide-up 0.35s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.97)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
