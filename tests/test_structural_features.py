import numpy as np
import pandas as pd
import pytest

from features.structural_features import (
    compute_slope_and_curvature,
    compute_path_efficiency,
    compute_distributional_stats,
    generate_structural_features,
)


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def sample_ohlcv():
    np.random.seed(42)
    n = 300
    close = 100 + np.cumsum(np.random.randn(n) * 0.5)
    return pd.DataFrame({
        "close": close,
        "high": close * (1 + np.random.uniform(0.001, 0.005, n)),
        "low": close * (1 - np.random.uniform(0.001, 0.005, n)),
    }, index=pd.date_range("2024-01-01", periods=n, freq="B"))


# ── compute_slope_and_curvature ──────────────────────────────────────────────

def test_slope_and_curvature_returns_tuple(sample_ohlcv):
    slope, curv = compute_slope_and_curvature(sample_ohlcv["close"], window=20)
    assert isinstance(slope, pd.Series)
    assert isinstance(curv, pd.Series)


def test_slope_and_curvature_length(sample_ohlcv):
    slope, curv = compute_slope_and_curvature(sample_ohlcv["close"], window=20)
    assert len(slope) == len(sample_ohlcv)
    assert len(curv) == len(sample_ohlcv)


def test_slope_and_curvature_constant():
    series = pd.Series([100.0] * 200)
    slope, curv = compute_slope_and_curvature(series, window=20)
    assert slope.dropna().abs().max() < 0.001


# ── compute_path_efficiency ──────────────────────────────────────────────────

def test_path_efficiency_returns_series(sample_ohlcv):
    eff = compute_path_efficiency(sample_ohlcv["close"], window=20)
    assert isinstance(eff, pd.Series)
    assert len(eff) == len(sample_ohlcv)


def test_path_efficiency_bounds(sample_ohlcv):
    eff = compute_path_efficiency(sample_ohlcv["close"], window=20).dropna()
    assert all(0 <= v <= 1 for v in eff)


def test_path_efficiency_perfect_trend():
    series = pd.Series(np.arange(100.0, 300.0))
    eff = compute_path_efficiency(series, window=20).dropna()
    assert all(v > 0.99 for v in eff)


def test_path_efficiency_pure_chop():
    series = pd.Series([100, 101, 100, 101, 100, 101, 100, 101] * 30)
    eff = compute_path_efficiency(series, window=20).dropna()
    assert all(v < 0.5 for v in eff)


# ── compute_distributional_stats ─────────────────────────────────────────────

def test_distributional_stats_returns_dataframe(sample_ohlcv):
    returns = sample_ohlcv["close"].pct_change()
    stats = compute_distributional_stats(returns, window=63)
    assert isinstance(stats, pd.DataFrame)
    assert "skew" in stats.columns
    assert "kurt" in stats.columns
    assert "tail_ratio" in stats.columns


def test_distributional_stats_not_all_nan(sample_ohlcv):
    returns = sample_ohlcv["close"].pct_change()
    stats = compute_distributional_stats(returns, window=63)
    assert stats["tail_ratio"].notna().any()


# ── generate_structural_features ─────────────────────────────────────────────

def test_generate_structural_features_returns_expected_columns(sample_ohlcv):
    result = generate_structural_features(sample_ohlcv)
    expected = [
        "slope_20", "curvature_20", "slope_10", "curvature_10",
        "path_efficiency_20", "path_efficiency_63", "skew", "kurt", "tail_ratio",
    ]
    for col in expected:
        assert col in result.columns, f"Missing column: {col}"


def test_generate_structural_features_no_nan_after_dropna(sample_ohlcv):
    result = generate_structural_features(sample_ohlcv)
    assert not result.isna().any().any()


def test_generate_structural_features_short_data():
    df = pd.DataFrame({"close": [100] * 5, "high": [101] * 5, "low": [99] * 5},
                      index=pd.date_range("2024-01-01", periods=5))
    result = generate_structural_features(df)
    assert len(result) == 0
