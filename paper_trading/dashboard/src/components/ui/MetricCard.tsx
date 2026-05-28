import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  valueClassName?: string
  accent?: 'emerald' | 'blue' | 'amber' | 'neutral'
  trend?: 'up' | 'down' | 'neutral'
  secondary?: ReactNode
  sparkline?: ReactNode
  size?: 'lg' | 'md' | 'sm'
  className?: string
}

const accentBar: Record<NonNullable<MetricCardProps['accent']>, string> = {
  emerald: 'bg-accent-emerald',
  blue: 'bg-accent-blue',
  amber: 'bg-accent-amber',
  neutral: 'bg-gov-init',
}

const trendIcon: Record<string, ReactNode> = {
  up: <TrendingUp className="w-3 h-3 text-gov-green" strokeWidth={2} />,
  down: <TrendingDown className="w-3 h-3 text-gov-red" strokeWidth={2} />,
  neutral: <Minus className="w-3 h-3 text-tertiary" strokeWidth={2} />,
}

const valueSize: Record<string, string> = {
  lg: 'text-2xl',
  md: 'text-xl',
  sm: 'text-lg',
}

export default function MetricCard({
  label,
  value,
  sub,
  valueClassName = 'text-primary',
  accent = 'emerald',
  trend,
  secondary,
  sparkline,
  size = 'md',
  className = '',
}: MetricCardProps) {
  return (
    <div className={`metric-card group relative overflow-hidden ${className}`}>
      <span className={`absolute top-0 left-0 right-0 h-0.5 ${accentBar[accent]}`} />
      <div className="flex items-center justify-between mb-1.5">
        <span className="metric-label">{label}</span>
        <div className="flex items-center gap-2">
          {secondary != null && (
            <span className="text-[10px] text-tertiary font-mono tabular-nums">{secondary}</span>
          )}
          {trend && trendIcon[trend]}
        </div>
      </div>
      <div className={`font-semibold tracking-tight metric-value ${valueSize[size]} ${valueClassName}`}>
        {value}
      </div>
      {sub != null && (
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-2xs text-tertiary font-mono tabular-nums">{sub}</span>
          {sparkline && <span className="shrink-0">{sparkline}</span>}
        </div>
      )}
    </div>
  )
}
