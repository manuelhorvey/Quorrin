import { useQuery } from '@tanstack/react-query'
import type { TradeEntry } from '../types/trades'
import { useMarketClosed } from './useMarketClosed'

async function fetchTrades(params: { limit?: number; offset?: number } = {}): Promise<TradeEntry[]> {
  const qs = new URLSearchParams()
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.offset) qs.set('offset', String(params.offset))
  const res = await fetch(`/trades.json?${qs}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function useTrades(limit = 10, offset = 0) {
  const closed = useMarketClosed()
  return useQuery({
    queryKey: ['trades', limit, offset],
    queryFn: () => fetchTrades({ limit, offset }),
    refetchInterval: closed ? 300_000 : 60_000,
    staleTime: closed ? 290_000 : 50_000,
  })
}
