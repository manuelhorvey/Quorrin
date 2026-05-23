import { useQuery } from '@tanstack/react-query'
import type { EngineSnapshot } from '../types/portfolio'

async function fetchState(): Promise<EngineSnapshot> {
  const res = await fetch('/state.json')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function usePortfolioState() {
  return useQuery({
    queryKey: ['portfolioState'],
    queryFn: fetchState,
    refetchInterval: (q) => {
      const d = q.state.data
      return d?.engine_status?.market_closed ? 120_000 : 30_000
    },
    staleTime: (q) => {
      const d = q.state.data
      return d?.engine_status?.market_closed ? 110_000 : 25_000
    },
  })
}
