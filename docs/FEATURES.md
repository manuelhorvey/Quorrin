# QuantForge — Feature Engineering

## Alpha Features

The primary feature builder is `features/alpha_features.py:build_alpha_features()`. It produces a DataFrame with ~30 feature columns per asset, used for both training and inference.

### Input Data

All data ingested from yfinance (no FRED in production):

| Source | Symbol | Data |
|---|---|---|
| Asset ticker | e.g. `CHFJPY=X` | Daily OHLCV close |
| Dollar index | `DX-Y.NYB` | DXY close |
| VIX | `^VIX` | VIX close |
| SPX | `^GSPC` | S&P 500 close |
| Crude oil | `CL=F` | WTI close |
| 10Y Treasury | `^TNX` | TNX yield |

### Per-Asset Features

| Feature | Formula | Usage |
|---|---|---|
| `{asset}_carry_vol_adj` | Close return × vol normalization | FX carry signal |
| `{asset}_mom_21d` | `close.pct_change(21)` | 1-month momentum |
| `{asset}_mom_63d` | `close.pct_change(63)` | 3-month momentum |
| `{asset}_mom_126d` | `close.pct_change(126)` | 6-month momentum |
| `{asset}_mom_252d` | `close.pct_change(252)` | 12-month momentum |
| `{asset}_zscore_20` | `(close - SMA20) / close.std(20)` | Mean reversion signal |
| `{asset}_vol_ratio` | Short-term vol / long-term vol | Vol regime indicator |
| `{asset}_dow_signal` | Day-of-week encoding | Calendar effect |

### Cross-Asset Features

| Feature | Source | Window |
|---|---|---|
| `dxy_mom_21` | DX-Y.NYB | 21d |
| `dxy_mom_63` | DX-Y.NYB | 63d |
| `vix_mom_21` | ^VIX | 21d |
| `vix_mom_63` | ^VIX | 63d |
| `spx_mom_21` | ^GSPC | 21d |
| `spx_mom_63` | ^GSPC | 63d |
| `wti_mom_21` | CL=F | 21d |
| `wti_mom_63` | CL=F | 63d |

### Data Fetching

`features/data_fetch.py` provides:

| Function | Returns | Period |
|---|---|---|
| `fetch_asset_data(name, ticker)` | (prices, rate_diffs, dxy, vix, spx, commodities) | 10y |
| `fetch_asset_ohlcv(ticker)` | DataFrame(open, high, low, close, volume) | 10y |
| `fetch_yf_series(ticker, name)` | pd.Series | 10y |

All functions normalize dates to TZ-naive DatetimeIndex via `pd.to_datetime(s.index.date)`.

## Archetype Features

Computed inline in `paper_trading/inference/pipeline.py:_generate_and_apply()` from full-history OHLCV:

| Feature | Formula | Window |
|---|---|---|
| `ema_spread` | (EMA20 − EMA50) / EMA50 | 20/50 |
| `adx` | ADX(high, low, close) | 14 |
| `rsi` | RSI(close) | 14 |
| `bb_zscore` | (close − BB_mavg) / (BB_std / 2) | 20 |

These are inference-only — used by `ArchetypeClassifier` but never passed to XGBoost.

## Regime Features

`features/regime_features.py:generate_regime_features()` produces:

| Feature | Formula | Purpose |
|---|---|---|
| `hurst` | Hurst exponent via variance method | Trend persistence detection |
| `kaufman_er` | Efficiency ratio (direction / path length) | Trend strength |
| `adx_regime` | ADX value | Trend magnitude |
| `vol_zscore` | `(vol - mean(vol)) / std(vol)` | Vol anomaly detection |
| `compression` | ATR5 / ATR20 ratio | Vol contraction/expansion |

## Labeling

`features/labels.py:triple_barrier_labels()`:

1. Compute ATR-based barrier distances from `pt_sl = (tp_mult, sl_mult)`
2. Apply triple-barrier touch: first touch of TP (+1), SL (-1), or vertical barrier at `vbar` bars → {-1, 0, 1}
3. Training pipeline drops HOLD (0) labels and maps {-1, 1} → {0, 1} for binary XGBoost

Per-asset `pt_sl` comes from `configs/paper_trading.yaml`:
- BTC-USD: `pt_sl = (2.5, 3.0)`
- All others: `pt_sl = (1.5, 2.0)`

## Feature Contract Validation

`features/contract.py` provides `FeatureContract` dataclass and `validate_no_cross_asset_leakage()`. This is used for validation only — the current production pipeline builds features directly via `build_alpha_features()` without the contract routing system.

## Lead-Lag Features

`features/lead_lag_features.py` — not used in production. Exists for research experiments with inter-asset lead-lag relationships.

## Pair-Specific Features

`features/pair_specific.py` — not used in production. Historical per-pair feature builders from the research phase.

## COT Features

`features/cot_features.py` — not used in production. Commitments of Traders features pending data integration.

## Architecture Note

The current production system uses a flat feature manifold: all alpha features are computed independently and concatenated by common date index. There is no Driver Atlas routing, no regime-specific feature subspace assignment, and no per-contract prefix isolation in the production pipeline. Validation features cross-asset leakage is handled by `build_alpha_features()` returning only the requested asset's columns.
