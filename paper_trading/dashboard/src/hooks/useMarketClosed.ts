import { usePortfolioState } from './usePortfolioState'
import { isMarketOpen, useSessionClock } from './useSessionClock'

export function useMarketClosed(): boolean {
  const { data } = usePortfolioState()
  const { day, hour } = useSessionClock()

  const serverClosed = data?.engine_status?.market_closed
  if (serverClosed !== undefined) return serverClosed
  return !isMarketOpen(day, hour)
}
