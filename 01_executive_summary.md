# QuantForge — Executive Summary

**Date:** 2026-06-23
**Audience:** Decision-maker evaluating next-sprint funding and live-trading readiness
**Full detail:** See `02_severity_register.md`

## The Findings That Matter Most

**1. The research results are not "optimistic" — they are invalid.**
Every walk-forward result in the repository was computed against a test set with 86% cross-fold leakage. This does not produce a biased estimate that can be discounted — it produces an estimate with no evidential value. The per-asset information coefficients, the asset-promotion decisions, the ensemble sign tests, and the counterfactual ablation baselines were all built on contaminated data. "Recalibrate and proceed" is the wrong response to a biased estimate; "stop and redo" is the correct response to an invalid one. We do not know the lower bound on this strategy's edge — we know nothing about it yet.

**2. 11 of 19 assets show an inverted BUY signal with no known cause.**
This was under-prioritized in the original draft. A majority of traded assets exhibiting unexplained signal inversion is an open scientific question, not an engineering ticket. Trading those 11 assets today means trading a mechanism nobody understands. This should stop independently of the engineering sprint below.

**3. The circuit breaker is currently dangerous, not just broken.**
The consecutive-loss breaker records intra-cycle P&L instead of daily P&L, which means it is expected to halt the portfolio multiple times during ordinary trading. A safety control that fires on noise teaches operators to override it — so by the time a real drawdown arrives, the breaker may already be disabled or patched around. This is a live, self-defeating failure mode, not a dormant risk. It is co-equal in severity with finding #1, not subordinate to it: #1 is invalid foundations that are currently inert until acted on; this is an active control degrading itself every cycle the system runs.

**4. Training labels and live execution draw from different data sources.**
Training uses yfinance adjusted closes; live execution uses raw MT5 bid/ask (`training.py:76` vs `pipeline.py:135`). Even after the walk-forward leakage is fixed, this is an independent, unmeasured distribution shift between what the model learned from and what it trades against. Unlike the BUY inversion, this has a defined check — compare the two distributions — it simply hasn't been run.

## What Is Genuinely Good

The decision pipeline architecture (19-stage composable design), the 11-layer risk governance concept, the write-ahead log with hash-verified causal chains, and the documentation culture (AGENTS.md logs falsified hypotheses with evidence, not just successes) reflect an engineering team with strong epistemics. The problems below are implementation debt and unresolved research, not a sign the team doesn't know how to build this correctly.

## Two Tracks, Not One Timeline

- **Known Fixable (engineering sprint, ~18-20h, CI-gated):** circuit breaker date guard, peak-value single source, MT5 credential encryption, pickle removal, frontend auth header, walk-forward purging fix, time-series CV, meta-model OOS retraining, early stopping, rolling window, MT5 leverage-budget bypass, MT5 fill simulation. All scoped, all estimable.
- **Open Research (no fixed timeline):** BUY inversion root cause; full re-run of walk-forward research once purging is fixed; measurement of the training/execution data-source distribution shift (concrete check, not yet run). Report back on a "we'll investigate and report findings" basis — do not bundle into the sprint estimate.

Collapsing these into one "30–60 days and it's ready" estimate was a mistake in the original draft. The engineering work is boundable. The research question is not.

## Go / No-Go Criteria for Live Capital

**Do not trade live (or institutional) capital until:**
- [ ] Walk-forward purging is fixed and **all** research results are re-run on valid folds
- [ ] BUY inversion is either explained or the affected assets are excluded from live trading
- [ ] Circuit breaker uses daily (not intra-cycle) P&L
- [ ] MT5 credentials are no longer transmitted in cleartext
- [ ] Training data source matches live execution source (currently: yfinance adjusted closes for labels vs. raw MT5 bid/ask for execution — `training.py:76` vs `pipeline.py:135`), or the resulting distribution shift is measured and shown to be immaterial

**Currently true:** none of the above are satisfied. The system should not be allocated real-money capital today, including under active developer supervision. Of the five items above, two are ordinary engineering fixes that supervision could plausibly bridge in the interim (the circuit breaker date guard; the cleartext credentials) — but the other three are not supervision-mitigable at all: the BUY inversion and the unmeasured research edge are open epistemic questions (supervision catches operational mistakes, not "we don't know if the strategy works"), and the training/execution source mismatch is a concrete, currently-unmeasured distribution shift with its own defined check that simply hasn't been run. Three of five blockers being epistemic, not operational, is why supervision isn't a substitute for clearing this list.

## Recommendation

Fund the engineering sprint (~18-20h, one to two weeks with review buffer) as a gate, not a finish line. Treat the BUY inversion investigation and the training/execution data-source check as separate, open-ended research items, each with its own go/no-go checkpoint — the BUY inversion before any of the 11 affected assets return to live trading, and the source-mismatch measurement before the model is trusted to trade what it was trained on. Re-evaluate institutional readiness only after the sprint and a fresh, valid walk-forward re-run are complete — not on a calendar date.
