import numpy as np
import pandas as pd
import pytest

from features.interaction_features import generate_interaction_features


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def base_features():
    return pd.DataFrame({
        "ema_spread": np.random.randn(100),
    }, index=pd.date_range("2024-01-01", periods=100, freq="B"))


@pytest.fixture
def regime_data():
    np.random.seed(42)
    n = 100
    probs = np.random.dirichlet(np.ones(3), size=n)
    return pd.DataFrame({
        "P_trend": probs[:, 0],
        "P_range": probs[:, 1],
        "P_volatile": probs[:, 2],
    }, index=pd.date_range("2024-01-01", periods=n, freq="B"))


@pytest.fixture
def struct_features():
    return pd.DataFrame({
        "slope_20": np.random.randn(100) * 0.01,
        "path_efficiency_20": np.random.uniform(0, 1, 100),
    }, index=pd.date_range("2024-01-01", periods=100, freq="B"))


# ── generate_interaction_features ────────────────────────────────────────────

def test_returns_expected_columns(base_features, regime_data, struct_features):
    result = generate_interaction_features(base_features, regime_data, struct_features)
    expected = [
        "regime_contrast", "ema_contrast", "slope_contrast", "path_contrast",
        "regime_entropy", "transition_risk",
    ]
    for col in expected:
        assert col in result.columns, f"Missing column: {col}"


def test_regime_contrast_bounds(base_features, regime_data, struct_features):
    result = generate_interaction_features(base_features, regime_data, struct_features)
    assert result["regime_contrast"].between(-1, 1).all()


def test_regime_entropy_non_negative(base_features, regime_data, struct_features):
    result = generate_interaction_features(base_features, regime_data, struct_features)
    assert (result["regime_entropy"] >= 0).all()


def test_transition_risk_non_negative(base_features, regime_data, struct_features):
    result = generate_interaction_features(base_features, regime_data, struct_features)
    assert (result["transition_risk"] >= 0).all()


def test_empty_on_non_overlapping_index():
    base = pd.DataFrame({"ema_spread": [1]}, index=pd.DatetimeIndex(["2024-01-01"]))
    regime = pd.DataFrame({"P_trend": [0.5], "P_range": [0.3], "P_volatile": [0.2]},
                          index=pd.DatetimeIndex(["2024-01-02"]))
    struct = pd.DataFrame({"slope_20": [0.01], "path_efficiency_20": [0.5]},
                          index=pd.DatetimeIndex(["2024-01-02"]))
    result = generate_interaction_features(base, regime, struct)
    assert len(result) == 0


def test_aligns_on_common_index(base_features, regime_data, struct_features):
    base_altered = base_features.iloc[:80]
    result = generate_interaction_features(base_altered, regime_data, struct_features)
    assert len(result) == 80
