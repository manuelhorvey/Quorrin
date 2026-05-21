import threading
from datetime import datetime

from paper_trading.drift_scoring import get_shadow_intelligence

_lock = threading.Lock()
_cache: dict = {}


WEIGHTS = {
    "model_drift": 0.25,
    "signal_drift": 0.20,
    "pnl_drift": 0.25,
    "feature_stability": 0.15,
    "regime_consistency": 0.15,
}

FLAG_THRESHOLD = 0.3


def evaluate(asset: str) -> dict:
    try:
        intelligence = get_shadow_intelligence(asset)
        drift_scores = intelligence.get("drift_scores", {})
        details = intelligence.get("details", {})

        risk_score = sum(drift_scores.get(k, 0.0) * v for k, v in WEIGHTS.items())

        if risk_score < 0.3:
            risk_level = "LOW"
        elif risk_score < 0.6:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        exposure_multiplier = max(0.0, 1.0 - risk_score)

        risk_flags = []
        for key, threshold in [
            ("model_drift", FLAG_THRESHOLD),
            ("signal_drift", FLAG_THRESHOLD),
            ("pnl_drift", FLAG_THRESHOLD),
            ("feature_stability", FLAG_THRESHOLD),
            ("regime_consistency", FLAG_THRESHOLD),
        ]:
            if drift_scores.get(key, 0.0) > threshold:
                flag_map = {
                    "model_drift": "MODEL_DRIFT",
                    "signal_drift": "SIGNAL_INSTABILITY",
                    "pnl_drift": "PNL_DEGRADATION",
                    "feature_stability": "FEATURE_UNSTABLE",
                    "regime_consistency": "REGIME_SHIFT",
                }
                risk_flags.append(flag_map[key])

        recommended_action = _recommend(risk_level, risk_flags)
        explanations = _generate_explanations(drift_scores, risk_flags)

        signal = {
            "asset": asset,
            "timestamp": datetime.utcnow().isoformat(),
            "risk_level": risk_level,
            "risk_score": round(risk_score, 4),
            "confidence": round(1.0 - risk_score, 4),
            "exposure_multiplier": round(exposure_multiplier, 4),
            "risk_flags": risk_flags,
            "recommended_action": recommended_action,
            "explanations": explanations,
            "component_scores": {k: round(drift_scores.get(k, 0.0), 4) for k in WEIGHTS},
            "drift_details": details,
        }

        with _lock:
            _cache[asset] = signal

        return signal
    except Exception:
        return _fallback_signal(asset)


def get_latest(asset: str | None = None):
    with _lock:
        if asset:
            return _cache.get(asset)
        return dict(_cache)


def _recommend(risk_level: str, risk_flags: list) -> str:
    if risk_level == "HIGH":
        return "PAUSE"
    elif risk_level == "MEDIUM":
        return "REDUCE_RISK"
    elif risk_flags:
        return "MONITOR"
    return "NORMAL"


def _generate_explanations(drift_scores: dict, risk_flags: list) -> list:
    templates = {
        "MODEL_DRIFT": "Model probability distribution deviates significantly from baseline (KL {score:.2f})",
        "SIGNAL_INSTABILITY": "Signal flip rate increased beyond historical percentile (mismatch rate {score:.2f})",
        "PNL_DEGRADATION": "PnL divergence exceeds expected baseline variance (MAE {score:.2f})",
        "FEATURE_UNSTABLE": "Feature stability declining, Jaccard similarity dropping (stability {score:.2f})",
        "REGIME_SHIFT": "Regime classification mismatch increasing vs historical distribution (consistency {score:.2f})",
    }
    key_map = {
        "MODEL_DRIFT": "model_drift",
        "SIGNAL_INSTABILITY": "signal_drift",
        "PNL_DEGRADATION": "pnl_drift",
        "FEATURE_UNSTABLE": "feature_stability",
        "REGIME_SHIFT": "regime_consistency",
    }
    explanations = []
    for flag in risk_flags:
        key = key_map.get(flag)
        score = drift_scores.get(key, 0.0) if key else 0.0
        template = templates.get(flag, "")
        if template:
            explanations.append(template.format(score=score))
    if not explanations:
        explanations.append("No significant drift detected — risk within normal bounds")
    return explanations


def _fallback_signal(asset: str) -> dict:
    return {
        "asset": asset,
        "timestamp": datetime.utcnow().isoformat(),
        "risk_level": "LOW",
        "risk_score": 0.0,
        "confidence": 1.0,
        "exposure_multiplier": 1.0,
        "risk_flags": [],
        "recommended_action": "NORMAL",
        "explanations": ["Risk governance unavailable — defaulting to LOW risk"],
        "component_scores": {},
        "drift_details": {},
    }
