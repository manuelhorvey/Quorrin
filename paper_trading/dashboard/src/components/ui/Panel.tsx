import type { ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'md' | 'lg' | 'none'
  accent?: 'green' | 'yellow' | 'red' | 'init' | null
  variant?: 'default' | 'elevated' | 'subtle'
}

const paddingMap = {
  md: 'p-3.5 sm:p-4',
  lg: 'p-4 sm:p-5',
  none: '',
}

const variantStyles: Record<NonNullable<PanelProps['variant']>, string> = {
  default: 'panel',
  elevated: 'bg-elevated border border-strong shadow-card',
  subtle: 'bg-surface/50 border border-default/30',
}

export default function Panel({ children, className = '', hover = false, padding = 'md', accent = null, variant = 'default' }: PanelProps) {
  const accentClass = accent ? `panel-accent panel-accent-${accent}` : ''
  return (
    <div
      className={[
        variantStyles[variant],
        'rounded-lg',
        paddingMap[padding],
        hover ? 'panel-hover' : '',
        accentClass,
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
