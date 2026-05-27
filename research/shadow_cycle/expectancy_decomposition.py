"""Expectancy Decomposition — Shadow Cycle Analysis Script.

Reads persisted Phase 6 attribution parquet files and decomposes
realized edge into its causal components:

    Forecast Edge
      x Entry Quality
      x Exit Geometry
      x Execution Realism
      = Realized Edge

Usage:
    python -m research.shadow_cycle.expectancy_decomposition \\
        --attribution-dir data/research/attribution \\
        --experiment-id <optional filter>

Outputs:
    - Terminal summary table
    - data/research/shadow_cycle/{experiment_id}/expectancy_decomposition.parquet
    - data/research/shadow_cycle/{experiment_id}/regime_segmented.parquet
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("shadow_cycle")


BASE = Path(__file__).resolve().parent.parent.parent
DEFAULT_ATTRIBUTION_DIR = BASE / "data" / "research" / "attribution"
OUTPUT_DIR = BASE / "data" / "research" / "shadow_cycle"


# ── Derived Metrics ────────────────────────────────────────────────


def compute_entry_timing_efficiency(df: pd.DataFrame) -> pd.Series:
    """entry_price / mid_price_at_signal — >1 means paid above mid, <1 means below."""
    return np.where(
        (df["exec_entry_price"] > 0) & (df["exec_mid_price_at_signal"] > 0),
        df["exec_entry_price"] / df["exec_mid_price_at_signal"],
        np.nan,
    )


def compute_slippage_cost_bps(df: pd.DataFrame) -> pd.Series:
    return df["friction_entry_slippage_bps"] + df["friction_exit_slippage_bps"]


def compute_edge_leakage(df: pd.DataFrame) -> pd.DataFrame:
    """Decompose: forecast -> entry -> exit -> friction -> realized."""
    result = df.copy()
    # Proxy for theoretical edge: counterfactual_ideal_fill_r or exit_theoretical_r
    result["theoretical_edge"] = df["exit_theoretical_r"].fillna(df["exit_realized_r"])
    result["entry_impact"] = np.where(
        df["exec_counterfactual_entry_timing_r"].notna(),
        df["exec_counterfactual_entry_timing_r"] - result["theoretical_edge"],
        0.0,
    )
    result["friction_impact"] = np.where(
        df["friction_counterfactual_real_fill_r"].notna(),
        df["friction_counterfactual_real_fill_r"] - result["theoretical_edge"],
        0.0,
    )
    result["realized_edge"] = df["exit_realized_r"]
    return result


# ── Segmentation ────────────────────────────────────────────────────


def regime_segmented_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Per-regime expectancy decomposition."""
    groups = df.groupby("pred_regime_at_entry")
    rows = []
    for regime, g in groups:
        n = len(g)
        if n < 3:
            continue
        rows.append(
            {
                "regime": regime,
                "n_trades": n,
                "mean_realized_r": g["exit_realized_r"].mean(),
                "mean_theoretical_r": g["exit_theoretical_r"].mean(),
                "mean_entry_timing_eff": g["entry_timing_efficiency"].mean(),
                "mean_slippage_cost_bps": g["slippage_cost_bps"].mean(),
                "mean_mae_per_bar": g["exit_mae_per_bar"].mean(),
                "mean_mfe_per_bar": g["exit_mfe_per_bar"].mean(),
                "win_rate": (g["exit_realized_r"] > 0).mean(),
                "sharpe": g["exit_realized_r"].mean() / g["exit_realized_r"].std() * np.sqrt(252)
                if g["exit_realized_r"].std() > 0
                else 0.0,
            }
        )
    return pd.DataFrame.from_records(rows).sort_values("mean_realized_r", ascending=False)


def archetype_segmented_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Per-archetype expectancy decomposition."""
    groups = df.groupby("pred_archetype_at_entry")
    rows = []
    for archetype, g in groups:
        n = len(g)
        if n < 3:
            continue
        improved_by_deferred = (
            g[g["exec_entry_type"] == "deferred"]["exit_realized_r"].mean()
            if (g["exec_entry_type"] == "deferred").any()
            else None
        )
        immediate_r = (
            g[g["exec_entry_type"] == "immediate"]["exit_realized_r"].mean()
            if (g["exec_entry_type"] == "immediate").any()
            else None
        )
        rows.append(
            {
                "archetype": archetype,
                "n_trades": n,
                "mean_realized_r": g["exit_realized_r"].mean(),
                "mean_theoretical_r": g["exit_theoretical_r"].mean(),
                "mean_slippage_cost_bps": g["slippage_cost_bps"].mean(),
                "win_rate": (g["exit_realized_r"] > 0).mean(),
                "mean_bars_held": g["exit_bars_held"].mean(),
                "deferred_entry_mean_r": improved_by_deferred,
                "immediate_entry_mean_r": immediate_r,
                "archetype_drift_rate": (g["pred_archetype_at_entry"] != g["exit_exit_archetype"]).mean(),
                "sharpe": g["exit_realized_r"].mean() / g["exit_realized_r"].std() * np.sqrt(252)
                if g["exit_realized_r"].std() > 0
                else 0.0,
            }
        )
    return pd.DataFrame.from_records(rows).sort_values("mean_realized_r", ascending=False)


def exit_reason_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Per exit reason decomposition."""
    groups = df.groupby("exit_exit_reason")
    rows = []
    for reason, g in groups:
        n = len(g)
        if n < 3:
            continue
        rows.append(
            {
                "exit_reason": reason,
                "n_trades": n,
                "mean_realized_r": g["exit_realized_r"].mean(),
                "mean_mae_per_bar": g["exit_mae_per_bar"].mean(),
                "mean_mfe_per_bar": g["exit_mfe_per_bar"].mean(),
                "mean_bars_held": g["exit_bars_held"].mean(),
                "archetype_drift_rate": (g["pred_archetype_at_entry"] != g["exit_exit_archetype"]).mean(),
            }
        )
    return pd.DataFrame.from_records(rows).sort_values("mean_realized_r", ascending=False)


def failure_mode_report(df: pd.DataFrame) -> dict:
    """Check specific failure modes from the shadow cycle spec."""
    report = {}

    # A. Deferred-entry alpha destruction
    deferred = df[df["exec_entry_type"] == "deferred"]["exit_realized_r"]
    immediate = df[df["exec_entry_type"] == "immediate"]["exit_realized_r"]
    if len(deferred) > 2 and len(immediate) > 2:
        report["deferred_entry_mean_r"] = float(deferred.mean())
        report["immediate_entry_mean_r"] = float(immediate.mean())
        report["deferred_vs_immediate_delta"] = float(deferred.mean() - immediate.mean())
        report["deferred_alpha_destruction"] = bool(deferred.mean() < immediate.mean())
    else:
        report["deferred_entry"] = "insufficient_samples"

    # B. Convexity illusion
    has_convex = df["exit_counterfactual_convex_tp_r"].notna().any()
    has_fixed = df["exit_counterfactual_fixed_tp_r"].notna().any()
    if has_convex and has_fixed:
        convex = df["exit_counterfactual_convex_tp_r"].mean()
        fixed = df["exit_counterfactual_fixed_tp_r"].mean()
        report["counterfactual_convex_tp_mean_r"] = float(convex)
        report["counterfactual_fixed_tp_mean_r"] = float(fixed)
        report["convexity_gain"] = float(convex - fixed)
    else:
        report["convexity_illusion"] = "insufficient_data"

    # C. Archetype instability
    if len(df) > 5:
        drift_rate = (df["pred_archetype_at_entry"] != df["exit_exit_archetype"]).mean()
        report["archetype_drift_rate"] = float(drift_rate)
        report["archetype_instability"] = drift_rate > 0.30

    # D. Friction collapse
    has_ideal = df["friction_counterfactual_ideal_fill_r"].notna().any()
    if has_ideal:
        ideal = df["friction_counterfactual_ideal_fill_r"].mean()
        real = df["friction_counterfactual_real_fill_r"].mean()
        report["ideal_fill_mean_r"] = float(ideal)
        report["real_fill_mean_r"] = float(real)
        report["friction_collapse"] = float(ideal - real)
    else:
        report["friction_collapse"] = "no_counterfactual_data"

    return report


def expectancy_decomposition_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Single-row summary of the full expectancy decomposition."""
    leakage = compute_edge_leakage(df)
    realized = leakage["realized_edge"].mean()
    theoretical = leakage["theoretical_edge"].mean()
    entry_loss = leakage["entry_impact"].mean()
    friction_loss = leakage["friction_impact"].mean()

    return pd.DataFrame.from_records(
        [
            {
                "component": "Forecast Edge (theoretical)",
                "mean_r": round(theoretical, 4),
            },
            {
                "component": "Entry Quality Impact",
                "mean_r": round(entry_loss, 4),
            },
            {
                "component": "Friction Impact",
                "mean_r": round(friction_loss, 4),
            },
            {
                "component": "Realized Edge",
                "mean_r": round(realized, 4),
            },
            {
                "component": "Remaining Unexplained",
                "mean_r": round(realized - theoretical - entry_loss - friction_loss, 4),
            },
        ]
    )


# ── Main ────────────────────────────────────────────────────────────


def load_attribution_data(attribution_dir: str | Path, experiment_id: str | None = None) -> pd.DataFrame:
    """Load all attribution parquet files from the export directory."""
    attribution_dir = Path(attribution_dir)
    if not attribution_dir.exists():
        logger.error("attribution directory not found: %s", attribution_dir)
        sys.exit(1)

    files = sorted(attribution_dir.glob("*_attribution.parquet"))
    if not files:
        logger.error("no attribution parquet files found in %s", attribution_dir)
        sys.exit(1)

    frames = []
    for f in files:
        try:
            df = pd.read_parquet(f)
            if not df.empty:
                frames.append(df)
                logger.info("loaded %d records from %s", len(df), f.name)
        except Exception as e:
            logger.warning("failed to load %s: %s", f.name, e)

    if not frames:
        logger.error("no attribution data loaded")
        sys.exit(1)

    combined = pd.concat(frames, ignore_index=True)

    if experiment_id:
        combined = combined[combined["experiment_id"] == experiment_id]
        logger.info("filtered to experiment_id=%s: %d records", experiment_id, len(combined))

    if combined.empty:
        logger.error("no records after filtering")
        sys.exit(1)

    # Derive entry timing efficiency and slippage cost
    combined["entry_timing_efficiency"] = compute_entry_timing_efficiency(combined)
    combined["slippage_cost_bps"] = compute_slippage_cost_bps(combined)

    return combined


def run_analysis(attribution_dir: str, experiment_id: str | None = None) -> None:
    """Run the full shadow-cycle analysis pipeline."""
    df = load_attribution_data(attribution_dir, experiment_id)
    exp_id = experiment_id or "all_experiments"

    logger.info("=" * 72)
    logger.info("SHADOW CYCLE — Expectancy Decomposition")
    logger.info("experiment_id: %s", exp_id)
    logger.info("total trades: %d", len(df))
    logger.info("assets: %s", sorted(df["asset"].unique()))
    logger.info("=" * 72)

    # 1. Top-level expectancy decomposition
    logger.info("\n── Expectancy Decomposition ──")
    decomposition = expectancy_decomposition_summary(df)
    for _, row in decomposition.iterrows():
        logger.info("  %-40s %+.4f", row["component"], row["mean_r"])

    # 2. Regime-segmented analysis
    logger.info("\n── Regime Segmented ──")
    regime_summary = regime_segmented_summary(df)
    for _, row in regime_summary.iterrows():
        logger.info(
            "  %-20s n=%-4d mean_r=%-+.4f win=%-5.1f%% sharpe=%-5.2f",
            row["regime"],
            int(row["n_trades"]),
            row["mean_realized_r"],
            row["win_rate"] * 100,
            row["sharpe"],
        )

    # 3. Archetype-segmented analysis
    logger.info("\n── Archetype Segmented ──")
    archetype_summary = archetype_segmented_summary(df)
    for _, row in archetype_summary.iterrows():
        logger.info(
            "  %-25s n=%-4d mean_r=%-+.4f win=%-5.1f%% drift=%-4.1f%%",
            row["archetype"],
            int(row["n_trades"]),
            row["mean_realized_r"],
            row["win_rate"] * 100,
            row["archetype_drift_rate"] * 100,
        )

    # 4. Exit reason decomposition
    logger.info("\n── Exit Reason Decomposition ──")
    exit_summary = exit_reason_summary(df)
    for _, row in exit_summary.iterrows():
        logger.info(
            "  %-15s n=%-4d mean_r=%-+.4f mae=%-7.4f mfe=%-7.4f bars=%-4.1f",
            row["exit_reason"],
            int(row["n_trades"]),
            row["mean_realized_r"],
            row["mean_mae_per_bar"],
            row["mean_mfe_per_bar"],
            row["mean_bars_held"],
        )

    # 5. Failure mode report
    logger.info("\n── Failure Mode Checks ──")
    failures = failure_mode_report(df)
    for key, val in failures.items():
        if isinstance(val, float):
            logger.info("  %-40s %.4f", key, val)
        elif isinstance(val, bool):
            logger.info("  %-40s %s", key, "DETECTED" if val else "OK")
        else:
            logger.info("  %-40s %s", key, val)

    # 6. Persist results
    output_path = Path(OUTPUT_DIR) / exp_id
    output_path.mkdir(parents=True, exist_ok=True)

    decomposition.to_parquet(output_path / "expectancy_decomposition.parquet", index=False)
    regime_summary.to_parquet(output_path / "regime_segmented.parquet", index=False)
    archetype_summary.to_parquet(output_path / "archetype_segmented.parquet", index=False)
    exit_summary.to_parquet(output_path / "exit_reason_decomposition.parquet", index=False)

    logger.info("\nResults saved to %s", output_path)
    logger.info("=" * 72)


def main() -> None:
    parser = argparse.ArgumentParser(description="Shadow Cycle — Expectancy Decomposition")
    parser.add_argument(
        "--attribution-dir",
        default=str(DEFAULT_ATTRIBUTION_DIR),
        help="Path to attribution parquet files (default: data/research/attribution)",
    )
    parser.add_argument(
        "--experiment-id",
        default=None,
        help="Filter to a specific experiment_id",
    )
    args = parser.parse_args()
    run_analysis(args.attribution_dir, args.experiment_id)


if __name__ == "__main__":
    main()
