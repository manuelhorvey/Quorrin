import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useShadowSummary } from '../../hooks/useShadowSummary'
import ChartContainer from '../ui/ChartContainer'
import { axisTick, tooltipStyle } from '../ui/chartTheme'

export default function ShadowDivergenceChart() {
  const { data, isPending } = useShadowSummary()

  if (isPending || !data || data.overall.n === 0) {
    return (
      <ChartContainer title="Shadow Divergence" accent="purple" isPending={isPending} isEmpty={!data || data.overall.n === 0}>
        null
      </ChartContainer>
    )
  }

  const byLabelData = Object.entries(data.by_label).map(([label, stats]) => ({
    name: label,
    divergenceRate: stats.divergence_rate,
    avgRDelta: stats.avg_r_delta,
  }))

  function cellFill(rate: number): string {
    if (rate > 0.3) return 'var(--color-gov-red)'
    if (rate > 0.1) return 'var(--color-gov-yellow)'
    return 'var(--color-gov-green)'
  }

  return (
    <ChartContainer title="Shadow Divergence" accent="purple" isEmpty={byLabelData.length === 0}>
      <div className="h-full flex flex-col">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-2xs">
          <div className="bg-panel rounded p-2">
            <span className="text-tertiary">Divergence</span>
            <p className="text-primary font-mono font-semibold">{(data.overall.divergence_rate * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-panel rounded p-2">
            <span className="text-tertiary">Avg ΔR</span>
            <p className={`font-mono font-semibold ${data.overall.avg_r_delta >= 0 ? 'text-gov-green' : 'text-gov-red'}`}>
              {data.overall.avg_r_delta > 0 ? '+' : ''}{data.overall.avg_r_delta.toFixed(2)}
            </p>
          </div>
          <div className="bg-panel rounded p-2">
            <span className="text-tertiary">Shadow WR</span>
            <p className="text-accent-purple font-mono font-semibold">{(data.overall.shadow_win_rate * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-panel rounded p-2">
            <span className="text-tertiary">Live WR</span>
            <p className="text-accent-blue font-mono font-semibold">{(data.overall.live_win_rate * 100).toFixed(0)}%</p>
          </div>
        </div>

        {byLabelData.length > 0 && (
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-tertiary mb-1">Divergence Rate by Config</p>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={byLabelData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[0, 1]}
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="divergenceRate" radius={[2, 2, 0, 0]}>
                  {byLabelData.map((d, i) => (
                    <Cell key={i} fill={cellFill(d.divergenceRate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </ChartContainer>
  )
}
