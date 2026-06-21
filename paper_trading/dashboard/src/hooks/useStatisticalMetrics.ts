import { createApiQuery } from '../lib/api'

export interface StatsRow {
  sharpe_ratio: number | null
  psr_gt_0: number | null
  psr_gt_1: number | null
  min_trl: number | null
  crs: number | null
  hhi: number | null
}

export type StatsData = Record<string, StatsRow>

const useStatsQuery = createApiQuery<StatsData>('/statistical-metrics.json')

export function useStatisticalMetrics() {
  return useStatsQuery({
    refetchInterval: 60_000,
    staleTime: 50_000,
  })
}
