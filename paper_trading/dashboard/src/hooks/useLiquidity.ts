import { useQuery } from '@tanstack/react-query'

interface LiquidityStatus {
  regime: string
  sl_mult: number
  size_scalar: number
}

interface LiquidityData {
  [asset: string]: LiquidityStatus
}

async function fetchLiquidity(): Promise<LiquidityData> {
  const resp = await fetch('/liquidity.json')
  if (!resp.ok) throw new Error('Failed to fetch liquidity')
  return resp.json()
}

export function useLiquidity() {
  return useQuery<LiquidityData>({
    queryKey: ['liquidity'],
    queryFn: fetchLiquidity,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}
