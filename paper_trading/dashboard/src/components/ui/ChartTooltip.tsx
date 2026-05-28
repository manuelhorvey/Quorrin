import type { CSSProperties } from 'react'
import { tooltipStyle, tooltipLabelStyle } from './chartTheme'

interface ChartTooltipItem {
  name: string
  value: string
  color: string
}

interface ChartTooltipProps {
  active?: boolean
  label?: string
  items?: ChartTooltipItem[]
  formatter?: (value: number) => string
}

const itemStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  padding: '1px 0',
}

export default function ChartTooltip({ active, label, items }: ChartTooltipProps) {
  if (!active || !items || items.length === 0) return null
  return (
    <div style={tooltipStyle}>
      {label && <div style={tooltipLabelStyle}>{label}</div>}
      {items.map(item => (
        <div key={item.name} style={itemStyle} className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span style={{ color: 'var(--color-text-secondary)' }}>{item.name}</span>
          <span className="ml-auto tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}
