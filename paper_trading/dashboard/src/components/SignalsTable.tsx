import { useMemo, useState } from 'react'
import { usePortfolioState } from '../hooks/usePortfolioState'
import { formatAssetPrice } from '../utils/format'

export default function SignalsTable() {
  const [search, setSearch] = useState('')
  const { data, isPending } = usePortfolioState()
  const rows = useMemo(() => {
    if (!data?.assets) return []
    return Object.entries(data.assets)
      .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, asset]) => {
        const sig = asset.last_signal
        const m = asset.metrics
        const alloc = data.portfolio?.allocations?.[name] ?? 0
        return { name, sig, m, alloc }
      })
  }, [data, search])

  if (isPending) {
    return (
      <div className="card-gradient card-border rounded-xl p-4">
        <div className="h-4 bg-gray-800 rounded w-1/4 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-6 bg-gray-800/50 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="card-gradient card-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
          <h2 className="text-sm font-semibold text-primary">Signals</h2>
        </div>
        <div className="text-xs text-tertiary text-center py-8">No assets loaded</div>
      </div>
    )
  }

  return (
    <div className="card-gradient card-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
          <h2 className="text-sm font-semibold text-primary">Signals</h2>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Filter..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-24 bg-surface border border-default rounded px-1.5 py-0.5 text-[11px] text-primary placeholder-tertiary focus:outline-none focus:border-strong"
          />
          <span className="text-[11px] text-tertiary">{rows.length}</span>
        </div>
      </div>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-default">
              <th className="table-header text-left py-1.5 pr-3">Asset</th>
              <th className="table-header text-left py-1.5 pr-3">Signal</th>
              <th className="table-header text-right py-1.5 pr-3">Conf</th>
              <th className="table-header text-right py-1.5 pr-3">Price</th>
              <th className="table-header text-right py-1.5 pr-3">Alloc</th>
              <th className="table-header text-right py-1.5 pr-3">Ret</th>
              <th className="table-header text-right py-1.5">DD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ name, sig, m, alloc }, i) => (
              <tr
                key={name}
                className={`border-b border-default/30 transition-colors hover:bg-panel/50 ${
                  i % 2 === 0 ? '' : 'bg-panel/20'
                }`}
              >
                <td className="py-1.5 pr-3">
                  <span className="font-medium text-primary text-xs">{name}</span>
                </td>
                <td className="py-1.5 pr-3">
                  <span className={`inline-flex items-center gap-1 font-medium text-[11px] ${
                    sig?.signal === 'BUY' ? 'text-emerald-400' : sig?.signal === 'SELL' ? 'text-red-400' : 'text-slate-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      sig?.signal === 'BUY' ? 'bg-emerald-500' : sig?.signal === 'SELL' ? 'bg-red-500' : 'bg-slate-500'
                    }`} />
                    {sig?.signal === 'BUY' ? 'LONG' : sig?.signal === 'SELL' ? 'SHORT' : 'FLAT'}
                  </span>
                </td>
                <td className={`py-1.5 pr-3 text-right font-mono tabular-nums ${
                  (sig?.confidence ?? 0) >= 60 ? 'text-emerald-400' : (sig?.confidence ?? 0) >= 45 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {(sig?.confidence ?? 0).toFixed(0)}
                </td>
                <td className="py-1.5 pr-3 text-right font-mono text-secondary tabular-nums">
                  {formatAssetPrice(sig?.close_price)}
                </td>
                <td className="py-1.5 pr-3 text-right font-mono text-tertiary tabular-nums">
                  {(alloc * 100).toFixed(0)}%
                </td>
                <td className={`py-1.5 pr-3 text-right font-mono tabular-nums ${
                  (m?.mtm_return ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {(m?.mtm_return ?? 0).toFixed(2)}
                </td>
                <td className={`py-1.5 text-right font-mono tabular-nums ${
                  (m?.drawdown ?? 0) > -3 ? 'text-emerald-400' : (m?.drawdown ?? 0) > -5 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {(m?.drawdown ?? 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
