import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '../lib/api'
import { EngineSnapshotSchema } from '../lib/schemas'
import type { EngineSnapshot } from '../types/portfolio'

const EXPECTED_CONTRACT_VERSION = 1

export function usePortfolioState() {
  return useQuery({
    queryKey: ['portfolioState'],
    queryFn: async () => {
      const json = await fetchApi<unknown>('/state.json')
      const parsed = EngineSnapshotSchema.safeParse(json)
      if (!parsed.success) {
        console.error('[State] validation failed:', parsed.error.issues)
        throw new Error('Invalid state data from server')
      }
      const data = parsed.data as unknown as EngineSnapshot
      if (data.contract_version !== EXPECTED_CONTRACT_VERSION) {
        throw new Error(
          `State contract version mismatch: got ${data.contract_version}, expected ${EXPECTED_CONTRACT_VERSION}`
        )
      }
      return data
    },
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
