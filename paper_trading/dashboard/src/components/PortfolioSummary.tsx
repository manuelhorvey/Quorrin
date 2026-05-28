import { useMemo } from 'react'
import { usePortfolioState } from '../hooks/usePortfolioState'
import { useEquityHistory } from '../hooks/useEquityHistory'
import MetricCard from './ui/MetricCard'
import MiniSparkline from './ui/MiniSparkline'
import { MetricCardSkeleton } from './ui/Skeleton'
import Panel from './ui/Panel'
import EmptyState from './ui/EmptyState'

import type { ReactNode } from 'react'

interface CardDef {
  label: string
  value: string
  sub: string
  valueClassName: string
  accent: 'emerald' | 'blue' | 'amber'
  trend?: 'up' | 'down'
  secondary?: string
  size?: 'lg' | 'md' | 'sm'
  sparkline?: ReactNode
}

const SPARKLINE_PTS = 40

export default function PortfolioSummary() {
  const { data, isPending, isError, isFetching } = usePortfolioState()
  const { data: eqData } = useEquityHistory()
  const p = data?.portfolio

  const sparkValues = useMemo(() => {
    if (!eqData || eqData.length < 2) return undefined
    return eqData.slice(-SPARKLINE_PTS).map(d => d.portfolio_value)
  }, [eqData])

  const cards = useMemo(() => {
    if (!p) return []
    const posReturn = (p.total_return ?? 0) >= 0
    const posRealized = (p.realized_return ?? 0) >= 0
    const cards: CardDef[] = [
      {
        label: 'Portfolio Value',
        value: `$${(p.total_value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        sub: `Capital $${(p.capital ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        valueClassName: 'text-gov-green',
        accent: 'emerald',
        trend: (p.total_return ?? 0) > 0 ? 'up' : (p.total_return ?? 0) < 0 ? 'down' : undefined,
        size: 'lg',
        sparkline: sparkValues ? (
          <MiniSparkline
            values={sparkValues}
            width={72}
            height={24}
            color="var(--color-gov-green)"
            positiveColor="var(--color-gov-green)"
            showFill
          />
        ) : undefined,
      },
      {
        label: 'Total Return',
        value: `${(p.total_return ?? 0).toFixed(2)}%`,
        sub: `Unrealized $${(p.unrealized_pnl ?? 0).toFixed(2)}`,
        valueClassName: posReturn ? 'text-gov-green' : 'text-gov-red',
        accent: posReturn ? 'emerald' : 'amber',
        trend: posReturn ? 'up' : 'down',
        secondary: `$${(p.unrealized_pnl ?? 0).toFixed(0)}`,
      },
      {
        label: 'Realized P&L',
        value: `${posRealized ? '+' : ''}${(p.realized_return ?? 0).toFixed(2)}%`,
        sub: `Realized $${(p.realized_value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        valueClassName: posRealized ? 'text-gov-green' : 'text-gov-red',
        accent: posRealized ? 'emerald' : 'amber',
        trend: posRealized ? 'up' : 'down',
        secondary: `$${(p.realized_value ?? 0).toFixed(0)}`,
      },
      {
        label: 'Positions',
        value: `${p.open_positions ?? 0} / ${p.closed_trades ?? 0}`,
        sub: 'Open / Closed',
        valueClassName: 'text-accent-blue',
        accent: 'blue',
        size: 'sm',
      },
    ]
    return cards
  }, [p])

  if (isPending) {
    return <MetricCardSkeleton count={4} />
  }

  if (isError) {
    return (
      <Panel padding="md">
        <EmptyState message="Connecting to paper trading engine…" compact />
      </Panel>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-fetching={isFetching ? 'true' : undefined}>
      {cards.map(c => (
        <MetricCard
          key={c.label}
          label={c.label}
          value={c.value}
          sub={c.sub}
          valueClassName={c.valueClassName}
          accent={c.accent}
          trend={c.trend}
          size={c.size}
          secondary={c.secondary}
          sparkline={c.sparkline}
        />
      ))}
    </div>
  )
}
