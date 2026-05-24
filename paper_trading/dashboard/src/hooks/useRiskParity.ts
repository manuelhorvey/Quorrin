import { useQuery } from '@tanstack/react-query'

export interface RiskParityData {
  weights: Record<string, number>
  capital_allocations: Record<string, number>
  total_value: number
}

async function fetchRiskParity(): Promise<RiskParityData> {
  const resp = await fetch('/risk-parity.json')
  if (!resp.ok) throw new Error('Failed to fetch risk parity')
  return resp.json()
}

export function useRiskParity() {
  return useQuery<RiskParityData>({
    queryKey: ['riskParity'],
    queryFn: fetchRiskParity,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}
