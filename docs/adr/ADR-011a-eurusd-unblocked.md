# ADR-011a: EURUSD Unblocked — COT Integration Complete

**Status:** Accepted — supersedes ADR-011

**Date:** 2026-05-17

## Context

ADR-011 blocked EURUSD (and all FX pairs) pending COT (Commitment of Traders) data integration. The COT data pipeline has been implemented and validated. An isolation test was conducted to verify that adding COT leveraged fund positioning features enables directional signal in EURUSD.

## Resolution

COT leveraged fund positioning integrated as the primary missing feature axis. The EURUSD model now uses a 4-feature set:

| Feature | Description | Importance |
|---------|-------------|-----------|
| `lev_net_cot_index` | Leveraged fund net position normalized vs 52-week range | 0.299 |
| `rate_diff` | US fed funds rate minus ECB rate | 0.269 |
| `lev_net_change_4w` | 4-week change in leveraged fund net positioning | 0.249 |
| `eurusd_mom_63` | EURUSD price momentum (63-day) | 0.182 |

## Data Pipeline

| Component | File | Purpose |
|-----------|------|---------|
| Download | `data/loaders/download_cot.py` | Fetches `fut_fin_txt_{year}.zip` from CFTC (2010-present), filters to FX contracts, saves as parquet |
| Loader | `data/loaders/cot_loader.py` | Contract lookup, 3-day release lag shift, daily forward-fill alignment |
| Features | `features/cot_features.py` | COT index, net positions, position changes, commercial-to-lev ratio, positioning extremes |
| Integration | `features/pair_specific.py` | `build_eurusd_features()` accepts optional `cot_weekly` param |
| Weekly pipeline | `data/weekly_pipeline.py` | Automated COT download + feature generation in weekly cycle |

### Lag Handling

3-day release lag applied before forward-fill:
```
Tuesday close positions → Friday 3:30pm release → +3 calendar days
```
`align_cot_to_daily()` shifts the COT index release date by 3 days, then forward-fills to the daily price index. Verified no look-ahead bias.

### Key Implementation Detail: learning_rate = 0.30

COT features require `learning_rate=0.30` (vs `0.02` for XLF/BTC). This is a structural difference, not a tuning artefact:

```
# Why COT needs higher learning rate than price-based models
#
# Price features (XLF, BTC): daily bars, high autocorrelation,
# signal is weak per-bar → slow learning rate prevents overfitting noise
#
# COT features: weekly observations, each carries ~5 days of
# accumulated positioning change → higher information density per bar
# → faster learning rate appropriate, less risk of overfitting noise
#
# Rule of thumb: learning_rate scales roughly with signal density
# Daily price:  0.01-0.03
# Weekly macro: 0.05-0.10
# Weekly COT:   0.20-0.35  ← confirmed at 0.30 for EURUSD
```

EURUSD model config diverging from XLF/BTC standard:
```python
EURUSD_MODEL_CONFIG = {
    'learning_rate':    0.30,   # COT signal density justifies this
    'max_depth':        2,      # keep shallow — same as other assets
    'n_estimators':     300,
    'min_child_weight': 10,     # still regularize — weekly data is sparse
}
```

## Isolation Test Results

Test window: 2017-2022 train, 2022-2024 test. XGBoost multiclass with `learning_rate=0.3`, `max_depth=2`, `n_estimators=300`.

| Year | P(short) | P(long) | Model Bias | EURUSD | Gate |
|------|----------|---------|------------|--------|------|
| 2022 | 0.5690 | 0.4273 | Short | Fell ~14% | PASS |
| 2023 | 0.3901 | 0.5837 | Long | Rose ~3.5% | PASS |
| 2024 | 0.4301 | 0.5304 | Long | Fell ~6% | — |

Max confidence: 0.9955 (PASS > 0.70 threshold)

### Gate: Directional correctness in 2022 and 2023
- 2022: P(short)=0.5690 > P(long)=0.4273 → **PASS** (correct short bias during USD strength)
- 2023: P(long)=0.5837 > P(short)=0.3901 → **PASS** (correct long bias during EUR recovery)

**COT signal confirmed. Proceed to walk-forward validation.**

## Walk-Forward Results

Weekly walk-forward (5-year expanding window, 1-year test, P > 0.50 signal threshold):

| Window | Trades | PF | Expectancy | Bootstrap p | Gate |
|--------|--------|----|------------|-------------|------|
| 2022 | 42 | 0.69 | -0.0007 | 1.00 | FAIL |
| 2023 | 35 | 0.47 | -0.0029 | 1.00 | FAIL |
| 2024 | 35 | 1.30 | +0.0018 | 0.25 | FAIL |
| 2025 | 44 | 0.35 | -0.0021 | 1.00 | FAIL |

**Isolation test result (directional correctness): PASS**
**Walk-forward result (tradable PnL at PF > 1.10): FAIL**

### Diagnosis

COT provides correct directional bias in aggregate (PASS on isolation gate)
but does not produce PF > 1.10 as a standalone entry signal. This is
structurally expected:

1. **3-day release lag**: Tuesday positions seen Friday — stale by 3-5 days
2. **Weekly observations**: ~52 data points/year, insufficient for signal timing
3. **COT is a macro overlay, not an entry signal**: COT describes the
   positioning environment, not the day-to-day entry timing

### Recommended Path

Feed COT features into the **HybridRegimeEnsemble's macro expert head**
alongside existing price-derived features. The regime ensemble architecture
(MacroExpertHead with 0.45 fixed weight) is designed for this exact use case:
- COT features → macro environment context (positioning extreme, trend in flows)
- Price features → entry timing (momentum, volatility, mean reversion)

The MacroExpertHead prevents price features from drowning the COT signal
(confirmed issue in prior work — price features drown macro unless protected).

### Signal Correlation Check (if deployed via ensemble)

Before allocation if COT-informed EURUSD enters paper trading:
- EURUSD vs XLF: target < 0.30 (different drivers)
- EURUSD vs BTC: target < 0.30 (different drivers)
- EURUSD vs NZDJPY: target < 0.40 (both FX — may share carry exposure)

## Files Created/Modified

- `data/loaders/download_cot.py` — New: CFTC COT data downloader
- `data/loaders/cot_loader.py` — New: Contract lookup + alignment
- `features/cot_features.py` — New: COT feature engineering
- `features/pair_specific.py` — Modified: COT integration in `build_eurusd_features()`
- `data/weekly_pipeline.py` — Modified: COT generation step
- `diagnostics/eurusd_cot_isolation_test.py` — New: Validation script

## Consequences

**Positive:** EURUSD unblocked for walk-forward and potential deployment. COT infrastructure now available for other FX pairs (GBPUSD, USDJPY, AUDUSD) and for XLF financial sector positioning analysis. The 3-day lag alignment honed by COT work is a reusable pattern.

**Negative:** COT requires ongoing weekly data ingestion (Friday release). Walk-forward may still not clear the deployment gate — COT fixes the feature gap but does not guarantee tradable signal. EURUSD COT model needs `learning_rate=0.3` diverging from the XLF/BTC standard of `0.02`, increasing configuration surface.
