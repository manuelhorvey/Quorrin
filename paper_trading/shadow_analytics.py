import os
from collections import Counter
from typing import Optional

from paper_trading.shadow_feedback import read_feedback


PAPER_PORTFOLIO = ["BTC", "NZDJPY", "CADJPY", "USDCAD", "GC", "EURAUD"]


def build_asset_learning_profile(asset: str, months: int = 3) -> Optional[dict]:
    try:
        events = read_feedback(asset, months=months)
        if not events:
            return None

        n = len(events)
        agreement_scores = []
        instability_scores = []
        risk_alignment_scores = []
        action_counter = Counter()
        drift_sensitivities = []

        for e in events:
            d = e.get("derived", {})
            agreement_scores.append(d.get("agreement_score", 0.0))
            instability_scores.append(d.get("instability_index", 0.0))
            risk_alignment_scores.append(d.get("risk_alignment", 0.0))

            inputs = e.get("inputs", {})
            action = inputs.get("shadow_action", {})
            action_counter[action.get("action_type", "NONE")] += 1

            drift = inputs.get("drift", {})
            avg_drift = sum(drift.values()) / max(len(drift), 1)
            drift_sensitivities.append(avg_drift)

        avg_agreement = sum(agreement_scores) / n
        avg_instability = sum(instability_scores) / n
        avg_risk_alignment = sum(risk_alignment_scores) / n
        drift_sensitivity = sum(drift_sensitivities) / n

        action_utilization = {
            k: round(v / n, 4) for k, v in sorted(action_counter.items())
        }

        risk_overreaction_count = sum(
            1 for e in events
            if e.get("derived", {}).get("risk_alignment", 1.0) < 0.5
        )
        risk_overreaction_rate = risk_overreaction_count / n

        return {
            "asset": asset,
            "event_count": n,
            "avg_agreement": round(avg_agreement, 4),
            "avg_instability": round(avg_instability, 4),
            "avg_risk_alignment": round(avg_risk_alignment, 4),
            "drift_sensitivity": round(drift_sensitivity, 4),
            "risk_overreaction_rate": round(risk_overreaction_rate, 4),
            "shadow_action_utilization": action_utilization,
        }
    except Exception:
        return None


def compare_assets(months: int = 3) -> list:
    try:
        profiles = []
        for asset in PAPER_PORTFOLIO:
            profile = build_asset_learning_profile(asset, months=months)
            if profile is not None:
                profiles.append(profile)

        profiles.sort(key=lambda p: p.get("avg_instability", 0.0))

        return {
            "month_range": f"last_{months}_months",
            "stability_ranking": [
                {
                    "asset": p["asset"],
                    "stability_score": round(1.0 - p["avg_instability"], 4),
                    "drift_sensitivity": p["drift_sensitivity"],
                    "risk_responsiveness": p["avg_risk_alignment"],
                }
                for p in profiles
            ],
            "profiles": profiles,
        }
    except Exception:
        return {"stability_ranking": [], "profiles": []}
