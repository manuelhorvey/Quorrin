import Panel from './ui/Panel'
import SectionHeader from './ui/SectionHeader'
import { useRiskParity } from '../hooks/useRiskParity'

export default function RiskParityPanel() {
  const { data, isPending } = useRiskParity()

  if (isPending) return null
  if (!data || !data.weights || Object.keys(data.weights).length === 0) return null

  const entries = Object.entries(data.weights)
    .sort(([, a], [, b]) => b - a)

  return (
    <Panel className="p-4">
      <SectionHeader
        title="Risk Parity Weights"
        accent="blue"
        meta={
          <span className="text-[10px] text-tertiary font-mono bg-panel px-2 py-0.5 rounded border border-default tabular-nums">
            {entries.length} assets
          </span>
        }
      />

      <div className="space-y-1.5">
        {entries.map(([name, weight]) => {
          const pct = (weight * 100)
          const capital = data.capital_allocations?.[name]
          const barColor = pct >= 10 ? 'bg-accent-blue' : pct >= 5 ? 'bg-accent-emerald' : 'bg-accent-purple'
          return (
            <div key={name} className="flex items-center gap-3 text-[11px]">
              <span className="w-14 font-mono text-primary font-semibold shrink-0">{name}</span>
              <div className="flex-1 h-4 bg-panel rounded-sm overflow-hidden border border-default/50">
                <div
                  className={`h-full rounded-sm transition-all duration-500 ${barColor}`}
                  style={{ width: `${pct * 4}%`, opacity: 0.7 }}
                />
              </div>
              <span className="w-12 text-right font-mono tabular-nums text-secondary">{pct.toFixed(1)}%</span>
              {capital != null && (
                <span className="w-20 text-right font-mono tabular-nums text-tertiary text-2xs">
                  ${capital.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 pt-2 border-t border-default/50 text-2xs text-tertiary font-mono flex justify-between">
        <span>Total value</span>
        <span className="text-secondary">
          ${data.total_value?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '—'}
        </span>
      </div>
    </Panel>
  )
}
