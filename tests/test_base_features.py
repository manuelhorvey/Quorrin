import numpy as np
import pandas as pd
import pytest

from features.base_features import generate_base_features


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def sample_ohlcv():
    np.random.seed(42)
    n = 200
    close = 100 + np.cumsum(np.random.randn(n) * 0.5)
    return pd.DataFrame({
        "close": close,
        "high": close * (1 + np.random.uniform(0.001, 0.005, n)),
        "low": close * (1 - np.random.uniform(0.001, 0.005, n)),
        "volume": np.random.randint(1000, 100000, n).astype(float),
        "open": close * (1 + np.random.uniform(-0.002, 0.002, n)),
    }, index=pd.date_range("2024-01-01", periods=n, freq="B"))


# ── generate_base_features ───────────────────────────────────────────────────

def test_generate_base_features_returns_expected_columns(sample_ohlcv):
    result = generate_base_features(sample_ohlcv)
    expected = ["ema_spread", "adx", "macd_diff", "rsi", "bb_zscore", "dist_ema_20"]
    for col in expected:
        assert col in result.columns, f"Missing column: {col}"


def test_generate_base_features_no_nan_after_dropna(sample_ohlcv):
    result = generate_base_features(sample_ohlcv)
    assert not result.isna().any().any()


def test_generate_base_features_does_not_modify_input(sample_ohlcv):
    original = sample_ohlcv.copy()
    _ = generate_base_features(sample_ohlcv)
    pd.testing.assert_frame_equal(sample_ohlcv, original)


def test_generate_base_features_short_data():
    """Short data returns empty result since rolling windows are not satisfied."""
    np.random.seed(42)
    n = 30
    close = 100 + np.cumsum(np.random.randn(n) * 0.5)
    df = pd.DataFrame({
        "close": close,
        "high": close * 1.01,
        "low": close * 0.99,
        "volume": np.full(n, 1000.0),
        "open": close * 1.001,
    }, index=pd.date_range("2024-01-01", periods=n))
    result = generate_base_features(df)
    # EMA-50 needs >50 data points, so with 30 rows everything is NaN → dropped
    assert len(result) == 0


def test_generate_base_features_rsi_range(sample_ohlcv):
    result = generate_base_features(sample_ohlcv)
    assert result["rsi"].between(0, 100).all()


def test_generate_base_features_bb_zscore_not_constant(sample_ohlcv):
    result = generate_base_features(sample_ohlcv)
    assert result["bb_zscore"].std() > 0
