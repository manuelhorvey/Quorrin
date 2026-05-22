import { useHealthScores } from '../hooks/useHealthScores'

const COMPONENT_LABELS: Record<string, string> = {
  validity: 'Validity',
  drift: 'Drift',
  pnl_stability: 'PnL Stability',
  shadow_agreement: 'Shadow Agreement',
  stress_robustness: 'Stress Robust.',
}

function colorClasses(color: string) {
  switch (color) {
    case 'green':
      return { bg: 'bg-emerald-500/8', text: 'text-emerald-400', border: 'border-emerald-500/15', bar: 'bg-emerald-500' }
    case 'amber':
      return { bg: 'bg-amber-500/8', text: 'text-amber-400', border: 'border-amber-500/15', bar: 'bg-amber-500' }
    case 'red':
      return { bg: 'bg-red-500/8', text: 'text-red-400', border: 'border-red-500/15', bar: 'bg-red-500' }
    default:
      return { bg: 'bg-gray-500/8', text: 'text-gray-400', border: 'border-gray-500/15', bar: 'bg-gray-500' }
  }
}

function barColor(score: number) {
  if (score >= 0.8) return 'bg-emerald-500'
  if (score >= 0.55) return 'bg-amber-500'
  return 'bg-red-500'
}

export default function HealthScores() {
  const { data, isPending } = useHealthScores()

  if (isPending) {
    return (
      <div className="card-gradient card-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-purple-500/50" />
          <h2 className="text-sm font-semibold text-primary">Asset Health</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-panel rounded-lg p-3 animate-pulse space-y-2">
              <div className="h-3 bg-gray-800 rounded w-1/2" />
              <div className="h-6 bg-gray-800 rounded w-2/3" />
              <div className="h-1 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data?.assets || Object.keys(data.assets).length === 0) return null

  const sys = data.system_health
  const names = Object.keys(data.assets).sort()

  return (
    <div className="card-gradient card-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500/50" />
          <h2 className="text-sm font-semibold text-primary">Asset Health</h2>
        </div>
        <span className="text-[10px] text-tertiary bg-panel px-2 py-0.5 rounded-full">
          Sys: {((sys?.mean_health_score ?? 0) * 100).toFixed(0)}% &middot; {sys?.n_healthy ?? 0} ok &middot; {sys?.n_degraded ?? 0} deg &middot; {sys?.n_critical ?? 0} crit
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        {names.map(name => {
          const h = data.assets[name]
          const cc = colorClasses(h.health_color)
          const pct = (h.health_score * 100).toFixed(0)
          return (
            <div key={name} className={`${cc.bg} border ${cc.border} rounded-lg px-2.5 py-2`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-primary">{name}</span>
                <span className={`text-sm font-bold tracking-tight ${cc.text}`}>{pct}%</span>
              </div>
              <div className="w-full h-1 bg-panel rounded-full overflow-hidden mb-1.5">
                <div className={`h-full rounded-full ${cc.bar}`} style={{ width: `${pct}%` }} />
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${cc.text}`}>
                {h.health_label}
              </span>
              <div className="mt-1.5 grid grid-cols-5 gap-0.5">
                {Object.entries(h.components).map(([key, val]) => (
                  <div key={key} className="flex flex-col items-center gap-0.5" title={`${COMPONENT_LABELS[key] ?? key}: ${(val * 100).toFixed(0)}%`}>
                    <div className="w-full h-3 bg-panel rounded-sm overflow-hidden relative">
                      <div className={`absolute bottom-0 left-0 right-0 ${barColor(val)} transition-all duration-500`} style={{ height: `${val * 100}%` }} />
                    </div>
                    <span className="text-[7px] text-tertiary uppercase tracking-tight leading-none">
                      {key === 'pnl_stability' ? 'PnL' : key === 'stress_robustness' ? 'Str' : key === 'shadow_agreement' ? 'Shad' : key.slice(0, 3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
