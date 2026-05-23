import { useQuery } from '@tanstack/react-query'
import { useMarketClosed } from './useMarketClosed'

async function fetchLogs(): Promise<string> {
  const res = await fetch('/logs')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

export function useEngineLogs() {
  const closed = useMarketClosed()
  return useQuery({
    queryKey: ['engineLogs'],
    queryFn: fetchLogs,
    refetchInterval: closed ? 120_000 : 15_000,
    staleTime: closed ? 110_000 : 10_000,
  })
}
