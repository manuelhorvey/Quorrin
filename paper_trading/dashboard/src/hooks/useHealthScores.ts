import { useQuery } from '@tanstack/react-query'
import { useMarketClosed } from './useMarketClosed'

export interface HealthComponent {
  validity: number
  drift: number
  pnl_stability: number
  shadow_agreement: number
  stress_robustness: number
}

export interface AssetHealth {
  asset: string
  health_score: number
  health_label: string
  health_color: string
  components: HealthComponent
  limiting_factors: { component: string; score: number }[]
  validity_state: string
}

export interface SystemHealth {
  mean_health_score: number
  n_assets: number
  healthiest_asset: string | null
  weakest_asset: string | null
  n_healthy: number
  n_degraded: number
  n_critical: number
}

interface HealthResponse {
  assets: Record<string, AssetHealth>
  system_health: SystemHealth
}

async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('/health.json')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function useHealthScores() {
  const closed = useMarketClosed()
  return useQuery({
    queryKey: ['healthScores'],
    queryFn: fetchHealth,
    refetchInterval: closed ? 300_000 : 60_000,
    staleTime: closed ? 290_000 : 50_000,
  })
}
