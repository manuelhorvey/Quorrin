export interface TradeEntry {
  asset: string
  side: 'LONG' | 'SHORT'
  entry: number
  exit: number
  return: number
  reason: 'TP' | 'SL' | 'EXIT' | 'tp' | 'sl' | 'signal_flip' | string
  entry_date: string
  exit_date: string
  bars?: number
}
