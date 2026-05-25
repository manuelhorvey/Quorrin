import numpy as np
import pandas as pd
import pytest

from shared.sizing import (
    risk_contribution,
    risk_parity_weights,
    compute_equal_risk_weights,
    VolTargetSizing,
)


# ── risk_contribution ────────────────────────────────────────────────────────

def test_risk_contribution_sums_to_portfolio_vol():
    n = 4
    np.random.seed(42)
    cov = np.random.randn(n, n)
    cov = cov @ cov.T + np.eye(n) * 0.1
    w = np.ones(n) / n
    rc = risk_contribution(w, cov)
    assert abs(rc.sum() - np.sqrt(w @ cov @ w)) < 1e-6


# ── risk_parity_weights ──────────────────────────────────────────────────────

def test_risk_parity_weights_sum_to_one():
    n = 5
    np.random.seed(42)
    cov = np.random.randn(n, n)
    cov = cov @ cov.T + np.eye(n) * 0.1
    w = risk_parity_weights(cov)
    assert abs(w.sum() - 1.0) < 1e-6


def test_risk_parity_weights_all_positive():
    n = 3
    cov = np.array([[1.0, 0.5, 0.3], [0.5, 2.0, 0.4], [0.3, 0.4, 1.5]])
    w = risk_parity_weights(cov)
    assert (w > 0).all()


def test_risk_parity_weights_custom_target():
    n = 3
    cov = np.array([[1.0, 0.5, 0.3], [0.5, 2.0, 0.4], [0.3, 0.4, 1.5]])
    target = np.array([0.5, 0.3, 0.2])
    w = risk_parity_weights(cov, target_risk=target)
    assert abs(w.sum() - 1.0) < 1e-6


def test_risk_parity_higher_vol_gets_lower_weight():
    cov = np.array([[1.0, 0.0], [0.0, 4.0]])
    w = risk_parity_weights(cov)
    assert w[0] > w[1]


# ── compute_equal_risk_weights ───────────────────────────────────────────────

def test_equal_risk_weights_sum_to_one():
    np.random.seed(42)
    returns = pd.DataFrame(np.random.randn(252, 4) * 0.01)
    w = compute_equal_risk_weights(returns)
    assert abs(sum(w.values()) - 1.0) < 1e-6


def test_equal_risk_weights_all_assets_in_output():
    returns = pd.DataFrame(np.random.randn(100, 3), columns=["A", "B", "C"])
    w = compute_equal_risk_weights(returns)
    assert set(w.keys()) == {"A", "B", "C"}


# ── VolTargetSizing ──────────────────────────────────────────────────────────

def test_vol_target_sizing_no_scalar():
    sizer = VolTargetSizing()
    close = pd.Series(100 + np.cumsum(np.random.randn(100) * 0.5))
    result = sizer.compute(close, {"vol_scalar": False})
    assert result == 1.0


def test_vol_target_sizing_with_scalar():
    sizer = VolTargetSizing(window=30, target_vol=0.30)
    close = pd.Series(100 + np.cumsum(np.random.randn(100) * 0.5))
    result = sizer.compute(close, {"vol_scalar": True})
    assert 0 < result <= 1.0


def test_vol_target_sizing_short_history():
    sizer = VolTargetSizing(window=100)
    close = pd.Series([100.0, 101.0, 102.0])
    result = sizer.compute(close, {"vol_scalar": True})
    assert result == 1.0


def test_vol_target_sizing_regime_aware():
    sizer = VolTargetSizing(window=30, target_vol=0.30, regime_aware=True)
    np.random.seed(42)
    close = pd.Series(100 + np.cumsum(np.random.randn(100) * 0.5))
    result_calm = sizer.compute(close, {"vol_scalar": True}, regime="calm")
    result_crisis = sizer.compute(close, {"vol_scalar": True}, regime="crisis")
    assert result_calm >= result_crisis


def test_vol_target_sizing_with_vol_baseline():
    sizer = VolTargetSizing(window=30, target_vol=0.30)
    close = pd.Series(np.full(100, 100.0))
    result = sizer.compute(close, {"vol_scalar": True, "vol_baseline": 0.2})
    assert result == 1.0


def test_vol_target_sizing_edge_decay():
    sizer = VolTargetSizing()
    assert sizer.edge_decay(3.0) == 1.0
    assert sizer.edge_decay(10.0) == 0.5


def test_vol_target_sizing_nan_rv():
    sizer = VolTargetSizing(window=30)
    close = pd.Series([np.nan] * 50)
    result = sizer.compute(close, {"vol_scalar": True})
    assert result == 1.0
