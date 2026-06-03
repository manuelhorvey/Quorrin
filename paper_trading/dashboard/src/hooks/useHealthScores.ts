import { createApiQuery } from '../lib/api'
import { HealthResponseSchema } from '../lib/schemas'
import type { z } from 'zod'

export type HealthComponent = z.infer<typeof HealthResponseSchema>['assets'][string]['components']
export type AssetHealth = z.infer<typeof HealthResponseSchema>['assets'][string]
export type SystemHealth = z.infer<typeof HealthResponseSchema>['system_health']
export type HealthResponse = z.infer<typeof HealthResponseSchema>

const useHealthScoresQuery = createApiQuery<HealthResponse>('/health.json', HealthResponseSchema)

export function useHealthScores() {
  return useHealthScoresQuery({
    refetchInterval: 60_000,
    staleTime: 50_000,
  })
}
