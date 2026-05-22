import { useMemo } from 'react'
import { usePortfolioState } from '../hooks/usePortfolioState'

export default function MetricsGrid() {
  const { data, isPending } = usePortfolioState()
  const cards = useMemo(() => {
    if (!data?.assets) return []
    return Object.entries(data.assets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, asset]) => {
        const m = asset.metrics
        const sd = m.signal_distribution ?? {}
        const total = (sd.BUY ?? 0) + (sd.SELL ?? 0) + (sd.FLAT ?? 0)
        return {
          name,
          nTrades: m.n_trades ?? 0,
          profitFactor: m.profit_factor,
          winRate: m.win_rate ?? 0,
          meanConf: m.mean_confidence ?? 0,
          meanProbLong: m.mean_prob_long ?? 0,
          meanProbShort: m.mean_prob_short ?? 0,
          monthlyPf: m.monthly_pf,
          sigBuy: sd.BUY ?? 0,
          sigSell: sd.SELL ?? 0,
          sigFlat: sd.FLAT ?? 0,
          sigTotal: total,
        }
      })
  }, [data])

  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card-gradient card-border rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-800 rounded w-1/3 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 bg-gray-800/50 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="card-gradient card-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-blue-500/50" />
          <h2 className="text-sm font-semibold text-primary">Asset Metrics</h2>
        </div>
        <div className="text-xs text-tertiary text-center py-8">No metric data available</div>
      </div>
    )
  }

  const pfColor = (v: number | null | undefined) =>
    v != null && !isNaN(v) && v !== Infinity ? (v >= 1 ? 'text-emerald-400' : 'text-amber-400') : 'text-tertiary'

  const monthlyPfColor = (v: number | null | undefined) =>
    v != null && !isNaN(v) && v !== Infinity ? (v >= 0.7 ? 'text-emerald-400' : 'text-amber-400') : 'text-tertiary'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map(c => (
        <div key={c.name} className="card-gradient card-border rounded-xl px-3.5 py-3 hover-lift">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary">{c.name}</span>
              <span className="text-[10px] text-tertiary bg-panel/60 px-1.5 py-0.5 rounded-full">{c.nTrades} trades</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
            <div className="flex items-baseline justify-between">
              <span className="text-tertiary">PF</span>
              <span className={`font-mono tabular-nums ${pfColor(c.profitFactor)}`}>
                {c.profitFactor != null && !isNaN(c.profitFactor) && c.profitFactor !== Infinity ? c.profitFactor.toFixed(2) : '—'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-tertiary">Win Rate</span>
              <span className="font-mono tabular-nums text-primary">{c.winRate.toFixed(1)}%</span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-tertiary">Conf</span>
              <span className="font-mono tabular-nums text-primary">{c.meanConf.toFixed(1)}%</span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-tertiary">MoPF</span>
              <span className={`font-mono tabular-nums ${monthlyPfColor(c.monthlyPf)}`}>
                {c.monthlyPf != null && !isNaN(c.monthlyPf) && c.monthlyPf !== Infinity ? c.monthlyPf.toFixed(2) : '—'}
              </span>
            </div>

            <div className="col-span-2 flex items-baseline justify-between">
              <span className="text-tertiary">L/S</span>
              <span className="font-mono tabular-nums text-secondary">
                {c.meanProbLong.toFixed(0)}<span className="text-tertiary">/</span>{c.meanProbShort.toFixed(0)}%
              </span>
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-tertiary">Signal Dist</span>
                <span className="font-mono text-[10px] text-tertiary tabular-nums">
                  {c.sigBuy}<span className="text-tertiary mx-0.5">/</span>{c.sigSell}<span className="text-tertiary mx-0.5">/</span>{c.sigFlat}
                </span>
              </div>
              {c.sigTotal > 0 && (
                <div className="flex h-1.5 bg-panel rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${(c.sigBuy / c.sigTotal) * 100}%` }} />
                  <div className="h-full bg-red-500" style={{ width: `${(c.sigSell / c.sigTotal) * 100}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${(c.sigFlat / c.sigTotal) * 100}%` }} />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
