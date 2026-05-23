import { useQuery } from '@tanstack/react-query'
import type { EquityHistoryPoint } from '../types/portfolio'
import { useMarketClosed } from './useMarketClosed'

async function fetchEquityHistory(): Promise<EquityHistoryPoint[]> {
  const res = await fetch('/equity_history.json')
  if (!res.ok) return []
  return res.json()
}

export function useEquityHistory() {
  const closed = useMarketClosed()
  return useQuery({
    queryKey: ['equityHistory'],
    queryFn: fetchEquityHistory,
    refetchInterval: closed ? 300_000 : 60_000,
    staleTime: closed ? 290_000 : 50_000,
  })
}
