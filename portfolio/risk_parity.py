"""DEPRECATED — use shared.portfolio_weights instead.

Replaced by:
    from shared.portfolio_weights import compute_weights(method='risk_parity_v1', ...)

This file is kept for backward compatibility and will be removed.
"""

import numpy as np
import pandas as pd

from shared.portfolio_weights import compute_weights


def compute_risk_parity_portfolio(
    returns: pd.DataFrame,
    target_vol: float = 0.15,
    max_leverage: float = 1.0,
) -> dict[str, float]:
    """Backward-compatible wrapper around ``shared.portfolio_weights``."""

    w = compute_weights("risk_parity_v1", returns)
    cov = returns.cov() * 252
    assets = list(w.weights.keys())
    arr = pd.Series([w.weights[a] for a in assets], index=assets)
    port_var = arr @ cov.values @ arr
    port_vol = float(np.sqrt(port_var)) if port_var > 0 else 1.0
    lev = min(target_vol / port_vol, max_leverage)
    return {a: float(w.weights[a] * lev) for a in assets}
