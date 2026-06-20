# ADR-026: Regime-Conditional Ensemble Disabled Portfolio-Wide

**Status:** Accepted  
**Date:** 2026-06-20  
**Supersedes:** ADR-002 (regime classifier as router — ensemble component only; regime features remain in alpha pipeline)

## Context

The regime-conditional ensemble blended base XGBoost predictions (60%) with a per-asset `RegimeConditionalModel` (40%) trained on alpha + regime features. It was live in production but contributed nothing measurable.

## Decision

Disable the ensemble portfolio-wide:
- **Config** `ensemble.base_weight` changed from `0.6` to `1.0` (all 22 assets inherit)
- **Training** `_train_regime_if_configured()` returns early when `base_weight >= 1.0`, skipping regime model load, training, and `EnsembleSignal` creation entirely
- **Inference** path naturally drops out — no `_regime_model` or `_ensemble` attribute → the `if ensemble is not None` guard on `pipeline.py:272` skips the blend
- **Regime features** are still generated at inference and logged as trace fields; only the ensemble *combination* is removed

## Evidence (walk-forward, 25 assets × 4 folds = 100 pairs)

| Metric | Value |
|--------|-------|
| Pooled sign test p | 0.83 |
| Mean IC delta (ensemble − base) | +0.020 |
| Median IC delta | 0.000 |
| Wins / Losses / Ties | 46 / 43 / 11 |
| Assets improved | 13/25 (binomial, p=0.50) |
| Assets with sign-p < 0.10 | 0 (max 4 folds → min achievable p = 0.125) |

**One secondary finding:** EURNZD had a statistically credible *negative* effect (p=0.002, t-test; 4/4 folds ensemble hurts, Δ = −0.011). This is a separate result from "ensemble does nothing on average" — ensemble actively degrades this one asset.

## Consequences

- **Saved compute:** ~3–5 regime model trainings per asset on cold start, plus ~22 `predict_proba()` calls per inference cycle
- **EURAUD config override** (`ensemble.threshold: 0.25`) becomes a no-op; annotated as dead config
- **Re-enable path:** Change `base_weight < 1.0` in `configs/paper_trading.yaml:16`, re-run `compare_ensemble.py` with fresh on-disk before/after artifacts. Do not re-enable based on memory or live PnL observations alone.

## Revert Criteria

Walk-forward with ≥6 months of OOS data showing:
- Pooled sign test p < 0.10 across 25+ assets, AND
- Per-asset sign-p < 0.10 for at least 3 assets (not the same 3 driven by one volatile fold)

Until then, ensemble stays off.
