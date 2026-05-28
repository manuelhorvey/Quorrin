interface KpiCardProps {
  label: string
  value: string
  color?: string
  className?: string
}

export default function KpiCard({
  label,
  value,
  color = 'text-secondary',
  className = '',
}: KpiCardProps) {
  return (
    <div className={`bg-panel/60 border border-default rounded-lg p-2.5 relative overflow-hidden ${className}`}>
      <span className="absolute top-0 left-0 right-0 h-0.5 bg-current/10 rounded-t-lg pointer-events-none" />
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="text-[10px] text-tertiary font-medium truncate">{label}</span>
      </div>
      <div className={`text-sm font-bold tabular-nums tracking-tight ${color}`}>{value}</div>
    </div>
  )
}
