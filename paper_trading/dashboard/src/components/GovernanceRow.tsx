import type { AssetState } from '../types/portfolio'
import { ASSET_LABEL_PARAMS, LABEL_HORIZON } from '../lib/registry'

function computePrematureStopRate(state: AssetState): number | null {
  const logs = state.metrics?.trade_log ?? []
  if (logs.length === 0) return null
  const premature = logs.filter(
    t =>
      (t.reason === 'sl' || t.reason === 'stop_loss' || t.reason === 'sl_hit') &&
      t.bars != null &&
      t.bars < LABEL_HORIZON,
  )
  return premature.length / logs.length
}

type StateClass = 'GREEN' | 'YELLOW' | 'RED' | 'INIT'

function classifyCalibration(prematureRate: number | null): StateClass {
  if (prematureRate === null) return 'INIT'
  if (prematureRate > 0.3) return 'RED'
  if (prematureRate > 0.1) return 'YELLOW'
  return 'GREEN'
}

interface GovernanceRowProps {
  asset: string
  state: AssetState
}

const stateColors: Record<StateClass, string> = {
  GREEN: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  YELLOW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  RED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  INIT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

function metaBand(decision?: string): string {
  if (decision === 'FULL') return 'FULL'
  if (decision === 'REDUCED') return 'REDUCED'
  if (decision === 'SKIP') return 'SKIP'
  return '—'
}

const labelVsRunColor = (labelSl: number, runtimeSl: number): string => {
  const gap = Math.abs(runtimeSl - labelSl)
  if (gap > 0.5) return 'text-amber-400'
  if (gap > 0.1) return 'text-slate-400'
  return 'text-emerald-400'
}

export default function GovernanceRow({ asset, state }: GovernanceRowProps) {
  const label = ASSET_LABEL_PARAMS[asset]
  if (!label) return null

  const runtimeSl = state.sl_mult ?? 0
  const runtimeTp = state.tp_mult ?? 0
  const prematureRate = computePrematureStopRate(state)
  const classification = classifyCalibration(prematureRate)

  return (
    <div className="bg-panel border border-default rounded-lg px-3 py-2.5 text-[11px] text-secondary">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">{asset}</span>
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${stateColors[classification]}`}>
            {classification}
          </span>
        </div>
        <span className="text-tertiary">
          Exposure <span className="font-mono text-secondary">{state.validity_exposure != null ? state.validity_exposure.toFixed(2) : '—'}x</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <div>
          <span className="text-tertiary">Jaccard (10d): </span>
          <span className={`font-mono ${state.feature_stability_jaccard != null ? 'text-indigo-400' : 'text-tertiary'}`}>
            {state.feature_stability_jaccard?.toFixed(2) ?? '—'}
          </span>
        </div>
        <div>
          <span className="text-tertiary">Meta: </span>
          <span className="font-mono text-primary">{metaBand(state.meta_decision)}</span>
          <span className="font-mono text-tertiary ml-0.5">(p={state.meta_confidence?.toFixed(2) ?? '—'})</span>
        </div>
        <div>
          <span className="text-tertiary">Label/Run: </span>
          <span className={`font-mono ${labelVsRunColor(label.sl, runtimeSl)}`}>
            [{label.sl}/{label.pt}] / [{runtimeSl.toFixed(2)}/{runtimeTp.toFixed(2)}]
          </span>
        </div>
        <div>
          <span className="text-tertiary">Premature: </span>
          <span className={`font-mono ${
            prematureRate == null
              ? 'text-tertiary'
              : prematureRate > 0.3
                ? 'text-rose-400 font-bold'
                : prematureRate > 0.1
                  ? 'text-amber-400'
                  : 'text-emerald-400'
          }`}>
            {prematureRate != null ? `${(prematureRate * 100).toFixed(1)}%` : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
