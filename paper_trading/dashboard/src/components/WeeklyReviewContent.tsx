import type { WeeklyReview } from '../hooks/useWeeklyReview'
import KpiCard from './ui/KpiCard'

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`
}

function r2(v: number): string {
  return v.toFixed(2)
}

function deltaStr(v: number): string {
  return v >= 0 ? `+${v.toFixed(1)}%` : `${v.toFixed(1)}%`
}

function colorForDelta(v: number): string {
  if (v === 0) return 'text-tertiary'
  const isGood = (
    (v > 0) ? true : false
  )
  return v > 0 ? 'text-gov-green' : 'text-gov-red'
}

function colorForRate(rate: number, isGood: boolean): string {
  if (isGood) return rate >= 0.5 ? 'text-gov-green' : 'text-gov-yellow'
  return rate <= 0.5 ? 'text-gov-green' : 'text-gov-red'
}

interface Props {
  data: WeeklyReview
}

export default function WeeklyReviewContent({ data }: Props) {
  const { summary, by_asset: byAsset, vs_prior_week: vsPrior, stop_out_cooldowns: stopOut, governance_summary: gov, regime_correlation: regimeCorr } = data

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <KpiCard label="P&L" value={`$${r2(summary.total_pnl)}`} color={summary.total_pnl >= 0 ? 'text-gov-green' : 'text-gov-red'} />
        <KpiCard label="Return" value={pct(summary.total_return_pct)} color={summary.total_return_pct >= 0 ? 'text-gov-green' : 'text-gov-red'} />
        <KpiCard label="Win Rate" value={pct(summary.win_rate)} color={colorForRate(summary.win_rate, true)} />
        <KpiCard label="Avg R" value={r2(summary.avg_r)} color={summary.avg_r >= 0 ? 'text-gov-green' : 'text-gov-red'} />
        <KpiCard label="Profit Factor" value={summary.profit_factor !== null ? r2(summary.profit_factor) : '—'} color="text-accent-purple" />
        <KpiCard label="Trades" value={String(summary.n_trades)} color="text-secondary" />
      </div>

      {vsPrior && (
        <div className="flex flex-wrap gap-3 text-2xs">
          <span>
            P&L <span className={colorForDelta(vsPrior.pnl_change)}>{deltaStr(vsPrior.pnl_change)}</span>
          </span>
          <span>
            WR <span className={colorForDelta(vsPrior.win_rate_change * 100)}>{deltaStr(vsPrior.win_rate_change * 100)}</span>
          </span>
          <span>
            SL <span className={colorForDelta(vsPrior.sl_rate_change * 100)}>{deltaStr(vsPrior.sl_rate_change * 100)}</span>
          </span>
          <span className="text-tertiary">vs prior week</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-panel/40 border border-default rounded-lg p-2.5">
          <h4 className="text-2xs font-semibold text-tertiary uppercase tracking-wider mb-2">Exit Reasons</h4>
          <div className="grid grid-cols-4 gap-1 text-center">
            <div>
              <div className="text-xs font-bold text-gov-green">{data.exit_reason_breakdown.tp}</div>
              <div className="text-[10px] text-tertiary">TP</div>
            </div>
            <div>
              <div className="text-xs font-bold text-gov-red">{data.exit_reason_breakdown.sl}</div>
              <div className="text-[10px] text-tertiary">SL</div>
            </div>
            <div>
              <div className="text-xs font-bold text-gov-yellow">{data.exit_reason_breakdown.signal_flip}</div>
              <div className="text-[10px] text-tertiary">Flip</div>
            </div>
            <div>
              <div className="text-xs font-bold text-tertiary">{data.exit_reason_breakdown.other}</div>
              <div className="text-[10px] text-tertiary">Other</div>
            </div>
          </div>
        </div>

        <div className="bg-panel/40 border border-default rounded-lg p-2.5">
          <h4 className="text-2xs font-semibold text-tertiary uppercase tracking-wider mb-2">Cooldowns</h4>
          <div className="text-xs font-bold text-secondary">{stopOut.stop_out_cooldowns_triggered}</div>
          <div className="text-[10px] text-tertiary">triggered this week</div>
          {stopOut.assets_in_cooldown.length > 0 && (
            <div className="text-[10px] text-tertiary mt-1 font-mono">{stopOut.assets_in_cooldown.join(', ')}</div>
          )}
        </div>
      </div>

      {byAsset.length > 0 && (
        <div>
          <h4 className="text-2xs font-semibold text-tertiary uppercase tracking-wider mb-2">Per Asset</h4>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs min-w-[400px]">
              <thead>
                <tr className="border-b border-default">
                  <th className="table-header text-left py-1.5 pr-2">Asset</th>
                  <th className="table-header text-right py-1.5 px-2">Trades</th>
                  <th className="table-header text-right py-1.5 px-2">Win%</th>
                  <th className="table-header text-right py-1.5 px-2">TP%</th>
                  <th className="table-header text-right py-1.5 px-2">SL%</th>
                  <th className="table-header text-right py-1.5 px-2">Avg R</th>
                  <th className="table-header text-right py-1.5 pl-2">P&L</th>
                </tr>
              </thead>
              <tbody>
                {byAsset.map((a) => (
                  <tr key={a.asset} className="border-b border-default/40 table-row-hover">
                    <td className="py-1.5 pr-2 font-medium text-primary font-mono text-xs">{a.asset}</td>
                    <td className="text-right py-1.5 px-2 text-secondary font-mono tabular-nums">{a.n_trades}</td>
                    <td className="text-right py-1.5 px-2 font-mono tabular-nums text-accent-blue">{pct(a.win_rate)}</td>
                    <td className={`text-right py-1.5 px-2 font-mono tabular-nums ${a.tp_rate >= 0.2 ? 'text-gov-green' : 'text-gov-yellow'}`}>{pct(a.tp_rate)}</td>
                    <td className={`text-right py-1.5 px-2 font-mono tabular-nums ${a.sl_rate <= 0.6 ? 'text-secondary' : 'text-gov-red'}`}>{pct(a.sl_rate)}</td>
                    <td className={`text-right py-1.5 px-2 font-mono tabular-nums ${a.avg_r >= 0 ? 'text-gov-green' : 'text-gov-red'}`}>{r2(a.avg_r)}</td>
                    <td className={`text-right py-1.5 pl-2 font-mono tabular-nums ${a.pnl >= 0 ? 'text-gov-green' : 'text-gov-red'}`}>${r2(a.pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {regimeCorr.length > 0 && (
          <div className="bg-panel/40 border border-default rounded-lg p-2.5">
            <h4 className="text-2xs font-semibold text-tertiary uppercase tracking-wider mb-2">Regime Correlation</h4>
            <div className="space-y-1.5">
              {regimeCorr.map((r) => (
                <div key={r.regime} className="flex items-center justify-between text-2xs">
                  <span className="font-medium text-primary">{r.regime}</span>
                  <span className="text-tertiary">{r.n_trades} trades</span>
                  <span className={`font-mono tabular-nums ${r.win_rate >= 0.5 ? 'text-gov-green' : 'text-gov-red'}`}>
                    WR {pct(r.win_rate)}
                  </span>
                  <span className={`font-mono tabular-nums ${r.sl_rate <= 0.5 ? 'text-gov-green' : 'text-gov-red'}`}>
                    SL {pct(r.sl_rate)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-panel/40 border border-default rounded-lg p-2.5">
          <h4 className="text-2xs font-semibold text-tertiary uppercase tracking-wider mb-2">Governance</h4>
          <div className="text-2xs space-y-1">
            <div className="flex justify-between">
              <span className="text-tertiary">Halted</span>
              <span className="font-mono text-gov-red">{gov.halted_assets.length > 0 ? gov.halted_assets.join(', ') : 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tertiary">Validity</span>
              <span className="font-mono text-secondary">{gov.most_common_validity}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
