import type { ReactNode } from 'react'

interface CompactMetricProps {
  label: string
  value: ReactNode
  border?: boolean
  className?: string
}

export default function CompactMetric({ label, value, border = false, className = '' }: CompactMetricProps) {
  return (
    <div className={`flex items-center justify-between gap-2 py-1 ${border ? 'border-b border-default/40 last:border-0' : ''} ${className}`}>
      <span className="text-[10px] text-tertiary font-medium truncate">{label}</span>
      <span className="text-[11px] text-primary font-mono tabular-nums font-semibold shrink-0">{value}</span>
    </div>
  )
}
