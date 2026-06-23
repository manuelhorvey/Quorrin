# QuantForge — Re-Prioritized Severity Register

**Date:** 2026-06-23
**Basis:** Re-ranked from the original technical audit to reflect operational danger and epistemic uncertainty, not code-level severity alone. See `01_executive_summary.md` for the decision-facing version.

## Why This Re-Ranking Differs From the Original Audit

The original audit ranked by conventional severity (Critical/High/Medium) within each subsystem. That ordering buried two findings that should have led the report:

1. A circuit breaker that fires on noise is **actively dangerous** — it creates the exact failure mode (an overridden safety control) that it exists to prevent. This is worse than "broken," because broken-and-inert is safer than broken-and-misleading.
2. The 86% walk-forward leakage doesn't make results "less accurate" — it makes them **uninformative**. Every per-asset IC, every promotion decision, every sign test was computed on contaminated folds. There is no valid number to discount; there is no number yet.

This register separates **scoped engineering work** from **unscoped research questions**, because bundling them into one timeline (as the original "30-60 days" estimate did) implied a false precision about the BUY inversion and the research re-run.

---

## Track A: Known Fixable (Engineering Sprint — CI-Gated)

Ordered by operational-danger-first, not by file or subsystem.

| Rank | Issue | Location | Why This Rank | Effort |
|---|---|---|---|---|
| 1 (co-equal Critical) | Consecutive-loss breaker records intra-cycle P&L | `orchestrator/engine.py:270-275` | **Live and self-defeating.** Will halt portfolio multiple times/day under normal trading, training operators to override the safety system before a real drawdown arrives. Co-equal with rank 1 below: this is an active control degrading itself every cycle; the leakage finding is invalid foundations that are currently inert until acted on. Ordered first here only because it requires zero upstream work to fix. | 15min |
| 1 (co-equal Critical) | PurgedWalkForwardFolds — no cross-fold purging (86% leakage) | `labels/compat.py:113-131` | Not a biased estimate to discount — an invalid one with no evidential value. Every per-asset IC, promotion decision, and sign test downstream is unsupported until this is fixed and everything is re-run (see Track B). | 2h |
| 3 | Peak portfolio value from two inconsistent sources | `orchestrator/engine.py:148-149, 225-227` | Directly feeds the same broken drawdown logic as rank 1 — phantom drawdown that never resets compounds the false-halt problem. | 30min |
| 4 | Random `train_test_split` for time-series | `training.py:134-144` | Compounds the leakage finding at rank 1: production training has its own independent leakage source via label lookahead. Must be fixed alongside, or the re-run in Track B is invalid again. | 1h |
| 5 | MT5 password cleartext over TCP | `mt5_client.py:304` | Live real-money credential exposed to any process on the same machine/subnet. Compliance failure (SOC2/SOX), not just a vulnerability. | 4h |
| 6 | `pickle.load()` on untrusted file path | `simulation_snapshot.py:186` | Arbitrary code execution if an attacker can write to `models/`. Sits next to rank 5 as a real-money-adjacent security gap. | 2h |
| 7 | Meta-model trained on in-sample predictions | `training.py:190-200` | Guarantees OOS degradation independent of the leakage fixes above — the meta-model's whole premise (primary model confidence is reliable) is built on inflated in-sample confidence. | 4h |
| 8 | No early stopping | `training.py:152-163` | Cheap fix, same training-integrity family as rank 7. | 30min |
| 9 | Expanding window never drops old data | `training.py:114-116` | Same family; lower urgency since it degrades gradually rather than guaranteeing a specific failure. | 2h |
| 10 | Frontend lacks Bearer auth header | `api.ts:50-56` | Dashboard-facing, not capital-facing — real but lower stakes than ranks 1-9. | 1h |
| 11 | MT5 sizing bypasses leverage budget | `entry_service.py:522-530` | Real risk-control gap, but requires MT5 live trading to trigger — lower immediate exposure than the breaker bugs. | 2-3h |
| 12 | MT5 mode zero fill simulation | `bridge.py:108-111, 148-149, 169-170` | Causes a reporting gap (paper P&L ≠ real P&L), not a control failure — important for trust in the dashboard, not for safety. | 1h |
| 13 | Exposure multiplier applied one cycle late | `orchestrator/engine.py:249-252` | Minor sequencing bug, bounded impact. | 10min |

**Track A total estimated effort: ~18-20h.**

**Gate condition:** None of Track A should be considered "done" until covered by the CI replay-determinism test and the decision-pipeline stage tests (currently 1/19 stages tested) — fixing a bug without a regression test against it is not closure.

---

## Track B: Open Research (No Fixed Timeline)

These do not belong in a sprint estimate. Each needs its own investigation with a "report back" checkpoint, not a due date.

| Issue | Status | What "Done" Looks Like |
|---|---|---|
| **BUY inversion, 11/19 assets, root cause unknown** | Open, currently live in production | A mechanistic explanation (e.g., a specific label-construction or feature-sign artifact) *or* a decision to permanently exclude the affected assets. Until one of these exists, those 11 assets should not be live-traded. |
| **Full walk-forward re-run post-purging-fix** | Blocked on Track A ranks 1 and 4 | Every per-asset IC, promotion decision, ensemble sign test, and counterfactual baseline recomputed on valid folds. Old numbers should be marked superseded, not archived as reference. |
| **Training/execution data-source mismatch** | Open, has a defined check | Training uses yfinance adjusted closes for labels; live execution uses raw MT5 bid/ask (`training.py:76` vs `pipeline.py:135`). Unlike the BUY inversion, this is not open-ended — it requires comparing the two distributions and either showing the shift is immaterial or fixing the source mismatch. Should be resolved before, or alongside, the walk-forward re-run below, since both feed the same go/no-go decision. |
| **Realistic Sharpe estimate** | Blocked on the re-run above | A Sharpe computed with transaction costs, slippage, and valid folds. The original 29.0 figure should not be cited again in any form, including "discounted," until this exists. |

**Why these are separate:** Track A items have a known fix and a known effort. These three do not — the BUY inversion in particular could resolve in a day (if it's a sign-flip bug) or could take months (if it's a genuine regime-dependent learned-inversion phenomenon, which the original audit's "final verdict" speculated might be a real research finding). Treating it as a sprint item would either create false confidence in a deadline or pressure a rushed, wrong answer.

---

## What Changed From the Original Audit's Ranking, and Why

| Original Position | New Position | Reason |
|---|---|---|
| E1 (circuit breaker) ranked "Critical" but listed 3rd among engine bugs, below research findings | Track A, co-equal Rank 1 with the leakage finding | A control that's live and self-defeating right now is not lesser than a backtest sitting in a directory — both are Critical for different reasons (active operational harm vs. invalid foundations), and neither subordinates the other. |
| BUY inversion mentioned only in §15 Final Verdict | Track B, top entry | A majority-of-assets unexplained signal inversion is a finding, not a footnote. It should never have been below the technical debt register in read order. |
| Single "30-60 days, fixable" timeline covering everything | Split into Track A (~18-20h, scoped) and Track B (unscoped) | Bundling implied the BUY inversion and full research validity were estimable on the same calendar as a credential-encryption fix. They are not comparable types of work. |
| 86% leakage framed as inflating the Sharpe number | Reframed as making the result **invalid**, not biased | The original framing implied "the real number is lower," which is itself a claim the leaky data can't support. The correct framing is "there is no valid number yet" — every downstream artifact (IC, promotion, sign test) needs recomputation, not adjustment. |
