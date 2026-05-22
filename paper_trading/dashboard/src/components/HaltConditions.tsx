import { useHaltStatus } from '../hooks/useHaltStatus'
import { usePortfolioState } from '../hooks/usePortfolioState'

function CheckIcon() {
  return (
    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function HaltConditions() {
  const { data, isPending } = usePortfolioState()
  const status = useHaltStatus(data)

  if (isPending) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl px-3 py-2.5 bg-panel/50 animate-pulse">
            <div className="h-3 bg-gray-800 rounded w-1/3 mb-2" />
            <div className="h-5 bg-gray-800 rounded w-1/2 mb-1" />
            <div className="h-3 bg-gray-800/50 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (!data) return null

  const assets = data?.assets ?? {}
  let haltedAny = false
  let haltedCount = 0
  let droughtAny = false
  let driftAny = false
  for (const name in assets) {
    const ah = assets[name].halt
    if (ah?.halted) {
      haltedAny = true
      haltedCount++
      for (const r of (ah.reasons ?? [])) {
        if (r.toLowerCase().includes('drought')) droughtAny = true
        if (r.toLowerCase().includes('drift')) driftAny = true
      }
    }
  }

  const cards = [
    {
      label: 'Max Drawdown',
      value: `${status.maxDrawdown.toFixed(2)}%`,
      threshold: `${status.drawdownTrigger.toFixed(0)}%`,
      pass: status.drawdownPass,
    },
    {
      label: 'Monthly PF',
      value: status.minMonthlyPf === Infinity || isNaN(status.minMonthlyPf) ? '—' : status.minMonthlyPf.toFixed(2),
      threshold: status.monthlyPfTrigger.toFixed(2),
      pass: status.monthlyPfPass,
    },
    {
      label: 'Signal Drought',
      value: droughtAny ? 'Halted' : 'OK',
      threshold: `${data.halt_conditions?.signal_drought ?? 30}d`,
      pass: !droughtAny,
    },
    {
      label: 'Prob Drift',
      value: driftAny ? 'Halted' : 'OK',
      threshold: `${((data.halt_conditions?.prob_drift ?? 0.15) * 100).toFixed(0)}%`,
      pass: !driftAny,
    },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(c => (
          <div
            key={c.label}
            className={`rounded-xl px-3 py-2.5 border transition-all duration-200 ${
              c.pass
                ? 'bg-emerald-500/5 border-emerald-500/15'
                : 'bg-red-500/5 border-red-500/15'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-tertiary font-medium tracking-wide">{c.label}</span>
              <div className={`p-0.5 rounded-full ${c.pass ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                {c.pass ? <CheckIcon /> : <XIcon />}
              </div>
            </div>
            <div className={`text-base font-bold tracking-tight metric-value ${c.pass ? 'text-emerald-400' : 'text-red-400'}`}>
              {c.value}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-tertiary">Threshold:</span>
              <span className={`text-[10px] font-mono ${c.pass ? 'text-secondary' : 'text-red-400/70'}`}>
                {c.threshold}
              </span>
            </div>
          </div>
        ))}
      </div>
      {haltedAny && (
        <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/5 border border-red-500/15 text-[11px] text-red-400">
          <svg className="w-3 h-3 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span className="font-medium">{haltedCount} asset{haltedCount > 1 ? 's' : ''} halted</span>
        </div>
      )}
    </div>
  )
}
