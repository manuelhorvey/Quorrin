import { useMemo } from 'react'
import { usePortfolioState } from '../hooks/usePortfolioState'
import type { VolRegime } from '../types/portfolio'

const VOL_BASELINES: Record<string, number> = {
  GC: 0.009129,
  NZDJPY: 0.006581,
  CADJPY: 0.005989,
  USDCAD: 0.004463,
  EURAUD: 0.005026,
  AUDJPY: 0.006759,
  GBPJPY: 0.006138,
  USDJPY: 0.004498,
  USDCHF: 0.004307,
  GBPUSD: 0.005595,
  CHFJPY: 0.004780,
  EURCAD: 0.003476,
  DJI: 0.008061,
}

function volStatus(ratio: number): VolRegime['status'] {
  if (ratio >= 0.8 && ratio <= 1.2) return 'green'
  if ((ratio >= 0.7 && ratio < 0.8) || (ratio > 1.2 && ratio <= 1.3)) return 'amber'
  return 'red'
}

const statusConfig = {
  green: { label: 'OK', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', bar: 'bg-emerald-500' },
  amber: { label: 'WATCH', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', bar: 'bg-amber-500' },
  red: { label: 'HIGH', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', bar: 'bg-red-500' },
}

export default function VolRegimePanel() {
  const { data, isPending } = usePortfolioState()

  const regimes = useMemo((): VolRegime[] => {
    if (!data?.assets) return []
    return Object.entries(data.assets)
      .map(([name, asset]) => {
        const trainingVol = VOL_BASELINES[name]
        const currentVol = asset.metrics?.position?.current_vol
        if (trainingVol == null || currentVol == null) return null
        if (isNaN(trainingVol) || isNaN(currentVol) || !isFinite(trainingVol)) return null
        const ratio = trainingVol > 0 ? currentVol / trainingVol : 1
        return { asset: name, training_vol: trainingVol, current_vol: currentVol, ratio, status: volStatus(ratio) }
      })
      .filter((r): r is VolRegime => r !== null)
      .sort((a, b) => a.asset.localeCompare(b.asset))
  }, [data])

  if (isPending) {
    return (
      <div className="card-gradient card-border rounded-xl p-4">
        <div className="h-4 bg-gray-800 rounded w-1/3 mb-3" />
        <div className="space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-800/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card-gradient card-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-amber-500/50" />
        <h2 className="text-sm font-semibold text-primary">Vol Regime</h2>
      </div>
      {regimes.length === 0 ? (
        <div className="text-xs text-tertiary text-center py-8">No position data yet</div>
      ) : (
        <div className="overflow-hidden -mx-4 px-4">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-default">
                <th className="table-header text-left py-1 pr-2">Asset</th>
                <th className="table-header text-right py-1 pr-2">Curr</th>
                <th className="table-header text-right py-1 pr-2">Base</th>
                <th className="table-header text-right py-1 pr-2">Ratio</th>
                <th className="table-header text-right py-1 pr-2">Bar</th>
              </tr>
            </thead>
            <tbody>
              {regimes.map((r, i) => {
                const cfg = statusConfig[r.status]
                const barWidth = Math.min(Math.max((r.ratio / 1.5) * 100, 0), 100)
                return (
                  <tr
                    key={r.asset}
                    className={`border-b border-default/20 transition-colors hover:bg-panel/50 ${i % 2 === 0 ? '' : 'bg-panel/20'}`}
                  >
                    <td className="py-1 pr-2">
                      <span className="text-xs font-medium text-primary">{r.asset}</span>
                    </td>
                    <td className="py-1 pr-2 text-right font-mono text-secondary tabular-nums">
                      {r.current_vol.toFixed(4)}
                    </td>
                    <td className="py-1 pr-2 text-right font-mono text-tertiary tabular-nums">
                      {r.training_vol.toFixed(4)}
                    </td>
                    <td className="py-1 pr-2 text-right">
                      <span className={`font-mono ${cfg.text} tabular-nums`}>{r.ratio.toFixed(2)}x</span>
                    </td>
                    <td className="py-1 pr-1 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <div className="w-10 h-1 bg-panel rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${barWidth}%` }} />
                        </div>
                        <span className={`px-1 py-0.5 rounded text-[9px] font-semibold ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
