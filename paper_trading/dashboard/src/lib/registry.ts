/** Maps asset name → label params used in triple-barrier training. */
export const ASSET_LABEL_PARAMS: Record<string, { pt: number; sl: number }> = {
  GC: { pt: 1.5, sl: 1.5 },
  NZDJPY: { pt: 2.0, sl: 2.0 },
  CADJPY: { pt: 2.0, sl: 2.0 },
  USDCAD: { pt: 2.0, sl: 2.0 },
  EURAUD: { pt: 2.0, sl: 2.0 },
  AUDJPY: { pt: 2.0, sl: 2.0 },
  GBPJPY: { pt: 2.0, sl: 2.0 },
  USDJPY: { pt: 2.0, sl: 2.0 },
  USDCHF: { pt: 2.0, sl: 2.0 },
  GBPUSD: { pt: 2.0, sl: 2.0 },
  CHFJPY: { pt: 2.0, sl: 2.0 },
  EURCAD: { pt: 2.0, sl: 2.0 },
  DJI: { pt: 2.0, sl: 2.0 },
  CL: { pt: 2.0, sl: 2.0 },
}

export const LABEL_HORIZON = 20
