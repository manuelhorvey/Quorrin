import { Satellite } from 'lucide-react'
import { usePortfolioState } from '../hooks/usePortfolioState'
import { governanceText, governanceDot } from './ui/governance'

function satDdState(dd: number): 'GREEN' | 'YELLOW' | 'RED' {
  if (dd > -5) return 'GREEN'
  if (dd > -15) return 'YELLOW'
  return 'RED'
}

export default function SatelliteCard() {
  const { data } = usePortfolioState()
  const sat = data?.engine_status?.satellite

  if (!sat) {
    return (
      <div className="panel rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <Satellite className={`w-3.5 h-3.5 ${governanceText.YELLOW}`} strokeWidth={1.5} />
          <span className="text-2xs text-tertiary font-medium tracking-wide">BTC SATELLITE</span>
        </div>
        <div className="text-[11px] text-tertiary">Not initialized</div>
      </div>
    )
  }

  const ddState = satDdState(sat.drawdown_pct)
  const retState: 'GREEN' | 'RED' = sat.total_return_pct >= 0 ? 'GREEN' : 'RED'
  const gateGated = !sat.gate_open
  const posActive = sat.position_active

  return (
    <div className="panel rounded-lg p-3 panel-hover">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Satellite className={`w-3.5 h-3.5 ${governanceText.YELLOW}`} strokeWidth={1.5} />
          <span className="text-2xs text-tertiary font-medium tracking-wide">BTC SATELLITE</span>
        </div>
        <span className={`text-2xs font-mono font-semibold ${gateGated ? governanceText.YELLOW : governanceText.GREEN}`}>
          {sat.gate_open ? 'GATE OPEN' : 'GATE CLOSED'}
        </span>
      </div>

      {sat.current_price && (
        <div className="flex justify-center mb-2.5">
          <span className="text-[13px] font-mono text-primary font-bold">
            ${sat.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] mb-2">
        <div className="flex items-baseline justify-between">
          <span className="text-tertiary">Value</span>
          <span className={`font-mono font-semibold ${governanceText[retState]}`}>
            ${sat.current_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-tertiary">Return</span>
          <span className={`font-mono font-semibold ${governanceText[retState]}`}>
            {sat.total_return_pct >= 0 ? '+' : ''}{sat.total_return_pct.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-tertiary">DD</span>
          <span className={`font-mono font-semibold ${governanceText[ddState]}`}>
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
        <div className="flex items-center justify-between text-2xs text-tertiary mb-1.5">
          <span>ΔSharpe (63d)</span>
          <span className={`font-mono font-semibold ${sat.sharpe_contribution >= 0 ? governanceText.GREEN : governanceText.RED}`}>
            {sat.sharpe_contribution >= 0 ? '+' : ''}{sat.sharpe_contribution.toFixed(2)}
          </span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-2xs">
        <span className={`w-1.5 h-1.5 rounded-full ${posActive ? governanceDot.GREEN : 'text-tertiary'}`} />
        <span className={posActive ? governanceText.GREEN : 'text-tertiary'}>{posActive ? 'POSITION ACTIVE' : 'NO POSITION'}</span>
      </div>

      {posActive ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-2xs mt-1 pt-1 border-t border-default/30">
          <div className="flex justify-between">
            <span className="text-tertiary">Entry</span>
            <span className="font-mono text-primary">
              ${sat.entry_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-tertiary">Exit</span>
            <span className="font-mono text-gov-yellow">{sat.exit_reason ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tertiary">SL</span>
            <span className={`font-mono ${governanceText.RED}`}>
              ${sat.stop_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-tertiary">TP</span>
            <span className={`font-mono ${governanceText.GREEN}`}>
              ${sat.target_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-2xs mt-1 pt-1 border-t border-default/30">
          <div className="flex justify-between">
            <span className="text-tertiary">SL</span>
            <span className="font-mono text-tertiary">—</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tertiary">TP</span>
            <span className="font-mono text-tertiary">—</span>
          </div>
          {sat.exit_reason && (
            <div className="flex justify-between col-span-2">
              <span className="text-tertiary">Last exit</span>
              <span className="font-mono text-gov-yellow">{sat.exit_reason}</span>
            </div>
          )}
        </div>
      )}

      {!sat.gate_open && sat.gate_reasons.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-default/30">
          <div className="text-2xs text-tertiary mb-0.5 font-medium">GATE BLOCKED:</div>
          {sat.gate_reasons.map((r, i) => (
            <div key={i} className="text-2xs text-gov-yellow/70 font-mono leading-tight">· {r}</div>
          ))}
        </div>
      )}
    </div>
  )
}
