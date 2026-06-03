import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  valueClassName?: string
  className?: string
}

export default function MetricCard({
  label,
  value,
  sub,
  valueClassName = 'text-primary',
  className = '',
}: MetricCardProps) {
  return (
    <div className={`metric-card ${className}`}>
      <span className="metric-label">{label}</span>
      <div className={`text-xl font-semibold tracking-tight metric-value mt-1 ${valueClassName}`}>
        {value}
      </div>
      {sub != null && (
        <p className="text-[11px] text-tertiary font-mono tabular-nums mt-1">{sub}</p>
      )}
    </div>
  )
}
