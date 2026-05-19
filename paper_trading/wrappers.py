import math
import numpy as np
import pandas as pd
from typing import Optional

from features.builder import build_features, compute_macro_derived
from features.contract import FeatureContract


def compute_proba(model, X: pd.DataFrame) -> np.ndarray:
    return model.predict_proba(X)


def compute_signals(
    proba: np.ndarray,
    index: pd.Index,
    threshold: float = 0.45,
) -> pd.DataFrame:
    probs_long = proba[:, 2]
    probs_short = proba[:, 0]
    signals = pd.Series(0, index=index)
    signals[probs_long > threshold] = 2
    signals[probs_short > threshold] = 0
    return pd.DataFrame({
        "signal": signals,
        "prob_long": probs_long,
        "prob_short": probs_short,
        "prob_neutral": proba[:, 1],
    }, index=index)


def signal_type_and_confidence(
    signal_value: int,
    prob_long: float,
    prob_short: float,
) -> tuple:
    signal_type = "BUY" if signal_value == 2 else ("SELL" if signal_value == 0 else "FLAT")
    confidence = max(prob_long, prob_short)
    confidence_pct = round(float(confidence * 100), 2)
    return signal_type, confidence, confidence_pct


def compute_vol_scalar(
    close: pd.Series,
    window: int = 30,
    target_vol: float = 0.30,
) -> float:
    rets = close.pct_change().dropna()
    if len(rets) < window:
        return 1.0
    rv = rets.iloc[-window:].std() * np.sqrt(252)
    if pd.isna(rv) or np.isinf(rv):
        return 1.0
    scalar = target_vol / (rv + 1e-9)
    return min(scalar, 1.0)


def compute_tb_vol(close: pd.Series, span: int = 100, floor: float = 0.01) -> float:
    returns = np.log(close / close.shift(1))
    vol = returns.ewm(span=span).std()
    return vol.iloc[-1] if not pd.isna(vol.iloc[-1]) else floor


def compute_daily_pnl(
    current_value: float,
    direction: int,
    ret: float,
    position_size_fraction: float,
    pos_size: float = 1.0,
) -> float:
    return current_value * direction * ret * position_size_fraction * pos_size


def compute_position_return(
    side: str,
    entry_price: float,
    exit_price: float,
) -> float:
    if side == "long":
        return exit_price / entry_price - 1
    else:
        return entry_price / exit_price - 1


def compute_sl_tp(
    side: str,
    entry_price: float,
    vol: float,
    multiplier: float = 2.0,
) -> tuple:
    if side == "long":
        sl = entry_price * (1 - vol * multiplier)
        tp = entry_price * (1 + vol * multiplier)
    else:
        sl = entry_price * (1 + vol * multiplier)
        tp = entry_price * (1 - vol * multiplier)
    return sl, tp


def compute_features(
    df: pd.DataFrame,
    macro: pd.DataFrame,
    ref: Optional[pd.DataFrame],
    contract: FeatureContract,
) -> pd.DataFrame:
    return build_features(df, macro, ref, contract)


def compute_macro_derived_wrapper(macro_df: pd.DataFrame) -> pd.DataFrame:
    return compute_macro_derived(macro_df)
