import { useMemo } from 'react'
import { usePortfolioState } from '../hooks/usePortfolioState'
import MetricCard from './ui/MetricCard'
import { MetricCardSkeleton } from './ui/Skeleton'
import Panel from './ui/Panel'
import EmptyState from './ui/EmptyState'

interface CardDef {
  label: string
  value: string
  sub: string
  valueClassName: string
}

export default function PortfolioSummary() {
  const { data, isPending, isError } = usePortfolioState()
  const p = data?.portfolio

  const cards = useMemo(() => {
    if (!p) return []
    const posReturn = (p.total_return ?? 0) >= 0
    const posRealized = (p.realized_return ?? 0) >= 0
    return [
      {
        label: 'Portfolio Value',
        value: `$${(p.total_value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        sub: `Capital $${(p.capital ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        valueClassName: 'text-gov-green',
      },
      {
        label: 'Total Return',
        value: `${(p.total_return ?? 0).toFixed(2)}%`,
        sub: `Unrealized $${(p.unrealized_pnl ?? 0).toFixed(2)}`,
        valueClassName: posReturn ? 'text-gov-green' : 'text-gov-red',
      },
      {
        label: 'Realized P&L',
        value: `${posRealized ? '+' : ''}${(p.realized_return ?? 0).toFixed(2)}%`,
        sub: `Realized $${(p.realized_value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        valueClassName: posRealized ? 'text-gov-green' : 'text-gov-red',
      },
      {
        label: 'Positions',
        value: `${p.open_positions ?? 0} / ${p.closed_trades ?? 0}`,
        sub: 'Open / Closed',
        valueClassName: 'text-accent-blue',
      },
    ]
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(c => (
        <MetricCard
          key={c.label}
          label={c.label}
          value={c.value}
          sub={c.sub}
          valueClassName={c.valueClassName}
        />
      ))}
    </div>
  )
}
