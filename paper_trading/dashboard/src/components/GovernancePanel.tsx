import GovernanceRow from './GovernanceRow'
import { usePortfolioState } from '../hooks/usePortfolioState'

function hasTrades(state: { metrics?: { trade_log?: unknown[] } }): boolean {
  return (state.metrics?.trade_log?.length ?? 0) > 0
}

export default function GovernancePanel() {
  const { data } = usePortfolioState()
  const assets = data?.assets ?? {}

  const entries = Object.entries(assets).sort(([a], [b]) => {
    if (a === '^DJI' || a === 'DJI') return -1
    if (b === '^DJI' || b === 'DJI') return 1
    return a.localeCompare(b)
  })

  const active = entries.filter(([, s]) => hasTrades(s))
  const init = entries.filter(([, s]) => !hasTrades(s))

  if (entries.length === 0) return null

  return (
    <div className="card-gradient card-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500/50" />
          <h2 className="text-sm font-semibold text-primary">Calibration Governance</h2>
        </div>
        <span className="text-[10px] text-tertiary bg-panel px-2 py-0.5 rounded-full">
          {active.length} active / {init.length} init
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {active.map(([name, state]) => (
          <GovernanceRow key={name} asset={name} state={state} />
        ))}
      </div>

      {init.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] text-slate-500 font-mono px-2 py-1 rounded hover:bg-panel/50 hover:text-slate-400 transition-colors select-none">
            ▸ {init.length} asset{init.length > 1 ? 's' : ''} with no trades
          </summary>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {init.map(([name, state]) => (
              <GovernanceRow key={name} asset={name} state={state} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
