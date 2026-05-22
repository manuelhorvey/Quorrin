import { usePortfolioState } from '../hooks/usePortfolioState'

export default function SatelliteCard() {
  const { data } = usePortfolioState()
  const sat = data?.engine_status?.satellite

  if (!sat) {
    return (
      <div className="card-gradient card-border rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-[10px] text-tertiary font-medium tracking-wide">BTC SATELLITE</span>
        </div>
        <div className="text-[11px] text-tertiary">Not initialized</div>
      </div>
    )
  }

  const ddColor = sat.drawdown_pct > -5 ? 'text-emerald-400' : sat.drawdown_pct > -15 ? 'text-amber-400' : 'text-red-400'
  const retColor = sat.total_return_pct >= 0 ? 'text-emerald-400' : 'text-red-400'
  const gateColor = sat.gate_open ? 'text-emerald-400' : 'text-amber-400'
  const posColor = sat.position_active ? 'text-emerald-400' : 'text-gray-500'

  return (
    <div className="card-gradient card-border rounded-xl p-3 hover-lift">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-[10px] text-tertiary font-medium tracking-wide">BTC SATELLITE</span>
        </div>
        <span className={`text-[10px] font-mono font-semibold ${gateColor}`}>
          {sat.gate_open ? 'GATE OPEN' : 'GATE CLOSED'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] mb-2">
        <div className="flex items-baseline justify-between">
          <span className="text-tertiary">Value</span>
          <span className={`font-mono font-semibold ${retColor}`}>
            ${sat.current_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-tertiary">Return</span>
          <span className={`font-mono font-semibold ${retColor}`}>
            {sat.total_return_pct >= 0 ? '+' : ''}{sat.total_return_pct.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-tertiary">DD</span>
          <span className={`font-mono font-semibold ${ddColor}`}>
            {sat.drawdown_pct.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-tertiary">Alloc</span>
          <span className="font-mono font-semibold text-primary">
            {(sat.allocation_pct * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {sat.sharpe_contribution != null && (
        <div className="flex items-center justify-between text-[10px] text-tertiary mb-1.5">
          <span>ΔSharpe (63d)</span>
          <span className={`font-mono font-semibold ${sat.sharpe_contribution >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {sat.sharpe_contribution >= 0 ? '+' : ''}{sat.sharpe_contribution.toFixed(2)}
          </span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px]">
        <span className={`w-1.5 h-1.5 rounded-full ${posColor}`} />
        <span className={posColor}>{sat.position_active ? 'POSITION ACTIVE' : 'NO POSITION'}</span>
      </div>

      {!sat.gate_open && sat.gate_reasons.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-default/30">
          <div className="text-[9px] text-tertiary mb-0.5 font-medium">GATE BLOCKED:</div>
          {sat.gate_reasons.map((r, i) => (
            <div key={i} className="text-[9px] text-amber-400/70 font-mono leading-tight">· {r}</div>
          ))}
        </div>
      )}
    </div>
  )
}
