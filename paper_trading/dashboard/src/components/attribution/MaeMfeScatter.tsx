import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts'
import { useAttributionTrades } from '../../hooks/useAttributionTrades'
import ChartContainer from '../ui/ChartContainer'
import { axisTick, tooltipStyle } from '../ui/chartTheme'

const ARCHETYPE_COLORS: Record<string, string> = {
  BREAKOUT: 'var(--color-gov-green)',
  MEAN_REVERSION: 'var(--color-accent-blue)',
  MOMENTUM: 'var(--color-accent-purple)',
  VOL_EXPANSION: 'var(--color-gov-yellow)',
  UNKNOWN: 'var(--color-text-muted)',
}

export default function MaeMfeScatter() {
  const { data, isPending } = useAttributionTrades(200)
  const isEmpty = !data || data.length === 0

  const chartData = (data ?? [])
    .filter(t => t.exit_mae > 0 || t.exit_mfe > 0)
    .map(t => ({
      mae: t.exit_mae,
      mfe: t.exit_mfe,
      archetype: t.pred_archetype_at_entry,
      r: t.exit_realized_r,
      asset: t.asset,
      trade_id: t.trade_id,
    }))

  return (
    <ChartContainer title="MAE / MFE Scatter" accent="emerald" isPending={isPending} isEmpty={isEmpty}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <XAxis
            dataKey="mae"
            type="number"
            name="MAE"
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            label={{ value: 'MAE', position: 'bottom', fontSize: 10, fill: 'var(--color-text-tertiary)' }}
          />
          <YAxis
            dataKey="mfe"
            type="number"
            name="MFE"
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            label={{ value: 'MFE', angle: -90, position: 'left', fontSize: 10, fill: 'var(--color-text-tertiary)' }}
          />
          <ZAxis dataKey="r" range={[20, 80]} name="R" />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number, name: string) => [value.toFixed(2), name]}
          />
          <Scatter data={chartData}>
            {chartData.map((point, i) => (
              <Cell key={point.trade_id || i} fill={ARCHETYPE_COLORS[point.archetype] ?? 'var(--color-text-muted)'} fillOpacity={0.7} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
