import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '../lib/api'

export interface MT5Status {
  connected: boolean
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'UNKNOWN'
  last_heartbeat: string | null
  account: Record<string, unknown> | null
}

export function useMT5Status() {
  return useQuery({
    queryKey: ['mt5Status'],
    queryFn: () => fetchApi<MT5Status>('/mt5/status.json'),
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: 1,
  })
}
