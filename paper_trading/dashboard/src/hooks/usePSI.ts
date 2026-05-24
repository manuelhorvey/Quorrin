import { useQuery } from '@tanstack/react-query'

export interface PSIFeatureEntry {
  feature: string
  psi: number
  classification: string
  trend: string
  importance_score: number
}

export interface PSIAssetStatus {
  per_feature: PSIFeatureEntry[]
  worst_classification: string
  moderate_count: number
  severe_count: number
  psi_ok: boolean
  penalty: number
}

export interface PSIData {
  [asset: string]: PSIAssetStatus
}

async function fetchPSI(): Promise<PSIData> {
  const resp = await fetch('/psi.json')
  if (!resp.ok) throw new Error('Failed to fetch PSI drift')
  return resp.json()
}

export function usePSI() {
  return useQuery<PSIData>({
    queryKey: ['psi'],
    queryFn: fetchPSI,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}
